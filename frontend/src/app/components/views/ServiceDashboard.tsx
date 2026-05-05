"use client";

interface ServiceDashboardProps {
  serviceId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ServiceDashboard({ serviceId }: ServiceDashboardProps) {
  const [data, setData] = React.useState<any>(null);
  const [deployments, setDeployments] = React.useState<any[]>([
    { id: 'd1', time: '2h ago', author: '@aman', message: 'feat: add retry logic to primary-db connection', status: 'success' },
    { id: 'd2', time: '5h ago', author: '@sarah', message: 'fix: schema validation for payment-intent', status: 'success' },
    { id: 'd3', time: '1d ago', author: '@aman', message: 'perf: optimize redis cache lookup', status: 'success' },
  ]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/services/${serviceId}/telemetry`);
        if (res.ok) {
          const telemetry = await res.json();
          setData({
            name: serviceId,
            status: telemetry.status || 'healthy',
            latency: `${telemetry.latency_ms || 0}ms`,
            errorRate: `${telemetry.error_rate || 0}%`,
            throughput: `${(telemetry.connections || 0) * 4} req/s`, // Mocking throughput from connections
            dependencies: telemetry.dependencies || ['primary-db', 'redis-cache'],
            lastDeploy: '2h ago by @aman',
            successRate: (100 - (telemetry.error_rate || 0)).toFixed(2) + '%'
          });
        }
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [serviceId]);

  if (!data) return <div className="flex-1 bg-[#09090B] flex items-center justify-center text-white/20">Loading telemetry...</div>;

  return (
    <div className="flex-1 bg-[#09090B] overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div className="flex items-center gap-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[20px] font-bold text-white shadow-lg ${data.status === 'healthy' ? 'bg-green-500 shadow-green-500/20' : 'bg-red-500 shadow-red-500/20 animate-pulse'}`}>
              {data.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[28px] font-bold tracking-tight text-white">{data.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${data.status === 'healthy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {data.status}
                </span>
              </div>
              <p className="text-[14px] text-white/40 font-medium italic">Critical path for core transaction processing.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white/[0.03] border border-white/10 hover:border-white/20 text-white/80 text-[12px] font-bold px-4 py-2 rounded-md transition-all">
              View Telemetry
            </button>
            <button className="bg-[#5E6AD2] hover:bg-[#4C58C1] text-white text-[12px] font-bold px-4 py-2 rounded-md transition-all shadow-lg shadow-[#5E6AD2]/20">
              Trigger Triage
            </button>
          </div>
        </div>

        {/* Vitals Bar */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Success Rate', value: data.successRate || '99.9%', sub: 'Target 99.9%', color: 'text-green-500/80' },
            { label: 'P99 Latency', value: data.latency, sub: 'P50: 12ms', color: data.status === 'healthy' ? 'text-white/80' : 'text-red-400' },
            { label: 'Error Rate', value: data.errorRate, sub: 'Stable', color: data.status === 'healthy' ? 'text-white/80' : 'text-red-400' },
            { label: 'Throughput', value: data.throughput, sub: '12% over avg', color: 'text-white/80' },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-lg bg-[#121214] border border-white/5">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-[20px] font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] text-white/30 font-medium">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-12">
            {/* Dependencies */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Service Dependencies</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {data.dependencies.map((dep: string) => (
                  <div key={dep} className="px-4 py-2.5 rounded-lg bg-[#121214] border border-white/5 flex items-center gap-3 shrink-0 group hover:border-white/20 transition-all cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                    <span className="text-[13px] font-bold text-white/70 group-hover:text-white/90">{dep}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Deployments */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Recent Deployments</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>
              <div className="space-y-3">
                {deployments.map((deploy) => (
                  <div key={deploy.id} className="p-4 rounded-lg bg-[#121214]/50 border border-white/5 hover:border-white/10 transition-all flex items-start gap-4 group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/30 group-hover:text-white/60 transition-colors">
                      {deploy.author[1].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-bold text-white/90 group-hover:text-white transition-colors truncate">{deploy.message}</span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded-[4px] bg-green-500/10 text-green-500/60 text-[9px] font-bold uppercase">Success</span>
                      </div>
                      <div className="text-[11px] text-white/30 flex items-center gap-2">
                        <span className="text-[#5E6AD2] font-semibold">{deploy.author}</span>
                        <span>•</span>
                        <span>{deploy.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Service Sidebar */}
          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Service Ownership</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>
              <div className="p-5 rounded-lg bg-[#121214] border border-white/5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-full bg-[#5E6AD2] flex items-center justify-center text-[16px] font-bold text-white">P</div>
                  <div>
                    <div className="text-[13px] font-bold text-white/90">Payments Team</div>
                    <div className="text-[11px] text-white/30">#team-payments</div>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div>
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Primary On-call</div>
                    <div className="text-[13px] font-bold text-white/80">@aman</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Infrastructure</div>
                    <div className="text-[13px] font-bold text-white/80">K8s Cluster: Production-01</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="p-5 rounded-lg bg-[#5E6AD2]/5 border border-dashed border-[#5E6AD2]/20">
              <div className="text-[12px] font-bold text-[#5E6AD2] mb-2 uppercase tracking-widest">Axiom Sense</div>
              <p className="text-[11px] text-white/40 leading-relaxed italic">
                "Detected a subtle latency creep in upstream auth-provider. Recommend proactive scaling of payment-processor replicas."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
