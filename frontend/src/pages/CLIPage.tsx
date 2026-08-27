import React, { useState, useRef, useEffect } from 'react';
import { executeCliCommand } from '../services/api';
import { GlassPanel, SectionLabel } from '../components/ui';

const BANNER = `
  ██╗    ██╗███████╗██████╗ ██╗   ██╗██╗     ███╗   ██╗██╗  ██╗
  ██║    ██║██╔════╝██╔══██╗██║   ██║██║     ████╗  ██║╚██╗██╔╝
  ██║ █╗ ██║█████╗  ██████╔╝██║   ██║██║     ██╔██╗ ██║ ╚███╔╝ 
  ██║███╗██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║     ██║╚██╗██║ ██╔██╗ 
  ╚███╔███╔╝███████╗██████╔╝ ╚████╔╝ ███████╗██║ ╚████║██╔╝ ██╗
   ╚══╝╚══╝ ╚══════╝╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝
                                             WebVulnX CLI v1.0.0`;

const COMMAND_CARDS = [
  { cmd: 'webvulnx targets list',          label: 'List Targets',       desc: 'Show registered target applications' },
  { cmd: 'webvulnx findings list',         label: 'List Findings',      desc: 'Show all discovered vulnerabilities' },
  { cmd: 'webvulnx history',               label: 'Scan History',       desc: 'List completed assessments' },
  { cmd: 'webvulnx version',               label: 'Version Info',       desc: 'Show engine capabilities' },
  { cmd: 'webvulnx scan https://example.com', label: 'Run Scan',        desc: 'Execute security assessment' },
  { cmd: 'webvulnx report 1',              label: 'Report Summary',     desc: 'Show report for ID 1' },
];

interface LogLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export default function CLIPage() {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogLine[]>([
    { type: 'system', text: BANNER },
    { type: 'system', text: '\nWebVulnX CLI Console — Select a quick command or type below.\n' },
  ]);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setHistory(h => [trimmed, ...h.slice(0, 49)]);
    setHistIdx(-1);
    setLogs(l => [...l, { type: 'input', text: `webvulnx@engine:~$ ${trimmed}` }]);
    setInput('');
    setRunning(true);
    try {
      const res = await executeCliCommand(trimmed);
      const output = res.output || JSON.stringify(res, null, 2);
      setLogs(l => [...l, { type: 'output', text: output }]);
    } catch (e: any) {
      setLogs(l => [...l, { type: 'error', text: `Error: ${e.message}` }]);
    } finally {
      setRunning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { runCommand(input); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      if (history[idx]) setInput(history[idx]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx < 0 ? '' : history[idx] || '');
    }
  };

  const exportTranscript = () => {
    const text = logs.map(l => l.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `webvulnx-cli-${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4 font-sans select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <SectionLabel label="Security Workstation" className="mb-0.5" />
          <h1 className="text-2xl font-black text-white tracking-tight">CLI Console</h1>
        </div>
        <button onClick={exportTranscript}
          className="font-mono-tech text-xs text-slate-500 hover:text-white border border-slate-800 hover:border-slate-600 px-3 py-1.5 rounded-xl transition-colors"
        >
          Export Transcript ↓
        </button>
      </div>

      {/* ── TWO-COLUMN WORKSTATION LAYOUT ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column — Terminal Console (Col span 8) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-[#030912] border border-slate-800 rounded-2xl overflow-hidden min-h-[420px]">
          {/* Terminal Title Bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#060a14] border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="flex-1 text-center text-[10px] font-mono-tech text-slate-600">webvulnx — shell core</span>
            <div className="flex items-center gap-1.5 text-[9px] font-mono-tech text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
            </div>
          </div>

          {/* Logs */}
          <div
            className="flex-1 font-mono-tech text-[11px] p-4 overflow-y-auto cursor-text text-slate-200 select-text max-h-[360px]"
            onClick={() => inputRef.current?.focus()}
          >
            {logs.map((line, i) => (
              <pre key={i} className={`whitespace-pre-wrap leading-relaxed mb-0.5 ${
                line.type === 'input'  ? 'text-cyan-400 font-bold' :
                line.type === 'error'  ? 'text-red-400' :
                line.type === 'system' ? 'text-slate-600' :
                'text-slate-300'
              }`}>{line.text}</pre>
            ))}
            {running && <span className="text-cyan-400 animate-pulse font-mono-tech">Processing...</span>}
            <div ref={logsEndRef} />
          </div>

          {/* Command Input Row */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#060a14] border-t border-slate-800">
            <span className="text-cyan-500 font-mono-tech text-sm font-bold">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={running}
              placeholder="webvulnx targets list"
              className="flex-1 bg-transparent text-white font-mono-tech text-xs focus:outline-none placeholder-slate-850"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => runCommand(input)}
              disabled={running || !input.trim()}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-mono-tech text-[10px] font-bold px-3 py-1 rounded-lg transition-colors"
            >
              RUN ↵
            </button>
          </div>
        </div>

        {/* Right Column — Shortcuts & Commands Panel (Col span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Shortcuts Selection Card */}
          <GlassPanel title="QUICK SHORTCUTS" className="p-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
              {COMMAND_CARDS.map(c => (
                <button
                  key={c.cmd}
                  onClick={() => runCommand(c.cmd)}
                  className="w-full bg-[#060a14] border border-slate-800/80 hover:border-cyan-500/30 rounded-xl p-3 text-left transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.05)] group"
                >
                  <div className="text-[10px] font-mono-tech font-bold text-cyan-400 group-hover:text-cyan-300 mb-0.5">{c.label}</div>
                  <div className="text-slate-500 text-[10px] font-mono-tech truncate">{c.cmd}</div>
                </button>
              ))}
            </div>
          </GlassPanel>

          {/* History Card */}
          {history.length > 0 && (
            <GlassPanel title="COMMAND HISTORY" className="p-4">
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto font-mono-tech text-[10px] text-slate-500 pr-1">
                {history.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(cmd)}
                    className="block w-full text-left hover:text-cyan-400 truncate"
                  >
                    {history.length - i}. {cmd}
                  </button>
                ))}
              </div>
            </GlassPanel>
          )}

        </div>

      </div>

    </div>
  );
}
