"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface Incident {
  id: string;
  name: string;
  service: string;
  severity: string;
}

export type MainTab = 'issues' | 'chats' | 'alerts' | 'health' | 'slo' | 'oncall' | 'integrations' | 'service-dashboard' | 'env';

interface SidebarProps {
  activeMainTab: MainTab;
  setActiveMainTab: (tab: MainTab) => void;
  selectedIncident: string;
  onSelectIncident: (id: string) => void;
  onNewChat: () => void;
  chatSessions: string[];
  selectedEnv: string;
  onSelectEnv: (name: string) => void;
  selectedIntegration: string;
  onSelectIntegration: (id: string) => void;
  onOpenSearch: () => void;
  onDeleteChat?: (id: string) => void;
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

const INCIDENT_NAMES: Record<string, string> = {
  db_cascade: "Post-Mortem: DB",
  memory_leak: "Post-Mortem: Memory",
  exception_loop: "Post-Mortem: Gateway",
};

// ── Icons (unchanged from Sidebar_full) ──────────────────────────────────────

const IconInbox = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10h3l1.5 2h3L11 10h3V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconTarget = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" /><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" /><line x1="8" y1="2" x2="8" y2="5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /><line x1="8" y1="11" x2="8" y2="14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /><line x1="2" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /><line x1="11" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>);
const IconLayers = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 11l6 3 6-3M2 8l6 3 6-3M2 5l6-3 6 3-6 3-6-3Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconMap = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2L2 3.5v10L6 12l4 2 4-1.5V3L10 4 6 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /><line x1="6" y1="2" x2="6" y2="12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /><line x1="10" y1="4" x2="10" y2="14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>);
const IconTeam = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.25" /><circle cx="8" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.25" /><path d="M4 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>);
const IconGrid = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" /><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" /><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" /><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" /></svg>);
const IconIssue = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" /></svg>);
const IconCycles = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" /><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconGitHub = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1C4.13 1 1 4.13 1 8c0 3.08 2 5.69 4.74 6.62.35.06.47-.15.47-.33v-1.15c-1.93.42-2.33-.93-2.33-.93-.32-.8-.77-1.01-.77-1.01-.63-.43.05-.42.05-.42.69.05 1.06.71 1.06.71.62 1.06 1.62.75 2.01.57.06-.45.24-.75.44-.92-1.54-.17-3.16-.77-3.16-3.43 0-.76.27-1.38.71-1.86-.07-.18-.31-.88.07-1.84 0 0 .58-.18 1.9.71.55-.15 1.14-.23 1.73-.23s1.18.08 1.73.23c1.31-.89 1.89-.71 1.89-.71.38.96.14 1.66.07 1.84.44.48.71 1.1.71 1.86 0 2.67-1.62 3.26-3.17 3.43.25.21.47.64.47 1.29v1.92c0 .18.12.39.47.33C13 13.69 15 11.08 15 8c0-3.87-3.13-7-7-7Z" /></svg>);
const IconSearch = () => (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" /><line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>);
const IconCompose = () => (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M11 2.5l2.5 2.5-7.5 7.5H3.5V10L11 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>);
const IconChevronDown = ({ className = "" }: { className?: string }) => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IconPlus = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>);
const IconChat = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 9.33C12 9.97 11.47 10.5 10.83 10.5H3.5L2 12V2.67C2 2.03 2.53 1.5 3.17 1.5H10.83C11.47 1.5 12 2.03 12 2.67V9.33Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>);

function SeverityBadge({ severity }: { severity: string }) {
  const isCritical = severity === 'critical';
  return (
    <span className="shrink-0 mr-[9px] w-[16px] h-[16px] rounded-[3px] flex items-center justify-center text-[9px] font-bold"
      style={{
        backgroundColor: isCritical ? 'rgba(224,82,82,0.15)' : 'rgba(212,168,67,0.15)',
        color: isCritical ? '#E05252' : '#D4A843',
        border: `1px solid ${isCritical ? 'rgba(224,82,82,0.3)' : 'rgba(212,168,67,0.3)'}`,
      }}>
      {isCritical ? 'C' : 'H'}
    </span>
  );
}

