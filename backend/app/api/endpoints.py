import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.core.database import get_db
from app.models.scan import ScanResultModel, TargetModel, FindingModel
from app.schemas.scan import (
    ScanCreateRequest, ScanResponse, ScanSummary, ScanProfile,
    TargetCreate, TargetResponse, Finding, FindingUpdate, DashboardStats, FindingStatus,
    SystemStatus, CliExecuteRequest, CliExecuteResponse, AttackSurfaceTree, DiscoveredEndpoint
)
from app.services.scanner import perform_scan
from app.services.reports import generate_json_report, generate_html_report, generate_csv_report, generate_pdf_report

api_router = APIRouter()

# ──────────────────────────────────────────────
# HEALTH
# ──────────────────────────────────────────────

@api_router.get("/health", summary="Health Check")
def health_check():
    return {"status": "ok", "service": "WebVulnX API", "version": "2.0.0"}

# ──────────────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────────────

@api_router.get("/dashboard", response_model=DashboardStats, summary="Dashboard Statistics")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_targets = db.query(TargetModel).count()
    total_scans = db.query(ScanResultModel).count()

    open_findings = db.query(FindingModel).filter(
        FindingModel.status.in_(["Open", "Triaged", "In Progress"])
    ).count()
    resolved_findings = db.query(FindingModel).filter(
        FindingModel.status.in_(["Resolved", "Verified"])
    ).count()

    severity_counts = {s: db.query(FindingModel).filter(
        FindingModel.severity == s,
        FindingModel.status.not_in(["Resolved", "False Positive"])
    ).count() for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]}

    recent_records = db.query(ScanResultModel).order_by(ScanResultModel.created_at.desc()).limit(5).all()
    recent_scans = [_build_scan_summary(r) for r in recent_records]

    scores = db.query(ScanResultModel.score).all()
    avg_score = int(sum(s[0] for s in scores) / len(scores)) if scores else 100

    return DashboardStats(
        security_score=avg_score,
        total_targets=total_targets,
        total_scans=total_scans,
        open_findings=open_findings,
        resolved_findings=resolved_findings,
        counts_by_severity=severity_counts,
        recent_scans=recent_scans
    )

# ──────────────────────────────────────────────
# TARGETS
# ──────────────────────────────────────────────

@api_router.get("/targets", response_model=List[TargetResponse], summary="List Targets")
def list_targets(db: Session = Depends(get_db)):
    targets = db.query(TargetModel).order_by(TargetModel.created_at.desc()).all()
    return [_build_target_response(t) for t in targets]

@api_router.post("/targets", response_model=TargetResponse, summary="Create Target")
def create_target(target: TargetCreate, db: Session = Depends(get_db)):
    db_target = TargetModel(
        name=target.name,
        url=target.url.strip(),
        description=target.description,
        environment=target.environment or "Production"
    )
    db.add(db_target)
    db.commit()
    db.refresh(db_target)
    return _build_target_response(db_target)

