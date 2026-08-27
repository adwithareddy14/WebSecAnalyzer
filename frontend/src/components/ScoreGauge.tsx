import React from 'react';

interface ScoreGaugeProps {
  score: number;
  rating: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, rating }) => {
  let strokeColor = "#10b981"; // Emerald
  let badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  if (score < 60) {
    strokeColor = "#ef4444"; // Red
    badgeColor = "text-red-400 bg-red-500/10 border-red-500/30";
  } else if (score < 75) {
    strokeColor = "#f59e0b"; // Amber
    badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  } else if (score < 90) {
    strokeColor = "#3b82f6"; // Blue
    badgeColor = "text-blue-400 bg-blue-500/10 border-blue-500/30";
  }

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#151c2c] border border-slate-800 p-6 rounded-xl shadow-xl">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#1e293b"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke={strokeColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-100">{score}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left space-y-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <h2 className="text-xl font-bold text-slate-100">Security Score</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border tracking-wider ${badgeColor}`}>
            {rating}
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Evaluated against passive security configuration standards including HTTP headers, TLS certificate metrics, cookie security attributes, and server exposure parameters.
        </p>
      </div>
    </div>
  );
};
