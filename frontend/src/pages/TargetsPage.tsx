import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTargets, createTarget, deleteTarget } from '../services/api';
import type { Target } from '../types/scan';
import { GlassPanel, SectionLabel, LoadingSpinner, ErrorMessage, EmptyState } from '../components/ui';
import { Play, Trash2, Plus, Globe, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function TargetsPage() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Development' | 'Testing'>('Production');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getTargets().then(setTargets).catch(e => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setSubmitting(true);
    try {
      let u = url.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
      await createTarget({ name: name.trim(), url: u, environment });
      setShowAdd(false); setName(''); setUrl('');
      load();
    } catch (err: any) {
      alert('Failed to add target: ' + err.message);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this target from WebVulnX registry?')) return;
    try { await deleteTarget(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  const ENV_COLORS: Record<string, string> = {
    Production: 'text-red-400 border-red-500/25 bg-red-950/20',
    Staging:    'text-amber-400 border-amber-500/25 bg-amber-950/20',
    Development:'text-blue-400 border-blue-500/25 bg-blue-950/20',
    Testing:    'text-teal-400 border-teal-500/25 bg-teal-950/20',
  };

  if (loading && targets.length === 0) return <div className="p-10"><LoadingSpinner message="Loading target applications..." /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <SectionLabel label="Asset Management" className="mb-0.5" />
          <h1 className="text-2xl font-black text-white tracking-tight">Target Applications</h1>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold font-mono-tech text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_16px_rgba(6,182,212,0.2)]"
        >
          <Plus className="w-4 h-4" /> Add Target
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {targets.length === 0 ? (
        <EmptyState
          title="NO TARGETS REGISTERED"
          description="Add your first authorized web application to begin security assessments."
          action={
            <button onClick={() => setShowAdd(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono-tech px-4 py-2 rounded-xl text-sm"
            >
              + Add Target
            </button>
          }
        />
      ) : (
        /* ── HIGH DENSITY TABLE-LIST HYBRID ────────────────────────────────────── */
        <GlassPanel title={`MONITORED TARGET REGISTRY (${targets.length} ASSETS)`} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono-tech">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#060a14] text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                  <th className="px-4 py-3">Target Name & Endpoint</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3">Posture Score</th>
                  <th className="px-4 py-3">Open Findings</th>
                  <th className="px-4 py-3">Health Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {targets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white mb-0.5">{t.name}</div>
                      <div className="text-cyan-400 text-[11px] flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[280px] md:max-w-md block">{t.url}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded border uppercase ${ENV_COLORS[t.environment] || ENV_COLORS['Production']}`}>
                        {t.environment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                          t.security_score >= 80 ? 'bg-emerald-950/30 text-emerald-400 border-emerald-700/20' :
                          t.security_score >= 60 ? 'bg-amber-950/30 text-amber-400 border-amber-700/20' :
                          'bg-red-950/30 text-red-400 border-red-700/20'
                        }`}>
                          {t.security_score}
                        </div>
                        <span className="text-[10px] text-slate-500">/ 100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${t.open_findings_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {t.open_findings_count} open
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-bold">MONITORED</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/scan?target_id=${t.id}&url=${encodeURIComponent(t.url)}`}
                          className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" /> Assess
                        </Link>
                        <button onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/20 rounded-lg transition-all"
                          title="Delete Target"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}

      {/* Add Target Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-[#0a0f1c] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-black">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono-tech font-bold text-cyan-500 tracking-widest">ASSET REGISTRATION</p>
                <h2 className="text-lg font-black text-white">Add Security Target</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white font-mono-tech text-xs border border-slate-700 px-2 py-1 rounded-lg">
                [X]
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono-tech font-bold text-slate-500 tracking-wider mb-1.5">APPLICATION NAME *</label>
                <input type="text" placeholder="e.g. Core Billing API" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono-tech text-sm placeholder-slate-700 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-mono-tech font-bold text-slate-500 tracking-wider mb-1.5">TARGET URL *</label>
                <input type="text" placeholder="https://authorized-target.com" value={url} onChange={e => setUrl(e.target.value)} required
                  className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono-tech text-sm placeholder-slate-700 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-mono-tech font-bold text-slate-500 tracking-wider mb-1.5">ENVIRONMENT</label>
                <select value={environment} onChange={e => setEnvironment(e.target.value as any)}
                  className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono-tech text-sm focus:outline-none focus:border-cyan-500">
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing / Lab</option>
                </select>
              </div>
              <p className="text-[10px] text-amber-400 font-mono-tech">⚠ Only add applications you own or have explicit written permission to test.</p>
              <button type="submit" disabled={submitting}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-extrabold font-mono-tech py-3 rounded-xl text-sm transition-all">
                {submitting ? 'Adding...' : '[ Register Target Asset ]'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
