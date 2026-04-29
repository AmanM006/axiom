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
  agentStatus: AgentStatus;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const INCIDENTS: Incident[] = [
  {
    id: "db_cascade",
    name: "Cascading DB Failure",
    service: "payment-service",
    description: "Connection pool exhausted → cascading 503s",
    severity: "critical",
    key_metric: "$4,200/min",
  },
  {
    id: "memory_leak",
    name: "Memory Leak",
    service: "image-processor",
    description: "RSS climbing unbounded toward OOM",
    severity: "high",
    key_metric: "$1,800/min",
  },
  {
    id: "exception_loop",
    name: "Exception Loop",
    service: "api-gateway",
    description: "KeyError crash loop every ~30s",
    severity: "critical",
    key_metric: "$7,500/min",
  },
];

export default function IncidentPanel({
  selectedIncident,
  onSelectIncident,
  onStartAgent,
  agentStatus,
}: IncidentPanelProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const selectedService =
    INCIDENTS.find((i) => i.id === selectedIncident)?.service || "";

  useEffect(() => {
    if (!selectedService) return;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/metrics/${selectedService}`);
        if (res.ok) {
          const data: Metrics = await res.json();
          setMetrics(data);
        }
      } catch {
        /* polling — silently retry */
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [selectedService]);

  return (
    <aside className="w-[260px] flex flex-col linear-sidebar linear-border-r shrink-0 select-none">
      
      {/* Workspace / Context Switcher style header */}
      <div className="px-4 py-3 border-b border-[var(--linear-border)]">
        <h2 className="text-[13px] font-medium text-primary">Issues</h2>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-2">
        
        {/* Section Header */}
        <div className="px-4 py-1.5 flex items-center group cursor-pointer">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-tertiary mr-1.5 transition-transform group-hover:text-secondary">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[12px] font-medium text-tertiary group-hover:text-secondary transition-colors">Active Incidents</span>
          <span className="ml-auto text-[11px] text-tertiary">{INCIDENTS.length}</span>
        </div>

        {/* List items */}
        <div className="mt-1 space-y-0.5 px-2">
          {INCIDENTS.map((incident) => {
            const isSelected = selectedIncident === incident.id;
            const severityIcon = incident.severity === "critical" 
              ? <div className="w-2.5 h-2.5 rounded-[3px] bg-[#E95460] mr-2 shrink-0" />
              : <div className="w-2.5 h-2.5 rounded-[3px] bg-[#F2C94C] mr-2 shrink-0" />;

            return (
              <button
                key={incident.id}
                onClick={() => onSelectIncident(incident.id)}
                className={`w-full flex items-start text-left px-2 py-1.5 rounded-[6px] transition-colors ${
                  isSelected ? "bg-[var(--linear-hover-active)]" : "hover:bg-[var(--linear-hover)]"
                }`}
              >
                <div className="pt-1">
                  {severityIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[13px] truncate ${isSelected ? "text-primary" : "text-secondary"}`}>
                      {incident.name}
                    </span>
                  </div>
                  <div className="text-[12px] text-tertiary truncate">
                    {incident.service}
                  </div>
                  {isSelected && (
                    <div className="mt-2 mb-1 pl-0">
                       <div className="text-[11px] text-tertiary leading-snug mb-1.5 whitespace-normal">
                          {incident.description}
                       </div>
                       <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#E95460] bg-[#E95460]/10 border border-[#E95460]/20">
                         {incident.key_metric}
                       </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Metrics - Only visible when selected */}
        {selectedIncident && metrics && (
          <div className="mt-6 px-4">
             <div className="text-[12px] font-medium text-tertiary mb-3">Service Metrics</div>
             <div className="space-y-2">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-secondary">CPU</span>
                  <span className={`font-mono ${metrics.cpu_percent > 80 ? 'text-[#E95460]' : 'text-primary'}`}>{metrics.cpu_percent.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-secondary">Memory</span>
                  <span className={`font-mono ${metrics.memory_mb > 3000 ? 'text-[#E95460]' : 'text-primary'}`}>{metrics.memory_mb.toFixed(0)} MB</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-secondary">Errors</span>
                  <span className={`font-mono ${metrics.error_rate > 5 ? 'text-[#E95460]' : 'text-primary'}`}>{metrics.error_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-secondary">Latency</span>
                  <span className={`font-mono ${metrics.latency_ms > 1000 ? 'text-[#E95460]' : 'text-primary'}`}>{metrics.latency_ms.toFixed(0)} ms</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="p-3 border-t border-[var(--linear-border)]">
        <button
          onClick={onStartAgent}
          disabled={!selectedIncident || agentStatus === "running"}
          className="w-full linear-btn-primary py-1.5 rounded-[6px] text-[13px] flex items-center justify-center gap-2 h-8"
        >
          {agentStatus === "running" ? (
            <>
               <svg className="animate-spin-slow w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
               </svg>
               Running...
            </>
          ) : (
            "Start Triage"
          )}
        </button>
      </div>
    </aside>
  );
}
