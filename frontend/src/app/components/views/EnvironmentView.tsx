"use client";

import React from 'react';

interface EnvironmentViewProps {
  envName: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function EnvironmentView({ envName }: EnvironmentViewProps) {
  const [services, setServices] = React.useState<any[]>([]);
  const [infra, setInfra] = React.useState<any[]>([
    { label: 'Nodes', value: '42', sub: 'Healthy', color: 'text-green-500/80' },
    { label: 'CPU Usage', value: '64%', sub: 'Avg per node', color: 'text-white/80' },
    { label: 'Memory', value: '1.2TB', sub: 'Total Capacity', color: 'text-white/80' },
    { label: 'Ingress', value: '12.4k', sub: 'req/s', color: 'text-white/80' },
  ]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/infrastructure/health`);
        if (res.ok) {
          const data = await res.json();
          // Map backend services to the view format
          const mapped = (data.services || [])
            .filter((s: any) => s.env === envName)
            .map((s: any) => ({
              name: s.id,
              status: s.status,
              version: s.version || 'v1.0.0',
              pods: s.pods || '1/1'
            }));
          setServices(mapped);
          
          if (data.infra) {
            setInfra([
              { label: 'Nodes', value: data.infra.nodes || '42', sub: 'Healthy', color: 'text-green-500/80' },
              { label: 'CPU Usage', value: `${data.infra.cpu_percent || 64}%`, sub: 'Avg per node', color: 'text-white/80' },
              { label: 'Memory', value: data.infra.memory || '1.2TB', sub: 'Total Capacity', color: 'text-white/80' },
              { label: 'Ingress', value: data.infra.ingress || '12.4k', sub: 'req/s', color: 'text-white/80' },
            ]);
          }
        }
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [envName]);

  return (
    <div className="flex-1 bg-[#09090B] overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${envName === 'Production' ? 'bg-[#4F6BED] shadow-[0_0_12px_rgba(79,107,237,0.4)]' : 'bg-[#BF5AF2]'} shadow-lg`} />
            <h1 className="text-[28px] font-bold tracking-tight text-white">{envName} Environment</h1>
          </div>
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-md px-3 py-1.5">
            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Region</span>
            <span className="text-[12px] font-bold text-white/80">us-east-1 (AWS)</span>
          </div>
        </div>

        {/* Infra Stats */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          {infra.map(stat => (
            <div key={stat.label} className="p-5 rounded-lg bg-[#121214] border border-white/5">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-[24px] font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] text-white/30 font-medium">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Service Grid */}
          <div className="col-span-2 space-y-8">
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Service Rollout Status</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {services.length === 0 ? (
                   <div className="p-10 text-center text-white/20 text-[13px]">No services detected in this environment.</div>
                ) : services.map((svc) => (
                  <div key={svc.name} className="p-4 rounded-lg bg-[#121214] border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${svc.status === 'healthy' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-[14px] font-bold text-white/80 group-hover:text-white transition-colors">{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-white/20 uppercase mb-0.5">Version</div>
                        <div className="text-[12px] font-mono text-white/60">{svc.version}</div>
                      </div>
                      <div className="text-right w-16">
                        <div className="text-[10px] font-bold text-white/20 uppercase mb-0.5">Pods</div>
                        <div className="text-[12px] font-bold text-white/80">{svc.pods}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="p-8 rounded-xl bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-white/5 relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-[16px] font-bold text-white mb-2">Live Traffic Map</h3>
                 <p className="text-[13px] text-white/40 mb-6 max-w-sm">Aggregated ingress traffic across global edge locations for {envName}.</p>
                 <div className="flex items-center gap-8">
                    <div>
                       <div className="text-[20px] font-bold text-white/90">94.2k</div>
                       <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Peak Req/s</div>
                    </div>
                    <div>
                       <div className="text-[20px] font-bold text-white/90">12ms</div>
                       <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Avg TTLB</div>
                    </div>
                 </div>
               </div>
               {/* Visual placeholder for map */}
               <div className="absolute right-[-20px] top-[-20px] bottom-[-20px] w-1/2 opacity-20 pointer-events-none">
                  <svg viewBox="0 0 200 200" className="w-full h-full text-[#4F6BED]">
                    <path fill="currentColor" d="M45,-78.3C58.3,-72.6,69.1,-60.1,76.5,-46.3C83.9,-32.5,88,-17.3,86.9,-2.7C85.8,11.9,79.5,25.8,70.9,37.6C62.3,49.4,51.4,59.1,38.8,66.8C26.2,74.5,11.9,80.1,-2.4,84.1C-16.7,88.1,-33.4,90.5,-47.3,84.5C-61.2,78.5,-72.3,64.1,-79.8,48.8C-87.3,33.5,-91.2,17.3,-90.1,1.5C-89,-14.3,-82.9,-29.7,-74.3,-43.3C-65.7,-56.9,-54.6,-68.7,-41.4,-74.6C-28.2,-80.5,-12.9,-80.5,1.5,-83.1C15.9,-85.7,31.7,-84.1,45,-78.3Z" transform="translate(100 100)" />
                  </svg>
               </div>
            </div>
          </div>

          {/* Environment Sidebar */}
          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Cluster Controls</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>
              <div className="space-y-3">
                <button className="w-full text-left p-4 rounded-lg bg-[#121214] border border-white/5 hover:border-red-500/30 group transition-all">
                  <div className="text-[13px] font-bold text-white/80 group-hover:text-red-400">Lock Environment</div>
                  <div className="text-[11px] text-white/30 mt-1">Prevents any new deployments.</div>
                </button>
                <button className="w-full text-left p-4 rounded-lg bg-[#121214] border border-white/5 hover:border-[#5E6AD2]/30 group transition-all">
                  <div className="text-[13px] font-bold text-white/80 group-hover:text-[#5E6AD2]">Purge Edge Cache</div>
                  <div className="text-[11px] text-white/30 mt-1">Invalidate all global CDN assets.</div>
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Change Log</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>
              <div className="space-y-4">
                {[
                  { event: 'Config Change', desc: 'Updated payment-svc replicas', time: '12m ago' },
                  { event: 'Deployment', desc: 'v2.4.1 to api-gateway', time: '2h ago' },
                  { event: 'Scaling', desc: 'Horizontal Pod Autoscaler triggered', time: '5h ago' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 mt-1.5 shrink-0" />
                    <div>
                      <div className="text-[12px] font-bold text-white/70">{item.event}</div>
                      <div className="text-[11px] text-white/30">{item.desc}</div>
                      <div className="text-[10px] text-white/20 mt-1 uppercase font-bold">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
