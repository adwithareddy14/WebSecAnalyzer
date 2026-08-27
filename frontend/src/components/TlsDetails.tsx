import React from 'react';
import { TlsInfo } from '../types/scan';
import { ShieldCheck, ShieldAlert, Lock, Unlock, Calendar, Key, CheckCircle } from 'lucide-react';

interface TlsDetailsProps {
  tls: TlsInfo;
}

export const TlsDetails: React.FC<TlsDetailsProps> = ({ tls }) => {
  return (
    <div className="bg-[#151c2c] border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          {tls.https_available ? (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              <Unlock className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-100">HTTPS & TLS Certificate Metrics</h3>
            <p className="text-xs text-slate-400">
              {tls.https_available ? 'Encrypted transport layer enabled' : 'HTTPS transport not available'}
            </p>
          </div>
        </div>

        <div>
          {tls.https_available ? (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full uppercase tracking-wider flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Valid SSL/TLS</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold rounded-full uppercase tracking-wider flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Insecure Transport</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Certificate Subject</span>
          <p className="font-mono text-cyan-300 font-bold truncate">{tls.subject || 'N/A'}</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Certificate Issuer</span>
          <p className="font-mono text-slate-200 font-medium truncate">{tls.issuer || 'N/A'}</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Protocol & Cipher</span>
          <p className="font-mono text-emerald-400 font-bold text-xs">{tls.tls_version || 'Unknown'} / {tls.cipher_name || 'N/A'}</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Valid From</span>
          <p className="font-mono text-slate-300 text-xs">{tls.valid_from || 'N/A'}</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Expiration Date</span>
          <p className="font-mono text-slate-300 text-xs">{tls.valid_to || 'N/A'}</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Days Remaining</span>
          <p className={`font-bold text-base ${tls.days_remaining != null && tls.days_remaining < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {tls.days_remaining != null ? `${tls.days_remaining} Days` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};
