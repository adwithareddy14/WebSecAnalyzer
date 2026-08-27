import React, { useState } from 'react';
import { Finding } from '../types/scan';
import { SeverityBadge } from './SeverityBadge';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#151c2c] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <SeverityBadge severity={finding.severity} />
          <h3 className="text-sm font-semibold text-slate-200">{finding.title}</h3>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700 hidden sm:inline">
            {finding.category}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-slate-900/50 border-t border-slate-800/80 space-y-3 text-xs sm:text-sm">
          <div>
            <span className="font-semibold text-slate-400">Description:</span>
            <p className="text-slate-300 mt-0.5">{finding.description}</p>
          </div>
          
          <div>
            <span className="font-semibold text-slate-400">Evidence:</span>
            <div className="mt-1 p-2 bg-[#0b0f19] border border-slate-800 rounded font-mono text-xs text-cyan-300 break-all">
              {finding.evidence}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
              <div className="flex items-center space-x-1.5 text-red-400 font-semibold text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Security Impact</span>
              </div>
              <p className="text-slate-300 text-xs">{finding.impact}</p>
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Remediation Recommendation</span>
              </div>
              <p className="text-slate-300 text-xs">{finding.remediation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
