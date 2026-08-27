import React from 'react';
import { SeverityLevel } from '../types/scan';

interface SeverityBadgeProps {
  severity: SeverityLevel;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles: Record<SeverityLevel, string> = {
    CRITICAL: "bg-red-600/20 text-red-500 border-red-600/40",
    HIGH: "bg-red-500/10 text-red-400 border-red-500/30",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    LOW: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    INFO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${styles[severity] || styles.INFO}`}>
      {severity}
    </span>
  );
};
