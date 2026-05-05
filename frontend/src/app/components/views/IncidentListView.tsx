"use client";

import React, { useState, useEffect } from 'react';

interface Incident {
  id: string;
  name: string;
  service: string;
  description: string;
  severity: string;
  key_metric: string;
}

interface IncidentListViewProps {
  selectedEnv: string;
  onSelectIncident: (id: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Map services to environments for frontend grouping
const SERVICE_ENV: Record<string, string> = {
  'payment-service': 'Production',
  'api-gateway': 'Production',
  'auth-provider': 'Production',
  'image-processor': 'Staging',
  'db-cluster-01': 'Production',
  'redis-cache': 'Production',
};

// Derive status/impact from incident data for display
function deriveStatus(inc: Incident): { status: string; impact: string; time: string } {
  if (inc.severity === 'critical') {
    return { status: 'TRIAGING', impact: 'Multiple clusters affected', time: 'Active' };
  }
  if (inc.severity === 'high') {
    return { status: 'INVESTIGATING', impact: 'Service degraded', time: 'Active' };
  }
  return { status: 'MONITORING', impact: 'Under observation', time: 'Watching' };
}

export default function IncidentListView({ selectedEnv, onSelectIncident }: IncidentListViewProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API_URL}/incidents`);
        if (res.ok) {
          const data = await res.json();
          setIncidents(data.incidents || []);
        }
      } catch {
        // Fallback to empty — the UI will show "Clear Skies"
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  // Filter by environment
  const filtered = incidents.filter(inc => {
    const env = SERVICE_ENV[inc.service] || 'Dev / QA';
    return env === selectedEnv || selectedEnv === 'All';
  });

  if (loading) {
    return (
      <div className="flex-1 bg-[#09090B] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/20">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" />
          </svg>
          <span className="text-[13px] font-medium">Loading incidents from backend...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#09090B] flex flex-col overflow-hidden">
      {/* Inbox Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-1.5 py-0.5 rounded bg-[#5E6AD2]/10 border border-[#5E6AD2]/20">
             <div className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]" />
             <span className="text-[10px] font-bold text-[#5E6AD2] uppercase tracking-widest">{selectedEnv}</span>
          </div>
          <h1 className="text-[14px] font-bold text-white/90">Active Triage Inbox</h1>
          <span className="text-[12px] text-white/20 font-medium">{filtered.length} incidents</span>
          <div className="ml-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" title="Live from API" />
        </div>
        <div className="flex items-center gap-2">
           <button className="px-2.5 py-1 rounded hover:bg-white/5 text-[12px] text-white/40 transition-colors">Mark all as seen</button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="divide-y divide-white/5">
          {filtered.map((incident) => {
            const meta = deriveStatus(incident);
            return (
              <div 
                key={incident.id} 
                onClick={() => onSelectIncident(incident.id)}
                className="group flex items-center px-6 py-4 hover:bg-white/[0.02] cursor-pointer transition-all border-l-2 border-transparent hover:border-[#5E6AD2]"
              >
                <div className="w-8 shrink-0 flex justify-center">
                   <div className={`w-2.5 h-2.5 rounded-full ${incident.severity === 'critical' ? 'bg-[#E05252] shadow-[0_0_8px_rgba(224,82,82,0.4)]' : incident.severity === 'high' ? 'bg-[#D4A843]' : 'bg-[#5E6AD2]'}`} />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                   <div className="flex items-center gap-3 mb-1">
                      <span className="text-[14px] font-bold text-white/90 group-hover:text-white transition-colors">{incident.name}</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-white/5 border border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-tighter">
                         {incident.service}
                      </span>
                   </div>
                   <div className="flex items-center gap-3 text-[12px] text-white/30">
                      <span className="text-[#5E6AD2] font-semibold tracking-tighter">{meta.status}</span>
                      <span>•</span>
                      <span className="truncate">{incident.description}</span>
                   </div>
                </div>
                <div className="shrink-0 text-right">
                   <div className="text-[12px] font-medium text-white/40">{meta.time}</div>
                   <div className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-1 group-hover:text-[#5E6AD2]/60 transition-colors">Open Triage</div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
             <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 mb-4" />
             <div className="text-[14px] font-bold uppercase tracking-widest">Clear Skies</div>
             <div className="text-[12px] mt-2">No incidents in {selectedEnv}</div>
          </div>
        )}
      </div>
    </div>
  );
}
