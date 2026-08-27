import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getScanHistory, getReportUrl } from '../services/api';
import type { ScanSummary } from '../types/scan';
import { GlassPanel, SectionLabel, LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';

const totalFindings = (sc: ScanSummary) =>
  (sc.findings_count_critical || 0) + (sc.findings_count_high || 0) + (sc.findings_count_medium || 0) + (sc.findings_count_low || 0) + (sc.findings_count_info || 0);

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getScanHistory().then(setScans).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10"><LoadingSpinner message="Loading assessment history..." /></div>;
  if (error) return <div className="p-10"><ErrorMessage message={error} /></div>;

  return (
    <div className="min-h-screen px-6 md:px-16 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <SectionLabel label="Assessment History" className="mb-2" />
          <h1 className="text-3xl font-black text-white tracking-tight">All Assessments</h1>
          <p className="text-slate-500 text-sm mt-1">Complete history of security assessments across your registered applications.</p>
        </div>

        {scans.length === 0 ? (
          <EmptyState title="NO ASSESSMENTS YET" description="Run your first security assessment to see results here."
            action={<Link to="/scan" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono-tech px-4 py-2 rounded-xl text-sm">▶ Start Assessment</Link>} />
        ) : (
          <div className="space-y-3">
            {scans.map((sc, i) => (
              <GlassPanel key={sc.id || i} className="px-5 py-4 hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black font-mono-tech text-sm flex-shrink-0 border ${
                    (sc.score ?? 0) >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    (sc.score ?? 0) >= 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>{sc.score ?? '—'}</div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{sc.target_url}</div>
                    <div className="text-[10px] font-mono-tech text-slate-600 mt-1 flex flex-wrap gap-3">
                      <span>Profile: <strong className="text-slate-400">{sc.scan_profile}</strong></span>
                      <span>Findings: <strong className="text-slate-400">{totalFindings(sc)}</strong></span>
                      <span>Rating: <strong className="text-slate-400">{sc.rating}</strong></span>
                      {sc.created_at && <span>Date: <strong className="text-slate-400">{new Date(sc.created_at).toLocaleString()}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(['html', 'json'] as const).map(fmt => (
                      <a key={fmt} href={getReportUrl(sc.id, fmt)} target="_blank" rel="noreferrer"
                        className="bg-[#060a14] border border-slate-800 hover:border-slate-600 text-slate-500 hover:text-white font-mono-tech text-[10px] px-2.5 py-1 rounded-lg transition-colors uppercase">
                        {fmt}
                      </a>
                    ))}
                    <Link to={`/results/${sc.id}`}
                      className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-mono-tech text-xs px-3 py-1.5 rounded-xl transition-all font-bold">
                      View →
                    </Link>
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
