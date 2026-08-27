import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTargets } from '../services/api';
import type { Target } from '../types/scan';

const NAV_LINKS = [
  { to: '/',              label: 'Dashboard' },
  { to: '/targets',      label: 'Targets' },
  { to: '/scan',         label: 'Assess' },
  { to: '/assessments',  label: 'History' },
  { to: '/findings',     label: 'Findings' },
  { to: '/reports',      label: 'Reports' },
];

const MORE_LINKS = [
  { to: '/cli',          label: 'CLI Console' },
  { to: '/attack-surface', label: 'Attack Surface' },
  { to: '/methodology',  label: 'Methodology' },
  { to: '/status',       label: 'System Status' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [targets, setTargets] = useState<Target[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    getTargets()
      .then(t => { setTargets(t); setApiOnline(true); })
      .catch(() => setApiOnline(false));
  }, []);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80" style={{ background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between h-14 gap-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 rounded bg-cyan-500/20 border border-cyan-500/30" />
            <div className="absolute inset-[3px] rounded-sm bg-cyan-500/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-cyan-400 font-extrabold text-[10px] font-mono-tech leading-none">W</span>
            </div>
          </div>
          <span className="font-mono-tech font-extrabold text-sm text-white tracking-tight">WEBVULNX</span>
        </Link>

        {/* Primary Nav — Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                isActive(l.to)
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >{l.label}</Link>
          ))}

          {/* More dropdown */}
          <div className="relative">
            <button onClick={() => setMoreOpen(o => !o)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 ${
                moreOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Tools <span className={`text-[8px] transition-transform ${moreOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full mt-1 bg-[#0e1422] border border-slate-700/80 rounded-xl p-1 shadow-xl shadow-black/50 min-w-[160px]"
                onMouseLeave={() => setMoreOpen(false)}>
                {MORE_LINKS.map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMoreOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-[12px] transition-colors ${
                      isActive(l.to) ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >{l.label}</Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* API Status Light */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono-tech text-[10px] text-slate-500">
            <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.9)]' : 'bg-red-500'}`} />
            <span className={apiOnline ? 'text-emerald-400' : 'text-red-400'}>API {apiOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* Target Selector */}
          {targets.length > 0 && (
            <select
              className="hidden sm:block bg-[#121a2d] border border-slate-700/80 text-slate-300 text-[11px] font-mono-tech rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 max-w-[160px] truncate"
              defaultValue=""
              onChange={e => {
                const t = targets.find(x => String(x.id) === e.target.value);
                if (t) navigate(`/scan?target_id=${t.id}&url=${encodeURIComponent(t.url)}`);
              }}
            >
              <option value="">Quick Assess...</option>
              {targets.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
            </select>
          )}

          {/* Primary CTA */}
          <Link to="/scan"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold font-mono-tech text-[11px] px-3.5 py-1.5 rounded-lg transition-all shadow-[0_0_16px_rgba(6,182,212,0.25)] hover:shadow-[0_0_24px_rgba(6,182,212,0.4)] flex items-center gap-1.5"
          >
            <span>▶</span> Start Assessment
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(o => !o)} className="md:hidden text-slate-400 hover:text-white p-1">
            <span className="font-mono-tech text-[10px]">{mobileOpen ? '[×]' : '[≡]'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0e1422] px-6 py-4 space-y-1">
          {[...NAV_LINKS, ...MORE_LINKS].map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(l.to) ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >{l.label}</Link>
          ))}
          <Link to="/scan" onClick={() => setMobileOpen(false)}
            className="block mt-3 text-center bg-cyan-500 text-black font-extrabold font-mono-tech text-xs px-4 py-2 rounded-lg"
          >▶ Start Assessment</Link>
        </div>
      )}
    </header>
  );
}
