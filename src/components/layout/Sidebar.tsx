import React from 'react';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  History,
  LifeBuoy,
  Network,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    services,
    activeIncident,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useApp();

  const criticalCount = Object.values(services).filter((s) => s.state === 'Critical').length;
  const atRiskCount = Object.values(services).filter((s) => s.state === 'At Risk' || s.state === 'Degraded').length;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    {
      id: 'topology',
      label: 'Service Topology',
      icon: Network,
      badge: criticalCount > 0 ? `${criticalCount}` : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'simulator',
      label: 'Failure Simulator',
      icon: AlertOctagon,
      badge: activeIncident ? 'Active' : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    { id: 'logs', label: 'Log Explorer', icon: FileText },
    {
      id: 'rca',
      label: 'Root Cause Analysis',
      icon: Compass,
      badge: activeIncident ? 'Ready' : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    { id: 'recovery', label: 'Recovery Planner', icon: ShieldAlert },
    { id: 'history', label: 'Incident History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderNavContent = (isCollapsed: boolean, isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Brand & Collapse Header */}
      <div>
        <div className="p-4 border-b border-[#263244] flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            {(!isCollapsed || isMobileDrawer) && (
              <div className="min-w-0 truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base tracking-tight text-white">FaultLens</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">AIOps Observability</p>
              </div>
            )}
          </div>

          {/* Close button on mobile drawer */}
          {isMobileDrawer && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161D2B]"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Tablet collapse toggle button (desktop/tablet only) */}
          {!isMobileDrawer && (
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden md:flex p-1 text-slate-400 hover:text-white rounded hover:bg-[#161D2B]"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Cluster Health Summary (hidden if collapsed icon rail) */}
        {(!isCollapsed || isMobileDrawer) && (
          <div className="px-4 py-3 border-b border-[#263244]/60 bg-[#111827]/40">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Cluster Health</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  criticalCount > 0
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : atRiskCount > 0
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {criticalCount > 0 ? 'CRITICAL CASCADE' : atRiskCount > 0 ? 'DEGRADED' : 'HEALTHY'}
              </span>
            </div>
            <div className="w-full bg-[#161D2B] h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(0, (9 - criticalCount - atRiskCount) / 9) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${(atRiskCount / 9) * 100}%` }}
              />
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${(criticalCount / 9) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>9 Services Total</span>
              <span>{criticalCount > 0 ? `${criticalCount} Outages` : '0 Outages'}</span>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="p-2 space-y-1 overflow-y-auto">
          {(!isCollapsed || isMobileDrawer) && (
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1.5">
              Observability Suite
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed && !isMobileDrawer ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed && !isMobileDrawer ? 'justify-center px-2' : 'justify-between px-3'
                } py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#161D2B]/80'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  {(!isCollapsed || isMobileDrawer) && <span className="truncate">{item.label}</span>}
                </div>
                {item.badge && (!isCollapsed || isMobileDrawer) && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Engine Disclaimers / Architecture & Copyright footer */}
      {(!isCollapsed || isMobileDrawer) && (
        <div className="border-t border-[#263244] bg-[#0A0E17]/80 divide-y divide-[#263244]/50">
          <div className="p-3 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold mb-1">
              <LifeBuoy className="w-3.5 h-3.5 text-cyan-400" />
              <span>AIOps Analysis Engine</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Rule-based propagation simulation with optional Gemini SRE postmortem summarization.
            </p>
          </div>
          <div className="px-3 py-2 text-center">
            <p className="text-[10px] text-slate-500 font-mono tracking-tight select-text">
              © 2026 Ayush Singh. All rights reserved.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. Desktop & Tablet Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-[#0D111B] border-r border-[#263244] h-screen sticky top-0 transition-all duration-200 z-20 ${
          isSidebarCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {renderNavContent(isSidebarCollapsed, false)}
      </aside>

      {/* 2. Mobile Modal Drawer (Screens < 768px) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <aside
            className="relative w-72 max-w-[85vw] bg-[#0D111B] border-r border-[#263244] h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {renderNavContent(false, true)}
          </aside>
        </div>
      )}
    </>
  );
};
