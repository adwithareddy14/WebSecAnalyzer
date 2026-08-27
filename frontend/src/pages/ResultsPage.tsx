import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScanById, getReportUrl } from '../services/api';
import type { ScanResponse, Finding, SeverityLevel } from '../types/scan';
import { SeverityBadge, StatusBadge, GlassPanel, SectionLabel, RadialScoreGauge, LoadingSpinner, ErrorMessage } from '../components/ui';

const SEV_ORDER: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

const SEV_STYLES: Record<string, { bar: string; text: string }> = {
  CRITICAL: { bar: 'bg-red-500',    text: 'text-red-400' },
  HIGH:     { bar: 'bg-orange-500', text: 'text-orange-400' },
  MEDIUM:   { bar: 'bg-amber-500',  text: 'text-amber-400' },
  LOW:      { bar: 'bg-blue-500',   text: 'text-blue-400' },
  INFO:     { bar: 'bg-teal-500',   text: 'text-teal-400' },
};

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    getScanById(parseInt(id))
      .then(setScan)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10"><LoadingSpinner message="Loading assessment results..." /></div>;
  if (error || !scan) return <div className="p-10"><ErrorMessage message={error || 'Assessment not found.'} /></div>;

  const findings: Finding[] = scan.findings || [];
  const countBySev = SEV_ORDER.reduce((acc, s) => {
    acc[s] = findings.filter(f => f.severity === s).length;
    return acc;
  }, {} as Record<string, number>);

  const SCORE_DEDUCTIONS = [
    { sev: 'CRITICAL', penalty: -15, color: 'text-red-400' },
    { sev: 'HIGH',     penalty: -10, color: 'text-orange-400' },
    { sev: 'MEDIUM',   penalty: -5,  color: 'text-amber-400' },
    { sev: 'LOW',      penalty: -2,  color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen px-6 md:px-16 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-600 mb-6">
          <Link to="/assessments" className="hover:text-slate-400 transition-colors">Assessments</Link>
          <span>/</span>
          <span className="text-slate-400">Assessment #{id}</span>
        </div>

        {/* Page heading */}
        <div className="mb-10">
          <SectionLabel label="Assessment Results" className="mb-2" />
          <h1 className="text-3xl font-black text-white tracking-tight">Security Assessment Report</h1>
          <p className="text-slate-500 text-sm mt-1 font-mono-tech break-all">{scan.target_url}</p>
        </div>

        {/* Metadata bar */}
        <GlassPanel className="px-5 py-4 mb-6">
          <div className="flex flex-wrap gap-6 text-xs font-mono-tech">
            <div><span className="text-slate-600 block text-[9px] tracking-wider mb-0.5">PROFILE</span><span className="text-white font-bold">{scan.scan_profile}</span></div>
            <div><span className="text-slate-600 block text-[9px] tracking-wider mb-0.5">DATE</span><span className="text-white font-bold">{scan.created_at ? new Date(scan.created_at).toLocaleString() : '—'}</span></div>
            <div><span className="text-slate-600 block text-[9px] tracking-wider mb-0.5">FINDINGS</span><span className="text-white font-bold">{findings.length}</span></div>
            <div className="ml-auto flex items-center gap-2">
              {(['html', 'pdf', 'json', 'csv'] as const).map(fmt => (
                <a key={fmt} href={getReportUrl(parseInt(id!), fmt)} target="_blank" rel="noreferrer"
                  className="bg-[#060a14] border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white font-mono-tech text-[10px] px-3 py-1.5 rounded-lg transition-colors uppercase">
                  {fmt}
                </a>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Score + breakdown + severity grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {/* Score Gauge */}
          <GlassPanel className="flex flex-col items-center justify-center py-10" accent>
            <RadialScoreGauge score={scan.score} size="lg" />
            <div className="text-[10px] font-mono-tech text-slate-500 tracking-widest mt-4">SECURITY POSTURE SCORE</div>
          </GlassPanel>

          {/* Score deduction breakdown */}
          <GlassPanel title="SCORE CALCULATION" className="p-5">
            <div className="space-y-3 font-mono-tech text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Base Score</span><span className="text-white font-bold">100</span>
              </div>
              {SCORE_DEDUCTIONS.map(({ sev, penalty, color }) => {
                const cnt = countBySev[sev] || 0;
                if (!cnt) return null;
                return (
                  <div key={sev} className="flex items-center justify-between">
                    <span className={color}>{sev} ({cnt} × {Math.abs(penalty)})</span>
                    <span className="text-red-400 font-bold">{cnt * penalty}</span>
                  </div>
                );
              })}
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <span className="text-slate-300 font-bold">Final Score</span>
                <span className={`font-black text-lg ${scan.score >= 80 ? 'text-emerald-400' : scan.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{scan.score}</span>
              </div>
            </div>
          </GlassPanel>

          {/* Severity counts */}
          <GlassPanel title="FINDINGS BREAKDOWN" className="p-5">
            <div className="space-y-2.5">
              {SEV_ORDER.map(sev => {
                const cnt = countBySev[sev] || 0;
                const pct = findings.length > 0 ? (cnt / findings.length) * 100 : 0;
                return (
                  <div key={sev}>
                    <div className="flex items-center justify-between text-xs font-mono-tech mb-1">
                      <span className={SEV_STYLES[sev].text}>{sev}</span>
                      <span className="text-slate-400 font-bold">{cnt}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${SEV_STYLES[sev].bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>

        {/* Findings list */}
        {findings.length > 0 && (
          <div>
            <div className="mb-5">
              <SectionLabel label="Discovered Vulnerabilities" className="mb-2" />
              <h2 className="text-xl font-black text-white">Security Findings</h2>
            </div>
            <div className="space-y-2">
              {findings.map((f, idx) => (
                <div key={f.id || idx}
                  className="bg-[#0e1422] border border-slate-800/80 rounded-2xl overflow-hidden">
                  <button className="w-full px-5 py-4 flex items-center gap-4 text-left group"
                    onClick={() => setExpanded(expanded === idx ? null : idx)}>
                    <div className="w-0.5 h-8 rounded-full flex-shrink-0 hidden sm:block" style={{
                      background: SEV_STYLES[f.severity]?.bar?.replace('bg-', '') || '#6b7280',
                      opacity: 0.6,
                    }} />
                    <SeverityBadge severity={f.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{f.title}</div>
                      <div className="text-xs text-cyan-400 font-mono-tech truncate mt-0.5">{f.affected_url}</div>
                    </div>
                    <StatusBadge status={f.status} />
                    <span className={`text-slate-600 font-mono-tech text-xs transition-transform ${expanded === idx ? 'rotate-90' : ''}`}>›</span>
                  </button>

                  {expanded === idx && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-800">
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-mono-tech font-bold text-slate-600 tracking-wider mb-2">RISK & IMPACT</div>
                          <p className="text-slate-300 text-sm leading-relaxed">{f.impact}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono-tech font-bold text-slate-600 tracking-wider mb-2">EVIDENCE</div>
                          <code className="block bg-[#060a14] border border-slate-800 rounded-xl p-3 text-xs text-amber-300 font-mono-tech break-all">{f.evidence}</code>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono-tech font-bold text-slate-600 tracking-wider mb-2">REMEDIATION</div>
                        <p className="text-slate-400 text-sm leading-relaxed">{f.remediation}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {f.owasp_category && <span className="bg-cyan-950/40 text-cyan-400 border border-cyan-700/30 text-[10px] font-mono-tech px-2.5 py-0.5 rounded-lg">{f.owasp_category}</span>}
                        {f.cwe_id && <span className="bg-violet-950/40 text-violet-400 border border-violet-700/30 text-[10px] font-mono-tech px-2.5 py-0.5 rounded-lg">{f.cwe_id}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {findings.length === 0 && (
          <GlassPanel className="p-10 text-center" accent>
            <div className="text-3xl mb-3">✓</div>
            <div className="text-emerald-400 font-bold font-mono-tech">No vulnerabilities detected</div>
            <div className="text-slate-600 text-sm mt-1">This assessment found no security issues.</div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
