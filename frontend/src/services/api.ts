import type {
  ScanResponse, ScanSummary, Target, TargetCreate, DashboardStats,
  FindingUpdate, Finding, ScanProfile
} from '../types/scan';

const BASE_URL = 'http://localhost:8001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const j = await res.json(); detail = j.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// ── Health ────────────────────────────────────
export const checkHealth = () => request<{ status: string }>('/health');

// ── Dashboard ─────────────────────────────────
export const getDashboardStats = () => request<DashboardStats>('/dashboard');

// ── Targets ───────────────────────────────────
export const getTargets = () => request<Target[]>('/targets');
export const getTarget = (id: number) => request<Target>(`/targets/${id}`);
export const createTarget = (data: TargetCreate) =>
  request<Target>('/targets', { method: 'POST', body: JSON.stringify(data) });
export const deleteTarget = (id: number) =>
  request<{ status: string }>(`/targets/${id}`, { method: 'DELETE' });

// ── Scans ─────────────────────────────────────
export const performScan = (url: string, profile: ScanProfile = 'Standard', targetId?: number, modules?: string[]) =>
  request<ScanResponse>('/scans', {
    method: 'POST',
    body: JSON.stringify({ url, scan_profile: profile, target_id: targetId, selected_modules: modules }),
  });
export const getScanHistory = () => request<ScanSummary[]>('/scans');
export const getScanById = (id: number) => request<ScanResponse>(`/scans/${id}`);
export const deleteScan = (id: number) => request<{ status: string }>(`/scans/${id}`, { method: 'DELETE' });

// ── Report Export ─────────────────────────────
export const getReportUrl = (scanId: number, format: 'html' | 'json' | 'csv' | 'pdf') =>
  `${BASE_URL}/scans/${scanId}/report?format=${format}`;

// ── Findings ──────────────────────────────────
export const getFindings = (params?: {
  severity?: string; status?: string; target_id?: number; category?: string; search?: string;
}) => {
  const q = new URLSearchParams();
  if (params?.severity) q.set('severity', params.severity);
  if (params?.status) q.set('status', params.status);
  if (params?.target_id) q.set('target_id', String(params.target_id));
  if (params?.category) q.set('category', params.category);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return request<Finding[]>(`/findings${qs ? '?' + qs : ''}`);
};
export const getFinding = (id: number) => request<Finding>(`/findings/${id}`);
export const updateFinding = (id: number, update: FindingUpdate) =>
  request<Finding>(`/findings/${id}`, { method: 'PATCH', body: JSON.stringify(update) });

// ── System & CLI & Attack Surface ─────────────
export const getSystemStatus = () => request<import('../types/scan').SystemStatus>('/system/status');
export const executeCliCommand = (command: string) =>
  request<import('../types/scan').CliExecuteResponse>('/cli/execute', {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
export const getAttackSurface = (scanId: number) =>
  request<import('../types/scan').AttackSurfaceTree>(`/scans/${scanId}/attack-surface`);

