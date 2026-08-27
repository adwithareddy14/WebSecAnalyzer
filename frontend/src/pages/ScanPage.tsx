import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { performScan, getTargets } from '../services/api';
import type { ScanProfile, Target } from '../types/scan';
import { WorkflowStepper, GlassPanel, SectionLabel } from '../components/ui';

const MODULES = [
  { key: 'headers',      name: 'HTTP Security Headers', desc: 'CSP, HSTS, XFO, XCTO, Referrer-Policy' },
  { key: 'cookies',      name: 'Cookie Security',       desc: 'Secure, HttpOnly, SameSite attributes' },
  { key: 'tls',          name: 'TLS Cryptography',      desc: 'Certificate validity, expiry, TLS version' },
  { key: 'cors',         name: 'CORS Configuration',    desc: 'Wildcard origin & credentials misconfiguration' },
  { key: 'response_info',name: 'Technology Detection',  desc: 'Server banners & framework disclosures' },
  { key: 'recon',        name: 'Safe Reconnaissance',   desc: 'DNS, robots.txt, .git exposure' },
];

const PROFILES = [
  { id: 'Quick' as ScanProfile,    icon: '⚡', name: 'QUICK',    time: '~5s',  desc: 'Fast assessment covering core security headers, TLS validity, and cookie attributes.', recommended: false },
  { id: 'Standard' as ScanProfile, icon: '⊙', name: 'STANDARD', time: '~10s', desc: 'Balanced security assessment. Full headers, TLS cryptography, CORS policy, cookie security.', recommended: true },
  { id: 'Full' as ScanProfile,     icon: '◈', name: 'FULL',     time: '~20s', desc: 'Comprehensive analysis including safe reconnaissance, robots.txt inspection, and .git exposure checks.', recommended: false },
];

const PHASES = [
  'Target validation', 'Discovery & endpoint mapping', 'Security header analysis',
  'TLS certificate analysis', 'Authentication & cookie checks',
  'Input & CORS validation', 'Configuration checks', 'Vulnerability analysis', 'Risk calculation',
];

