/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DemoWalkthroughBar } from './components/common/DemoWalkthroughBar';
import { SplashScreen } from './components/common/SplashScreen';
import { IncidentHistoryView } from './components/history/IncidentHistoryView';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { LogExplorer } from './components/logs/LogExplorer';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { RootCauseAnalysisView } from './components/rca/RootCauseAnalysisView';
import { RecoveryPlanner } from './components/recovery/RecoveryPlanner';
import { SettingsView } from './components/settings/SettingsView';
import { FailureSimulator } from './components/simulator/FailureSimulator';
import { TopologyExplorer } from './components/topology/TopologyExplorer';
import { AppProvider, useApp } from './context/AppContext';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('faultlens_splash_seen');
    }
    return false;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('faultlens_splash_seen', 'true');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080B12] text-slate-100 font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* Optional Initial Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <DemoWalkthroughBar />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && <OverviewDashboard />}
          {activeTab === 'topology' && <TopologyExplorer />}
          {activeTab === 'simulator' && <FailureSimulator />}
          {activeTab === 'logs' && <LogExplorer />}
          {activeTab === 'rca' && <RootCauseAnalysisView />}
          {activeTab === 'recovery' && <RecoveryPlanner />}
          {activeTab === 'history' && <IncidentHistoryView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
