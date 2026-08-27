import React, { useEffect, useState } from 'react';
import { getScanHistory, getReportUrl } from '../services/api';
import type { ScanSummary } from '../types/scan';
import { GlassPanel, SectionLabel, LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';
import { FileText, Shield, Globe, Calendar, AlertTriangle } from 'lucide-react';

const totalFindings = (sc: ScanSummary) =>
  (sc.findings_count_critical || 0) + (sc.findings_count_high || 0) + (sc.findings_count_medium || 0) + (sc.findings_count_low || 0) + (sc.findings_count_info || 0);

export default function ReportsPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getScanHistory().then(setScans).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10"><LoadingSpinner message="Loading reports..." /></div>;
  if (error) return <div className="p-10"><ErrorMessage message={error} /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans select-none">
      
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-3">
        <SectionLabel label="Reporting Library" className="mb-0.5" />
        <h1 className="text-2xl font-black text-white tracking-tight">Security Reports</h1>
        <p className="text-slate-500 text-xs mt-0.5">Export high-fidelity security posture reports and audit logs in standardized formats.</p>
      </div>

      {scans.length === 0 ? (
        <EmptyState title="NO REPORTS AVAILABLE" description="Complete a security assessment to generate exportable reports." />
      ) : (
        /* ── DENSE MULTI-COLUMN REPORTS GRID ───────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scans.map((sc, i) => (
            <GlassPanel key={sc.id || i} className="p-4 flex flex-col justify-between hover:border-slate-700 transition-colors gap-3">
              
              {/* Header: Score + Target */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-cyan-400 font-mono-tech text-[10px] truncate mb-0.5">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span>{sc.target_url}</span>
                  </div>
                  <h3 className="text-white font-bold font-mono-tech text-xs truncate">Session #{sc.id}</h3>
                </div>
                
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono-tech text-xs border shrink-0 ${
                  (sc.score ?? 0) >= 80 ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/20' :
                  (sc.score ?? 0) >= 60 ? 'bg-amber-950/40 text-amber-400 border-amber-700/20' :
                  'bg-red-950/40 text-red-400 border-red-700/20'
                }`}>{sc.score ?? '—'}</div>
              </div>

              {/* Specs List */}
              <div className="grid grid-cols-2 gap-2 bg-[#060a14] border border-slate-800/80 rounded-xl p-2.5 text-[10px] font-mono-tech text-slate-500">
                <div>
                  <span className="block text-[8px] text-slate-600 uppercase">PROFILE</span>
                  <strong className="text-slate-300 font-bold">{sc.scan_profile}</strong>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-600 uppercase">FINDINGS</span>
                  <strong className="text-slate-300 font-bold">{totalFindings(sc)} total</strong>
                </div>
                <div className="col-span-2 pt-1.5 border-t border-slate-800/80 mt-1 flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3 h-3" />
                  <span>{sc.created_at ? new Date(sc.created_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>

              {/* Action Downloads grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/60">
                {[
                  { fmt: 'html' as const, label: 'HTML', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-500/20' },
                  { fmt: 'pdf' as const,  label: 'PDF',  color: 'text-orange-400 border-orange-500/20 bg-orange-950/20 hover:bg-orange-500/20' },
                  { fmt: 'json' as const, label: 'JSON', color: 'text-violet-400 border-violet-500/20 bg-violet-950/20 hover:bg-violet-500/20' },
                  { fmt: 'csv' as const,  label: 'CSV',  color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20 hover:bg-emerald-500/20' },
                ].map(({ fmt, label, color }) => (
                  <a key={fmt} href={getReportUrl(sc.id, fmt)} target="_blank" rel="noreferrer"
                    className={`font-mono-tech text-[9px] font-extrabold py-1.5 rounded-lg border text-center transition-colors uppercase ${color}`}>
                    {label}
                  </a>
                ))}
              </div>

            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
