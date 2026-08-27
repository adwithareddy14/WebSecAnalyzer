from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class FindingStatus(str, Enum):
    OPEN = "Open"
    TRIAGED = "Triaged"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    FALSE_POSITIVE = "False Positive"
    VERIFIED = "Verified"

class ScanProfile(str, Enum):
    QUICK = "Quick"
    STANDARD = "Standard"
    FULL = "Full"

class TargetCreate(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    environment: Optional[str] = "Production"

class TargetResponse(BaseModel):
    id: int
    name: str
    url: str
    description: Optional[str] = None
    environment: str
    created_at: str
    last_scan_at: Optional[str] = None
    security_score: int
    open_findings_count: int
    status: str

class Finding(BaseModel):
    id: Optional[int] = None
    finding_key: Optional[str] = None
    scan_id: Optional[int] = None
    target_id: Optional[int] = None
    title: str
    severity: SeverityLevel
    category: str
    target_url: str = ""
    affected_url: str = ""
    description: str
    evidence: str
    impact: str
    # 'remediation' is the canonical field; accept 'recommendation' as alias for
    # backward-compat with service files that still pass recommendation=...
    remediation: str = Field(default="", alias="recommendation", validation_alias="recommendation")
    detection_rule: str = ""
    owasp_category: Optional[str] = None
    cwe_id: Optional[str] = None
    status: FindingStatus = FindingStatus.OPEN
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"populate_by_name": True}

class FindingUpdate(BaseModel):
    status: Optional[FindingStatus] = None
    notes: Optional[str] = None

class HeaderInfo(BaseModel):
    header_name: str
    status: str  # "Present" or "Absent"
    current_value: Optional[str] = None
    severity: SeverityLevel
    security_significance: str
    recommendation: str

class CookieInfo(BaseModel):
    name: str
    value_preview: str
    secure: bool
    httponly: bool
    samesite: Optional[str] = None
    domain: Optional[str] = None
    path: Optional[str] = None
    expires_or_maxage: Optional[str] = None
    findings: List[Finding] = []

class TlsInfo(BaseModel):
    https_available: bool
    subject: Optional[str] = None
    issuer: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    days_remaining: Optional[int] = None
    hostname_verified: bool = False
    tls_version: Optional[str] = None
    cipher_name: Optional[str] = None
    issues: List[str] = []

class CorsInfo(BaseModel):
    allow_origin: Optional[str] = None
    allow_credentials: bool = False
    allow_methods: Optional[str] = None
    misconfigured: bool = False
    findings: List[Finding] = []

class ReconInfo(BaseModel):
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    dns_records: Dict[str, Any] = {}
    exposed_files: List[str] = []

class RedirectStep(BaseModel):
    step: int
    url: str
    status_code: int

class ServerInfo(BaseModel):
    status_code: int
    content_type: Optional[str] = None
    server_header: Optional[str] = None
    x_powered_by: Optional[str] = None
    technology_disclosures: List[str] = []

class ScanCreateRequest(BaseModel):
    url: str
    target_id: Optional[int] = None
    scan_profile: ScanProfile = ScanProfile.STANDARD
    timeout: Optional[int] = Field(default=10, ge=1, le=60)
    selected_modules: Optional[List[str]] = None

class ScanResponse(BaseModel):
    id: Optional[int] = None
    target_id: Optional[int] = None
    target_name: Optional[str] = None
    target_url: str
    created_at: str
    scan_profile: str
    score: int
    rating: str
    summary_counts: Dict[str, int]
    findings: List[Finding]
    headers: List[HeaderInfo]
    cookies: List[CookieInfo]
    tls_info: TlsInfo
    cors_info: Optional[CorsInfo] = None
    recon_info: Optional[ReconInfo] = None
    redirect_chain: List[RedirectStep]
    server_info: ServerInfo

class ScanSummary(BaseModel):
    id: int
    target_id: Optional[int] = None
    target_url: str
    created_at: str
    scan_profile: str
    score: int
    rating: str
    findings_count_critical: int
    findings_count_high: int
    findings_count_medium: int
    findings_count_low: int
    findings_count_info: int

class DashboardStats(BaseModel):
    security_score: int
    total_targets: int
    total_scans: int
    open_findings: int
    resolved_findings: int
    counts_by_severity: Dict[str, int]
    recent_scans: List[ScanSummary]

class CliExecuteRequest(BaseModel):
    command: str

class CliExecuteResponse(BaseModel):
    command: str
    status: str
    output: str
    error: Optional[str] = None

class SystemStatus(BaseModel):
    api: str = "ONLINE"
    database: str = "CONNECTED"
    scanner: str = "READY"
    cli: str = "AVAILABLE"
    report_engine: str = "READY"
    version: str = "2.0.0"

class DiscoveredEndpoint(BaseModel):
    path: str
    url: str
    status_code: int
    category: str  # e.g., "Authentication", "API", "Admin", "Static", "Root"
    method: str = "GET"
    findings_count: int = 0
    technology: Optional[str] = None

class AttackSurfaceTree(BaseModel):
    target_url: str
    hostname: str
    ip_address: Optional[str] = None
    tech_stack: List[str] = []
    endpoints: List[DiscoveredEndpoint] = []

