// Core types for WebVulnX frontend

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingStatus = 'Open' | 'Triaged' | 'In Progress' | 'Resolved' | 'False Positive' | 'Verified';
export type ScanProfile = 'Quick' | 'Standard' | 'Full';
export type Environment = 'Production' | 'Staging' | 'Development' | 'Testing';

export interface Finding {
  id?: number;
  finding_key?: string;
  scan_id?: number;
  target_id?: number;
  title: string;
  severity: SeverityLevel;
  category: string;
  target_url: string;
  affected_url: string;
  description: string;
  evidence: string;
  impact: string;
  remediation: string;
  detection_rule?: string;
  owasp_category?: string;
  cwe_id?: string;
  status: FindingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HeaderInfo {
  header_name: string;
  status: 'Present' | 'Absent';
  current_value?: string;
  severity: SeverityLevel;
  security_significance: string;
  recommendation: string;
}

export interface CookieInfo {
  name: string;
  value_preview: string;
  secure: boolean;
  httponly: boolean;
  samesite?: string;
  domain?: string;
  path?: string;
  expires_or_maxage?: string;
  findings: Finding[];
}

export interface TlsInfo {
  https_available: boolean;
  subject?: string;
  issuer?: string;
  valid_from?: string;
  valid_to?: string;
  days_remaining?: number;
  hostname_verified: boolean;
  tls_version?: string;
  cipher_name?: string;
  issues: string[];
}

export interface CorsInfo {
  allow_origin?: string;
  allow_credentials: boolean;
  allow_methods?: string;
  misconfigured: boolean;
  findings: Finding[];
}

export interface ReconInfo {
  hostname?: string;
  ip_address?: string;
  dns_records: Record<string, unknown>;
  exposed_files: string[];
}

export interface RedirectStep {
  step: number;
  url: string;
  status_code: number;
}

export interface ServerInfo {
  status_code: number;
  content_type?: string;
  server_header?: string;
  x_powered_by?: string;
  technology_disclosures: string[];
}

export interface ScanResponse {
  id?: number;
  target_id?: number;
  target_name?: string;
  target_url: string;
  created_at: string;
  scan_profile: string;
  score: number;
  rating: string;
  summary_counts: Record<string, number>;
  findings: Finding[];
  headers: HeaderInfo[];
  cookies: CookieInfo[];
  tls_info: TlsInfo;
  cors_info?: CorsInfo;
  recon_info?: ReconInfo;
  redirect_chain: RedirectStep[];
  server_info: ServerInfo;
}

export interface ScanSummary {
  id: number;
  target_id?: number;
  target_url: string;
  created_at: string;
  scan_profile: string;
  score: number;
  rating: string;
  findings_count_critical: number;
  findings_count_high: number;
  findings_count_medium: number;
  findings_count_low: number;
  findings_count_info: number;
}

export interface Target {
  id: number;
  name: string;
  url: string;
  description?: string;
  environment: Environment;
  created_at: string;
  last_scan_at?: string;
  security_score: number;
  open_findings_count: number;
  status: string;
}

export interface TargetCreate {
  name: string;
  url: string;
  description?: string;
  environment?: Environment;
}

export interface DashboardStats {
  security_score: number;
  total_targets: number;
  total_scans: number;
  open_findings: number;
  resolved_findings: number;
  counts_by_severity: Record<string, number>;
  recent_scans: ScanSummary[];
}

export interface FindingUpdate {
  status?: FindingStatus;
  notes?: string;
}

export interface CliExecuteResponse {
  command: string;
  status: string;
  output: string;
  error?: string;
}

export interface SystemStatus {
  api: string;
  database: string;
  scanner: string;
  cli: string;
  report_engine: string;
  version: string;
}

export interface DiscoveredEndpoint {
  path: string;
  url: string;
  status_code: number;
  category: string;
  method: string;
  findings_count: number;
  technology?: string;
}

export interface AttackSurfaceTree {
  target_url: string;
  hostname: string;
  ip_address?: string;
  tech_stack: string[];
  endpoints: DiscoveredEndpoint[];
}

