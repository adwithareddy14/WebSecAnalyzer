import React, { useEffect, useState } from 'react';
import { getScanHistory, getAttackSurface } from '../services/api';
import type { ScanSummary, AttackSurfaceTree } from '../types/scan';
import { GlassPanel, SectionLabel, LoadingSpinner, ErrorMessage, EmptyState, AttackTopologyCanvas } from '../components/ui';

const STATUS_COLORS: Record<number, string> = {
  200: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/30',
  301: 'text-amber-400  border-amber-500/20  bg-amber-950/30',
  302: 'text-amber-400  border-amber-500/20  bg-amber-950/30',
  401: 'text-orange-400 border-orange-500/20 bg-orange-950/30',
  403: 'text-orange-400 border-orange-500/20 bg-orange-950/30',
  404: 'text-slate-500  border-slate-700/40  bg-slate-900/30',
  500: 'text-red-400    border-red-500/20    bg-red-950/30',
};
const getStatusColor = (code: number) => STATUS_COLORS[code] || 'text-slate-400 border-slate-700/40 bg-slate-900/30';

export default function AttackSurfacePage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [surface, setSurface] = useState<AttackSurfaceTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [surfaceLoading, setSurfaceLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getScanHistory()
      .then(s => { setScans(s); if (s.length > 0) setSelectedId(s[0].id); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setSurfaceLoading(true);
    getAttackSurface(selectedId)
      .then(setSurface)
      .catch(() => setSurface(null))
      .finally(() => setSurfaceLoading(false));
  }, [selectedId]);

  if (loading) return <div className="p-10"><LoadingSpinner message="Loading attack surface data..." /></div>;
  if (error) return <div className="p-10"><ErrorMessage message={error} /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans select-none">
      
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <SectionLabel label="Discovered Attack Surface" className="mb-0.5" />
          <h1 className="text-2xl font-black text-white tracking-tight">Attack Surface</h1>
        </div>

        {scans.length > 0 && (
          <select
            value={selectedId ?? ''}
            onChange={e => setSelectedId(Number(e.target.value))}
            className="bg-[#0e1422] border border-slate-800 text-slate-300 text-xs font-mono-tech rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 min-w-[240px]"
          >
            {scans.map(sc => (
              <option key={sc.id} value={sc.id}>
                {sc.target_url} (Score {sc.score ?? '—'})
              </option>
            ))}
          </select>
        )}
      </div>

      {scans.length === 0 ? (
        <EmptyState title="NO ASSESSMENTS FOUND" description="Complete a security assessment to populate the attack surface view." />
      ) : surfaceLoading ? (
        <LoadingSpinner message="Mapping attack surface..." />
      ) : !surface ? (
        <GlassPanel className="p-10 text-center">
          <div className="text-slate-600 font-mono-tech text-xs">No attack surface data collected for this assessment. Run a Full profile scan to enable reconnaissance.</div>
        </GlassPanel>
      ) : (
        /* ── TWO-COLUMN SPLIT-PANEL COMPOSITION ─────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column — Mapped Node Topology (60% width on large screens) */}
          <div className="lg:col-span-7 bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
              <span className="text-[10px] font-mono-tech text-slate-500 tracking-wider font-extrabold uppercase">TOPOLOGY MAP</span>
              <span className="text-[10px] font-mono-tech text-cyan-400 font-bold">{surface.endpoints.length} Endpoints</span>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[300px] lg:min-h-0 py-4">
              <AttackTopologyCanvas score={scans.find(s => s.id === selectedId)?.score} targetCount={1} findingCount={surface.endpoints.reduce((acc, ep) => acc + (ep.findings_count || 0), 0)} />
            </div>
          </div>

          {/* Right Column — Host Specs & Endpoints List (40% width on large screens) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Host Metadata Card */}
            <GlassPanel accent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono-tech text-sm font-bold">◉</div>
                <div className="min-w-0">
                  <div className="text-[9px] font-mono-tech text-slate-500 tracking-wider">HOST DOMAIN</div>
                  <div className="text-xs font-bold text-white font-mono-tech truncate">{surface.hostname}</div>
                </div>
              </div>

              {surface.ip_address && (
                <div>
                  <div className="text-[9px] font-mono-tech text-slate-500 tracking-wider mb-1">RESOLVED IP</div>
                  <span className="bg-[#060a14] border border-slate-800 text-slate-300 font-mono-tech text-[10px] px-2 py-0.5 rounded-md">{surface.ip_address}</span>
                </div>
              )}

              {surface.tech_stack && surface.tech_stack.length > 0 && (
                <div>
                  <div className="text-[9px] font-mono-tech text-slate-500 tracking-wider mb-1.5">TECH STACK</div>
                  <div className="flex flex-wrap gap-1">
                    {surface.tech_stack.map((t, i) => (
                      <span key={i} className="bg-violet-950/30 border border-violet-700/20 text-violet-300 font-mono-tech text-[9px] px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </GlassPanel>

            {/* Scrollable Endpoints Card */}
            {surface.endpoints && surface.endpoints.length > 0 && (
              <GlassPanel title="DISCOVERED ENDPOINTS" className="flex-1 flex flex-col min-h-[300px] overflow-hidden">
                <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-800/60">
                  {surface.endpoints.map((ep, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/20 transition-colors text-[11px] font-mono-tech">
                      {ep.method && (
                        <span className="font-mono-tech text-[9px] font-extrabold text-amber-400 bg-amber-950/20 border border-amber-500/20 px-1.5 py-0.5 rounded w-10 text-center shrink-0">
                          {ep.method}
                        </span>
                      )}
                      {ep.status_code && (
                        <span className={`font-mono-tech text-[9px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${getStatusColor(ep.status_code)}`}>
                          {ep.status_code}
                        </span>
                      )}
                      <span className="text-slate-300 flex-1 truncate">{ep.path || ep.url}</span>
                      {ep.findings_count != null && ep.findings_count > 0 && (
                        <span className="text-[9px] font-mono-tech text-red-400 bg-red-950/20 border border-red-500/20 px-1.5 py-0.5 rounded shrink-0">
                          {ep.findings_count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
