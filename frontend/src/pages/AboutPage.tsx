import React from 'react';
import { Shield, AlertOctagon, CheckCircle2, Lock, Cpu } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">About WebSecAnalyzer</h1>
            <p className="text-xs text-slate-400">Ethical Web Security Header & Configuration Assessment Tool — Version 1.0.0</p>
          </div>
        </div>

        {/* Ethical Safe-Use Disclaimer Banner */}
        <div className="p-5 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-sm">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span>Authorized Testing & Safe-Use Notice</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Use <strong>WebSecAnalyzer</strong> only against websites and systems that you own or have explicit written authorization to assess.
            The tool performs strictly non-destructive security configuration analysis and is not intended for unauthorized testing, credential attacks, or payload injection.
          </p>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <span>Core Inspection Scope</span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <li className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <strong className="text-cyan-400 block mb-1">HTTP Security Headers</strong>
              Audits CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, and COEP.
            </li>
            <li className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <strong className="text-cyan-400 block mb-1">HTTPS & TLS Metrics</strong>
              Collects certificate subject, issuer, validity period, expiration warnings, hostname verification status, and negotiated protocol versions.
            </li>
            <li className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <strong className="text-cyan-400 block mb-1">Cookie Attribute Inspector</strong>
              Checks flags on HTTP response cookies including Secure, HttpOnly, SameSite, Domain, and Path scope parameters.
            </li>
            <li className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <strong className="text-cyan-400 block mb-1">Technology Exposure Banners</strong>
              Identifies detailed version banners disclosed via Server, X-Powered-By, and framework signature response headers.
            </li>
          </ul>
        </div>

        <div className="space-y-3 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Scoring & Rating Methodology</span>
          </h2>
          <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
            <p>Score range: 0 to 100 points (Base score: 100)</p>
            <p>• High Severity Finding Deduction: -15 points</p>
            <p>• Medium Severity Finding Deduction: -8 points</p>
            <p>• Low Severity Finding Deduction: -3 points</p>
            <p>• Informational Finding: 0 points</p>
            <div className="pt-2 text-slate-400">
              Ratings: 90–100 (Excellent) | 75–89 (Good) | 60–74 (Moderate) | 40–59 (Weak) | 0–39 (Critical Risk)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
