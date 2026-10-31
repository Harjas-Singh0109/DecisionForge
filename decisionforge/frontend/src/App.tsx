import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { NewInvestigation } from './pages/NewInvestigation';
import { AgentWorkspace } from './pages/AgentWorkspace';
import { AdaptiveAnalysisPage } from './pages/AdaptiveAnalysisPage';
import { EvidenceGraph } from './pages/EvidenceGraph';
import { ScenarioLab } from './pages/ScenarioLab';
import { ResearchReports } from './pages/ResearchReports';
import { Settings } from './pages/Settings';
import { Investigation, SystemStatus } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const invs = await api.listInvestigations();
      setInvestigations(invs);
      if (invs.length > 0 && !selectedInvId) {
        setSelectedInvId(invs[0].id);
      }
      const sys = await api.getSystemStatus();
      setSystemStatus(sys);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeInvestigation = investigations.find((i) => i.id === selectedInvId) || null;

  const handleSelectInvestigation = (id: string, tab: string = 'workspace') => {
    setSelectedInvId(id);
    setCurrentTab(tab);
  };

  const handleStartInvestigation = async (id?: string) => {
    const targetId = id || selectedInvId;
    if (!targetId) return;
    setIsStarting(true);
    try {
      await api.startInvestigation(targetId);
      await loadData();
      setCurrentTab('workspace');
    } catch (e) {
      console.error(e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleDeleteInvestigation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investigation?')) return;
    try {
      await api.deleteInvestigation(id);
      await loadData();
      if (selectedInvId === id) {
        const remaining = investigations.filter((i) => i.id !== id);
        setSelectedInvId(remaining.length > 0 ? remaining[0].id : '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F172A] text-[#F8FAFC]">
      {/* Persistent Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        investigations={investigations}
        selectedInvId={selectedInvId}
        setSelectedInvId={setSelectedInvId}
        systemStatus={systemStatus}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar
          currentTab={currentTab}
          activeInvestigation={activeInvestigation}
          onNewClick={() => setCurrentTab('new')}
          onStartClick={() => handleStartInvestigation()}
          isStarting={isStarting}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && (
            <Overview
              investigations={investigations}
              onSelectInvestigation={handleSelectInvestigation}
              onNewInvestigation={() => setCurrentTab('new')}
              onDeleteInvestigation={handleDeleteInvestigation}
              onStartInvestigation={handleStartInvestigation}
              systemStatus={systemStatus}
            />
          )}

          {currentTab === 'new' && (
            <NewInvestigation
              onInvestigationCreated={(id) => {
                loadData();
                setSelectedInvId(id);
                setCurrentTab('workspace');
              }}
            />
          )}

          {currentTab === 'workspace' && (
            <AgentWorkspace
              investigation={activeInvestigation}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'analysis' && (
            <AdaptiveAnalysisPage
              investigation={activeInvestigation}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'graph' && (
            <EvidenceGraph
              investigation={activeInvestigation}
            />
          )}

          {currentTab === 'scenario' && (
            <ScenarioLab
              investigation={activeInvestigation}
            />
          )}

          {currentTab === 'reports' && (
            <ResearchReports
              investigation={activeInvestigation}
            />
          )}

          {currentTab === 'settings' && (
            <Settings
              systemStatus={systemStatus}
              onRefreshStatus={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
