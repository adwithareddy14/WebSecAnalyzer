import sys
import os
import asyncio
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.scanner import perform_scan
from app.services.reports import (
    generate_json_report, generate_html_report,
    generate_csv_report, generate_pdf_report
)

console = Console()

@click.group()
def cli():
    """WebVulnX — Ethical Web Application Security Assessment & Vulnerability Management Platform"""
    pass

@cli.command()
def version():
    """Display WebVulnX version information."""
    console.print(Panel.fit(
        "[bold cyan]WebVulnX[/bold cyan] v2.0.0\n"
        "[dim]Ethical Web Application Security Assessment Platform[/dim]",
        title="Version",
        border_style="cyan"
    ))

@cli.command()
@click.argument("url")
@click.option("--profile", type=click.Choice(["Quick", "Standard", "Full"], case_sensitive=False), default="Standard", help="Scan profile.")
@click.option("--format", "output_format", type=click.Choice(["terminal", "json", "html", "csv", "pdf"], case_sensitive=False), default="terminal", help="Output format.")
@click.option("--output", "--out", type=click.Path(), help="Output file path to save report.")
@click.option("--timeout", default=10, help="Connection timeout in seconds.")
@click.option("--verbose", is_flag=True, help="Enable verbose evidence & remediation output.")
def scan(url: str, profile: str, output_format: str, output: str, timeout: int, verbose: bool):
    """Scan a target URL for security vulnerabilities & configuration weaknesses."""
    console.print(f"[bold blue][*][/bold blue] Initiating [bold cyan]{profile}[/bold cyan] passive security analysis for [bold yellow]{url}[/bold yellow]...")

    try:
        scan_res = asyncio.run(perform_scan(url, scan_profile=profile.capitalize(), timeout=timeout))
    except Exception as e:
        console.print(f"[bold red][!] Error during scan:[/bold red] {e}")
        sys.exit(1)

    if output_format.lower() == "json":
        content = generate_json_report(scan_res)
        if output:
            with open(output, "w", encoding="utf-8") as f:
                f.write(content)
            console.print(f"[bold green][✓][/bold green] JSON report written to {output}")
        else:
            console.print(content)
        return

    if output_format.lower() == "html":
        content = generate_html_report(scan_res)
        if output:
            with open(output, "w", encoding="utf-8") as f:
                f.write(content)
            console.print(f"[bold green][✓][/bold green] HTML report written to {output}")
        else:
            console.print(content)
        return

    if output_format.lower() == "csv":
        content = generate_csv_report(scan_res)
        if output:
            with open(output, "w", encoding="utf-8") as f:
                f.write(content)
            console.print(f"[bold green][✓][/bold green] CSV report written to {output}")
        else:
            console.print(content)
        return

    if output_format.lower() == "pdf":
        try:
            pdf_bytes = generate_pdf_report(scan_res)
            out_file = output or "webvulnx_report.pdf"
            with open(out_file, "wb") as f:
                f.write(pdf_bytes)
            console.print(f"[bold green][✓][/bold green] PDF report generated and saved to [bold]{out_file}[/bold]")
        except Exception as e:
            console.print(f"[bold red][!] PDF generation failed:[/bold red] {e}")
        return

    # Terminal Output
    rating_color = "green" if scan_res.score >= 80 else ("yellow" if scan_res.score >= 60 else "red")
    
    console.print()
    console.print(Panel(
        f"[bold]Target:[/bold] {scan_res.target_url}\n"
        f"[bold]Profile:[/bold] {scan_res.scan_profile}\n"
        f"[bold]Security Score:[/bold] [{rating_color}]{scan_res.score}/100[/{rating_color}]\n"
        f"[bold]Rating:[/bold] [{rating_color}]{scan_res.rating}[/{rating_color}]\n"
        f"[bold]Scan Timestamp:[/bold] {scan_res.created_at}",
        title="[bold cyan]WebVulnX Security Summary[/bold cyan]",
        border_style="cyan"
    ))

    # Findings Table
    table = Table(title="Findings Breakdown", show_header=True, header_style="bold magenta")
    table.add_column("Severity", style="bold", width=10)
    table.add_column("Title", style="white")
    table.add_column("OWASP", style="cyan", width=18)
    table.add_column("CWE", style="violet", width=10)

    for f in scan_res.findings:
        sev_color = "magenta" if f.severity == "CRITICAL" else ("red" if f.severity == "HIGH" else ("yellow" if f.severity == "MEDIUM" else ("blue" if f.severity == "LOW" else "green")))
        table.add_row(
            f"[{sev_color}]{f.severity}[/{sev_color}]",
            f.title,
            f.owasp_category or "—",
            f.cwe_id or "—"
        )

    console.print(table)
    console.print()

    if verbose:
        console.print("[bold underline]Detailed Findings Evidence & Remediation:[/bold underline]")
        for idx, f in enumerate(scan_res.findings, 1):
            sev_color = "magenta" if f.severity == "CRITICAL" else ("red" if f.severity == "HIGH" else ("yellow" if f.severity == "MEDIUM" else "blue"))
            console.print(f"[bold]{idx}. [{sev_color}]{f.title}[/{sev_color}][/bold]")
            if f.owasp_category: console.print(f"   [cyan]OWASP:[/cyan] {f.owasp_category}")
            if f.cwe_id: console.print(f"   [violet]CWE:[/violet] {f.cwe_id}")
            console.print(f"   [dim]Evidence:[/dim] {f.evidence}")
            console.print(f"   [dim]Impact:[/dim] {f.impact}")
            console.print(f"   [green]Remediation:[/green] {f.remediation}")
            console.print()

    if output:
        report_html = generate_html_report(scan_res)
        with open(output, "w", encoding="utf-8") as f:
            f.write(report_html)
        console.print(f"[bold green][✓][/bold green] HTML scan report saved to [bold]{output}[/bold]")

    console.print("[bold green]Scan completed successfully.[/bold green]")

