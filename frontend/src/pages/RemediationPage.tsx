import React, { useEffect, useState } from 'react';
import { getFindings, updateFinding } from '../services/api';
import type { Finding, FindingStatus } from '../types/scan';
import { GlassPanel, SectionLabel, SeverityBadge, StatusBadge, LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';

export default function RemediationPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    getFindings({ status: 'Open' })
      .then(setFindings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: number, status: FindingStatus) => {
    setUpdating(id);
    try {
      const updated = await updateFinding(id, { status });
      setFindings(prev => prev.filter(f => f.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setUpdating(null); }
  };

  if (loading) return <div className="p-10"><LoadingSpinner message="Loading remediation queue..." /></div>;
  if (error) return <div className="p-10"><ErrorMessage message={error} /></div>;

  return (
    <div className="min-h-screen px-6 md:px-16 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <SectionLabel label="Remediation Workflow" className="mb-2" />
          <h1 className="text-3xl font-black text-white tracking-tight">Remediation Queue</h1>
          <p className="text-slate-500 text-sm mt-1">Open security vulnerabilities awaiting triage and remediation.</p>
        </div>

        {findings.length === 0 ? (
          <GlassPanel className="p-12 text-center" accent>
            <div className="text-4xl mb-3 text-emerald-400">✓</div>
            <div className="text-lg font-black text-white mb-1">Remediation Queue Clear</div>
            <div className="text-slate-500 text-sm">All open findings have been triaged or resolved.</div>
          </GlassPanel>
        ) : (
          <div className="space-y-3">
            {findings.map(f => (
              <GlassPanel key={f.id} className="p-5 hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <SeverityBadge severity={f.severity} />
                      <span className="text-[10px] font-mono-tech text-slate-600">{f.category}</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-0.5">{f.title}</div>
                    <div className="text-xs text-cyan-400 font-mono-tech truncate">{f.affected_url}</div>
                    {f.remediation && (
                      <div className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">{f.remediation}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <button
                      onClick={() => f.id && handleStatus(f.id, 'Triaged')}
                      disabled={updating === f.id}
                      className="bg-amber-950/40 text-amber-400 border border-amber-500/20 hover:bg-amber-900/40 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-colors"
                    >Triage</button>
                    <button
                      onClick={() => f.id && handleStatus(f.id, 'Resolved')}
                      disabled={updating === f.id}
                      className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900/40 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-colors"
                    >Resolved</button>
                    <button
                      onClick={() => f.id && handleStatus(f.id, 'False Positive')}
                      disabled={updating === f.id}
                      className="bg-slate-900 text-slate-500 border border-slate-700 hover:text-slate-300 px-3 py-1.5 rounded-xl font-mono-tech text-xs font-bold transition-colors"
                    >False Positive</button>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
