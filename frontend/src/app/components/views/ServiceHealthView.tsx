"use client";

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ServiceMetrics {
  name: string;
  category: string;
  status: string;
  cpu_percent: number;
  memory_mb: number;
  error_rate: number;
  latency_ms: number;
  connections: number;
}

interface ServiceDef {
  name: string;
  category: string;
  env: string;
}

const FALLBACK_SERVICES: ServiceDef[] = [
  { name: 'payment-service', category: 'Core Services', env: 'Production' },
  { name: 'api-gateway', category: 'Gateway & Routing', env: 'Production' },
  { name: 'auth-provider', category: 'Gateway & Routing', env: 'Production' },
  { name: 'image-processor', category: 'Core Services', env: 'Staging' },
  { name: 'db-cluster-01', category: 'Data Stores', env: 'Production' },
  { name: 'redis-cache', category: 'Data Stores', env: 'Production' },
];

function deriveStatus(m: ServiceMetrics): string {
  if (m.error_rate > 10) return 'degraded';
  if (m.error_rate > 1 || m.latency_ms > 500 || m.cpu_percent > 90) return 'warning';
  return 'healthy';
}

export default function ServiceHealthView({ selectedEnv = 'Production' }: { selectedEnv?: string }) {
  const [services, setServices] = useState<ServiceDef[]>(FALLBACK_SERVICES);
  const [metrics, setMetrics] = useState<Record<string, ServiceMetrics>>({});
  const [isLive, setIsLive] = useState(false);

  // Fetch service definitions from backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        if (res.ok) {
          const data = await res.json();
          if (data.services?.length) setServices(data.services);
        }
      } catch {}
    };
    fetchServices();
  }, []);

  // Poll metrics for all services every 5 seconds
  useEffect(() => {
    const fetchAllMetrics = async () => {
      const results: Record<string, ServiceMetrics> = {};
      for (const svc of services) {
        try {
          const res = await fetch(`${API_URL}/metrics/${svc.name}`);
          if (res.ok) {
            const data = await res.json();
            if (!data.error) {
              results[svc.name] = {
                name: svc.name,
                category: svc.category,
                status: 'healthy',
                cpu_percent: data.cpu_percent ?? 0,
                memory_mb: data.memory_mb ?? 0,
                error_rate: data.error_rate ?? 0,
                latency_ms: data.latency_ms ?? 0,
                connections: data.connections ?? 0,
              };
              results[svc.name].status = deriveStatus(results[svc.name]);
            }
          }
        } catch {}
      }
      if (Object.keys(results).length > 0) {
        setMetrics(results);
        setIsLive(true);
      }
    };

    fetchAllMetrics();
    const interval = setInterval(fetchAllMetrics, 5000);
    return () => clearInterval(interval);
  }, [services]);

  // Group services by category, filtered by env
  const envServices = services.filter(s => s.env === selectedEnv || selectedEnv === 'All');
  const categories = Array.from(new Set(envServices.map(s => s.category)));

  const hasIssues = Object.values(metrics).some(m => m.status !== 'healthy');

  return (
    <div className="flex-1 bg-[#09090B] overflow-y-auto scrollbar-hide">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-white mb-2">{selectedEnv} Service Health</h1>
            <p className="text-[14px] text-white/40 font-medium">Real-time telemetry from the backend — polling every 5s.</p>
          </div>

          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-md px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest">Live</span>
              </div>
            )}
            <div className={`flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-md px-3 py-1.5`}>
              <div className={`w-2 h-2 rounded-full ${hasIssues ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} />
              <span className="text-[12px] font-bold text-white/80">{hasIssues ? 'ISSUES DETECTED' : 'SYSTEMS OPERATIONAL'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-16">
          {categories.map((cat) => {
            const catServices = envServices.filter(s => s.category === cat);
            return (
              <section key={cat}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">{cat}</h2>
                  <div className="h-px w-full bg-white/[0.06]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {catServices.map((svc) => {
                    const m = metrics[svc.name];
                    const status = m ? m.status : 'loading';
                    const latency = m ? `${Math.round(m.latency_ms)}ms` : '—';
                    const errors = m ? `${m.error_rate.toFixed(1)}%` : '—';
                    const cpu = m ? `${Math.round(m.cpu_percent)}%` : '—';
                    const conns = m ? `${m.connections}` : '—';

                    return (
                      <div
                        key={svc.name}
                        className="group relative p-5 rounded-lg bg-[#121214] border border-white/5 hover:border-white/10 hover:bg-[#161618] transition-all cursor-default"
                      >
                        <div className="flex items-start justify-between mb-8">
                          <div>
                            <h3 className="text-[15px] font-bold text-white/90 group-hover:text-white transition-colors mb-1">{svc.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                status === 'healthy' ? 'text-green-500/80' : 
                                status === 'degraded' ? 'text-red-500/80' : 
                                status === 'warning' ? 'text-orange-500/80' : 'text-white/20'
                              }`}>
                                {status === 'loading' ? 'Fetching...' : status}
                              </span>
                            </div>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            status === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 
                            status === 'degraded' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 
                            status === 'warning' ? 'bg-orange-500' : 'bg-white/10'
                          }`} />
                        </div>

                        <div className="grid grid-cols-2 gap-y-5">
                          <div>
                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">Latency</div>
                            <div className={`text-[13px] font-medium ${m && m.latency_ms > 200 ? 'text-red-400' : 'text-white/80'}`}>
                              {latency}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">Connections</div>
                            <div className="text-[13px] font-medium text-white/80">{conns}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">Error Rate</div>
                            <div className={`text-[13px] font-medium ${m && m.error_rate > 1 ? 'text-red-400' : 'text-green-500/80'}`}>
                              {errors}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">CPU</div>
                            <div className={`text-[13px] font-medium ${m && m.cpu_percent > 80 ? 'text-orange-400' : 'text-white/80'}`}>{cpu}</div>
                          </div>
                        </div>

                        {/* Sparkline */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden opacity-20">
                          <div className={`h-full w-full ${status === 'healthy' ? 'bg-green-500' : status === 'degraded' ? 'bg-red-500' : 'bg-orange-500'}`} style={{ clipPath: 'polygon(0% 100%, 10% 80%, 20% 90%, 30% 60%, 40% 70%, 50% 40%, 60% 80%, 70% 30%, 80% 90%, 90% 10%, 100% 100%)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
