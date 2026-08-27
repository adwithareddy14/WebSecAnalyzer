import json
import csv
import io
from datetime import datetime
from jinja2 import Template
from app.schemas.scan import ScanResponse

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebVulnX Security Assessment Report – {{ scan.target_url }}</title>
    <style>
        :root {
            --bg: #0b0f19; --card: #151c2c; --panel: #1e293b;
            --text: #f8fafc; --muted: #94a3b8; --border: #334155;
            --critical: #dc2626; --high: #ef4444; --medium: #f59e0b;
            --low: #3b82f6; --info: #10b981; --cyan: #38bdf8;
        }
        * { box-sizing: border-box; }
        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 32px; line-height: 1.5; }
        .container { max-width: 1050px; margin: 0 auto; }
        .report-header { border-bottom: 2px solid var(--border); padding-bottom: 24px; margin-bottom: 32px; }
        .report-title { font-size: 28px; font-weight: 800; color: var(--cyan); margin: 0 0 6px; }
        .report-meta { color: var(--muted); font-size: 14px; }
        .score-row { display: flex; gap: 20px; margin-bottom: 32px; flex-wrap: wrap; }
        .score-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px 28px; flex: 1; min-width: 140px; }
        .score-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 700; }
        .score-card .value { font-size: 32px; font-weight: 900; margin-top: 4px; }
        .score-card.critical .value { color: var(--critical); }
        .score-card.high .value { color: var(--high); }
        .score-card.medium .value { color: var(--medium); }
        .score-card.low .value { color: var(--low); }
        .score-card.info .value { color: var(--info); }
        .score-card.main .value { color: var(--cyan); }
        h2 { font-size: 18px; font-weight: 700; color: #cbd5e1; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin: 32px 0 16px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
        .badge-CRITICAL { background: rgba(220,38,38,.15); color: #fca5a5; border: 1px solid rgba(220,38,38,.3); }
        .badge-HIGH { background: rgba(239,68,68,.12); color: #f87171; border: 1px solid rgba(239,68,68,.3); }
        .badge-MEDIUM { background: rgba(245,158,11,.12); color: #fbbf24; border: 1px solid rgba(245,158,11,.3); }
        .badge-LOW { background: rgba(59,130,246,.12); color: #60a5fa; border: 1px solid rgba(59,130,246,.3); }
        .badge-INFO { background: rgba(16,185,129,.12); color: #34d399; border: 1px solid rgba(16,185,129,.3); }
        .finding { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 18px; margin-bottom: 14px; }
        .finding-title { font-weight: 700; font-size: 15px; margin-bottom: 10px; }
        .finding dl { display: grid; grid-template-columns: 140px 1fr; gap: 4px 12px; font-size: 13px; margin: 0; }
        .finding dt { color: var(--muted); font-weight: 600; }
        .finding dd { margin: 0; color: #cbd5e1; word-break: break-word; }
        .code-block { background: #0b0f19; border: 1px solid var(--border); border-radius: 4px; font-family: monospace; font-size: 12px; padding: 8px 12px; margin: 6px 0; color: var(--cyan); }
        table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 8px; overflow: hidden; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
        th { background: #0b0f19; color: var(--muted); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: .04em; }
        .footer { margin-top: 48px; border-top: 1px solid var(--border); padding-top: 20px; text-align: center; color: var(--muted); font-size: 12px; }
    </style>
</head>
<body><div class="container">
<div class="report-header">
    <div class="report-title">WebVulnX Security Assessment Report</div>
    <div class="report-meta">
        Target: <strong>{{ scan.target_url }}</strong> &nbsp;|&nbsp;
        Date: {{ scan.created_at }} &nbsp;|&nbsp;
        Profile: {{ scan.scan_profile }} &nbsp;|&nbsp;
        Rating: <strong>{{ scan.rating }}</strong>
    </div>
</div>

<div class="score-row">
    <div class="score-card main">
        <div class="label">Security Score</div>
        <div class="value">{{ scan.score }}<span style="font-size:18px;font-weight:400;color:#94a3b8">/100</span></div>
    </div>
    <div class="score-card critical">
        <div class="label">Critical</div>
        <div class="value">{{ scan.summary_counts.get('CRITICAL', 0) }}</div>
    </div>
    <div class="score-card high">
        <div class="label">High</div>
        <div class="value">{{ scan.summary_counts.get('HIGH', 0) }}</div>
    </div>
    <div class="score-card medium">
        <div class="label">Medium</div>
        <div class="value">{{ scan.summary_counts.get('MEDIUM', 0) }}</div>
    </div>
    <div class="score-card low">
        <div class="label">Low</div>
        <div class="value">{{ scan.summary_counts.get('LOW', 0) }}</div>
    </div>
    <div class="score-card info">
        <div class="label">Info</div>
        <div class="value">{{ scan.summary_counts.get('INFO', 0) }}</div>
    </div>
</div>

<h2>Executive Summary</h2>
<p style="color:#cbd5e1;font-size:14px;">
    This security assessment of <strong>{{ scan.target_url }}</strong> was conducted using WebVulnX
    with the <strong>{{ scan.scan_profile }}</strong> scan profile on {{ scan.created_at }}.
    The assessment identified <strong>{{ scan.findings|length }}</strong> security observations
    across HTTP headers, TLS configuration, cookie security attributes, and server information disclosure.
    The overall security posture is rated <strong>{{ scan.rating }}</strong> with a score of
    <strong>{{ scan.score }}/100</strong>.
</p>

<h2>Detailed Findings ({{ scan.findings|length }})</h2>
{% for f in scan.findings %}
<div class="finding">
    <div class="finding-title">
        <span class="badge badge-{{ f.severity }}">{{ f.severity }}</span>&nbsp;
        {{ f.title }}
    </div>
    <dl>
        <dt>Category</dt><dd>{{ f.category }}</dd>
        <dt>Affected URL</dt><dd>{{ f.affected_url }}</dd>
        <dt>Evidence</dt><dd><div class="code-block">{{ f.evidence }}</div></dd>
        <dt>Impact</dt><dd>{{ f.impact }}</dd>
        <dt>Remediation</dt><dd>{{ f.remediation }}</dd>
        {% if f.owasp_category %}<dt>OWASP</dt><dd>{{ f.owasp_category }}</dd>{% endif %}
        {% if f.cwe_id %}<dt>CWE</dt><dd>{{ f.cwe_id }}</dd>{% endif %}
        <dt>Status</dt><dd>{{ f.status }}</dd>
    </dl>
</div>
{% endfor %}

<h2>HTTP Security Headers Matrix</h2>
<table>
    <thead><tr><th>Header</th><th>Status</th><th>Current Value</th><th>Recommendation</th></tr></thead>
    <tbody>
    {% for h in scan.headers %}
    <tr>
        <td style="font-family:monospace;font-size:12px;">{{ h.header_name }}</td>
        <td>{% if h.status == 'Present' %}<span style="color:#34d399;">Present</span>{% else %}<span style="color:#f87171;">Absent</span>{% endif %}</td>
        <td style="font-family:monospace;font-size:11px;color:#38bdf8;">{{ h.current_value or '—' }}</td>
        <td style="font-size:12px;color:#94a3b8;">{{ h.recommendation }}</td>
    </tr>
    {% endfor %}
    </tbody>
</table>

<h2>HTTPS & TLS Certificate</h2>
<table>
    <tbody>
        <tr><td><strong>HTTPS Available</strong></td><td>{{ 'Yes' if scan.tls_info.https_available else 'No' }}</td></tr>
        <tr><td><strong>Subject</strong></td><td>{{ scan.tls_info.subject or 'N/A' }}</td></tr>
        <tr><td><strong>Issuer</strong></td><td>{{ scan.tls_info.issuer or 'N/A' }}</td></tr>
        <tr><td><strong>Valid Period</strong></td><td>{{ scan.tls_info.valid_from or 'N/A' }} to {{ scan.tls_info.valid_to or 'N/A' }}</td></tr>
        <tr><td><strong>Days Remaining</strong></td><td>{{ scan.tls_info.days_remaining if scan.tls_info.days_remaining is not none else 'N/A' }}</td></tr>
        <tr><td><strong>Protocol Version</strong></td><td>{{ scan.tls_info.tls_version or 'N/A' }}</td></tr>
    </tbody>
</table>

<div class="footer">
    <p>Generated by <strong>WebVulnX</strong> v2.0 — Ethical Web Application Security Assessment Platform</p>
    <p>This report is based on passive, non-destructive security configuration analysis. Only use against authorized targets.</p>
</div>
</div></body></html>"""


def generate_json_report(scan_response: ScanResponse) -> str:
    return json.dumps(scan_response.model_dump(), indent=2)

def generate_html_report(scan_response: ScanResponse) -> str:
    template = Template(HTML_TEMPLATE)
    return template.render(scan=scan_response.model_dump())

def generate_csv_report(scan_response: ScanResponse) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Finding ID", "Title", "Severity", "Category", "Affected URL",
        "Description", "Evidence", "Impact", "Remediation", "OWASP", "CWE", "Status"
    ])
    for i, f in enumerate(scan_response.findings, 1):
        f_dict = f if isinstance(f, dict) else f.model_dump()
        writer.writerow([
            i,
            f_dict.get("title", ""),
            f_dict.get("severity", ""),
            f_dict.get("category", ""),
            f_dict.get("affected_url", ""),
            f_dict.get("description", ""),
            f_dict.get("evidence", ""),
            f_dict.get("impact", ""),
            f_dict.get("remediation", ""),
            f_dict.get("owasp_category", ""),
            f_dict.get("cwe_id", ""),
            f_dict.get("status", "")
        ])
    return output.getvalue()

def generate_pdf_report(scan_response: ScanResponse) -> bytes:
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("reportlab package not installed. Run: pip install reportlab")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=1.2*cm, bottomMargin=1.5*cm,
                            leftMargin=1.8*cm, rightMargin=1.8*cm)
    styles = getSampleStyleSheet()
    story = []

    dark_bg = colors.HexColor("#0b0f19")
    card_bg = colors.HexColor("#151c2c")
    text_color = colors.HexColor("#f1f5f9")
    muted_color = colors.HexColor("#94a3b8")
    cyan_color = colors.HexColor("#38bdf8")
    red_color = colors.HexColor("#ef4444")
    amber_color = colors.HexColor("#f59e0b")
    blue_color = colors.HexColor("#3b82f6")
    green_color = colors.HexColor("#10b981")
    critical_color = colors.HexColor("#dc2626")

    sev_colors = {
        "CRITICAL": critical_color,
        "HIGH": red_color,
        "MEDIUM": amber_color,
        "LOW": blue_color,
        "INFO": green_color
    }

    title_style = ParagraphStyle("Title", fontName="Helvetica-Bold", fontSize=20,
                                  textColor=cyan_color, spaceAfter=6)
    heading_style = ParagraphStyle("Heading", fontName="Helvetica-Bold", fontSize=13,
                                    textColor=text_color, spaceAfter=4, spaceBefore=14,
                                    borderPad=(0, 0, 4, 0))
    body_style = ParagraphStyle("Body", fontName="Helvetica", fontSize=9,
                                 textColor=muted_color, leading=13, spaceAfter=4)
    mono_style = ParagraphStyle("Mono", fontName="Courier", fontSize=8,
                                 textColor=cyan_color, leading=11)

    # ── Header ──
    story.append(Paragraph("WebVulnX Security Assessment Report", title_style))
    story.append(Paragraph(
        f"Target: <b>{scan_response.target_url}</b> &nbsp;|&nbsp; "
        f"Date: {scan_response.created_at} &nbsp;|&nbsp; "
        f"Profile: {scan_response.scan_profile} &nbsp;|&nbsp; "
        f"Rating: <b>{scan_response.rating}</b>",
        body_style
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#334155"), spaceAfter=12))

    # ── Score Summary ──
    counts = scan_response.summary_counts
    score_data = [
        ["Security Score", "Critical", "High", "Medium", "Low", "Info"],
        [
            f"{scan_response.score}/100",
            str(counts.get("CRITICAL", 0)),
            str(counts.get("HIGH", 0)),
            str(counts.get("MEDIUM", 0)),
            str(counts.get("LOW", 0)),
            str(counts.get("INFO", 0))
        ]
    ]
    score_table = Table(score_data, colWidths=[3.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), muted_color),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("TEXTCOLOR", (0, 1), (0, 1), cyan_color),
        ("TEXTCOLOR", (1, 1), (1, 1), critical_color),
        ("TEXTCOLOR", (2, 1), (2, 1), red_color),
        ("TEXTCOLOR", (3, 1), (3, 1), amber_color),
        ("TEXTCOLOR", (4, 1), (4, 1), blue_color),
        ("TEXTCOLOR", (5, 1), (5, 1), green_color),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, 1), 14),
        ("BACKGROUND", (0, 1), (-1, 1), card_bg),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#1e293b"), card_bg]),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#334155")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 14))

    # ── Executive Summary ──
    story.append(Paragraph("1. Executive Summary", heading_style))
    story.append(Paragraph(
        f"This WebVulnX security assessment of {scan_response.target_url} was conducted on "
        f"{scan_response.created_at} using the {scan_response.scan_profile} scan profile. "
        f"The assessment identified {len(scan_response.findings)} security observations. "
        f"The overall security posture is rated '{scan_response.rating}' with a score of "
        f"{scan_response.score}/100.",
        body_style
    ))

    # ── Findings ──
    story.append(Paragraph(f"2. Detailed Security Findings ({len(scan_response.findings)})", heading_style))

    for i, finding in enumerate(scan_response.findings, 1):
        f = finding if isinstance(finding, dict) else finding.model_dump()
        sev = f.get("severity", "INFO")
        sev_clr = sev_colors.get(sev, green_color)

        finding_header = Table(
            [[Paragraph(f"[{sev}] {f.get('title', '')}", ParagraphStyle(
                "FH", fontName="Helvetica-Bold", fontSize=9, textColor=sev_clr))]],
            colWidths=["100%"]
        )
        finding_header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1e293b")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
        ]))
        story.append(finding_header)

        detail_data = [
            ["Category", f.get("category", "—")],
            ["Affected URL", f.get("affected_url", "—")],
            ["Evidence", f.get("evidence", "—")],
            ["Impact", f.get("impact", "—")],
            ["Remediation", f.get("remediation", "—")],
            ["OWASP", f.get("owasp_category") or "—"],
            ["CWE", f.get("cwe_id") or "—"],
            ["Status", f.get("status", "Open")],
        ]
        detail_table = Table(detail_data, colWidths=[3*cm, 13.5*cm])
        detail_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (0, -1), muted_color),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TEXTCOLOR", (1, 0), (1, -1), text_color),
            ("BACKGROUND", (1, 0), (1, -1), card_bg),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#334155")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(detail_table)
        story.append(Spacer(1, 6))

    # ── Header Matrix ──
    story.append(PageBreak())
    story.append(Paragraph("3. HTTP Security Headers Matrix", heading_style))
    header_table_data = [["Header", "Status", "Current Value"]]
    for h in scan_response.headers:
        h_dict = h if isinstance(h, dict) else h.model_dump()
        header_table_data.append([
            h_dict.get("header_name", ""),
            h_dict.get("status", ""),
            (h_dict.get("current_value") or "None")[:60]
        ])
    hdr_table = Table(header_table_data, colWidths=[5*cm, 2.5*cm, 9*cm])
    hdr_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), muted_color),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), text_color),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [card_bg, colors.HexColor("#1e293b")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#334155")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(hdr_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("4. TLS Certificate Information", heading_style))
    tls = scan_response.tls_info if isinstance(scan_response.tls_info, dict) else scan_response.tls_info.model_dump()
    tls_data = [
        ["HTTPS Available", "Yes" if tls.get("https_available") else "No"],
        ["Subject", tls.get("subject") or "N/A"],
        ["Issuer", tls.get("issuer") or "N/A"],
        ["Valid From", tls.get("valid_from") or "N/A"],
        ["Expires", tls.get("valid_to") or "N/A"],
        ["Days Remaining", str(tls.get("days_remaining")) if tls.get("days_remaining") is not None else "N/A"],
        ["Protocol Version", tls.get("tls_version") or "N/A"],
    ]
    tls_table = Table(tls_data, colWidths=[4.5*cm, 12*cm])
    tls_table.setStyle(TableStyle([
        ("TEXTCOLOR", (0, 0), (0, -1), muted_color),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (1, 0), (1, -1), text_color),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [card_bg, colors.HexColor("#1e293b")]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#334155")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tls_table)

    doc.build(story)
    return buffer.getvalue()
