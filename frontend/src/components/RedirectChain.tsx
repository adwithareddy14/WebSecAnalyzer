import React from 'react';
import { RedirectStep } from '../types/scan';
import { ArrowRight, CornerDownRight } from 'lucide-react';

interface RedirectChainProps {
  chain: RedirectStep[];
}

export const RedirectChain: React.FC<RedirectChainProps> = ({ chain }) => {
  if (chain.length <= 1) {
    return (
      <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        Direct connection established (No HTTP redirects detected).
      </div>
    );
  }

  return (
    <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
      <h3 className="font-bold text-slate-200 text-sm">HTTP Redirect Chain Sequence</h3>
      
      <div className="space-y-2">
        {chain.map((step, idx) => (
          <div key={idx} className="flex items-center space-x-3 text-xs">
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">
              {step.step}
            </span>
            
            <span className={`px-2 py-0.5 rounded font-mono font-bold ${
              step.status_code >= 300 && step.status_code < 400 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {step.status_code}
            </span>

            <span className="font-mono text-cyan-300 truncate max-w-xl">
              {step.url}
            </span>

            {idx < chain.length - 1 && (
              <CornerDownRight className="w-4 h-4 text-slate-500 shrink-0 ml-auto" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
