import React from 'react';
import { 
  FileSearch, 
  History, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  AlertCircle,
  FlaskConical,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  historyCount: number;
  auditCount: number;
  hasActiveReceipt: boolean;
  reviewerName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  auditCount,
  hasActiveReceipt,
  reviewerName,
}) => {
  const navItems = [
    {
      id: 'review',
      label: 'Review Receipt',
      icon: FileSearch,
      badge: hasActiveReceipt ? 'Active' : null,
      badgeColor: 'bg-teal-700 text-teal-50',
    },
    {
      id: 'history',
      label: 'Receipt History',
      icon: History,
      badge: historyCount > 0 ? `${historyCount}` : null,
      badgeColor: 'bg-slate-700 text-slate-100',
    },
    {
      id: 'audit',
      label: 'Audit Log',
      icon: ShieldCheck,
      badge: auditCount > 0 ? `${auditCount}` : null,
      badgeColor: 'bg-slate-700 text-slate-100',
    },
    {
      id: 'evaluation',
      label: 'Evaluation',
      icon: BarChart3,
      badge: 'Baselines',
      badgeColor: 'bg-blue-900 text-blue-100',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 select-none">
      {/* Top Research Disclaimer Banner */}
      <div className="bg-slate-950 px-4 py-1 text-[11px] text-slate-400 border-b border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-teal-400">
            <FlaskConical className="w-3.5 h-3.5" />
            ACADEMIC RESEARCH PROTOTYPE
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            Evidence-supported thermal receipt recovery & trace-based field verification.
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Non-certifying research tool (No official MyInvois legal claim)</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Left: App Identity */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab('review')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center font-bold text-white shadow-sm border border-teal-500">
              <span className="text-xs font-mono tracking-tighter">DSD</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 text-base tracking-tight group-hover:text-teal-300 transition-colors">
                  DSDNet-Receipt
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                  v2.2-Dual
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Document Forensics & Verification</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-teal-400 shadow-inner border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Reviewer Identity & Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/80 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <div className="text-right">
              <span className="block text-[11px] font-medium text-slate-200 leading-tight">{reviewerName}</span>
              <span className="block text-[9px] text-slate-400 font-mono leading-none">Reviewer Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-900/95 py-1.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded text-[10px] font-medium ${
                isActive ? 'text-teal-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
