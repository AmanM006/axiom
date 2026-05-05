"use client";

import { useState, useEffect } from "react";
import { AgentStatus } from "../hooks/useAgentStream";

interface Incident {
  id: string;
  name: string;
  service: string;
  description: string;
  severity: string;
  key_metric: string;
}

interface Metrics {
  cpu_percent: number;
  memory_mb: number;
  error_rate: number;
  latency_ms: number;
  connections: number;
  status: string;
}

interface IncidentPanelProps {
  selectedIncident: string;
  onSelectIncident: (id: string) => void;
  onStartAgent: () => void;
  onOpenChat: () => void;
  agentStatus: AgentStatus;
  selectedEnv?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";


const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif';

// Local cache for incident data fetched from the API
let incidentCache: Record<string, Incident> | null = null;

const FALLBACK_INCIDENTS: Record<string, Incident> = {
  "db_cascade": { id: "db_cascade", name: "Cascading DB Failure", service: "payment-service", description: "Connection pool exhausted → cascading 503s", severity: "critical", key_metric: "$4,200/min" },
  "memory_leak": { id: "memory_leak", name: "Memory Leak", service: "image-processor", description: "RSS climbing unbounded toward OOM", severity: "high", key_metric: "$1,800/min" },
  "exception_loop": { id: "exception_loop", name: "Exception Loop", service: "api-gateway", description: "KeyError crash loop every ~30s", severity: "critical", key_metric: "$7,500/min" },
};

function MetricPill({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col items-end gap-[2px]">
      <span style={{ fontSize: 10, color: '#454A54', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: FONT }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontFamily: 'ui-monospace, "SF Mono", monospace', fontWeight: 500, color: alert ? '#E95460' : '#8A8F9A' }}>
        {value}
      </span>
    </div>
  );
}

export default function IncidentDetails({
  selectedIncident,
  onStartAgent,
  onOpenChat,
  agentStatus,
  selectedEnv = 'Production',
}: Omit<IncidentPanelProps, 'onSelectIncident'>) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [incidents, setIncidents] = useState<Record<string, Incident>>(incidentCache || FALLBACK_INCIDENTS);

  // Fetch incidents from API and cache
  useEffect(() => {
    if (incidentCache) return;
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API_URL}/incidents`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, Incident> = {};
          for (const inc of data.incidents) {
            map[inc.id] = inc;
          }
          incidentCache = map;
          setIncidents(map);
        }
      } catch {}
    };
    fetchIncidents();
  }, []);

  const incident = incidents[selectedIncident] || incidents["db_cascade"] || FALLBACK_INCIDENTS["db_cascade"];


  useEffect(() => {
    if (!incident) return;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/metrics/${incident.service}`);
        if (res.ok) setMetrics(await res.json());
      } catch { }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [incident]);

  const calculateCost = (incidentId: string, m: Metrics | null): string => {
    if (!m) return incidents[incidentId]?.key_metric || "$0/min";
    let base = 0, err = 0, lat = 0;
    if (incidentId === "db_cascade") { base = 500; err = m.error_rate * 55; lat = (m.latency_ms / 100) * 25; }
    else if (incidentId === "memory_leak") { base = 200; err = m.error_rate * 30; lat = (m.latency_ms / 100) * 15; }
    else if (incidentId === "exception_loop") { base = 1200; err = m.error_rate * 85; lat = (m.latency_ms / 100) * 40; }
    return `$${(base + err + lat).toLocaleString(undefined, { maximumFractionDigits: 0 })}/min`;
  };

  if (!incident) return null;

  return (
    <div
      className="flex items-center justify-between px-6 py-[14px] shrink-0 select-none"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(10,11,13,0.5)',
        fontFamily: FONT,
      }}
    >
      {/* Left: incident info */}
      <div className="flex flex-col gap-[4px]">
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center gap-2 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${selectedEnv === 'Production' ? 'bg-[#5E6AD2]' : 'bg-[#BF5AF2]'}`} />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{selectedEnv}</span>
          </div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div className={`w-[9px] h-[9px] rounded-full shrink-0 ${incident.severity === 'critical'
            ? 'bg-[#E05252] shadow-[0_0_6px_rgba(224,82,82,0.5)]'
            : 'bg-[#D4A843] shadow-[0_0_6px_rgba(212,168,67,0.4)]'
            }`} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#E8E9EB', letterSpacing: '-0.02em' }}>
            {incident.name}
          </span>
          <span
            className="px-[7px] py-[2px] rounded-[5px]"
            style={{
              fontSize: 11,
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              color: '#8A8F9A',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {incident.service}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#555B65', marginLeft: 19, letterSpacing: '0.01em' }}>
          {incident.description}
        </span>
      </div>

      {/* Center: metrics */}
      {metrics && (
        <div className="flex items-center gap-[24px]">
          <MetricPill label="CPU / Mem"
            value={`${metrics.cpu_percent?.toFixed(0)}%  ${metrics.memory_mb?.toFixed(0)}MB`}
            alert={(metrics.cpu_percent ?? 0) > 80 || (metrics.memory_mb ?? 0) > 3000}
          />
          <MetricPill label="Err / Lat"
            value={`${metrics.error_rate?.toFixed(1)}%  ${metrics.latency_ms?.toFixed(0)}ms`}
            alert={(metrics.error_rate ?? 0) > 5 || (metrics.latency_ms ?? 0) > 1000}
          />
          <div
            className="flex flex-col items-end gap-[2px] pl-[20px]"
            style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span style={{ fontSize: 10, color: '#454A54', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: FONT }}>
              Downtime Cost
            </span>
            <span style={{ fontSize: 14, fontFamily: 'ui-monospace, "SF Mono", monospace', fontWeight: 600, color: '#E05252' }}>
              {calculateCost(incident.id, metrics)}
            </span>
          </div>
        </div>
      )}

      {/* Right: CTA */}
      {agentStatus === "resolved" ? (
        <button
          onClick={onOpenChat}
          className="flex items-center gap-[6px] px-[16px] py-[7px] rounded-[7px] transition-all"
          style={{
            fontSize: 13, fontWeight: 500, fontFamily: FONT, letterSpacing: '-0.01em',
            backgroundColor: '#22C55E', color: '#fff', cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Summarize in Chat
        </button>
      ) : (
        <button
          onClick={onStartAgent}
          disabled={agentStatus === "running"}
          className="flex items-center gap-[6px] px-[16px] py-[7px] rounded-[7px] transition-all"
          style={{
            fontSize: 13, fontWeight: 500, fontFamily: FONT, letterSpacing: '-0.01em',
            backgroundColor: agentStatus === "running" ? 'rgba(255,255,255,0.06)' : '#fff',
            color: agentStatus === "running" ? '#555B65' : '#0A0B0D',
            border: agentStatus === "running" ? '1px solid rgba(255,255,255,0.08)' : 'none',
            cursor: agentStatus === "running" ? 'not-allowed' : 'pointer',
          }}
        >
          {agentStatus === "running" ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
              </svg>
              Running...
            </>
          ) : "Start Triage"}
        </button>
      )}

    </div>
  );
}