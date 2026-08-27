import React, { useState } from 'react';
import { GlassPanel, SectionLabel } from '../components/ui';

const STAGES = [
  {
    n: '01', label: 'TARGET DEFINITION',
    desc: 'Define and document the authorized scope of assessment including all target URLs, domains, and authorized IP ranges.',
    items: ['Identify target URLs', 'Confirm authorization', 'Define scope limits', 'Select scan profile'],
    color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20',
  },
  {
    n: '02', label: 'RECONNAISSANCE',
    desc: "Perform safe, non-intrusive reconnaissance to map the application's attack surface including DNS and tech stack.",
    items: ['DNS IP resolution', 'Tech stack detection', 'Server banner audit', 'robots.txt check'],
    color: 'text-violet-400 border-violet-500/20 bg-violet-950/20',
  },
  {
    n: '03', label: 'SECURITY HEADERS',
    desc: 'Evaluate HTTP security response headers for presence, configuration quality, and policy enforcement.',
    items: ['CSP validation', 'HSTS validation', 'XFO check', 'XCTO audit'],
    color: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
  },
  {
    n: '04', label: 'TLS ENCRYPTION',
    desc: 'Analyse the transport layer security configuration including certificate validity, expiry, and minimum protocols.',
    items: ['Chain validation', 'Expiry warnings', 'TLS version audit', 'Cipher quality test'],
    color: 'text-blue-400 border-blue-500/20 bg-blue-950/20',
  },
  {
    n: '05', label: 'COOKIE SECURITY',
    desc: 'Evaluate session management and cookie security attribute configuration.',
    items: ['Secure attribute audit', 'HttpOnly verification', 'SameSite attributes', 'Path/domain scopes'],
    color: 'text-orange-400 border-orange-500/20 bg-orange-950/20',
  },
  {
    n: '06', label: 'CORS ANALYSIS',
    desc: 'Identify Cross-Origin Resource Sharing misconfigurations and permissive access control policies.',
    items: ['Wildcard origin audit', 'Credentials allowances', 'Access-Control methods'],
    color: 'text-pink-400 border-pink-500/20 bg-pink-950/20',
  },
  {
    n: '07', label: 'RISK SCORING',
    desc: 'Aggregate all discovered weaknesses into a normalized Security Posture Score with severity-weighted deductions.',
    items: ['Base score 100', 'Critical: -15 pts', 'High: -10 pts', 'Medium: -5 pts'],
    color: 'text-red-400 border-red-500/20 bg-red-950/20',
  },
  {
    n: '08', label: 'REMEDIATION',
    desc: 'Generate actionable security assessment reports with evidence, remediation code samples, and compliance references.',
    items: ['PDF/HTML exports', 'OWASP alignment', 'CWE references', 'Fix config snippets'],
    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
  },
];

export default function MethodologyPage() {
  const [expanded, setExpanded] = useState<string | null>('01');

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans select-none">
      
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-3">
        <SectionLabel label="Educational Framework" className="mb-0.5" />
        <h1 className="text-2xl font-black text-white tracking-tight">WebVulnX Methodology</h1>
        <p className="text-slate-500 text-xs mt-0.5">WebVulnX implements a structured 8-stage audit pipeline to identify vulnerabilities cleanly.</p>
      </div>

      {/* ── HIGH DENSITY HORIZONTAL PIPELINE ROW ────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-8 gap-2 bg-[#0e1422]/60 border border-slate-800/80 rounded-2xl p-3 font-mono-tech text-[10px]">
        {STAGES.map(stage => {
          const act = expanded === stage.n;
          return (
            <button
              key={stage.n}
              onClick={() => setExpanded(stage.n)}
              className={`p-2 rounded-xl text-center border transition-all ${
                act ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="text-xs font-black">{stage.n}</div>
              <div className="truncate mt-0.5 font-bold">{stage.label.split(' ')[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Main split screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Accordions stack (Col span 7) */}
        <div className="lg:col-span-7 space-y-2">
          {STAGES.map(stage => {
            const exp = expanded === stage.n;
            return (
              <div
                key={stage.n}
                className={`bg-[#0e1422]/60 border rounded-xl overflow-hidden transition-colors ${
                  exp ? 'border-slate-700' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setExpanded(expanded === stage.n ? null : stage.n)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-mono-tech font-bold"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold ${stage.color}`}>{stage.n}</span>
                    <span className="text-white font-extrabold tracking-tight">{stage.label}</span>
                  </div>
                  <span className="text-slate-600">{exp ? '▼' : '►'}</span>
                </button>

                {exp && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 space-y-3">
                    <p className="text-slate-400 text-[11px] leading-relaxed font-sans">{stage.desc}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {stage.items.map((item, i) => (
                        <div key={i} className="bg-[#060a14] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono-tech flex items-center gap-1.5">
                          <span className="text-cyan-400">↳</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info detail and compliance box (Col span 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <GlassPanel title="ACTIVE STAGE DETAILS" className="p-4 flex-1 flex flex-col justify-between">
            {expanded ? (() => {
              const stg = STAGES.find(s => s.n === expanded)!;
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border font-mono-tech text-[9px] font-extrabold ${stg.color}`}>{stg.n}</span>
                    <h3 className="text-xs font-bold text-white font-mono-tech tracking-tight">{stg.label}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{stg.desc}</p>
                  
                  <div>
                    <div className="text-[8px] font-mono-tech text-slate-500 tracking-wider font-extrabold mb-1.5 uppercase">EVALUATED ATTRIBUTES</div>
                    <ul className="space-y-1 font-mono-tech text-[10px] text-slate-300">
                      {stg.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-cyan-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })() : (
              <div className="text-center text-slate-600 text-xs py-8">Select a stage to view context.</div>
            )}
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="text-[9px] font-mono-tech font-bold text-amber-500 tracking-wider mb-1.5">⚠ AUDIT COMPLIANCE NOTICE</div>
            <p className="text-slate-450 text-[11px] leading-relaxed font-sans">
              Audits are passive and non-intrusive. However, they must be performed strictly against target networks and hosts for which you possess authorized consent.
            </p>
          </GlassPanel>
        </div>

      </div>

    </div>
  );
}
