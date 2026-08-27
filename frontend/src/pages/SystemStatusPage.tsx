import React, { useEffect, useState } from 'react';
import { getSystemStatus } from '../services/api';
import type { SystemStatus } from '../types/scan';
import { GlassPanel, SectionLabel, LoadingSpinner, ErrorMessage } from '../components/ui';

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = () => {
    setLoading(true);
    getSystemStatus()
      .then(s => { setStatus(s); setLastRefresh(new Date()); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const isOnline = (val: string | undefined) =>
    val === 'online' || val === 'ready' || val === 'connected' || val === 'active';

  const StatusDot = ({ ok }: { ok: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 font-mono-tech text-xs font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'}`} />
      {ok ? 'ONLINE' : 'OFFLINE'}
    </span>
  );

  return (
    <div className="min-h-screen px-6 md:px-16 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <SectionLabel label="Infrastructure" className="mb-2" />
            <h1 className="text-3xl font-black text-white tracking-tight">System Status</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time health of the WebVulnX security platform infrastructure.</p>
          </div>
          <button onClick={load}
            className="font-mono-tech text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-xl transition-colors">
            ↺ Refresh
          </button>
        </div>

        {loading && !status ? (
          <LoadingSpinner message="Checking system health..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : status ? (
          <div className="space-y-5">
            {/* Overall banner */}
            <GlassPanel accent className="px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">✓</div>
              <div>
                <div className="text-lg font-black text-white">All Systems Operational</div>
                <div className="text-[10px] font-mono-tech text-slate-500 tracking-wider mt-0.5">
                  Engine Version: <strong className="text-slate-300">{status.version}</strong> · Last checked: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            </GlassPanel>

            {/* Core services */}
            <GlassPanel title="CORE SERVICES">
              <div className="divide-y divide-slate-800/60">
                {[
                  { label: 'FastAPI Security Backend', val: status.api,           detail: 'Port 8001 · REST API' },
                  { label: 'Database Engine',          val: status.database,       detail: 'SQLite · webvulnx.db' },
                  { label: 'Security Scanner',         val: status.scanner,        detail: 'Security analysis modules' },
                  { label: 'CLI Interface',            val: status.cli,            detail: 'Command execution endpoint' },
                  { label: 'Report Generator',         val: status.report_engine,  detail: 'PDF, HTML, JSON, CSV export' },
                ].map(svc => (
                  <div key={svc.label} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{svc.label}</div>
                      <div className="text-[10px] font-mono-tech text-slate-600 mt-0.5">{svc.detail}</div>
                    </div>
                    <StatusDot ok={isOnline(svc.val)} />
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Version info */}
            <GlassPanel className="px-5 py-4">
              <div className="flex flex-wrap gap-6 text-xs font-mono-tech">
                <div><span className="text-slate-600 text-[9px] tracking-wider block mb-0.5">ENGINE VERSION</span><span className="text-cyan-400 font-bold">{status.version}</span></div>
                <div><span className="text-slate-600 text-[9px] tracking-wider block mb-0.5">API BACKEND</span><span className="text-slate-300 font-bold">FastAPI · Port 8001</span></div>
                <div><span className="text-slate-600 text-[9px] tracking-wider block mb-0.5">FRONTEND</span><span className="text-slate-300 font-bold">Vite + React 18 · Port 3000</span></div>
                <div><span className="text-slate-600 text-[9px] tracking-wider block mb-0.5">DATABASE</span><span className="text-slate-300 font-bold">SQLite + SQLAlchemy</span></div>
              </div>
            </GlassPanel>
          </div>
        ) : null}
      </div>
    </div>
  );
}
