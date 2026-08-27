import React, { useEffect, useState } from 'react';
import { getFindings } from '../services/api';
import type { Finding, SeverityLevel } from '../types/scan';
import { GlassPanel, SectionLabel, SeverityBadge, LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';

const SEV_ORDER: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFO: '#14b8a6',
};

export default function RiskAnalysisPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getFindings()
      .then(setFindings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const countBySev = SEV_ORDER.reduce((acc, sev) => {
    acc[sev] = findings.filter(f => f.severity === sev).length;
    return acc;
  }, {} as Record<string, number>);

  const byCategory = findings.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, Finding[]>);

  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length);
  const total = findings.length;

  if (loading) return <div className="p-10"><LoadingSpinner message="Analyzing risk profile..." /></div>;
  if (error) return <div className="p-10"><ErrorMessage message={error} /></div>;

  return (
    <div className="min-h-screen px-6 md:px-16 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <SectionLabel label="Risk Analysis" className="mb-2" />
          <h1 className="text-3xl font-black text-white tracking-tight">Risk Analysis</h1>
          <p className="text-slate-500 text-sm mt-1">Aggregated risk profile across all assessed applications.</p>
        </div>

        {findings.length === 0 ? (
          <EmptyState title="NO RISK DATA" description="Complete a security assessment to generate risk analysis." />
        ) : (
          <div className="space-y-6">
            {/* Severity breakdown */}
            <GlassPanel title="SEVERITY DISTRIBUTION" className="p-5">
              <div className="flex h-3 rounded-full overflow-hidden mb-5">
                {SEV_ORDER.map(sev => {
                  const pct = total > 0 ? ((countBySev[sev] || 0) / total) * 100 : 0;
                  return pct > 0 ? (
                    <div key={sev} style={{ width: `${pct}%`, background: SEV_COLORS[sev] }} title={`${sev}: ${countBySev[sev]}`} />
                  ) : null;
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {SEV_ORDER.map(sev => (
                  <div key={sev} className="text-center bg-[#060a14] border border-slate-800 rounded-xl p-3">
                    <div className="text-2xl font-black font-mono-tech" style={{ color: SEV_COLORS[sev] }}>{countBySev[sev] || 0}</div>
                    <div className="text-[9px] font-mono-tech text-slate-600 tracking-wider mt-1">{sev}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* By category */}
            <GlassPanel title="RISK BY VULNERABILITY CATEGORY" className="p-5">
              <div className="space-y-3">
                {sortedCategories.map(([cat, items]) => {
                  const pct = (items.length / total) * 100;
                  const topSev = items.sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity))[0]?.severity;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs font-mono-tech mb-1.5">
                        <span className="text-slate-300 font-semibold">{cat}</span>
                        <div className="flex items-center gap-2">
                          {topSev && <SeverityBadge severity={topSev} />}
                          <span className="text-slate-500">{items.length}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: SEV_COLORS[topSev] || '#6b7280' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>

            {/* Open vs resolved */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Open', count: findings.filter(f => f.status === 'Open').length, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-950/20' },
                { label: 'In Progress', count: findings.filter(f => f.status === 'In Progress' || f.status === 'Triaged').length, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-950/20' },
                { label: 'Resolved', count: findings.filter(f => f.status === 'Resolved' || f.status === 'False Positive').length, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-950/20' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 text-center`}>
                  <div className={`text-3xl font-black font-mono-tech ${s.color}`}>{s.count}</div>
                  <div className="text-[10px] font-mono-tech text-slate-600 tracking-wider mt-1">{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
