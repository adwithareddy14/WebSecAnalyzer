import React from 'react';
import { HeaderInfo } from '../types/scan';
import { Check, X } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';

interface HeadersTableProps {
  headers: HeaderInfo[];
}

export const HeadersTable: React.FC<HeadersTableProps> = ({ headers }) => {
  return (
    <div className="bg-[#151c2c] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-slate-200">HTTP Security Headers Analysis</h3>
        <span className="text-xs text-slate-400">Total Analyzed: {headers.length}</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0b0f19] text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Header</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Current Value</th>
              <th className="py-3 px-4">Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {headers.map((h, i) => (
              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-slate-200">{h.header_name}</td>
                <td className="py-3 px-4">
                  {h.status === 'Present' ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      <span>Present</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-red-400 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      <X className="w-3 h-3" />
                      <span>Absent</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <SeverityBadge severity={h.severity} />
                </td>
                <td className="py-3 px-4 font-mono text-xs text-cyan-300 max-w-xs truncate">
                  {h.current_value || <span className="text-slate-500 font-sans italic">None</span>}
                </td>
                <td className="py-3 px-4 text-xs text-slate-400 max-w-sm">
                  {h.recommendation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
