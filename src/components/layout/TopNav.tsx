import React, { useState } from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronDown,
  Layers,
  Menu,
  MoreVertical,
  Play,
  RotateCcw,
  Server,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TopNav: React.FC = () => {
  const {
    environment,
    setEnvironment,
    simulationState,
    runPresetDemo,
    resetAllToBaseline,
    aiAvailable,
    logs,
    setIsMobileMenuOpen,
  } = useApp();

  const [showEnvMenu, setShowEnvMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileOverflow, setShowMobileOverflow] = useState(false);

  const envs: ('Production' | 'Staging' | 'Development')[] = ['Production', 'Staging', 'Development'];
  const recentAlerts = logs.filter((l) => l.severity === 'ERROR' || l.severity === 'FATAL').slice(0, 5);

  return (
    <header className="h-16 bg-[#0D111B]/95 backdrop-blur-md border-b border-[#263244] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Hamburger & Branding / Breadcrumbs */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
        {/* Hamburger button for mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-[#161D2B] border border-[#263244] focus:outline-none shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Mobile Mini Logo */}
        <div className="flex md:hidden items-center space-x-2 shrink-0">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white">FaultLens</span>
        </div>

        {/* Desktop Breadcrumbs */}
        <div className="hidden lg:flex items-center space-x-2 text-xs truncate">
          <span className="font-semibold text-slate-300">FaultLens AI</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 truncate">Cascading Software Failure Prediction & Recovery</span>
        </div>

        {/* Environment Selector (Desktop & Tablet) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowEnvMenu(!showEnvMenu)}
            className="flex items-center space-x-1.5 sm:space-x-2 bg-[#161D2B] hover:bg-[#1E2638] border border-[#263244] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{environment}</span>
            <span className="hidden md:inline text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
              Simulated
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showEnvMenu && (
            <div className="absolute left-0 mt-1.5 w-44 bg-[#111827] border border-[#263244] rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 border-b border-[#263244]/60">
                Simulated Environments
              </div>
              {envs.map((env) => (
                <button
                  key={env}
                  onClick={() => {
                    setEnvironment(env);
                    setShowEnvMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#161D2B] ${
                    environment === env ? 'text-purple-400 font-semibold bg-purple-500/10' : 'text-slate-300'
                  }`}
                >
                  <span>{env}</span>
                  {environment === env && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Live Simulation Status Indicator (Large Screens) */}
      {simulationState.isActive && (
        <div className="hidden xl:flex items-center space-x-2.5 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/40 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span className="text-xs font-medium text-purple-300">
            Simulating Cascade: Step {simulationState.currentStepIndex + 1} of {simulationState.totalSteps}
          </span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Preset 3-minute Demo CTA Button (Always Visible & Prominent) */}
        <button
          onClick={runPresetDemo}
          className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg shadow-md shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          title="Run 3-Minute Preset Demo Scenario"
        >
          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          <span className="hidden sm:inline">3-Min Preset Demo</span>
          <span className="sm:hidden">Demo</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={resetAllToBaseline}
          className="flex items-center space-x-1 sm:space-x-1.5 bg-[#161D2B] hover:bg-[#1F293D] text-slate-300 hover:text-white border border-[#263244] text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors"
          title="Reset to pristine baseline"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* AI Capability Status Badge (Desktop Only) */}
        <div
          className={`hidden md:flex items-center space-x-1.5 text-[11px] px-2.5 py-1 rounded-md border ${
            aiAvailable
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}
          title={aiAvailable ? 'Gemini 3.8 Flash online for SRE briefings' : 'Rule-based analysis engine active'}
        >
          <Sparkles className={`w-3 h-3 ${aiAvailable ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="hidden lg:inline">{aiAvailable ? 'Gemini AI Ready' : 'Rule Engine Active'}</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg bg-[#161D2B] hover:bg-[#1E2638] text-slate-300 border border-[#263244] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {recentAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {recentAlerts.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#111827] border border-[#263244] rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#263244] mb-2">
                <span className="text-xs font-semibold text-slate-200">Recent Critical Events</span>
                <span className="text-[10px] text-slate-400">{recentAlerts.length} issues</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No active critical alerts</p>
                ) : (
                  recentAlerts.map((alert) => (
                    <div key={alert.id} className="p-2 rounded bg-[#161D2B] border border-red-500/20 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-red-400 font-semibold mb-1">
                        <span>{alert.serviceName}</span>
                        <span>{alert.timestamp}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] line-clamp-2">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Overflow Menu Button (screens < 640px) */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setShowMobileOverflow(!showMobileOverflow)}
            className="p-2 rounded-lg bg-[#161D2B] hover:bg-[#1E2638] text-slate-300 border border-[#263244]"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMobileOverflow && (
            <div className="absolute right-0 mt-2 w-52 bg-[#111827] border border-[#263244] rounded-xl shadow-2xl p-2 z-50 space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1 border-b border-[#263244]">
                Environment: {environment}
              </div>
              <div className="space-y-1">
                {envs.map((env) => (
                  <button
                    key={env}
                    onClick={() => {
                      setEnvironment(env);
                      setShowMobileOverflow(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${
                      environment === env ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:bg-[#161D2B]'
                    }`}
                  >
                    <span>{env}</span>
                    {environment === env && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
              <div className="pt-1 border-t border-[#263244] px-2 py-1 text-[10px] text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{aiAvailable ? 'Gemini 3.8 Flash Ready' : 'Rule Engine Active'}</span>
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar */}
        <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-[#263244]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
            SR
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-none">SRE Lead</div>
            <div className="text-[10px] text-slate-400 leading-tight">Cluster Ops</div>
          </div>
        </div>
      </div>
    </header>
  );
};
