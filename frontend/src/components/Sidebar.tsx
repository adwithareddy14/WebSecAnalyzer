import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Target, Network, Zap, History,
  AlertOctagon, PieChart, CheckSquare, FileText, Terminal,
  Activity, HelpCircle, ShieldCheck, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'TARGETS',
    items: [
      { to: '/targets', icon: Target, label: 'Applications' },
      { to: '/attack-surface', icon: Network, label: 'Attack Surface' },
    ],
  },
  {
    title: 'ASSESSMENT',
    items: [
      { to: '/scan', icon: Zap, label: 'New Assessment' },
      { to: '/history', icon: History, label: 'Assessments' },
      { to: '/findings', icon: AlertOctagon, label: 'Findings' },
      { to: '/risk-analysis', icon: PieChart, label: 'Risk Analysis' },
    ],
  },
  {
    title: 'REMEDIATION',
    items: [
      { to: '/remediation', icon: CheckSquare, label: 'Remediation' },
    ],
  },
  {
    title: 'REPORTING',
    items: [
      { to: '/reports', icon: FileText, label: 'Reports' },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { to: '/cli', icon: Terminal, label: 'CLI Console' },
      { to: '/methodology', icon: HelpCircle, label: 'Methodology' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/status', icon: Activity, label: 'System Status' },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-[#070a0f] border-r border-slate-800/80
          transition-all duration-300 select-none
          ${collapsed ? 'w-16' : 'w-64'}
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Header Branding */}
        <div className={`flex items-center border-b border-slate-800/80 bg-[#0b101b] ${collapsed ? 'justify-center p-3' : 'justify-between px-4 py-3.5'}`}>
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-extrabold text-white text-sm tracking-tight font-mono-tech">
                  WEB<span className="text-cyan-400">VULNX</span>
                </span>
                <p className="text-[9px] font-mono-tech text-slate-500 tracking-wider uppercase">Enterprise WebSec</p>
              </div>
            )}
          </NavLink>

          {!collapsed && (
            <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 font-mono-tech text-xs">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <p className="px-2 text-[9px] font-bold text-slate-500 tracking-wider uppercase">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors font-bold text-xs
                      ${collapsed ? 'justify-center' : ''}
                      ${
                        isActive
                          ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                          : 'text-slate-400 hover:text-white hover:bg-[#0b101b]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Collapse Toggle */}
        <div className="p-2 border-t border-slate-800/80 bg-[#0b101b] hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-[#070a0f] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
