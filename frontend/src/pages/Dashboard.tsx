import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStats, getFindings, getScanHistory } from '../services/api';
import type { DashboardStats, Finding, ScanSummary } from '../types/scan';
import {
  RadialScoreGauge, SecurityTrendChart, RiskDistributionBar,
  AttackTopologyCanvas, SeverityBadge, StatusBadge, GlassPanel, SectionLabel, ScoreCalculationModal
} from '../components/ui';
import { Shield, Play, Plus, List, FileText, Terminal, Activity, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (to === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCurrent(Math.floor(progress * to));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{current}</>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [criticalFindings, setCriticalFindings] = useState<Finding[]>([]);
  const [recentScans, setRecentScans] = useState<ScanSummary[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreModal, setScoreModal] = useState(false);

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      getFindings({ severity: 'CRITICAL' }).catch(() => []),
      getFindings({ severity: 'HIGH' }).catch(() => []),
      getScanHistory().catch(() => []),
    ]).then(([s, crits, highs, scans]) => {
      setStats(s);
      setCriticalFindings([...crits, ...highs].slice(0, 5));
      setRecentScans(scans.slice(0, 5));
      const td = scans
        .filter(sc => sc.created_at && sc.score != null)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(sc => ({ date: new Date(sc.created_at).toLocaleDateString(), score: sc.score }));
      setTrendData(td);
    }).finally(() => setLoading(false));
  }, []);

  const score = stats?.security_score ?? 0;
  const totalFindings = stats?.open_findings ?? 0;
  const totalTargets = stats?.total_targets ?? 0;
  const totalScans = stats?.total_scans ?? 0;
  const findingCounts = stats?.counts_by_severity ?? {};

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-5 font-sans select-none">
      
      {/* ── COMPACT HERO & TOPOLOGY VISUAL ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column — Headline & CTAs (Col span 7) */}
        <div className="lg:col-span-7 bg-[#0e1422]/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/20 border border-cyan-800/30 text-[10px] font-mono-tech tracking-wider text-cyan-400 font-bold uppercase">
              <Shield className="w-3 h-3" /> Security Intelligence Platform
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
              Know what is{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-500">exposed</span>.
              <br />Know what is{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-400">vulnerable</span>.
            </h1>

            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xl">
              Continuously assess target applications, identify configuration leaks, evaluate TLS posture, and implement framework-specific remediations.
            </p>
          </div>

          {/* Compact Actions & Stats Row */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2.5">
              <Link to="/scan"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold font-mono-tech text-xs px-5 py-2.5 rounded-xl transition-all shadow-[0_0_16px_rgba(6,182,212,0.2)] flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Assessment
              </Link>
              <Link to="/targets"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold font-mono-tech text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Target
              </Link>
              <Link to="/findings"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold font-mono-tech text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <List className="w-3.5 h-3.5" /> View Findings
              </Link>
              <Link to="/cli"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold font-mono-tech text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" /> CLI Terminal
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column — Compact Topology Visual (Col span 5) */}
        <div className="lg:col-span-5 bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="text-[10px] font-mono-tech text-slate-500 tracking-widest font-extrabold uppercase">LIVE ATTACK SURFACE GEOMETRY</span>
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </div>
          <div className="flex justify-center items-center h-48 lg:h-full">
            <AttackTopologyCanvas score={score} targetCount={totalTargets} findingCount={totalFindings} />
          </div>
        </div>
      </div>

      {/* ── SECURITY SCORE & METRICS STRIP (IMMEDIATELY BELOW HERO) ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side: Score card (Col span 4) */}
        <GlassPanel className="md:col-span-4 p-5 flex items-center gap-6 justify-center" accent>
          <RadialScoreGauge score={score} size="md" />
          <div className="space-y-1">
            <div className="text-[10px] font-mono-tech text-slate-500 tracking-wider font-extrabold uppercase">POSTURE INDEX</div>
            <div className="text-xl font-black text-white font-mono-tech">{score} / 100</div>
            <button onClick={() => setScoreModal(true)} className="text-[9px] font-mono-tech text-cyan-400 hover:underline">
              [ Breakdown Calculation ]
            </button>
          </div>
        </GlassPanel>

        {/* Right Side: Quick Stats Strip (Col span 8) */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'MONITORED TARGETS', value: totalTargets, color: 'text-cyan-400', border: 'border-cyan-500/10' },
            { label: 'COMPLETED ASSESSMENTS', value: totalScans, color: 'text-violet-400', border: 'border-violet-500/10' },
            { label: 'CRITICAL RISKS', value: findingCounts['CRITICAL'] ?? 0, color: (findingCounts['CRITICAL'] ?? 0) > 0 ? 'text-red-400' : 'text-slate-500', border: 'border-red-500/10' },
            { label: 'HIGH SEVERITY', value: findingCounts['HIGH'] ?? 0, color: (findingCounts['HIGH'] ?? 0) > 0 ? 'text-orange-400' : 'text-slate-500', border: 'border-orange-500/10' },
          ].map(stat => (
            <div key={stat.label} className={`bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between ${stat.border}`}>
              <span className="text-[9px] font-mono-tech text-slate-500 tracking-wider font-extrabold uppercase">{stat.label}</span>
              <span className={`text-2xl font-black font-mono-tech mt-2 ${stat.color}`}>
                <CountUp to={stat.value} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TWO-COLUMN DETAILED COMPOSITION ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Section — Security Trend Line (Col span 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl p-5">
          <div>
            <SectionLabel label="Historical Posture Trend" className="mb-1" />
            <h3 className="text-sm font-bold text-white font-mono-tech">SECURITY STATE PROGRESSION</h3>
          </div>
          <div className="mt-4 flex-1 flex items-center">
            <div className="w-full">
              <SecurityTrendChart data={trendData} />
            </div>
          </div>
        </div>

        {/* Right Section — Recent Activity List (Col span 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
            <div>
              <SectionLabel label="Recent Scans" className="mb-0.5" />
              <h3 className="text-xs font-bold text-white font-mono-tech">ACTIVITY RECORD</h3>
            </div>
            <Link to="/assessments" className="text-[10px] font-mono-tech text-slate-500 hover:text-cyan-400 transition-colors">
              History →
            </Link>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-48 pr-1">
            {recentScans.length === 0 ? (
              <div className="text-center text-slate-600 text-xs py-8">No scans executed.</div>
            ) : (
              recentScans.map(sc => (
                <div key={sc.id} className="bg-[#060a14] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-[11px] font-mono-tech">
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-semibold truncate">{sc.target_url}</div>
                    <div className="text-slate-500 text-[9px] mt-0.5">
                      {sc.scan_profile} · {(sc.findings_count_critical || 0) + (sc.findings_count_high || 0)} issues
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    sc.score >= 80 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-700/20' :
                    sc.score >= 60 ? 'bg-amber-950/40 text-amber-400 border border-amber-700/20' :
                    'bg-red-950/40 text-red-400 border border-red-700/20'
                  }`}>
                    {sc.score}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: CRITICAL FINDINGS NEEDING ATTENTION ────────────────────────── */}
      {criticalFindings.length > 0 && (
        <div className="bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <div>
              <SectionLabel label="Action Priority" className="mb-0.5" />
              <h2 className="text-sm font-bold text-white font-mono-tech">CRITICAL & HIGH FINDINGS REQUIRING ATTENTION</h2>
            </div>
            <Link to="/findings" className="text-[10px] font-mono-tech text-slate-500 hover:text-cyan-400">
              Manage All →
            </Link>
          </div>

          <div className="space-y-2">
            {criticalFindings.map(f => (
              <div key={f.id} className="bg-[#060a14] border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-tech transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={f.severity} />
                    <span className="text-[10px] text-slate-500">{f.category}</span>
                  </div>
                  <div className="font-bold text-white truncate">{f.title}</div>
                  <div className="text-[10px] text-cyan-400 truncate mt-0.5">{f.affected_url}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <StatusBadge status={f.status} />
                  <Link to="/findings" className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-bold transition-all">
                    Triage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scoreModal && <ScoreCalculationModal score={score} onClose={() => setScoreModal(false)} />}
    </div>
  );
}