@cli.group()
def targets():
    """Manage security assessment targets."""
    pass

@targets.command("list")
def list_targets():
    """List all managed target applications."""
    try:
        from app.core.database import SessionLocal
        from app.models.scan import TargetModel
        db = SessionLocal()
        records = db.query(TargetModel).order_by(TargetModel.created_at.desc()).all()
        db.close()

        if not records:
            console.print("[yellow]No managed targets found. Add targets in WebVulnX GUI or database.[/yellow]")
            return

        table = Table(title="Managed Targets", show_header=True, header_style="bold cyan")
        table.add_column("ID", width=4)
        table.add_column("Name", style="bold white")
        table.add_column("URL")
        table.add_column("Env", width=12)
        table.add_column("Score", width=8)
        table.add_column("Open Findings", width=14)

        for r in records:
            score_color = "green" if r.security_score >= 80 else ("yellow" if r.security_score >= 60 else "red")
            table.add_row(
                str(r.id),
                r.name,
                r.url,
                r.environment or "Production",
                f"[{score_color}]{r.security_score}/100[/{score_color}]",
                str(r.open_findings_count)
            )

        console.print(table)
    except Exception as e:
        console.print(f"[red]Error fetching targets:[/red] {e}")

@cli.group()
def findings():
    """Manage security findings."""
    pass

