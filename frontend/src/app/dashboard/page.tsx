"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import StatusHeader from "../components/StatusHeader";
import IncidentDetails from "../components/IncidentPanel";
import ReasoningTrace from "../components/ReasoningTrace";
import ActionLog from "../components/ActionLog";
import PRViewer from "../components/PRViewer";
import ChatPanel from "../components/ChatPanel";
import Sidebar, { MainTab } from "../components/Sidebar";
import { useAgentStream } from "../hooks/useAgentStream";
import SearchModal from "../components/SearchModal";
import ConfigModal from "../components/ConfigModal";

// Views
import AlertsView from "../components/views/AlertsView";
import MyTriagesView from "../components/views/MyTriagesView";
import ServiceHealthView from "../components/views/ServiceHealthView";
import SLOView from "../components/views/SLOView";
import IntegrationsView from "../components/views/IntegrationsView";
import ServiceDashboard from "../components/views/ServiceDashboard";
import OnCallView from "../components/views/OnCallView";
import EnvironmentView from "../components/views/EnvironmentView";
import IncidentListView from "../components/views/IncidentListView";

export default function DashboardPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('issues');
  const [selectedIncident, setSelectedIncident] = useState("db_cascade");
  const [selectedEnv, setSelectedEnv] = useState("Production");
  const [selectedIntegration, setSelectedIntegration] = useState("logs");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showPR, setShowPR] = useState(true);
  const [autoSendQuery, setAutoSendQuery] = useState<string | null>(null);
  
  const { getIncidentData, startStream } = useAgentStream();
  const { events, status, isPaused, elapsedMs } = getIncidentData(selectedIncident);

  const totalReward = useMemo(() => {
    let reward = 0;
    for (const e of events) {
      if (e.metadata.reward !== undefined) {
        reward += e.metadata.reward;
      }
    }
    return reward;
  }, [events]);

  const hasPR = useMemo(() => {
    return events.some(
      (e) => e.type === "result" && e.metadata.diff !== undefined,
    );
  }, [events]);
  const [chatSessions, setChatSessions] = useState<string[]>([]);

  // Global search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchNavigate = (tab: any, context?: string) => {
    setActiveMainTab(tab);
    if (tab === 'issues' && context) setSelectedIncident(context);
    if (tab === 'service-dashboard' && context) setSelectedIncident(context);
    if (tab === 'env' && context) setSelectedEnv(context);
  };

  const handleSelectIncident = useCallback((id: string) => {
    setSelectedIncident(id);
  }, []);

  const handleStartAgent = useCallback(() => {
    if (selectedIncident && getIncidentData(selectedIncident).status !== "running") {
      setShowPR(true);
      startStream(selectedIncident);
    }
  }, [selectedIncident, getIncidentData, startStream]);

  const handleChatStarted = useCallback((incidentId: string) => {
    setChatSessions(prev => prev.includes(incidentId) ? prev : [...prev, incidentId]);
  }, []);

  // New Chat resets to blank slate, stays on chats tab
  const handleNewChat = useCallback(() => {
    setActiveMainTab('chats');
    const newId = `session_${Date.now()}`;
    setSelectedIncident(newId);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    const chats = JSON.parse(localStorage.getItem('axiom_chats') || '[]');
    localStorage.setItem('axiom_chats', JSON.stringify(chats.filter((c: string) => c !== id)));
    localStorage.removeItem(`axiom_history_${id}`);
    setChatSessions(prev => prev.filter(c => c !== id));
    if (selectedIncident === id) {
      setSelectedIncident("db_cascade");
    }
  }, [selectedIncident]);

  const handleChatTriage = useCallback((incidentId: string) => {
    setSelectedIncident(incidentId);
    if (getIncidentData(incidentId).status !== 'running') {
      setShowPR(true);
      startStream(incidentId);
    }
  }, [getIncidentData, startStream]);

  const renderContent = () => {
    switch (activeMainTab) {
      case 'issues':
        if (selectedIncident) {
          return (
            <div className="flex flex-col flex-1 overflow-hidden">
              <IncidentDetails
                selectedIncident={selectedIncident}
                onStartAgent={handleStartAgent}
                onOpenChat={(query) => {
                  setActiveMainTab('chats');
                  if (query) setAutoSendQuery(query);
                }}
                agentStatus={status}
                selectedEnv={selectedEnv}
              />
              <div className="flex flex-1 overflow-hidden">
                <ReasoningTrace events={events} />
                <div className="w-[380px] flex flex-col border-l border-[var(--linear-border)] bg-[var(--linear-bg)] overflow-hidden">
                  <ActionLog events={events} incidentId={selectedIncident} onOpenPR={() => setShowPR(true)} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <IncidentListView 
            selectedEnv={selectedEnv} 
            onSelectIncident={(id) => {
              setSelectedIncident(id);
            }} 
          />
        );
      case 'chats':
        return (
          <div className="flex-1 flex overflow-hidden bg-[var(--linear-bg)] justify-center">
            <div className="w-full h-full">
              <ChatPanel
                incidentId={selectedIncident}
                activeMainTab={activeMainTab}
                onNewChat={handleNewChat}
                onStartTriage={handleChatTriage}
                agentEvents={events}
                agentStatus={status}
                autoQuery={autoSendQuery}
                onQueryHandled={() => setAutoSendQuery(null)}
              />
            </div>
          </div>
        );
      case 'alerts':
        return <AlertsView onTriage={(id) => { setSelectedIncident(id); setActiveMainTab('issues'); }} />;
      case 'health':
        return <ServiceHealthView selectedEnv={selectedEnv} />;
      case 'slo':
        return <SLOView selectedEnv={selectedEnv} />;
      case 'integrations':
        return <IntegrationsView selectedIntegration={selectedIntegration} />;
      case 'service-dashboard':
        return <ServiceDashboard serviceId={selectedIncident} />;
      case 'env':
        return <EnvironmentView envName={selectedEnv} />;
      case 'oncall':
        return <OnCallView />;
      default:
        return <MyTriagesView onOpenTriage={(id) => { setSelectedIncident(id); setActiveMainTab('issues'); }} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
        selectedIncident={selectedIncident}
        onSelectIncident={handleSelectIncident}
        onNewChat={handleNewChat}
        chatSessions={chatSessions}
        selectedEnv={selectedEnv}
        onSelectEnv={setSelectedEnv}
        selectedIntegration={selectedIntegration}
        onSelectIntegration={setSelectedIntegration}
        onOpenSearch={() => setIsSearchOpen(true)}
        onDeleteChat={handleDeleteChat}
      />

      <div className="flex-1 flex flex-col min-0 relative">
        {activeMainTab === 'issues' && (
          <StatusHeader
            status={status}
            isPaused={isPaused}
            elapsedMs={elapsedMs}
            totalReward={totalReward}
            onOpenConfig={() => setIsConfigOpen(true)}
          />
        )}

        {renderContent()}

        {hasPR && showPR && activeMainTab === 'issues' && (
          <PRViewer events={events} onDismiss={() => setShowPR(false)} />
        )}

        <SearchModal 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
          onNavigate={handleSearchNavigate}
        />

        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
        />
      </div>
    </div>
  );
}