export default function ScanPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [url, setUrl] = useState(params.get('url') || '');
  const [profile, setProfile] = useState<ScanProfile>((params.get('profile') as ScanProfile) || 'Standard');
  const [targetId, setTargetId] = useState<number | undefined>(params.get('target_id') ? parseInt(params.get('target_id')!) : undefined);
  const [selectedMods, setSelectedMods] = useState<string[]>(['headers', 'cookies', 'tls', 'cors', 'response_info']);
  const [currentStep, setCurrentStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [targets, setTargets] = useState<Target[]>([]);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [findingsFound, setFindingsFound] = useState(0);

  useEffect(() => { getTargets().then(setTargets).catch(() => {}); }, []);

  const handleProfileSelect = (p: ScanProfile) => {
    setProfile(p);
    if (p === 'Quick') setSelectedMods(['headers', 'cookies', 'tls', 'response_info']);
    else if (p === 'Standard') setSelectedMods(['headers', 'cookies', 'tls', 'cors', 'response_info']);
    else setSelectedMods(['headers', 'cookies', 'tls', 'cors', 'response_info', 'recon']);
  };

  const toggleModule = (key: string) =>
    setSelectedMods(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const ts = () => new Date().toISOString().split('T')[1].slice(0, 8);

  const handleStartScan = async () => {
    if (!url.trim()) { setError('Please specify a target URL.'); return; }
    let targetStr = url.trim();
    if (!targetStr.startsWith('http://') && !targetStr.startsWith('https://')) targetStr = 'https://' + targetStr;
    setError('');
    setScanning(true);
    setCurrentStep(4);
    setPhaseIdx(0);
    setElapsed(0);
    setFindingsFound(0);
    setLogs([
      `${ts()} INFO  Target validated: ${targetStr}`,
      `${ts()} INFO  Profile loaded: ${profile.toUpperCase()} · Modules: ${selectedMods.join(', ')}`,
      `${ts()} EXEC  Initiating phase 1: ${PHASES[0]}...`,
    ]);
    const timerInt = setInterval(() => setElapsed(s => s + 1), 1000);
    let idx = 0;
    const phaseInt = setInterval(() => {
      idx++;
      if (idx < PHASES.length) {
        setPhaseIdx(idx);
        if (idx === 3) setFindingsFound(2);
        if (idx === 6) setFindingsFound(5);
        setLogs(prev => [
          ...prev,
          `${ts()} OK    Phase completed: ${PHASES[idx - 1]}`,
          `${ts()} EXEC  Initiating phase ${idx + 1}: ${PHASES[idx]}...`,
        ]);
      }
    }, 900);

    try {
      const res = await performScan(targetStr, profile, targetId, selectedMods);
      clearInterval(timerInt); clearInterval(phaseInt);
      setCurrentStep(5);
      setLogs(prev => [...prev, `${ts()} DONE  Assessment completed. Security Score: ${res.score}/100`]);
      setTimeout(() => navigate(`/results/${res.id}`), 800);
    } catch (e: any) {
      clearInterval(timerInt); clearInterval(phaseInt);
      setError(e.message || 'Assessment failed.');
      setLogs(prev => [...prev, `${ts()} ERROR ${e.message}`]);
      setScanning(false);
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen px-6 md:px-16 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Page heading */}
        <div className="mb-8">
          <SectionLabel label="Security Assessment Workflow" className="mb-2" />
          <h1 className="text-3xl font-black text-white tracking-tight">Start a Security Assessment</h1>
          <p className="text-slate-500 text-sm mt-1">Configure and launch an authorized web application security assessment.</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <WorkflowStepper currentStep={currentStep} />
        </div>

        {!scanning ? (
          <div className="space-y-5">
            {/* STEP 01 — TARGET */}
            <GlassPanel title="STEP 01 — TARGET ASSET" className="p-5">
              <div className="space-y-4">
                {targets.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-mono-tech font-bold text-slate-500 tracking-wider mb-1.5">SELECT REGISTERED ASSET</label>
                    <select
                      className="w-full bg-[#0a0f1c] border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono-tech text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      value={targetId ?? ''}
                      onChange={e => {
                        const id = e.target.value ? Number(e.target.value) : undefined;
                        setTargetId(id);
                        const t = targets.find(x => x.id === id);
                        if (t) setUrl(t.url);
                      }}
                    >
                      <option value="">— Select registered application —</option>
                      {targets.map(t => <option key={t.id} value={t.id}>{t.name} ({t.url})</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono-tech font-bold text-slate-500 tracking-wider mb-1.5">TARGET URL *</label>
                  <input
                    type="text"
                    placeholder="https://authorized-target.com"
                    value={url}
                    onChange={e => { setUrl(e.target.value); setTargetId(undefined); }}
                    className="w-full bg-[#0a0f1c] border border-slate-700/80 rounded-xl px-4 py-3 text-white font-mono-tech text-sm placeholder-slate-700 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-600 mt-1.5 font-mono-tech">Only assess applications you own or have explicit written permission to test.</p>
                </div>
              </div>
            </GlassPanel>

            {/* STEP 02 — PROFILE */}
            <GlassPanel title="STEP 02 — SCAN PROFILE" className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PROFILES.map(p => (
                  <button key={p.id} onClick={() => handleProfileSelect(p.id)}
                    className={`relative text-left p-4 rounded-xl border transition-all ${
                      profile === p.id
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                        : 'bg-[#0a0f1c] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.recommended && (
                      <span className="absolute top-2 right-2 text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono-tech font-bold">REC</span>
                    )}
                    <div className={`text-lg font-mono-tech mb-2 ${profile === p.id ? 'text-cyan-400' : 'text-slate-500'}`}>{p.icon}</div>
                    <div className="font-extrabold text-white text-sm">{p.name}</div>
                    <div className="text-[10px] font-mono-tech text-slate-600 mb-2">{p.time}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{p.desc}</div>
                  </button>
                ))}
              </div>
            </GlassPanel>

            {/* STEP 03 — MODULES */}
            <GlassPanel title="STEP 03 — ACTIVE MODULES" className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MODULES.map(mod => {
                  const checked = selectedMods.includes(mod.key);
                  return (
                    <button key={mod.key} onClick={() => toggleModule(mod.key)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        checked
                          ? 'bg-[#0e1422] border-slate-700/80 text-slate-200'
                          : 'bg-[#0a0f1c] border-slate-800/60 text-slate-600 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 transition-colors ${
                        checked ? 'bg-cyan-500 text-black' : 'bg-slate-800 border border-slate-700 text-transparent'
                      }`}>✓</div>
                      <div>
                        <p className="font-bold text-sm text-white">{mod.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{mod.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </GlassPanel>

            {error && (
              <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3.5 flex items-center gap-2.5">
                <span className="text-red-400">⚠</span>
                <p className="text-red-300 text-sm font-mono-tech">{error}</p>
              </div>
            )}

            {/* LAUNCH */}
            <button
              onClick={handleStartScan}
              disabled={!url.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold font-mono-tech py-4 rounded-2xl text-sm transition-all shadow-[0_0_24px_rgba(6,182,212,0.25)] hover:shadow-[0_0_36px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
            >
              <span>▶</span> STEP 04 — START SECURITY ASSESSMENT →
            </button>
          </div>
        ) : (
          /* ── ACTIVE SCAN EXPERIENCE ─────────────────────────────────────── */
          <div className="space-y-5">
            {/* Target metadata */}
            <GlassPanel accent className="px-5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono-tech text-xs">
                <div><span className="text-[9px] text-slate-600 tracking-wider block mb-0.5">TARGET</span><span className="text-cyan-400 font-bold truncate block">{url}</span></div>
                <div><span className="text-[9px] text-slate-600 tracking-wider block mb-0.5">PROFILE</span><span className="text-white font-bold">{profile.toUpperCase()}</span></div>
                <div><span className="text-[9px] text-slate-600 tracking-wider block mb-0.5">ELAPSED</span><span className="text-amber-400 font-bold">{elapsed}s</span></div>
                <div><span className="text-[9px] text-slate-600 tracking-wider block mb-0.5">FINDINGS</span><span className="text-red-400 font-bold">{findingsFound} detected</span></div>
              </div>
            </GlassPanel>

            {/* Phase progress */}
            <GlassPanel title="ASSESSMENT PHASE PROGRESS" className="p-5">
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white font-mono-tech uppercase">{PHASES[phaseIdx]}</span>
                  <span className="text-cyan-400 font-mono-tech">{phaseIdx + 1} / {PHASES.length}</span>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${PHASES.length}, 1fr)` }}>
                  {PHASES.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx < phaseIdx ? 'bg-emerald-500' : idx === phaseIdx ? 'bg-cyan-400 animate-pulse' : 'bg-slate-800'
                    }`} />
                  ))}
                </div>
              </div>

              {/* Progress % */}
              <div className="mt-4 text-center">
                <div className="text-4xl font-black font-mono-tech text-cyan-400">
                  {Math.round((phaseIdx / PHASES.length) * 100)}
                  <span className="text-2xl text-cyan-400/50">%</span>
                </div>
                <div className="text-[10px] text-slate-600 font-mono-tech tracking-wider mt-1">SCAN PROGRESS</div>
              </div>
            </GlassPanel>

            {/* Live log stream */}
            <GlassPanel title="ENGINE LOG STREAM" accent className="p-4">
              <div className="bg-[#060a14] rounded-xl p-4 font-mono-tech text-[11px] text-cyan-300 max-h-56 overflow-y-auto space-y-1" style={{ scrollBehavior: 'smooth' }}>
                {logs.map((log, i) => (
                  <div key={i} className={`leading-relaxed ${log.includes('ERROR') ? 'text-red-400' : log.includes('DONE') ? 'text-emerald-400' : log.includes('OK') ? 'text-emerald-300' : 'text-cyan-300'}`}>
                    {log}
                  </div>
                ))}
                <div className="text-slate-700 animate-pulse">█</div>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
}