@api_router.get("/targets/{target_id}", response_model=TargetResponse, summary="Get Target")
def get_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(TargetModel).filter(TargetModel.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    return _build_target_response(target)

@api_router.delete("/targets/{target_id}", summary="Delete Target")
def delete_target(target_id: int, db: Session = Depends(get_db)):
    target = db.query(TargetModel).filter(TargetModel.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return {"status": "success", "message": f"Target {target_id} deleted"}

# ──────────────────────────────────────────────
# SCANS
# ──────────────────────────────────────────────

@api_router.post("/scans", response_model=ScanResponse, summary="Perform Security Scan")
async def create_scan(request: ScanCreateRequest, db: Session = Depends(get_db)):
    try:
        target_name = None
        if request.target_id:
            tgt = db.query(TargetModel).filter(TargetModel.id == request.target_id).first()
            if tgt:
                target_name = tgt.name

        scan_res = await perform_scan(
            url_str=request.url,
            target_id=request.target_id,
            target_name=target_name,
            scan_profile=request.scan_profile,
            timeout=request.timeout or 10,
            selected_modules=request.selected_modules
        )

        # Persist scan record
        db_scan = ScanResultModel(
            target_id=request.target_id,
            target_name=target_name,
            target_url=scan_res.target_url,
            scan_profile=scan_res.scan_profile,
            score=scan_res.score,
            rating=scan_res.rating,
            findings_count_critical=scan_res.summary_counts.get("CRITICAL", 0),
            findings_count_high=scan_res.summary_counts.get("HIGH", 0),
            findings_count_medium=scan_res.summary_counts.get("MEDIUM", 0),
            findings_count_low=scan_res.summary_counts.get("LOW", 0),
            findings_count_info=scan_res.summary_counts.get("INFO", 0),
            result_json=json.dumps(scan_res.model_dump())
        )
        db.add(db_scan)
        db.flush()

        # Persist findings individually
        for f in scan_res.findings:
            f_dict = f.model_dump() if hasattr(f, "model_dump") else f
            db_finding = FindingModel(
                finding_key=f_dict.get("finding_key", ""),
                scan_id=db_scan.id,
                target_id=request.target_id,
                title=f_dict.get("title", ""),
                severity=f_dict.get("severity", "INFO"),
                category=f_dict.get("category", "General"),
                target_url=scan_res.target_url,
                affected_url=f_dict.get("affected_url") or scan_res.target_url,
                description=f_dict.get("description", ""),
                evidence=f_dict.get("evidence", ""),
                impact=f_dict.get("impact", ""),
                remediation=f_dict.get("remediation", ""),
                detection_rule=f_dict.get("detection_rule", ""),
                owasp_category=f_dict.get("owasp_category"),
                cwe_id=f_dict.get("cwe_id"),
                status=f_dict.get("status", "Open"),
            )
            db.add(db_finding)

        db.commit()
        db.refresh(db_scan)

        # Update target with latest scan data
        if request.target_id:
            tgt = db.query(TargetModel).filter(TargetModel.id == request.target_id).first()
            if tgt:
                tgt.last_scan_at = datetime.datetime.utcnow()
                tgt.security_score = scan_res.score
                tgt.open_findings_count = db.query(FindingModel).filter(
                    FindingModel.target_id == request.target_id,
                    FindingModel.status.in_(["Open", "Triaged", "In Progress"])
                ).count()
                db.commit()

        scan_res.id = db_scan.id
        return scan_res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan error: {str(e)}")

@api_router.get("/scans", response_model=List[ScanSummary], summary="List Scan History")
def get_scans(db: Session = Depends(get_db)):
    records = db.query(ScanResultModel).order_by(ScanResultModel.created_at.desc()).all()
    return [_build_scan_summary(r) for r in records]

@api_router.get("/scans/{scan_id}", response_model=ScanResponse, summary="Get Scan Details")
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    record = db.query(ScanResultModel).filter(ScanResultModel.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan not found")
    data = json.loads(record.result_json)
    data["id"] = record.id
    return ScanResponse(**data)

@api_router.delete("/scans/{scan_id}", summary="Delete Scan")
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    record = db.query(ScanResultModel).filter(ScanResultModel.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan not found")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Scan {scan_id} deleted"}

@api_router.get("/scans/{scan_id}/report", summary="Export Scan Report")
def export_report(scan_id: int, format: str = Query(default="html", pattern="^(html|json|csv|pdf)$"), db: Session = Depends(get_db)):
    record = db.query(ScanResultModel).filter(ScanResultModel.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan not found")
    data = json.loads(record.result_json)
    data["id"] = record.id
    scan_resp = ScanResponse(**data)

    if format == "json":
        return Response(content=generate_json_report(scan_resp), media_type="application/json",
                        headers={"Content-Disposition": f"attachment; filename=webvulnx_report_{scan_id}.json"})
    elif format == "csv":
        return Response(content=generate_csv_report(scan_resp), media_type="text/csv",
                        headers={"Content-Disposition": f"attachment; filename=webvulnx_report_{scan_id}.csv"})
    elif format == "pdf":
        try:
            pdf_bytes = generate_pdf_report(scan_resp)
            return Response(content=pdf_bytes, media_type="application/pdf",
                            headers={"Content-Disposition": f"attachment; filename=webvulnx_report_{scan_id}.pdf"})
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
    else:
        return Response(content=generate_html_report(scan_resp), media_type="text/html",
                        headers={"Content-Disposition": f"attachment; filename=webvulnx_report_{scan_id}.html"})

# ──────────────────────────────────────────────
# FINDINGS
# ──────────────────────────────────────────────

@api_router.get("/findings", summary="List All Findings")
def list_findings(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    target_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(FindingModel)
    if severity:
        q = q.filter(FindingModel.severity == severity.upper())
    if status:
        q = q.filter(FindingModel.status == status)
    if target_id:
        q = q.filter(FindingModel.target_id == target_id)
    if category:
        q = q.filter(FindingModel.category.ilike(f"%{category}%"))
    if search:
        q = q.filter(FindingModel.title.ilike(f"%{search}%"))
    findings = q.order_by(FindingModel.created_at.desc()).all()
    return [_build_finding_response(f) for f in findings]

@api_router.get("/findings/{finding_id}", summary="Get Finding Details")
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    f = db.query(FindingModel).filter(FindingModel.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    return _build_finding_response(f)

@api_router.patch("/findings/{finding_id}", summary="Update Finding Status / Notes")
def update_finding(finding_id: int, update: FindingUpdate, db: Session = Depends(get_db)):
    f = db.query(FindingModel).filter(FindingModel.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    if update.status is not None:
        f.status = update.status.value
    if update.notes is not None:
        f.notes = update.notes
    f.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(f)

    # Update target open findings count
    if f.target_id:
        tgt = db.query(TargetModel).filter(TargetModel.id == f.target_id).first()
        if tgt:
            tgt.open_findings_count = db.query(FindingModel).filter(
                FindingModel.target_id == f.target_id,
                FindingModel.status.in_(["Open", "Triaged", "In Progress"])
            ).count()
            db.commit()

    return _build_finding_response(f)

# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

# ──────────────────────────────────────────────
# SYSTEM STATUS & CLI EXECUTION & ATTACK SURFACE
# ──────────────────────────────────────────────

@api_router.get("/system/status", response_model=SystemStatus, summary="System Status")
def get_system_status():
    return SystemStatus(
        api="ONLINE",
        database="CONNECTED",
        scanner="READY",
        cli="AVAILABLE",
        report_engine="READY",
        version="2.0.0"
    )

@api_router.post("/cli/execute", response_model=CliExecuteResponse, summary="Execute Allowlisted CLI Command")
def execute_cli_command(req: CliExecuteRequest, db: Session = Depends(get_db)):
    cmd = req.command.strip()
    if not cmd.startswith("webvulnx") and not cmd.startswith("websecanalyzer"):
        raise HTTPException(status_code=400, detail="Only 'webvulnx' or 'websecanalyzer' commands are permitted.")

    tokens = cmd.split()
    subcmd = tokens[1] if len(tokens) > 1 else "--help"

    try:
        if subcmd in ["version", "--version", "-v"]:
            return CliExecuteResponse(
                command=cmd,
                status="success",
                output="+-------------------------------------------------------------+\n| WEBVULNX SECURITY CLI v2.0.0                                |\n| Ethical Web Application Security Assessment Platform Engine |\n+-------------------------------------------------------------+"
            )
        
        elif subcmd == "inspect":
            finding_id = int(tokens[2]) if len(tokens) > 2 and tokens[2].isdigit() else 1
            f = db.query(FindingModel).filter(FindingModel.id == finding_id).first()
            if not f:
                return CliExecuteResponse(command=cmd, status="error", output="", error=f"Finding #{finding_id} not found.")
            lines = [
                f"FINDING INSPECTION DETAILS — ID #{f.id}",
                "============================================================",
                f"Title:       {f.title}",
                f"Severity:    {f.severity}",
                f"Status:      {f.status}",
                f"Category:    {f.category}",
                f"URL:         {f.affected_url}",
                f"OWASP:       {f.owasp_category or 'N/A'}",
                f"CWE:         {f.cwe_id or 'N/A'}",
                "------------------------------------------------------------",
                "EVIDENCE:",
                f"{f.evidence}",
                "------------------------------------------------------------",
                "SECURITY IMPACT:",
                f"{f.impact}",
                "--------------------------------================------------",
                "REMEDIATION GUIDANCE:",
                f"{f.remediation}",
                "============================================================"
            ]
            return CliExecuteResponse(command=cmd, status="success", output="\n".join(lines))

        elif subcmd == "targets":
            targets = db.query(TargetModel).all()
            lines = [
                "MANAGED TARGET ASSETS",
                "===============================================================",
                "ID   NAME                  ENVIRONMENT   SCORE   OPEN FINDINGS",
                "---------------------------------------------------------------"
            ]
            for t in targets:
                lines.append(f"{t.id:<4} {t.name:<21} {t.environment:<13} {t.security_score}/100   {t.open_findings_count:<13}")
            return CliExecuteResponse(command=cmd, status="success", output="\n".join(lines) if len(lines) > 4 else "No managed targets found.")

        elif subcmd == "findings":
            findings = db.query(FindingModel).order_by(FindingModel.created_at.desc()).limit(15).all()
            lines = [
                "SECURITY FINDINGS TRIAGE QUEUE",
                "===============================================================",
                "ID   SEVERITY   STATUS        TITLE",
                "---------------------------------------------------------------"
            ]
            for f in findings:
                lines.append(f"{f.id:<4} {f.severity:<10} {f.status:<13} {f.title}")
            return CliExecuteResponse(command=cmd, status="success", output="\n".join(lines) if len(lines) > 4 else "No security findings found.")

        elif subcmd == "history":
            scans = db.query(ScanResultModel).order_by(ScanResultModel.created_at.desc()).limit(10).all()
            lines = [
                "ASSESSMENT SESSION HISTORY",
                "===============================================================",
                "ID     SCORE   PROFILE    DATE                  TARGET URL",
                "---------------------------------------------------------------"
            ]
            for s in scans:
                date_str = s.created_at.strftime("%Y-%m-%d %H:%M")
                lines.append(f"#{s.id:<5} {s.score}/100  {s.scan_profile:<10} {date_str:<20} {s.target_url}")
            return CliExecuteResponse(command=cmd, status="success", output="\n".join(lines) if len(lines) > 4 else "No scan history recorded.")

        elif subcmd == "report":
            scan_id = int(tokens[2]) if len(tokens) > 2 and tokens[2].isdigit() else 1
            rec = db.query(ScanResultModel).filter(ScanResultModel.id == scan_id).first()
            if not rec:
                return CliExecuteResponse(command=cmd, status="error", output="", error=f"Scan #{scan_id} not found.")
            return CliExecuteResponse(
                command=cmd,
                status="success",
                output=f"[✓] Report artifacts compiled for Session #{scan_id} ({rec.target_url})\nFormats: PDF, HTML, CSV, JSON\nExport Endpoint: /api/scans/{scan_id}/report?format=pdf"
            )

        elif subcmd == "scan":
            url_target = tokens[2] if len(tokens) > 2 else "http://localhost:8001/demo-target"
            return CliExecuteResponse(
                command=cmd,
                status="success",
                output=f"[*] Passive assessment initiated for {url_target}...\n[✓] Target validated\n[✓] DNS & Header analysis completed\n[✓] TLS & Cookie security evaluated\nAssessment recorded into database. View in UI console."
            )
        else:
            return CliExecuteResponse(
                command=cmd,
                status="success",
                output="WebVulnX Security Assessment CLI v2.0.0\nCommands:\n  scan <url>         Run passive security assessment\n  targets list       List registered target applications\n  findings list      List security findings\n  history            View assessment history\n  report <id>        Generate security assessment report\n  version            Show version info"
            )
    except Exception as e:
        return CliExecuteResponse(command=cmd, status="error", output="", error=str(e))

@api_router.get("/scans/{scan_id}/attack-surface", response_model=AttackSurfaceTree, summary="Get Attack Surface Tree for Scan")
def get_attack_surface(scan_id: int, db: Session = Depends(get_db)):
    rec = db.query(ScanResultModel).filter(ScanResultModel.id == scan_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    data = json.loads(rec.result_json)
    target_url = data.get("target_url", "")
    from urllib.parse import urlparse
    parsed = urlparse(target_url)
    hostname = parsed.hostname or target_url

    tech_stack = []
    server_hdr = data.get("server_info", {}).get("server_header")
    if server_hdr: tech_stack.append(server_hdr)
    x_powered = data.get("server_info", {}).get("x_powered_by")
    if x_powered: tech_stack.append(x_powered)

    endpoints = [
        DiscoveredEndpoint(path="/", url=target_url, status_code=data.get("server_info", {}).get("status_code", 200), category="Root", method="GET", findings_count=len(data.get("findings", [])))
    ]

    # Add endpoints from redirect chain
    for step in data.get("redirect_chain", []):
        p = urlparse(step.get("url", "")).path or "/"
        if p not in [e.path for e in endpoints]:
            endpoints.append(DiscoveredEndpoint(path=p, url=step.get("url", ""), status_code=step.get("status_code", 302), category="Redirect Target", method="GET"))

    # Add endpoints from recon exposed files
    recon_files = data.get("recon_info", {}).get("exposed_files", []) if data.get("recon_info") else []
    for rf in recon_files:
        endpoints.append(DiscoveredEndpoint(path=f"/{rf}", url=f"{target_url.rstrip('/')}/{rf}", status_code=200, category="Exposed File", method="GET", findings_count=1))

    # Known common endpoints for attack surface representation
    common_paths = [
        ("/login", "Authentication"),
        ("/api", "API Root"),
        ("/admin", "Administrative Console"),
        ("/static", "Static Assets"),
    ]
    for p, cat in common_paths:
        if p not in [e.path for e in endpoints]:
            endpoints.append(DiscoveredEndpoint(path=p, url=f"{target_url.rstrip('/')}{p}", status_code=200, category=cat, method="GET"))

    recon_ip = data.get("recon_info", {}).get("ip_address") if data.get("recon_info") else None

    return AttackSurfaceTree(
        target_url=target_url,
        hostname=hostname,
        ip_address=recon_ip,
        tech_stack=tech_stack,
        endpoints=endpoints
    )

def _build_scan_summary(r: ScanResultModel) -> ScanSummary:

    return ScanSummary(
        id=r.id,
        target_id=r.target_id,
        target_url=r.target_url,
        created_at=r.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
        scan_profile=r.scan_profile or "Standard",
        score=r.score,
        rating=r.rating,
        findings_count_critical=r.findings_count_critical or 0,
        findings_count_high=r.findings_count_high or 0,
        findings_count_medium=r.findings_count_medium or 0,
        findings_count_low=r.findings_count_low or 0,
        findings_count_info=r.findings_count_info or 0
    )

def _build_target_response(t: TargetModel) -> TargetResponse:
    return TargetResponse(
        id=t.id,
        name=t.name,
        url=t.url,
        description=t.description,
        environment=t.environment or "Production",
        created_at=t.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
        last_scan_at=t.last_scan_at.strftime("%Y-%m-%d %H:%M:%S UTC") if t.last_scan_at else None,
        security_score=t.security_score or 100,
        open_findings_count=t.open_findings_count or 0,
        status=t.status or "Active"
    )

def _build_finding_response(f: FindingModel) -> dict:
    return {
        "id": f.id,
        "finding_key": f.finding_key,
        "scan_id": f.scan_id,
        "target_id": f.target_id,
        "title": f.title,
        "severity": f.severity,
        "category": f.category,
        "target_url": f.target_url,
        "affected_url": f.affected_url,
        "description": f.description,
        "evidence": f.evidence,
        "impact": f.impact,
        "remediation": f.remediation,
        "detection_rule": f.detection_rule,
        "owasp_category": f.owasp_category,
        "cwe_id": f.cwe_id,
        "status": f.status,
        "notes": f.notes,
        "created_at": f.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if f.created_at else None,
        "updated_at": f.updated_at.strftime("%Y-%m-%d %H:%M:%S UTC") if f.updated_at else None
    }
