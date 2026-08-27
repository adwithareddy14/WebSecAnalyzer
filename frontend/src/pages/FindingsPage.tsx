import React, { useEffect, useState } from 'react';
import { getFindings, updateFinding, getTargets } from '../services/api';
import type { Finding, FindingStatus, SeverityLevel, Target } from '../types/scan';
import { SeverityBadge, StatusBadge, GlassPanel, SectionLabel, LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';
import { getVulnerabilityIntel } from '../services/vulnerability_db';

const SEVERITIES: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const STATUSES: FindingStatus[] = ['Open', 'Triaged', 'In Progress', 'Resolved', 'False Positive', 'Verified'];
type FrameworkKey = 'nginx' | 'apache' | 'express' | 'fastapi' | 'django' | 'cloudflare';

function FindingDetailDrawer({ finding, onClose, onUpdate }: {
  finding: Finding; onClose: () => void; onUpdate: (f: Finding) => void;
}) {
  const [status, setStatus] = useState<FindingStatus>(finding.status);
  const [saving, setSaving] = useState(false);
  const [activeFw, setActiveFw] = useState<FrameworkKey>('nginx');
  const [copied, setCopied] = useState(false);
  const intel = getVulnerabilityIntel(finding.category, finding.title);

  const handleAction = async (newStatus: FindingStatus) => {
    if (!finding.id) return;
    setSaving(true);
    try {
      const updated = await updateFinding(finding.id, { status: newStatus });
      onUpdate({ ...finding, ...updated });
      setStatus(newStatus);
    } catch (e: any) { alert('Failed: ' + e.message); }
    finally { setSaving(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl my-4 rounded-2xl border border-slate-700/80 bg-[#0a0f1c] shadow-2xl shadow-black overflow-hidden">
        {/* Header */}
        <div className="bg-[#0e1422] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <SeverityBadge severity={finding.severity} />
            <span className="text-xs font-mono-tech text-slate-500">#{finding.id} · {finding.category}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white font-mono-tech text-xs border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-lg transition-colors">
            [CLOSE]
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Title & Target */}
          <div>
            <h2 className="text-xl font-black text-white leading-tight mb-2">{finding.title}</h2>
            <p className="text-cyan-400 font-mono-tech text-sm break-all">{finding.affected_url}</p>
          </div>

          {/* Why this matters */}
          <div>
            <div className="text-[10px] font-mono-tech font-bold text-slate-500 tracking-widest mb-2">WHY THIS MATTERS</div>
            <p className="text-slate-300 text-sm leading-relaxed">{finding.impact}</p>
          </div>

          {/* Evidence */}
          <div>
            <div className="text-[10px] font-mono-tech font-bold text-slate-500 tracking-widest mb-2">OBSERVED EVIDENCE</div>
            <div className="bg-[#060a14] border border-slate-800 rounded-xl p-4 font-mono-tech text-xs text-amber-300 break-all">
              {finding.evidence || 'No evidence string collected by scanner.'}
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <div className="text-[10px] font-mono-tech font-bold text-slate-500 tracking-widest mb-2">TECHNICAL REFERENCES</div>
            <div className="flex flex-wrap gap-2">
              {finding.detection_rule && (
                <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-2.5 py-1 rounded-lg font-mono-tech">
                  Rule: <strong className="text-slate-200">{finding.detection_rule}</strong>
                </span>
              )}
              {finding.owasp_category && (
                <span className="bg-cyan-950/40 text-cyan-400 border border-cyan-700/30 text-[10px] px-2.5 py-1 rounded-lg font-mono-tech font-bold">{finding.owasp_category}</span>
              )}
              {finding.cwe_id && (
                <span className="bg-violet-950/40 text-violet-400 border border-violet-700/30 text-[10px] px-2.5 py-1 rounded-lg font-mono-tech font-bold">{finding.cwe_id}</span>
              )}
            </div>
          </div>

          {/* Remediation Code Snippets */}
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono-tech font-extrabold text-emerald-400 tracking-widest">REMEDIATION CODE SNIPPETS</span>
              <button onClick={() => copyCode(intel.code_snippets[activeFw])}
                className="text-[10px] font-mono-tech text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                {copied ? '✓ COPIED' : '[ Copy ]'}
              </button>
            </div>
            <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
              {(['nginx', 'apache', 'express', 'fastapi', 'django', 'cloudflare'] as FrameworkKey[]).map(fw => (
                <button key={fw} onClick={() => setActiveFw(fw)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono-tech font-bold uppercase transition-colors flex-shrink-0 ${
                    activeFw === fw ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-600 hover:text-slate-300'
                  }`}>{fw}</button>
              ))}
            </div>
            <div className="p-4">
              <pre className="bg-[#060a14] rounded-xl p-4 text-[11px] text-cyan-300 font-mono-tech overflow-x-auto leading-relaxed">
                {intel.code_snippets[activeFw]}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
            {status !== 'Triaged' && (
              <button onClick={() => handleAction('Triaged')} disabled={saving}
                className="bg-orange-950/40 text-orange-400 border border-orange-700/30 hover:bg-orange-900/40 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-colors">
                [ Triage ]
              </button>
            )}
            {status !== 'Resolved' && (
              <button onClick={() => handleAction('Resolved')} disabled={saving}
                className="bg-emerald-950/40 text-emerald-400 border border-emerald-700/30 hover:bg-emerald-900/40 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-colors">
                [ Mark Resolved ]
              </button>
            )}
            {status !== 'False Positive' && (
              <button onClick={() => handleAction('False Positive')} disabled={saving}
                className="bg-slate-900 text-slate-500 border border-slate-700 hover:text-slate-300 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-colors">
                [ False Positive ]
              </button>
            )}
            <div className="ml-auto">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [selected, setSelected] = useState<Finding | null>(null);

  useEffect(() => { getTargets().then(setTargets).catch(() => {}); }, []);

  const load = () => {
    setLoading(true);
    getFindings({ severity: sevFilter || undefined, status: statusFilter || undefined, search: search || undefined })
      .then(res => {
        let f = res;
        if (targetFilter) f = f.filter(x => x.affected_url?.includes(targetFilter));
        setFindings(f);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [sevFilter, statusFilter, targetFilter]);

  const handleUpdate = (updated: Finding) =>
    setFindings(prev => prev.map(f => f.id === updated.id ? updated : f));

  const SEV_COLORS: Record<string, string> = {
    CRITICAL: 'text-red-400', HIGH: 'text-orange-400', MEDIUM: 'text-amber-400', LOW: 'text-blue-400', INFO: 'text-teal-400'
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans select-none">
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <SectionLabel label="Vulnerability Management" className="mb-0.5" />
          <h1 className="text-2xl font-black text-white tracking-tight">Security Findings</h1>
        </div>
        <div className="font-mono-tech text-[10px] text-slate-500 bg-[#060a14] border border-slate-800 px-3 py-1.5 rounded-lg">{findings.length} findings displayed</div>
      </div>

        {/* Filter Bar */}
        <GlassPanel className="p-4 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={e => { e.preventDefault(); load(); }} className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">⌕</span>
              <input type="text" placeholder="Search findings..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-slate-700 font-mono-tech focus:outline-none focus:border-cyan-500 transition-colors" />
            </form>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#060a14] border border-slate-800 text-slate-400 text-xs font-mono-tech rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={targetFilter} onChange={e => setTargetFilter(e.target.value)}
              className="bg-[#060a14] border border-slate-800 text-slate-400 text-xs font-mono-tech rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 max-w-[200px]">
              <option value="">All Targets</option>
              {targets.map(t => <option key={t.id} value={t.url}>{t.name}</option>)}
            </select>
          </div>

          {/* Severity chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-mono-tech text-slate-600 tracking-wider">SEVERITY:</span>
            <button onClick={() => setSevFilter('')}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono-tech font-bold border transition-colors ${!sevFilter ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'text-slate-600 border-slate-800 hover:text-slate-400'}`}>
              ALL
            </button>
            {SEVERITIES.map(sev => (
              <button key={sev} onClick={() => setSevFilter(sevFilter === sev ? '' : sev)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono-tech font-bold border transition-colors ${
                  sevFilter === sev ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : `${SEV_COLORS[sev]} border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100`
                }`}>{sev}</button>
            ))}
          </div>
        </GlassPanel>

        {loading ? (
          <LoadingSpinner message="Querying vulnerability database..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : findings.length === 0 ? (
          <EmptyState title="NO FINDINGS FOUND" description="No vulnerabilities matched the current filters." />
        ) : (
          <div className="bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-800/50">
              {findings.map(f => (
                <div key={f.id}
                  className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors cursor-pointer hover:bg-slate-800/30 group"
                  onClick={() => setSelected(f)}
                >
                  <SeverityBadge severity={f.severity} />
                  
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs truncate group-hover:text-cyan-400 transition-colors">{f.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono-tech truncate mt-0.5">{f.affected_url}</div>
                    </div>
                    <div className="hidden md:block w-32 shrink-0 text-[9px] text-slate-500 font-mono-tech uppercase">{f.category}</div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <StatusBadge status={f.status} />
                    <button className="bg-[#060a14] border border-slate-800 hover:border-cyan-500/50 text-slate-400 group-hover:text-cyan-400 px-3 py-1 rounded-lg text-[10px] font-mono-tech font-bold transition-all">
                      [ View ]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {selected && <FindingDetailDrawer finding={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}
    </div>
  );
}
