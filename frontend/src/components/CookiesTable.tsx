import React from 'react';
import { CookieInfo } from '../types/scan';
import { Check, X, ShieldAlert } from 'lucide-react';

interface CookiesTableProps {
  cookies: CookieInfo[];
}

export const CookiesTable: React.FC<CookiesTableProps> = ({ cookies }) => {
  if (cookies.length === 0) {
    return (
      <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        <p>No HTTP response cookies detected during target scan.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#151c2c] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 bg-slate-900/60 border-b border-slate-800">
        <h3 className="font-bold text-slate-200">Cookie Security Attributes Inspector</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0b0f19] text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Cookie Name</th>
              <th className="py-3 px-4">Secure</th>
              <th className="py-3 px-4">HttpOnly</th>
              <th className="py-3 px-4">SameSite</th>
              <th className="py-3 px-4">Domain / Path</th>
              <th className="py-3 px-4">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {cookies.map((c, i) => (
              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-cyan-300">{c.name}</td>
                <td className="py-3 px-4">
                  {c.secure ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Secure
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 text-xs font-semibold">
                      <X className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {c.httponly ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> HttpOnly
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 text-xs font-semibold">
                      <X className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs font-mono text-slate-300">
                  {c.samesite || <span className="text-amber-400 italic">None / Unset</span>}
                </td>
                <td className="py-3 px-4 text-xs font-mono text-slate-400">
                  {c.domain || 'Target Host'} / {c.path || '/'}
                </td>
                <td className="py-3 px-4">
                  {c.findings.length > 0 ? (
                    <span className="inline-flex items-center space-x-1 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{c.findings.length} Issue(s)</span>
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold">Clean</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
