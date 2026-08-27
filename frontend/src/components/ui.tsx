import React, { useEffect, useRef, useState } from 'react';
import type { SeverityLevel, FindingStatus } from '../types/scan';

// ─────────────────────────────────────────────────────────────────────────────
// Severity & Status Badges
// ─────────────────────────────────────────────────────────────────────────────
const SEV_MAP: Record<SeverityLevel, { label: string; dot: string; text: string; border: string; bg: string }> = {
  CRITICAL: { label: 'CRITICAL', dot: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-950/40' },
  HIGH:     { label: 'HIGH',     dot: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-950/40' },
  MEDIUM:   { label: 'MEDIUM',  dot: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-950/40' },
  LOW:      { label: 'LOW',     dot: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-blue-500/30',   bg: 'bg-blue-950/40' },
  INFO:     { label: 'INFO',    dot: 'bg-teal-500',   text: 'text-teal-400',   border: 'border-teal-500/30',   bg: 'bg-teal-950/40' },
};

export const SeverityBadge = ({ severity }: { severity: SeverityLevel }) => {
  const s = SEV_MAP[severity] || SEV_MAP.INFO;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold font-mono-tech tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const STATUS_MAP: Record<string, { text: string; border: string; bg: string }> = {
  'Open':           { text: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-950/30' },
  'Triaged':        { text: 'text-orange-400',   border: 'border-orange-500/20', bg: 'bg-orange-950/30' },
  'In Progress':    { text: 'text-blue-400',     border: 'border-blue-500/20',   bg: 'bg-blue-950/30' },
  'Resolved':       { text: 'text-emerald-400',  border: 'border-emerald-500/20',bg: 'bg-emerald-950/30' },
  'False Positive': { text: 'text-slate-400',    border: 'border-slate-600/20',  bg: 'bg-slate-900/30' },
  'Verified':       { text: 'text-cyan-400',     border: 'border-cyan-500/20',   bg: 'bg-cyan-950/30' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_MAP[status] || STATUS_MAP['Open'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono-tech tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading Spinner & Empty State
// ─────────────────────────────────────────────────────────────────────────────
export const LoadingSpinner = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
    {message && <p className="text-slate-500 text-xs font-mono-tech tracking-wider">{message}</p>}
  </div>
);

export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
    <span className="text-red-400 text-lg">⚠</span>
    <p className="text-red-300 text-sm font-mono-tech">{message}</p>
  </div>
);

export const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-xl">◉</div>
    <div>
      <p className="text-slate-300 font-bold font-mono-tech text-sm">{title}</p>
      <p className="text-slate-600 text-xs mt-1 max-w-xs">{description}</p>
    </div>
    {action}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Glass Panel — Premium Surface Card
// ─────────────────────────────────────────────────────────────────────────────
export const GlassPanel = ({
  children, className = '', title, subtitle, accent = false
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  accent?: boolean;
}) => (
  <div className={`rounded-2xl bg-[#0e1422] border ${accent ? 'border-cyan-500/20' : 'border-slate-800/80'} overflow-hidden ${className}`}>
    {(title || subtitle) && (
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          {title && <span className="text-[10px] font-mono-tech font-extrabold text-slate-400 tracking-widest uppercase">{title}</span>}
          {subtitle && <p className="text-slate-600 text-[11px] mt-0.5">{subtitle}</p>}
        </div>
        {accent && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />}
      </div>
    )}
    {children}
  </div>
);

// Keep compatibility alias
export const WorkstationPanel = GlassPanel;

// ─────────────────────────────────────────────────────────────────────────────
// Radial Score Gauge — Large premium security posture visualization
// ─────────────────────────────────────────────────────────────────────────────
export const RadialScoreGauge = ({ score, size = 'lg' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
  const radius = size === 'lg' ? 70 : size === 'md' ? 52 : 36;
  const strokeWidth = size === 'lg' ? 6 : 5;
  const svgSize = (radius + strokeWidth + 4) * 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score, 100) / 100);

  const getColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';
  const getLabel = (s: number) => s >= 80 ? 'LOW RISK' : s >= 60 ? 'MODERATE RISK' : s >= 40 ? 'HIGH RISK' : 'CRITICAL RISK';
  const color = getColor(score);
  const label = getLabel(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="rotate-[-90deg]">
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth}
        />
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="text-center" style={{ marginTop: -(svgSize * 0.55) }}>
        <div className="font-extrabold font-mono-tech leading-none" style={{ fontSize: size === 'lg' ? 42 : size === 'md' ? 30 : 22, color }}>
          {score}
        </div>
        <div className="text-[9px] font-mono-tech tracking-widest text-slate-500 mt-1">{label}</div>
      </div>
      <div style={{ marginTop: svgSize * 0.47 }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Security Trend Chart — SVG line chart
// ─────────────────────────────────────────────────────────────────────────────
export const SecurityTrendChart = ({ data }: { data: { date: string; score: number }[] }) => {
  const [filter, setFilter] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const now = new Date();

  const filtered = data.filter(d => {
    if (filter === 'all') return true;
    const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(d.date) >= cutoff;
  });

  if (!filtered.length) return (
    <div className="p-6 text-center text-slate-600 text-xs font-mono-tech">No historical data yet — run your first assessment.</div>
  );

  const W = 600, H = 160, PAD = 20;
  const scores = filtered.map(d => d.score);
  const minS = Math.max(0, Math.min(...scores) - 10);
  const maxS = Math.min(100, Math.max(...scores) + 10);
  const xScale = (i: number) => PAD + (i / (filtered.length - 1 || 1)) * (W - PAD * 2);
  const yScale = (s: number) => H - PAD - ((s - minS) / (maxS - minS || 1)) * (H - PAD * 2);
  const points = filtered.map((d, i) => `${xScale(i)},${yScale(d.score)}`).join(' ');
  const areaPoints = `${xScale(0)},${H - PAD} ${points} ${xScale(filtered.length - 1)},${H - PAD}`;

  return (
    <div>
      <div className="flex justify-end gap-1 px-5 pt-3 pb-1">
        {(['7d', '30d', '90d', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono-tech transition-colors ${
              filter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-600 hover:text-slate-400'
            }`}
          >{f.toUpperCase()}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {[0, 25, 50, 75, 100].map(v => (
          <line key={v} x1={PAD} x2={W - PAD} y1={yScale(Math.min(v, maxS))} y2={yScale(Math.min(v, maxS))}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {filtered.length > 1 && (
          <>
            <polygon points={areaPoints} fill="url(#trendGrad)" />
            <polyline points={points} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.6))' }} />
          </>
        )}
        {filtered.map((d, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(d.score)} r="3" fill="#06b6d4"
            style={{ filter: 'drop-shadow(0 0 3px rgba(6,182,212,0.8))' }}>
            <title>{d.date}: {d.score}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Risk Distribution Bar — Interactive severity spectrum
// ─────────────────────────────────────────────────────────────────────────────
export const RiskDistributionBar = ({
  counts, onFilter
}: {
  counts: Record<string, number>;
  onFilter?: (sev: string) => void;
}) => {
  const SEVS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
  const COLORS: Record<string, string> = {
    CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFO: '#14b8a6'
  };
  const total = SEVS.reduce((s, k) => s + (counts[k] || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full rounded-full overflow-hidden">
        {SEVS.map(sev => {
          const pct = total > 0 ? ((counts[sev] || 0) / total) * 100 : 0;
          return pct > 0 ? (
            <div key={sev} style={{ width: `${pct}%`, background: COLORS[sev], cursor: 'pointer' }}
              className="transition-all hover:opacity-80" onClick={() => onFilter?.(sev)}
              title={`${sev}: ${counts[sev] || 0}`} />
          ) : null;
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {SEVS.map(sev => (
          <button key={sev} onClick={() => onFilter?.(sev)}
            className="flex items-center gap-1.5 text-[10px] font-mono-tech font-bold text-slate-400 hover:text-white transition-colors">
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[sev] }} />
            {sev} <span className="text-slate-600 font-normal">{counts[sev] || 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Attack Topology Canvas — Animated SVG node visualization
// ─────────────────────────────────────────────────────────────────────────────
export const AttackTopologyCanvas = ({ score = 72, targetCount = 0, findingCount = 0 }: {
  score?: number; targetCount?: number; findingCount?: number;
}) => {
  const nodes = [
    { id: 'target',    label: 'TARGET',     x: 300, y: 60,  color: '#06b6d4', r: 22, desc: `${targetCount} apps` },
    { id: 'discovery', label: 'DISCOVERY',  x: 150, y: 140, color: '#8b5cf6', r: 16, desc: 'Recon' },
    { id: 'headers',   label: 'HEADERS',   x: 300, y: 180, color: '#f59e0b', r: 16, desc: 'HTTP Security' },
    { id: 'tls',       label: 'TLS',       x: 450, y: 140, color: '#06b6d4', r: 16, desc: 'Cryptography' },
    { id: 'critical',  label: 'CRITICAL',  x: 120, y: 250, color: '#ef4444', r: 14, desc: `Risks` },
    { id: 'findings',  label: 'FINDINGS',  x: 300, y: 280, color: '#f97316', r: 18, desc: `${findingCount} found` },
    { id: 'triage',    label: 'TRIAGE',    x: 480, y: 250, color: '#10b981', r: 14, desc: 'Remediate' },
  ];
  const edges = [
    ['target', 'discovery'], ['target', 'headers'], ['target', 'tls'],
    ['discovery', 'critical'], ['headers', 'findings'], ['tls', 'findings'],
    ['critical', 'findings'], ['findings', 'triage'],
  ];

  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  return (
    <div className="relative w-full" style={{ maxWidth: 600 }}>
      <svg viewBox="0 0 600 330" className="w-full" style={{ height: 260 }}>
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <rect width="600" height="330" fill="url(#bgGlow)" />

        {/* Edges */}
        {edges.map(([a, b], i) => {
          const n1 = getNode(a), n2 = getNode(b);
          return (
            <line key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="4 4" />
          );
        })}

        {/* Nodes */}
        {nodes.map(n => (
          <g key={n.id}>
            {/* Outer glow ring */}
            <circle cx={n.x} cy={n.y} r={n.r + 6} fill={n.color} opacity="0.08" />
            {/* Node circle */}
            <circle cx={n.x} cy={n.y} r={n.r} fill={`${n.color}18`} stroke={n.color}
              strokeWidth="1.5" filter="url(#glow)" />
            {/* Label */}
            <text x={n.x} y={n.y - n.r - 5} textAnchor="middle"
              fill={n.color} fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="700" letterSpacing="1">
              {n.label}
            </text>
            {/* Desc */}
            <text x={n.x} y={n.y + n.r + 12} textAnchor="middle"
              fill="rgba(148,163,184,0.7)" fontSize="7" fontFamily="JetBrains Mono, monospace">
              {n.desc}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section Header — for large storytelling sections
// ─────────────────────────────────────────────────────────────────────────────
export const SectionLabel = ({ label, className = '' }: { label: string; className?: string }) => (
  <p className={`font-mono-tech text-[10px] font-extrabold tracking-widest text-cyan-500 uppercase ${className}`}>{label}</p>
);

// ─────────────────────────────────────────────────────────────────────────────
// WorkflowStepper — 5-step assessment wizard header
// ─────────────────────────────────────────────────────────────────────────────
export const WorkflowStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { n: 1, label: 'TARGET' },
    { n: 2, label: 'PROFILE' },
    { n: 3, label: 'CONFIG' },
    { n: 4, label: 'SCAN' },
    { n: 5, label: 'RESULTS' },
  ];
  return (
    <div className="bg-[#0e1422] border border-slate-800/80 rounded-2xl px-5 py-4 flex items-center justify-between gap-2">
      {steps.map((s, idx) => {
        const done = s.n < currentStep;
        const active = s.n === currentStep;
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold font-mono-tech border transition-all ${
                done ? 'bg-cyan-500 border-cyan-500 text-black' :
                active ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' :
                'bg-transparent border-slate-700 text-slate-600'
              }`}>
                {done ? '✓' : String(s.n).padStart(2, '0')}
              </div>
              <span className={`text-[9px] font-mono-tech font-bold tracking-widest ${active ? 'text-cyan-400' : done ? 'text-slate-400' : 'text-slate-700'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-px ${done ? 'bg-cyan-500/40' : 'bg-slate-800'} transition-colors`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Compatibility shims
// ─────────────────────────────────────────────────────────────────────────────
export const TechnicalHeader = ({
  title, subtitle, action
}: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
    <div>
      <p className="text-[10px] font-mono-tech font-extrabold tracking-widest text-cyan-500 uppercase">{title}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-0.5 max-w-2xl">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const StatusLight = ({ label, status }: { label: string; status: string }) => (
  <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] text-slate-500">
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'READY' || status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`} />
    {label}: <span className={status === 'READY' || status === 'ONLINE' ? 'text-emerald-400' : 'text-slate-400'}>{status}</span>
  </span>
);

export const ScoreCalculationModal = ({ score, onClose }: { score: number; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#0e1422] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <span className="font-mono-tech text-xs font-bold text-slate-300 tracking-widest">POSTURE SCORE METHODOLOGY</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white font-mono-tech">[X]</button>
        </div>
        <div className="space-y-3 text-xs font-mono-tech text-slate-400">
          <div className="bg-[#121a2d] border border-slate-800 rounded-lg p-3">
            <div className="text-slate-300 mb-2">Base Score: <strong className="text-white">100</strong></div>
            <div className="text-red-400">CRITICAL findings: <strong>−15 pts each</strong></div>
            <div className="text-orange-400">HIGH findings: <strong>−10 pts each</strong></div>
            <div className="text-amber-400">MEDIUM findings: <strong>−5 pts each</strong></div>
            <div className="text-blue-400">LOW findings: <strong>−2 pts each</strong></div>
          </div>
          <div className="text-center pt-2 border-t border-slate-800">
            Current Score: <span className="text-2xl font-black text-cyan-400 font-mono-tech">{score}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