@findings.command("list")
@click.option("--severity", help="Filter by severity level (CRITICAL, HIGH, MEDIUM, LOW, INFO).")
@click.option("--status", help="Filter by status (Open, Triaged, In Progress, Resolved).")
def list_findings(severity: str, status: str):
    """List and filter security findings."""
    try:
        from app.core.database import SessionLocal
        from app.models.scan import FindingModel
        db = SessionLocal()
        q = db.query(FindingModel)
        if severity:
            q = q.filter(FindingModel.severity == severity.upper())
        if status:
            q = q.filter(FindingModel.status == status)
        records = q.order_by(FindingModel.created_at.desc()).all()
        db.close()

        if not records:
            console.print("[yellow]No matching security findings found.[/yellow]")
            return

        table = Table(title="Security Findings", show_header=True, header_style="bold magenta")
        table.add_column("ID", width=4)
        table.add_column("Severity", width=10)
        table.add_column("Title")
        table.add_column("Status", width=12)
        table.add_column("OWASP", width=18)

        for r in records:
            sev_color = "magenta" if r.severity == "CRITICAL" else ("red" if r.severity == "HIGH" else ("yellow" if r.severity == "MEDIUM" else "blue"))
            table.add_row(
                str(r.id),
                f"[{sev_color}]{r.severity}[/{sev_color}]",
                r.title,
                r.status,
                r.owasp_category or "—"
            )

        console.print(table)
    except Exception as e:
        console.print(f"[red]Error fetching findings:[/red] {e}")

@cli.command()
def history():
    """Display past scan history stored in the database."""
    try:
        from app.core.database import SessionLocal
        from app.models.scan import ScanResultModel
        db = SessionLocal()
        records = db.query(ScanResultModel).order_by(ScanResultModel.created_at.desc()).all()
        db.close()

        if not records:
            console.print("[yellow]No previous scan history found.[/yellow]")
            return

        table = Table(title="Scan History", show_header=True, header_style="bold cyan")
        table.add_column("ID", width=6)
        table.add_column("Target URL", style="white")
        table.add_column("Profile", width=10)
        table.add_column("Score", width=8)
        table.add_column("Rating", width=12)
        table.add_column("Date", width=20)

        for r in records:
            rating_color = "green" if r.score >= 80 else ("yellow" if r.score >= 60 else "red")
            table.add_row(
                str(r.id),
                r.target_url,
                r.scan_profile or "Standard",
                f"[{rating_color}]{r.score}/100[/{rating_color}]",
                r.rating,
                r.created_at.strftime("%Y-%m-%d %H:%M:%S")
            )

        console.print(table)
    except Exception as e:
        console.print(f"[red]Error fetching scan history:[/red] {e}")

@cli.command()
def demo():
    """Run a safe local demonstration assessment against a mock target."""
    console.print("[bold yellow][*] Running safe local WebVulnX demonstration assessment...[/bold yellow]")
    
    demo_url = "http://localhost:8001/demo-target"
    console.print(f"Targeting local demo mock endpoint: {demo_url}")
    
    try:
        scan_res = asyncio.run(perform_scan(demo_url, scan_profile="Full", timeout=5))
        
        rating_color = "yellow" if scan_res.score >= 60 else "red"
        console.print()
        console.print(Panel(
            f"[bold]Target:[/bold] {scan_res.target_url}\n"
            f"[bold]Security Score:[/bold] [{rating_color}]{scan_res.score}/100[/{rating_color}]\n"
            f"[bold]Rating:[/bold] [{rating_color}]{scan_res.rating}[/{rating_color}]\n"
            f"[bold]Notice:[/bold] Safe non-destructive local demonstration.",
            title="[bold yellow]WebVulnX Demo Analysis Result[/bold yellow]",
            border_style="yellow"
        ))

        table = Table(title="Demonstration Findings", show_header=True, header_style="bold red")
        table.add_column("Severity", width=10)
        table.add_column("Title")
        table.add_column("OWASP Category")
        table.add_column("CWE ID")

        for f in scan_res.findings:
            sev_color = "red" if f.severity == "HIGH" else ("yellow" if f.severity == "MEDIUM" else "blue")
            table.add_row(
                f"[{sev_color}]{f.severity}[/{sev_color}]",
                f.title,
                f.owasp_category or "—",
                f.cwe_id or "—"
            )

        console.print(table)
        console.print("\n[bold green]Demo assessment completed successfully.[/bold green]")
    except Exception as e:
        console.print(f"[red]Demo scan error:[/red] {e}")

if __name__ == "__main__":
    cli()