function SectionLabel({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-1 px-[6px] py-[4px] w-full text-left rounded-[5px] group hover:bg-white/[0.04] transition-colors">
      <IconChevronDown className={`transition-transform duration-150 ${open ? '' : '-rotate-90'} text-[#555B65] group-hover:text-[#8A8F9A]`} />
      <span className="text-[12px] font-medium text-[#555B65] group-hover:text-[#8A8F9A] transition-colors tracking-[0.01em]">{label}</span>
    </button>
  );
}

function NavItem({ icon, label, badge, active, onClick }: { icon?: React.ReactNode; label: string; badge?: string | number; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center w-full text-left px-[10px] py-[5px] rounded-[6px] transition-colors duration-100 ${active ? 'bg-white/[0.08] text-[#E8E9EB]' : 'text-[#8A8F9A] hover:bg-white/[0.04] hover:text-[#C8CDD6]'}`}>
      {icon && <span className="mr-[10px] shrink-0 flex items-center">{icon}</span>}
      <span className="text-[13px] font-[450] leading-[1.2] tracking-[0.01em] truncate flex-1">{label}</span>
      {badge !== undefined && <span className="ml-auto text-[12px] text-[#555B65] tabular-nums">{badge}</span>}
    </button>
  );
}

function TeamSection({
  label, color, initial, active, onClick, setActiveMainTab, activeMainTab, onSelectIncident
}: {
  label: string; color: string; initial: string; active?: boolean; onClick?: () => void;
  setActiveMainTab: (tab: MainTab) => void; activeMainTab: MainTab; onSelectIncident: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Helper to handle sub-navigation clicks
  const handleSubNavigate = (tab: MainTab) => {
    onClick?.(); // Sets the environment context
    setActiveMainTab(tab);
    // If navigating to issues, we want to see the list first
    if (tab === 'issues') {
      onSelectIncident?.('');
    }
  };

  return (
    <div className="mt-[2px]">
      <button
        onClick={(e) => {
          setOpen(v => !v);
          onClick?.();
        }}
        className={`flex items-center gap-[8px] w-full px-[10px] py-[5px] rounded-[6px] transition-colors ${active && activeMainTab === 'env' ? 'bg-white/[0.08] text-[#E8E9EB]' : 'text-[#C8CDD6] hover:bg-white/[0.04]'}`}
      >
        <span className="w-[18px] h-[18px] rounded-[4px] text-white flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ backgroundColor: color }}>{initial}</span>
        <span className="text-[13px] font-[500] tracking-[-0.01em] flex-1 text-left">{label}</span>
        <IconChevronDown className={`text-[#555B65] transition-transform duration-150 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="mt-[1px] space-y-[1px]">
          <NavItem
            icon={<IconIssue />}
            label="Issues"
            onClick={() => handleSubNavigate('issues')}
            active={active && activeMainTab === 'issues'}
          />
          <div className="relative pl-[38px] space-y-[1px]">
            <div className="absolute left-[26px] top-0 bottom-0 w-px bg-[#202328]" />
            <button
              onClick={() => handleSubNavigate('issues')}
              className={`flex items-center w-full text-left px-2 py-[5px] rounded-[6px] transition-colors ${active && activeMainTab === 'issues' ? 'text-[#C8CDD6] bg-white/[0.04]' : 'text-[#8A8F9A] hover:bg-white/[0.04] hover:text-[#C8CDD6]'}`}
            >
              <span className="text-[13px] font-[450] tracking-[0.01em]">Active</span>
            </button>
            <button
              onClick={() => handleSubNavigate('issues')}
              className="flex items-center w-full text-left px-2 py-[5px] rounded-[6px] text-[#8A8F9A] hover:bg-white/[0.04] hover:text-[#C8CDD6] transition-colors"
            >
              <span className="text-[13px] font-[450] tracking-[0.01em]">Backlog</span>
            </button>
          </div>
          <NavItem
            icon={<IconGrid />}
            label="Projects"
            onClick={() => handleSubNavigate('health')}
            active={active && activeMainTab === 'health'}
          />
          <NavItem
            icon={<IconLayers />}
            label="Views"
            onClick={() => handleSubNavigate('slo')}
            active={active && activeMainTab === 'slo'}
          />
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Sidebar({
  activeMainTab, setActiveMainTab, selectedIncident, onSelectIncident, onNewChat, chatSessions, selectedEnv, onSelectEnv, selectedIntegration, onSelectIntegration, onOpenSearch, onDeleteChat
}: SidebarProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [triageOpen, setTriageOpen] = useState(true);
  const [sreOpen, setSreOpen] = useState(true);
  const [tryOpen, setTryOpen] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resolvedIncidents, setResolvedIncidents] = useState<{ id: string; name: string; service: string }[]>([]);
  const [liveChatSessions, setLiveChatSessions] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API_URL}/incidents`);
        if (res.ok) {
          const data = await res.json();
          setIncidents(data.incidents || []);
        }
      } catch (err) { }
    };
    const fetchResolved = async () => {
      try {
        const res = await fetch(`${API_URL}/incidents/resolved/list`);
        if (res.ok) {
          const data = await res.json();
          setResolvedIncidents(data.resolved || []);
        }
      } catch (err) { }
    };
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_URL}/chat/sessions`);
        if (res.ok) {
          const data = await res.json();
          const backendSessions = data.sessions || [];
          
          // Merge with local fallback sessions
          const localChats = JSON.parse(localStorage.getItem('axiom_chats') || '[]');
          const allSessions = [...backendSessions];
          
          localChats.forEach((sid: string) => {
            if (!allSessions.some(s => s.id === sid)) {
              allSessions.push({ id: sid, title: sid.startsWith('session_') ? `Chat: ${sid.slice(-4)}` : sid });
            }
          });
          
          setLiveChatSessions(allSessions);
        }
      } catch { 
        // Fallback to local only if backend fails
        const localChats = JSON.parse(localStorage.getItem('axiom_chats') || '[]');
        setLiveChatSessions(localChats.map((sid: string) => ({ id: sid, title: sid })));
      }
    };

    fetchIncidents();
    fetchResolved();
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [activeMainTab, API_URL]);

  return (
    <aside className="flex flex-col h-full shrink-0 select-none" style={{
      width: 240,
      backgroundColor: 'rgba(10, 11, 13, 0.65)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
    }}>

      {/* Header (Anchored) */}
      <div className="flex items-center px-3 pt-[14px] pb-[10px] shrink-0">
        <button className="flex items-center gap-[8px] flex-1 min-w-0 group rounded-[6px] px-[4px] py-[4px] hover:bg-white/[0.04] transition-colors">
          <div className="w-[18px] h-[18px] rounded-[4px] bg-[#5E6AD2] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">A</div>
          <span className="text-[13px] font-semibold text-[#E0E1E4] truncate tracking-[-0.01em]">AXIOM Workspace</span>
          <IconChevronDown className="shrink-0 text-[#555B65] group-hover:text-[#8A8F9A] transition-colors" />
        </button>
        <div className="flex items-center gap-[2px] ml-1 shrink-0">
          <button onClick={onOpenSearch} className="p-[6px] rounded-[6px] text-[#555B65] hover:text-[#C8CDD6] hover:bg-white/[0.04] transition-colors"><IconSearch /></button>
          <button className="p-[6px] rounded-[6px] text-[#555B65] hover:text-[#C8CDD6] hover:bg-white/[0.04] transition-colors"><IconCompose /></button>
        </div>
      </div>

      {/* Scrollable Navigation Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">


        {/* Inbox / My issues */}
        <div className="px-[6px] mt-[2px] space-y-[1px]">
          <NavItem
            icon={<IconInbox />}
            label="Alerts"
            badge={3}
            onClick={() => setActiveMainTab('alerts')}
            active={activeMainTab === 'alerts'}
          />
        </div>

        {/* Triage Dashboard */}
        <div className="mt-[18px] px-[6px]">
          <SectionLabel label="Triage Dashboard" open={triageOpen} onToggle={() => setTriageOpen(v => !v)} />
          {triageOpen && (
            <div className="mt-[6px] space-y-[14px]">
              {/* Active Section */}
              <div className="space-y-[1px]">
                <div className="flex items-center px-[10px] py-[5px] text-[#8A8F9A] pointer-events-none">
                  <span className="mr-[10px] shrink-0 flex items-center"><IconTarget /></span>
                  <span className="text-[13px] font-semibold tracking-[-0.01em] uppercase text-[10px]">Active Incidents</span>
                </div>
                <div className="space-y-[1px]">
                  {incidents.map(incident => {
                    const isSelected = activeMainTab === 'issues' && selectedIncident === incident.id;
                    return (
                      <NavItem
                        key={incident.id}
                        icon={<SeverityBadge severity={incident.severity} />}
                        label={incident.name}
                        active={isSelected}
                        onClick={() => { setActiveMainTab('issues'); onSelectIncident(incident.id); }}
                      />
                    );
                  })}

                </div>
              </div>

              {/* Past Section */}
              <div className="space-y-[1px]">
                <div className="flex items-center px-[10px] py-[5px] text-[#8A8F9A] pointer-events-none">
                  <span className="mr-[10px] shrink-0 flex items-center"><IconCycles /></span>
                  <span className="text-[13px] font-semibold tracking-[-0.01em] uppercase text-[10px]">Past Incidents</span>
                </div>
                <div className="space-y-[1px] opacity-60">
                  {resolvedIncidents.length === 0 ? (
                    <div className="px-[10px] py-[5px] text-[11px]" style={{ color: '#454A54' }}>No resolved incidents yet</div>
                  ) : (
                    resolvedIncidents.slice(0, 5).map(r => (
                      <NavItem key={r.id} icon={<IconIssue />} label={`Post-Mortem: ${r.name}`} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SRE Copilot */}
        <div className="mt-[18px] px-[6px]">
          <SectionLabel label="SRE Copilot" open={sreOpen} onToggle={() => setSreOpen(v => !v)} />
          {sreOpen && (
            <div className="mt-[4px] space-y-[1px]">
              {/* New Chat — resets the panel */}
              <button
                onClick={() => { setActiveMainTab('chats'); onNewChat(); }}
                className={`flex items-center w-full text-left px-[10px] py-[5px] rounded-[6px] transition-colors ${activeMainTab === 'chats' && !selectedIncident ? 'bg-white/[0.08] text-[#E8E9EB]' : 'text-[#8A8F9A] hover:bg-white/[0.04] hover:text-[#C8CDD6]'}`}
              >
                <span className="mr-[10px] shrink-0 flex items-center"><IconPlus /></span>
                <span className="text-[13px] font-[450] tracking-[0.01em]">New Chat</span>
              </button>

              {/* One entry per incident that has chat history */}
              {liveChatSessions.map(session => (
                <div key={session.id} className="group relative">
                  <button
                    onClick={() => { setActiveMainTab('chats'); onSelectIncident(session.id); }}
                    className={`flex items-center w-full text-left px-[10px] py-[5px] pr-[30px] rounded-[6px] transition-colors duration-100
                    ${activeMainTab === 'chats' && selectedIncident === session.id ? 'bg-white/[0.08] text-[#E8E9EB]' : 'text-[#8A8F9A] hover:bg-white/[0.04] hover:text-[#C8CDD6]'}`}
                  >
                    <span className="mr-[10px] shrink-0 flex items-center"><IconChat /></span>
                    <span className="text-[13px] font-[450] tracking-[0.01em] truncate">
                      {session.title}
                    </span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(onDeleteChat) onDeleteChat(session.id); }}
                    className="absolute right-[8px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Infrastructure */}
        <div className="mt-[18px] px-[6px]">
          <SectionLabel label="Infrastructure" open={workspaceOpen} onToggle={() => setWorkspaceOpen(v => !v)} />
          {workspaceOpen && (
            <div className="mt-[2px] space-y-[1px]">
              <NavItem
                icon={<IconLayers />}
                label="Service Health"
                onClick={() => setActiveMainTab('health')}
                active={activeMainTab === 'health'}
              />
              <NavItem
                icon={<IconMap />}
                label="SLO Tracking"
                onClick={() => setActiveMainTab('slo')}
                active={activeMainTab === 'slo'}
              />
              <NavItem
                icon={<IconTeam />}
                label="On-call Rotation"
                onClick={() => setActiveMainTab('oncall')}
                active={activeMainTab === 'oncall'}
              />
            </div>
          )}
        </div>

        {/* Critical Services */}
        <div className="mt-[18px] px-[6px]">
          <SectionLabel label="Critical Services" open={favoritesOpen} onToggle={() => setFavoritesOpen(v => !v)} />
          {favoritesOpen && (
            <div className="mt-[2px] space-y-[1px]">
              <NavItem
                icon={<IconGrid />}
                label="payment-service"
                onClick={() => { onSelectIncident('payment-service'); setActiveMainTab('service-dashboard'); }}
                active={selectedIncident === 'payment-service' && activeMainTab === 'service-dashboard'}
              />
              <NavItem
                icon={<IconGrid />}
                label="api-gateway"
                onClick={() => { onSelectIncident('api-gateway'); setActiveMainTab('service-dashboard'); }}
                active={selectedIncident === 'api-gateway' && activeMainTab === 'service-dashboard'}
              />
              <NavItem icon={<IconGrid />} label="db-cluster-01" />
            </div>
          )}
        </div>

        {/* Environments */}
        <div className="mt-[18px] px-[6px]">
          <SectionLabel label="Environments" open={teamsOpen} onToggle={() => setTeamsOpen(v => !v)} />
          {teamsOpen && (
            <div className="mt-[2px] space-y-[1px]">
              <TeamSection
                label="Production"
                color="#4F6BED"
                initial="P"
                active={selectedEnv === 'Production'}
                onClick={() => { onSelectEnv('Production'); setActiveMainTab('env'); }}
                setActiveMainTab={setActiveMainTab}
                activeMainTab={activeMainTab}
                onSelectIncident={onSelectIncident}
              />
              <TeamSection
                label="Staging"
                color="#BF5AF2"
                initial="S"
                active={selectedEnv === 'Staging'}
                onClick={() => { onSelectEnv('Staging'); setActiveMainTab('env'); }}
                setActiveMainTab={setActiveMainTab}
                activeMainTab={activeMainTab}
                onSelectIncident={onSelectIncident}
              />
              <TeamSection
                label="Dev / QA"
                color="#34A853"
                initial="D"
                active={selectedEnv === 'Dev / QA'}
                onClick={() => { onSelectEnv('Dev / QA'); setActiveMainTab('env'); }}
                setActiveMainTab={setActiveMainTab}
                activeMainTab={activeMainTab}
                onSelectIncident={onSelectIncident}
              />
            </div>
          )}
        </div>

        {/* Integrations */}
        <div className="mt-[18px] px-[6px]">
          <SectionLabel label="Integrations" open={tryOpen} onToggle={() => setTryOpen(v => !v)} />
          {tryOpen && (
            <div className="mt-[2px] space-y-[1px]">
              <NavItem
                icon={<IconPlus />}
                label="Connect Logs"
                onClick={() => { onSelectIntegration('logs'); setActiveMainTab('integrations'); }}
                active={activeMainTab === 'integrations' && selectedIntegration === 'logs'}
              />
              <NavItem
                icon={<IconCycles />}
                label="Connect Cloud"
                onClick={() => { onSelectIntegration('cloud'); setActiveMainTab('integrations'); }}
                active={activeMainTab === 'integrations' && selectedIntegration === 'cloud'}
              />
              <NavItem
                icon={<IconGitHub />}
                label="Link GitHub"
                onClick={() => { onSelectIntegration('github'); setActiveMainTab('integrations'); }}
                active={activeMainTab === 'integrations' && selectedIntegration === 'github'}
              />
            </div>
          )}
        </div>

        <div className="pb-4" />
        {/* Bottom actions */}
        <div className="mt-auto px-[6px] pb-4 space-y-[2px]">
          <NavItem
            icon={<IconPlus />}
            label="Back to Landing"
            onClick={() => { localStorage.removeItem('axiom_entered'); window.location.reload(); }}
          />
        </div>
      </div>
    </aside>
  );
}