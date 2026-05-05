"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";


const SLOS = [
  { name: 'Core API Availability', target: '99.99%', actual: '99.992%', budget: 'Remaining: 42m', status: 'healthy' },
  { name: 'Payment Processing Latency', target: '< 200ms (P95)', actual: '245ms', budget: 'Exhausted', status: 'breach' },
  { name: 'Checkout Success Rate', target: '99.9%', actual: '99.91%', budget: 'Remaining: 1.2h', status: 'healthy' },
  { name: 'Auth Response Time', target: '< 50ms (P90)', actual: '48ms', budget: 'Remaining: 8h', status: 'warning' },
];

export default function SLOView({ selectedEnv = 'Production' }: { selectedEnv?: string }) {
  const [sloGroups, setSloGroups] = useState<any[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchSLOs = async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        if (!res.ok) return;
        const data = await res.json();
        const services = data.services || [];

        const newGroups = await Promise.all(
          services.map(async (svc: any) => {
            let metrics: any = { error_rate: 0, latency_ms: 0 };
            try {
              const mRes = await fetch(`${API_URL}/metrics/${svc.id}`);
              if (mRes.ok) metrics = await mRes.json();
            } catch (e) {}

            const availStatus = metrics.error_rate > 5 ? 'breach' : (metrics.error_rate > 1 ? 'warning' : 'healthy');
            const availBudget = Math.max(-20, 100 - metrics.error_rate * 5);
            const actualAvail = (100 - metrics.error_rate).toFixed(3) + '%';

            const latStatus = metrics.latency_ms > 1000 ? 'breach' : (metrics.latency_ms > 500 ? 'warning' : 'healthy');
            const latBudget = Math.max(-20, 100 - (metrics.latency_ms / 1000) * 10);
            const actualLat = metrics.latency_ms.toFixed(0) + 'ms';

            return {
              service: svc.name,
              objectives: [
                { name: 'API Availability', target: '> 99.9%', actual: actualAvail, budget: availBudget, trend: (metrics.error_rate > 0 ? '-' : '+') + '0.01%', status: availStatus },
                { name: 'P95 Latency', target: '< 500ms', actual: actualLat, budget: latBudget, trend: (metrics.latency_ms > 500 ? '+' : '-') + '1%', status: latStatus },
              ]
            };
          })
        );
        setSloGroups(newGroups);
      } catch (err) {}
    };

    fetchSLOs();
    interval = setInterval(fetchSLOs, 5000);
    return () => clearInterval(interval);
  }, [selectedEnv]);


  return (
    <div className="flex-1 bg-[#09090B] overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-white mb-2">{selectedEnv} SLO Tracking</h1>
            <p className="text-[14px] text-white/40 font-medium">Service Level Objectives and Error Budget utilization for the {selectedEnv} stack.</p>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-md p-1">
            {['7d', '30d', '90d'].map((period) => (
              <button key={period} className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${period === '30d' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}>
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Global Budget Overview */}
        <div className="grid grid-cols-3 gap-6 mb-16">
          {(() => {
            const healthPct = sloGroups.length === 0 ? 99.98 : (() => {
              const all = sloGroups.flatMap(g => g.objectives);
              const breaches = all.filter((o: any) => o.status === 'breach').length;
              return parseFloat((100 - (breaches / Math.max(all.length, 1)) * 2).toFixed(2));
            })();
            const burnRate = sloGroups.length === 0 ? 0.8 : (() => {
              const all = sloGroups.flatMap(g => g.objectives);
              const budgets = all.map((o: any) => o.budget);
              const avg = budgets.reduce((a: number, b: number) => a + b, 0) / Math.max(budgets.length, 1);
              return parseFloat((1 - avg / 100 + 0.5).toFixed(2));
            })();
            const radius = 28; const circ = 2 * Math.PI * radius;
            const pct = Math.max(0, Math.min(100, healthPct));
            const offset = circ - (pct / 100) * circ;
            const arcColor = pct >= 99 ? '#22C55E' : pct >= 95 ? '#F59E0B' : '#EF4444';
            return (
              <>
                <div className="col-span-2 p-6 rounded-lg bg-[#121214] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-white/20 uppercase tracking-widest mb-2">Total System Health</div>
                    <div className="text-3xl font-bold text-white">{healthPct}% <span className="text-[14px] text-green-500/80 font-medium ml-2">↑ live</span></div>
                    <p className="text-[12px] text-white/30 mt-3">Aggregated across {sloGroups.flatMap(g => g.objectives).length} monitored objectives.</p>
                  </div>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                    <circle cx="36" cy="36" r={radius} fill="none" stroke={arcColor} strokeWidth="7"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                    <text x="36" y="40" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{Math.round(pct)}%</text>
                  </svg>
                </div>
                <div className="p-6 rounded-lg bg-[#121214] border border-white/5">
                  <div className="text-[11px] font-bold text-white/20 uppercase tracking-widest mb-2">Budget Burn Rate</div>
                  <div className={`text-3xl font-bold ${burnRate > 1.5 ? 'text-red-500/90' : burnRate > 1 ? 'text-orange-500/90' : 'text-green-500/90'}`}>{burnRate}x</div>
                  <p className={`text-[12px] mt-3 italic ${burnRate > 1 ? 'text-red-500/40' : 'text-green-500/40'}`}>{burnRate > 1 ? 'Budget burning faster than normal.' : 'Within normal operating limits.'}</p>
                </div>
              </>
            );
          })()}
        </div>

        {/* SLO Service Groups */}
        <div className="space-y-12">
          {sloGroups.map((group) => (
            <div key={group.service}>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">{group.service}</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>

              <div className="space-y-3">
                {group.objectives.map((slo: any) => (
                  <div key={slo.name} className="group flex items-center p-4 rounded-lg bg-[#121214] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[14px] font-bold text-white/90">{slo.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                          slo.status === 'healthy' ? 'bg-green-500/10 text-green-500/80' :
                          slo.status === 'breach' ? 'bg-red-500/10 text-red-500/80' : 'bg-orange-500/10 text-orange-500/80'
                        }`}>
                          {slo.status}
                        </span>
                      </div>
                      <div className="text-[12px] text-white/30">Target: {slo.target}</div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-white/20 uppercase mb-1">Performance</div>
                        <div className={`text-[13px] font-bold ${slo.status === 'breach' ? 'text-red-400' : 'text-white/90'}`}>
                          {slo.actual} <span className={`text-[10px] ml-1 font-medium ${slo.trend.startsWith('+') ? 'text-green-500/60' : 'text-red-500/60'}`}>{slo.trend}</span>
                        </div>
                      </div>

                      <div className="w-[140px]">
                        <div className="flex items-center justify-between text-[10px] font-bold text-white/20 uppercase mb-2">
                          <span>Error Budget</span>
                          <span className={slo.budget < 0 ? 'text-red-400' : 'text-white/60'}>{slo.budget.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              slo.status === 'healthy' ? 'bg-green-500' :
                              slo.status === 'breach' ? 'bg-red-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, slo.budget))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
