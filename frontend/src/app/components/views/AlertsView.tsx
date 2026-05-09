"use client";
import React, { useState, useEffect } from "react";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
);
const IconStar = ({ filled }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#F2C94C" : "none"} stroke={filled ? "#F2C94C" : "currentColor"} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);
const IconCheck = () => (
  <div className="w-[14px] h-[14px] border border-white/20 rounded-[2px] group-hover:border-white/40 transition-colors" />
);

interface AlertsViewProps {
  onTriage: (incidentId: string) => void;
}

export default function AlertsView({ onTriage }: AlertsViewProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'starred'>('all');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API_URL}/incidents`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.incidents.map((inc: any, i: number) => ({
            id: `alert-${i}`,
            service: inc.service,
            title: inc.name.toLowerCase().replace(/ /g, '_'),
            snippet: inc.description,
            severity: inc.severity,
            time: 'Just now',
            starred: i === 0,
            incidentId: inc.id
          }));
          setAlerts(mapped);
          if (mapped.length > 0) {
            setStarredIds(new Set([mapped[0].id]));
          }
        }
      } catch (e) {}
    };
    fetchIncidents();
  }, []);

  const filteredAlerts = alerts.filter(a => {

    if (filter === 'starred') return starredIds.has(a.id);
    return true;
  });

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(starredIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setStarredIds(next);
  };

  const toggleCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(checkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedIds(next);
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checkedIds.size === filteredAlerts.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(filteredAlerts.map(a => a.id)));
  };

  if (selectedAlert) {
    return (
      <div className="flex flex-col h-full bg-[#09090B] text-[#E2E3E5] font-sans">
        {/* Header */}
        <div className="h-[44px] border-b border-white/[0.06] flex items-center px-4 gap-4 bg-[#09090B]">
          <button 
            onClick={() => setSelectedAlert(null)}
            className="flex items-center gap-2 text-[12px] font-medium text-white/40 hover:text-white/80 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>
          <div className="h-4 w-[1px] bg-white/[0.06]" />
          <div className="text-[12px] font-medium text-white/40">{selectedAlert.service} / {selectedAlert.id}</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedAlert.severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  }`}>
                    {selectedAlert.severity} • UNTRIAGED
                  </span>
                  <span className="text-[11px] text-white/30 font-medium">Opened {selectedAlert.time}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">{selectedAlert.title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={(e) => toggleStar(e, selectedAlert.id)} className="p-2 rounded-md hover:bg-white/5 border border-white/10">
                  <IconStar filled={starredIds.has(selectedAlert.id)} />
                </button>
                <button
                  onClick={() => onTriage(selectedAlert.incidentId)}
                  className="px-4 py-2 bg-white text-black rounded-md font-bold text-sm hover:bg-[#E2E3E5] transition-all flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  Solve Incident
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-12">
              <div className="col-span-2 space-y-12">
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-4">Description</h3>
                  <p className="text-[15px] leading-relaxed text-white/80">{selectedAlert.snippet}</p>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-4">Telemetry Sense</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Impacted Users</div>
                      <div className="text-xl font-bold text-red-400">4,208 <span className="text-[10px] text-white/20 font-normal">↑ 12%</span></div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-white/40 mb-1">Error Frequency</div>
                      <div className="text-xl font-bold text-red-400">12.4% <span className="text-[10px] text-white/20 font-normal">Last 5m</span></div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-4">Related Logs</h3>
                  <div className="p-4 rounded-lg bg-black/40 border border-white/5 font-mono text-[12px] leading-relaxed text-white/60 overflow-hidden">
                    <div className="mb-1"><span className="text-white/20">[15:25:04]</span> <span className="text-red-400/80">ERROR</span> [payment-service] pool.Exhausted: Unable to acquire connection</div>
                    <div className="mb-1"><span className="text-white/20">[15:25:05]</span> <span className="text-red-400/80">ERROR</span> [payment-service] Request failed: 500 Internal Server Error</div>
                    <div className="opacity-40"><span className="text-white/20">[15:25:05]</span> <span className="text-blue-400/80">DEBUG</span> [payment-service] Initiating retry strategy...</div>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-3">Service</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">{selectedAlert.service[0].toUpperCase()}</div>
                    <span className="text-[13px] font-medium">{selectedAlert.service}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-3">Cluster</h3>
                  <div className="text-[13px] font-medium">prod-us-east-1</div>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-3">Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/60 border border-white/10">prometheus</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/60 border border-white/10">p0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090B] text-[#E2E3E5] font-sans">
      {/* ── Top Navigation ── */}
      <div className="h-[44px] border-b border-white/[0.06] flex items-center px-4 gap-6 bg-[#09090B]">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 h-[44px] text-[12px] font-medium transition-all border-b-2 ${filter === 'all' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/60'}`}
          >
            All Alerts
          </button>
          <button 
            onClick={() => setFilter('starred')}
            className={`px-3 h-[44px] text-[12px] font-medium transition-all border-b-2 ${filter === 'starred' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/60'}`}
          >
            Starred
          </button>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-48 h-[24px] bg-white/[0.04] border border-white/[0.06] rounded px-2 outline-none text-[11px] focus:border-white/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="h-[36px] border-b border-white/[0.06] flex items-center px-4 gap-4 text-white/40">
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="p-1 hover:bg-white/5 rounded transition-colors">
            <div className={`w-[14px] h-[14px] border rounded-[2px] flex items-center justify-center ${checkedIds.size === filteredAlerts.length ? 'bg-white border-white' : 'border-white/20'}`}>
              {checkedIds.size === filteredAlerts.length && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
            </div>
          </button>
          <button className="p-1.5 hover:bg-white/5 rounded transition-colors"><IconRefresh /></button>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1.5 hover:bg-white/5 rounded transition-colors ${showMenu ? 'text-white' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            
            {showMenu && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-[#121214] border border-white/10 rounded-md shadow-2xl z-50 py-1 overflow-hidden">
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-white/5 transition-colors">Mark as Read</button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-white/5 transition-colors">Archive Selected</button>
                <div className="h-[1px] bg-white/5 my-1" />
                <button className="w-full px-3 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10 transition-colors">Delete Forever</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Alert List ── */}
      <div className="flex-1 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
            <IconStar />
            <div className="text-[13px] font-medium mt-4">No starred alerts</div>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`group flex items-center px-4 h-[32px] border-b border-white/[0.03] transition-all cursor-pointer ${checkedIds.has(alert.id) ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
            >
              <div className="flex items-center gap-2 w-[60px] shrink-0">
                <button onClick={(e) => toggleCheck(e, alert.id)} className="p-1">
                  <div className={`w-[13px] h-[13px] border rounded-[2px] flex items-center justify-center ${checkedIds.has(alert.id) ? 'bg-white border-white' : 'border-white/20'}`}>
                    {checkedIds.has(alert.id) && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                </button>
                <button onClick={(e) => toggleStar(e, alert.id)} className={`${starredIds.has(alert.id) ? 'text-[#F2C94C]' : 'text-white/10 group-hover:text-white/30'}`}>
                  <IconStar filled={starredIds.has(alert.id)} />
                </button>
              </div>

              <div className="w-[140px] shrink-0 text-[12px] font-medium text-white/80 pr-4 truncate">
                {alert.service}
              </div>

              <div className="flex-1 flex items-baseline gap-2 overflow-hidden">
                <span className="text-[12px] font-medium text-white/90 shrink-0">{alert.title}</span>
                <span className="text-[12px] text-white/30 truncate">{alert.snippet}</span>
              </div>

              <div className="w-[60px] shrink-0 text-right text-[11px] font-medium text-white/20 group-hover:text-white/50">
                {alert.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

