"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { AgentEvent, AgentStatus } from "../hooks/useAgentStream";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function persistMessage(sessionId: string, role: string, content: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ session_id: sessionId, role, content }),
    });
  } catch { }
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  eventType?: string; // For agent events: hypothesis, action, result, resolved
  confidence?: number;
}

interface ChatPanelProps {
  incidentId: string | null;
  activeMainTab: string;
  onNewChat: () => void;
  onStartTriage: (id: string) => void;
  agentEvents: AgentEvent[];
  agentStatus: AgentStatus;
  onChatStarted?: (id: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif';

// ── Incident metadata ──────────────────────────────────────────────────────────

const INCIDENT_META: Record<string, {
  name: string;
  service: string;
  branch: string;
  suggestions: string[];
}> = {
  db_cascade: {
    name: "Cascading DB Failure",
    service: "payment-service",
    branch: "fix/db-pool",
    suggestions: [
      "What's the root cause of this incident?",
      "What's the current error rate?",
      "Show me the latency trends",
    ],
  },
  memory_leak: {
    name: "Memory Leak",
    service: "image-processor",
    branch: "main",
    suggestions: [
      "What's the current memory usage?",
      "Why is the RSS growing?",
      "Start triage on image-processor",
    ],
  },
  exception_loop: {
    name: "Exception Loop",
    service: "api-gateway",
    branch: "hotfix/key-error",
    suggestions: [
      "What's causing the crash loop?",
      "What's the current error rate?",
      "Investigate the gateway exception",
    ],
  },
};

const DEFAULT_META = {
  name: "Incident",
  service: "unknown",
  branch: "main",
  suggestions: [
    "What's the root cause?",
    "Show me current metrics",
    "Start triage on this service",
  ],
};

// ── Trigger detection (client-side) ────────────────────────────────────────────

const TRIGGER_VERBS = ["triage", "start", "fix", "investigate", "run", "diagnose", "debug"];
const INCIDENT_KEYWORDS: Record<string, string> = {
  "payment": "db_cascade",
  "db": "db_cascade",
  "cascade": "db_cascade",
  "memory": "memory_leak",
  "leak": "memory_leak",
  "image": "memory_leak",
  "oom": "memory_leak",
  "gateway": "exception_loop",
  "exception": "exception_loop",
  "keyerror": "exception_loop",
  "crash": "exception_loop",
};

function detectTrigger(text: string): string | null {
  const lower = text.toLowerCase();
  const hasVerb = TRIGGER_VERBS.some(v => lower.includes(v));
  if (!hasVerb) return null;
  for (const [keyword, incidentId] of Object.entries(INCIDENT_KEYWORDS)) {
    if (lower.includes(keyword)) return incidentId;
  }
  return null;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const IcoPlus = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IcoSend = ({ active }: { active: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth={active ? "1.8" : "1.5"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoLoop = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 8C13.5 11.04 11.04 13.5 8 13.5C4.96 13.5 2.5 11.04 2.5 8C2.5 4.96 4.96 2.5 8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 5V2.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoDoc = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const IcoBranch = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7 4h7M5 6v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IcoGlobe = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2L2 5v6l6 3 6-3V5L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoLayers = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M2 11l6 3 6-3M2 8l6 3 6-3M2 5l6-3 6 3-6 3-6-3Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoChevron = () => (
  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IcoChevronDown = () => (
  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ── Agent Event Bubble ─────────────────────────────────────────────────────────

function AgentEventBubble({
  event,
  onApprove
}: {
  event: AgentEvent;
  onApprove?: (approved: boolean) => void
}) {
  const styles: Record<string, { bg: string; border: string; color: string; label: string; icon?: React.ReactNode }> = {
    hypothesis: { bg: 'rgba(217,180,70,0.08)', border: 'rgba(217,180,70,0.2)', color: '#D9B446', label: 'REASONING' },
    action: { bg: 'rgba(94,106,210,0.08)', border: 'rgba(94,106,210,0.2)', color: '#5E6AD2', label: 'ACTION' },
    result: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', color: '#8A8F9A', label: 'RESULT' },
    verify: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', color: '#8A8F9A', label: 'VERIFY' },
    resolved: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', color: '#22C55E', label: 'RESOLVED' },
    replan: { bg: 'rgba(217,180,70,0.05)', border: 'rgba(217,180,70,0.15)', color: '#D9B446', label: 'REPLAN' },
    error: { bg: 'rgba(224,82,82,0.08)', border: 'rgba(224,82,82,0.2)', color: '#E05252', label: 'ERROR' },
    approval_required: { bg: 'rgba(224,82,82,0.12)', border: 'rgba(224,82,82,0.3)', color: '#E05252', label: 'AWAITING APPROVAL' },
  };

  const [expanded, setExpanded] = useState(false);
  const style = styles[event.type] || styles.result;
  const isApproval = event.type === 'approval_required';

  if (event.type === 'hypothesis' && event.metadata.streaming && !event.metadata.complete) return null;

  const content = event.type === 'hypothesis' && event.metadata.complete
    ? event.metadata.parsed?.hypothesis as string || event.content
    : event.content;

  if (!content) return null;

  // For tool actions/results, show a compact "Antigravity" style bar
  const isToolEvent = ['action', 'result', 'verify', 'replan'].includes(event.type);

  if (isToolEvent && !expanded) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-1.5 rounded-md border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors mb-2"
        onClick={() => setExpanded(true)}
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          <IcoChevron />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-40">{style.label}</span>
        <span className="text-[12px] text-white/60 truncate font-mono">{content.slice(0, 60)}{content.length > 60 ? '...' : ''}</span>
      </div>
    );
  }

  return (
    <div className={`mb-3 ${event.type === 'resolved' ? 'w-full' : 'max-w-[90%]'}`}>
      <div
        className={`rounded-[10px] px-4 py-3 ${event.type === 'resolved' ? 'border-2' : 'border'}`}
        style={{ backgroundColor: style.bg, borderColor: style.border }}
        onClick={() => isToolEvent && setExpanded(false)}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: style.color }}>{style.label}</span>
          {event.type === 'hypothesis' && event.metadata.confidence && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5" style={{ color: style.color }}>
              {Math.round((event.metadata.confidence as number) * 100)}% conf.
            </span>
          )}
          <span className="text-[9px] text-white/15 ml-auto">Step {event.step}</span>
        </div>

        <p className={`text-[13px] leading-relaxed break-words ${['action', 'result'].includes(event.type) ? 'font-mono text-[12px] whitespace-pre-wrap' : ''}`}
          style={{ color: style.color === '#8A8F9A' ? '#C8CDD6' : style.color }}>
          {content}
        </p>

        {isApproval && onApprove && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(true); }}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold py-1.5 rounded transition-colors uppercase tracking-wider"
            >
              Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(false); }}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold py-1.5 rounded transition-colors uppercase tracking-wider"
            >
              Deny
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Input Box Component ────────────────────────────────────────────────────────

function InputBox({
  value, onChange, onSend, isLoading, incidentId, placeholder,
  activeIncidents, onSelectIncident, onRunTriage, isTriageRunning, meta, setSessions, activeSession, isInitial
}: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  isLoading: boolean; incidentId: string; placeholder: string;
  activeIncidents: { id: string; name: string; service: string }[];
  onSelectIncident: (id: string) => void;
  onRunTriage: () => void;
  isTriageRunning: boolean;
  meta: any;
  setSessions: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  activeSession: string | null;
  isInitial: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showIncidentPicker, setShowIncidentPicker] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showAtMenu, setShowAtMenu] = useState(false);
  const canSend = value.trim().length > 0 && !isLoading;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
        setShowIncidentPicker(false);
        setShowAtMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    if (e.key === "Escape") { setShowIncidentPicker(false); setShowPlusMenu(false); setShowAtMenu(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const currentName = activeIncidents.find(i => i.id === incidentId)?.name
    || (incidentId && INCIDENT_META[incidentId] ? INCIDENT_META[incidentId].name : incidentId?.startsWith('session_') ? 'New Chat' : (incidentId ? incidentId.replace(/_/g, ' ') : 'New Chat'));

  return (
    <motion.div
      ref={containerRef}
      layout
      initial={false}
      animate={{
        height: isInitial ? 'auto' : 'auto',
        borderRadius: isInitial ? 12 : 10
      }}
      className="w-full overflow-visible relative transition-all duration-300"
      style={{ backgroundColor: '#1C1D20', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => {
          handleChange(e);
          if (e.target.value.endsWith('@')) {
            setShowAtMenu(true);
            setShowPlusMenu(false);
          } else if (!e.target.value.includes('@')) {
            setShowAtMenu(false);
          }
        }}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={`w-full resize-none bg-transparent outline-none px-4 leading-[1.5] transition-all duration-300 ${isInitial ? 'pt-[14px] pb-2' : 'pt-[10px] pb-1'}`}
        style={{ fontSize: 14, color: '#E8E9EB', fontFamily: FONT }}
      />

      {showAtMenu && (
        <div className="absolute bottom-[100%] left-4 mb-2 w-64 rounded-xl py-2 z-[100] shadow-2xl border border-white/10" style={{ backgroundColor: '#1C1D20' }}>
          <div className="px-3 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest">Tag Incident</div>
          {activeIncidents.map(inc => (
            <button key={inc.id}
              onClick={() => {
                const newValue = value.slice(0, -1) + '@' + inc.id + ' ';
                onChange(newValue);
                setShowAtMenu(false);
                textareaRef.current?.focus();
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex flex-col"
            >
              <span className="text-[13px] font-medium text-white/80">{inc.name}</span>
              <span className="text-[11px] text-white/30">{inc.service}</span>
            </button>
          ))}
          {activeIncidents.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-white/40 italic">No active incidents to tag</div>
          )}
        </div>
      )}

      <div className={`flex items-center justify-between px-3 transition-all duration-300 ${isInitial ? 'pb-[10px] pt-[4px]' : 'pb-[6px] pt-[2px]'}`}>
        <div className="relative">
          <button
            onClick={() => { setShowPlusMenu(v => !v); setShowIncidentPicker(false); setShowAtMenu(false); }}
            className="w-[26px] h-[26px] flex items-center justify-center rounded-[6px] transition-colors"
            style={{ color: showPlusMenu ? '#C8CDD6' : '#555B65', backgroundColor: showPlusMenu ? 'rgba(255,255,255,0.08)' : 'transparent' }}
          >
            <IcoPlus />
          </button>
          {showPlusMenu && (
            <div className="absolute bottom-[32px] left-0 w-52 rounded-[8px] py-1 z-50 shadow-2xl"
              style={{ backgroundColor: '#1C1D20', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => { setShowPlusMenu(false); setShowAtMenu(true); }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-white/5 transition-colors flex items-center gap-2" style={{ color: '#8A8F9A', fontFamily: FONT }}>
                <IcoGlobe size={14} /> Tag Incident (@)
              </button>
              <button onClick={() => setShowPlusMenu(false)}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-white/5 transition-colors flex items-center gap-2" style={{ color: '#8A8F9A', fontFamily: FONT }}>
                <IcoLayers size={14} /> Search Knowledge (RAG)
              </button>
              <button onClick={() => setShowPlusMenu(false)}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-white/5 transition-colors flex items-center gap-2" style={{ color: '#8A8F9A', fontFamily: FONT }}>
                <IcoDoc size={14} /> Attach Logs / Artifacts
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button onClick={() => { setShowPlusMenu(false); if (activeSession) setSessions(prev => ({ ...prev, [activeSession]: [] })); }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-white/5 transition-colors" style={{ color: '#8A8F9A', fontFamily: FONT }}>
                Clear Chat History
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onSend}
          disabled={!canSend}
          className="w-[30px] h-[30px] flex items-center justify-center rounded-[8px] transition-all"
          style={{
            backgroundColor: canSend ? '#E8E9EB' : 'rgba(255,255,255,0.08)',
            color: canSend ? '#0A0B0D' : '#454A54',
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          <IcoSend active={canSend} />
        </button>
      </div>

      <div className={`flex items-center gap-[6px] px-3 transition-all duration-300 ${isInitial ? 'pb-[10px] pt-[10px]' : 'pb-[6px] pt-[6px]'} border-t border-white/5`}>
        <div className="relative">
          <button
            onClick={() => { setShowIncidentPicker(v => !v); setShowPlusMenu(false); setShowAtMenu(false); }}
            className="flex items-center gap-[5px] px-[7px] h-[22px] rounded-[5px] transition-colors max-w-[160px]"
            style={{ backgroundColor: incidentId ? 'rgba(94,106,210,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${incidentId ? 'rgba(94,106,210,0.3)' : 'rgba(255,255,255,0.07)'}`, fontSize: 11, color: incidentId ? '#8A9BF0' : '#555B65', fontFamily: FONT }}
          >
            <IcoDoc />
            <span className="truncate">{currentName}</span>
            <IcoChevronDown />
          </button>
          {showIncidentPicker && (
            <div className="absolute bottom-[28px] left-0 w-52 rounded-[8px] py-1 z-50 shadow-2xl"
              style={{ backgroundColor: '#1C1D20', border: '1px solid rgba(255,255,255,0.1)' }}>
              {activeIncidents.length === 0 && (
                <div className="px-3 py-2 text-[11px]" style={{ color: '#555B65' }}>No active incidents</div>
              )}
              {activeIncidents.map(inc => (
                <button key={inc.id}
                  onClick={() => { onSelectIncident(inc.id); setShowIncidentPicker(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                  style={{ fontFamily: FONT }}>
                  <div className="text-[12px] font-medium" style={{ color: inc.id === incidentId ? '#8A9BF0' : '#C8CDD6' }}>{inc.name}</div>
                  <div className="text-[10px]" style={{ color: '#555B65' }}>{inc.service}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onRunTriage}
          disabled={!incidentId || isTriageRunning || !activeIncidents.some(i => i.id === incidentId)}
          className="flex items-center gap-[5px] px-[7px] h-[22px] rounded-[5px] transition-all"
          style={{
            backgroundColor: isTriageRunning ? 'rgba(94,106,210,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isTriageRunning ? 'rgba(94,106,210,0.3)' : 'rgba(255,255,255,0.07)'}`,
            fontSize: 11,
            color: !incidentId || !activeIncidents.some(i => i.id === incidentId) ? '#333' : isTriageRunning ? '#5E6AD2' : '#555B65',
            fontFamily: FONT,
            cursor: !incidentId || isTriageRunning || !activeIncidents.some(i => i.id === incidentId) ? 'not-allowed' : 'pointer',
          }}
        >
          {isTriageRunning ? (
            <><svg className="animate-spin w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" /><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" /></svg>Running Triage...</>
          ) : (
            <><IcoLoop />Run Triage</>
          )}
        </button>

        <div className="flex items-center gap-[5px] px-[7px] h-[22px] rounded-[5px] border border-white/5 bg-white/0 opacity-40 cursor-default" style={{ fontSize: 11, color: '#555B65', fontFamily: FONT }}>
          <IcoGlobe size={10} /> Work locally
        </div>
        <div className="flex items-center gap-[5px] px-[7px] h-[22px] rounded-[5px] border border-white/5 bg-white/0 opacity-40 cursor-default" style={{ fontSize: 11, color: '#555B65', fontFamily: FONT }}>
          <IcoBranch size={10} /> {meta.branch}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ChatPanel({ 
  incidentId, activeMainTab, onNewChat, onStartTriage, agentEvents, agentStatus, onChatStarted 
}: ChatPanelProps) {
  const [sessions, setSessions] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(incidentId || null);
  const [lastEventCount, setLastEventCount] = useState(0);
  const [activeIncidents, setActiveIncidents] = useState<{ id: string; name: string; service: string }[]>([]);
  const [isTriageRunning, setIsTriageRunning] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchIncidents = useCallback(() => {
    fetch(`${API_URL}/incidents`)
      .then(r => r.json())
      .then(d => {
        const incs = d.incidents || [];
        setActiveIncidents(incs);
        if (!incidentId && !activeSession && incs.length > 0) {
          setActiveSession(incs[0].id);
        }
      })
      .catch(() => { });
  }, [incidentId, activeSession]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  useEffect(() => {
    if (incidentId) setActiveSession(incidentId);
  }, [incidentId]);

  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!activeSession) return;
    
    // 1. Check local storage first for instant load
    const localData = JSON.parse(localStorage.getItem(`axiom_history_${activeSession}`) || '[]');
    if (localData.length > 0 && (!sessions[activeSession] || sessions[activeSession].length === 0)) {
      setSessions(prev => ({ ...prev, [activeSession]: localData }));
    }

    // 2. Then sync with backend if needed
    if (sessions[activeSession] && sessions[activeSession].length > 0) return;

    setHistoryLoading(true);
    fetch(`${API_URL}/chat/${activeSession}/history`)
      .then(r => r.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          const remoteMsgs = data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: m.created_at
          }));
          setSessions(prev => ({ ...prev, [activeSession]: remoteMsgs }));
          // Merge into local storage to keep them in sync
          localStorage.setItem(`axiom_history_${activeSession}`, JSON.stringify(remoteMsgs));
        }
      })
      .catch(() => { })
      .finally(() => setHistoryLoading(false));
  }, [activeSession]);

  const messages: Message[] = activeSession ? (sessions[activeSession] ?? []) : [];
  const meta = activeSession ? (INCIDENT_META[activeSession] || DEFAULT_META) : DEFAULT_META;
  const isInitial = !historyLoading && messages.length === 0;

  const pushMessage = useCallback((sessionId: string, msg: Message) => {
    setSessions(prev => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), msg],
    }));
    // Also save to local storage for demo persistence
    const local = JSON.parse(localStorage.getItem(`axiom_history_${sessionId}`) || '[]');
    localStorage.setItem(`axiom_history_${sessionId}`, JSON.stringify([...local, { ...msg, timestamp: new Date().toISOString() }]));
  }, []);

  const handleApprove = useCallback(async (sessionId: string, approved: boolean) => {
    try {
      await fetch(`${API_URL}/api/v1/incidents/${sessionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      pushMessage(sessionId, { role: 'system', content: `Decision: ${approved ? 'APPROVED' : 'DENIED'}`, eventType: 'result' });
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  }, [pushMessage]);

  const handleRunTriage = useCallback(async () => {
    const sessionId = activeSession || incidentId || 'general';
    if (!sessionId || sessionId === 'general') return;
    if (isTriageRunning) return;

    setIsTriageRunning(true);
    if (!activeSession) setActiveSession(sessionId);

    pushMessage(sessionId, { role: 'system', content: `🤖 Starting autonomous triage on **${sessionId}**...`, eventType: 'action' });

    try {
      const res = await fetch(`${API_URL}/run/${sessionId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr) continue;
          try {
            const ev = JSON.parse(dataStr);
            if (!ev.type || !ev.content) continue;
            if (ev.type === 'hypothesis' && ev.metadata?.streaming && !ev.metadata?.complete) continue;
            const content = ev.type === 'hypothesis' && ev.metadata?.complete
              ? (ev.metadata?.parsed?.hypothesis || ev.content)
              : ev.content;
            if (!content) continue;
            pushMessage(sessionId, { role: 'system', content, eventType: ev.type, confidence: ev.metadata?.confidence });
            if (ev.type === 'resolved') {
              // Mark incident resolved on backend
              fetch(`${API_URL}/incidents/${sessionId}/resolve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary: content }),
              }).catch(() => { });
            }
          } catch { }
        }
      }
    } catch (err) {
      pushMessage(sessionId, { role: 'assistant', content: `⚠️ Could not start triage: ${String(err)}` });
    } finally {
      setIsTriageRunning(false);
    }
  }, [activeSession, incidentId, isTriageRunning, pushMessage]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    const sessionId = activeSession || incidentId || "general";
    if (!activeSession) setActiveSession(sessionId);

    const userMsg: Message = { role: "user", content: text };
    pushMessage(sessionId, userMsg);
    persistMessage(sessionId, 'user', text);
    setInput("");

    // Notify sidebar and session list
    if (onChatStarted) onChatStarted(sessionId);
    const stored = JSON.parse(localStorage.getItem('axiom_chats') || '[]');
    if (!stored.includes(sessionId)) {
      localStorage.setItem('axiom_chats', JSON.stringify([...stored, sessionId]));
    }

    // 1. Check for agent trigger commands (client-side fast path)
    const triggered = detectTrigger(text);
    if (triggered && onStartTriage) {
      const service = INCIDENT_META[triggered]?.service || triggered;
      pushMessage(sessionId, {
        role: "system",
        content: `Starting triage on ${service}...`,
        eventType: "action",
      });
      onStartTriage(triggered);
      return;
    }

    // 2. Send to backend for log-aware Q&A
    setIsLoading(true);
    try {
      const history = sessions[sessionId] ?? [];
      const chatMessages = [...history.filter(m => m.role !== 'system'), userMsg].map(m => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_URL}/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, session_id: sessionId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Try to read as stream first (SSE from Groq/LLM)
      const reader = res.body?.getReader();
      if (reader) {
        // Add placeholder assistant message
        setSessions(prev => ({
          ...prev,
          [sessionId]: [...(prev[sessionId] ?? []), { role: 'assistant' as const, content: '' }],
        }));

        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';
        let isJson = false;
        let rawBody = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          rawBody += chunk;
          buffer += chunk;

          // Check if this is a JSON response (trigger detection)
          if (rawBody.length < 10 && rawBody.trimStart().startsWith('{')) {
            isJson = true;
            continue;
          }

          if (isJson) continue;

          // Parse SSE events from buffer
          const parts = buffer.split('\n');
          buffer = parts.pop() || '';

          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr) continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'token' && data.content) {
                  fullResponse += data.content;
                  setSessions(prev => {
                    const msgs = [...(prev[sessionId] ?? [])];
                    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
                      msgs[msgs.length - 1] = { role: 'assistant', content: fullResponse };
                    }
                    return { ...prev, [sessionId]: msgs };
                  });
                }
              } catch { }
            }
          }
        }

        // Save the finished assistant message to local storage
        if (fullResponse) {
          const local = JSON.parse(localStorage.getItem(`axiom_history_${sessionId}`) || '[]');
          localStorage.setItem(`axiom_history_${sessionId}`, JSON.stringify([...local, { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() }]));
        }

        // If it was JSON, parse the full body
        if (isJson) {
          try {
            const data = JSON.parse(rawBody);
            // Remove the placeholder
            setSessions(prev => {
              const msgs = [...(prev[sessionId] ?? [])];
              if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant' && msgs[msgs.length - 1].content === '') {
                msgs.pop();
              }
              return { ...prev, [sessionId]: msgs };
            });

            if (data.type === 'trigger' && onStartTriage) {
              pushMessage(sessionId, {
                role: "system",
                content: data.message || `Starting triage on ${data.service}...`,
                eventType: "action",
              });
              onStartTriage(data.incident_id);
            } else if (data.reply) {
              pushMessage(sessionId, { role: "assistant", content: data.reply });
              persistMessage(sessionId, 'assistant', data.reply);
            }
          } catch { }
        }

        // If we got no content at all from SSE, use the raw body as fallback
        if (!isJson && fullResponse.length === 0 && rawBody.trim().length > 0) {
          pushMessage(sessionId, { role: "assistant", content: rawBody.trim() });
          persistMessage(sessionId, 'assistant', rawBody.trim());
        }
      }
    } catch (err) {
      pushMessage(sessionId, {
        role: "assistant",
        content: `⚠️ Could not reach the AXIOM backend at \`${API_URL}\`. Make sure the FastAPI server is running.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, activeSession, incidentId, sessions, pushMessage, onStartTriage]);


  const handleNewChat = () => {
    setActiveSession(null);
    setInput("");
    setIsLoading(false);
    setLastEventCount(0);
    onNewChat();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0A0B0D', fontFamily: FONT }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-[10px] shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          {agentStatus === 'running' && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#5E6AD2]/10 border border-[#5E6AD2]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] animate-pulse" />
              <span className="text-[10px] font-bold text-[#5E6AD2] uppercase tracking-widest">Agent Running</span>
            </div>
          )}
        </div>
        <button
          onClick={handleNewChat}
          className="justify-center items-center flex gap-[5px] px-[8px] py-[4px] rounded-[6px] transition-colors"
          style={{ fontSize: 12, color: '#555B65', fontFamily: FONT }}
          onMouseEnter={e => { e.currentTarget.style.color = '#C8CDD6'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#555B65'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <IcoPlus /> New chat
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6">

        {isInitial ? (
          <div className="w-full max-w-[620px] flex flex-col items-center">
            <h2 style={{ fontSize: 26, fontWeight: 600, color: '#E8E9EB', letterSpacing: '-0.03em', marginBottom: 28, textAlign: 'center' }}>
              {activeSession
                ? `What should we check for ${meta.name}?`
                : 'What should we investigate?'}
            </h2>

            <div className="w-full mb-4">
              <InputBox
                value={input}
                onChange={setInput}
                onSend={() => handleSend()}
                isLoading={isLoading}
                incidentId={activeSession ?? incidentId ?? ''}
                placeholder="Ask about logs, metrics, or say 'run triage'..."
                activeIncidents={activeIncidents}
                onSelectIncident={id => setActiveSession(id)}
                onRunTriage={handleRunTriage}
                isTriageRunning={isTriageRunning}
                meta={meta}
                setSessions={setSessions}
                activeSession={activeSession}
                isInitial={isInitial}
              />
            </div>

            <div className="w-full flex flex-col">
              {meta.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="flex items-center gap-[10px] w-full px-4 py-[11px] text-left rounded-[6px] transition-colors"
                  style={{ color: '#8A8F9A', fontSize: 13, fontFamily: FONT }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{ color: '#454A54', flexShrink: 0 }}><IcoLoop /></span>
                  {s}
                </button>
              ))}
            </div>
          </div>

        ) : (
          <div className="w-full px-10 flex flex-col gap-6 py-10">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isSystem = msg.role === 'system';

              if (isSystem && msg.eventType) {
                return (
                  <div key={i} className="flex flex-col items-start pl-11">
                    <AgentEventBubble
                      event={{
                        type: msg.eventType as AgentEvent['type'],
                        step: 0,
                        content: msg.content,
                        metadata: { confidence: msg.confidence, complete: true },
                      }}
                      onApprove={(approved) => handleApprove(activeSession!, approved)}
                    />
                  </div>
                );
              }

              return (
                <div key={i} className={`flex w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isUser && (
                    <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 mr-3 bg-[#5E6AD2] text-white text-[11px] font-bold">A</div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-[14px] leading-[1.6] ${isUser ? 'bg-[#5E6AD2] text-white shadow-lg' : 'bg-white/[0.04] text-[#E8E9EB] border border-white/5'
                    }`}>
                    {msg.content.split(/(`[^`]+`)/g).map((chunk, j) =>
                      chunk.startsWith('`') && chunk.endsWith('`')
                        ? <code key={j} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[12px]">{chunk.slice(1, -1)}</code>
                        : <span key={j}>{chunk}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start items-center gap-3">
                <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#5E6AD2', fontSize: 11, color: '#fff', fontWeight: 700 }}>A</div>
                <div className="flex items-center gap-[10px] px-[16px] py-[10px] rounded-[14px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <svg className="animate-spin w-4 h-4 text-[#555B65]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
                  </svg>
                  <span style={{ fontSize: 13, color: '#555B65' }}>Querying logs for {meta.service}...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Persistent bottom input when in conversation */}
      {!isInitial && (
        <div className="px-6 pb-6 pt-2 flex justify-center shrink-0">
          <div className="w-full max-w-[1100px]">
            <InputBox
              value={input}
              onChange={setInput}
              onSend={() => handleSend()}
              isLoading={isLoading}
              incidentId={activeSession ?? incidentId ?? ''}
              placeholder="Ask about logs, metrics, or say 'run triage'..."
              activeIncidents={activeIncidents}
              onSelectIncident={id => setActiveSession(id)}
              onRunTriage={handleRunTriage}
              isTriageRunning={isTriageRunning}
              meta={meta}
              setSessions={setSessions}
              activeSession={activeSession}
              isInitial={isInitial}
            />
          </div>
        </div>
      )}
    </div>
  );
}