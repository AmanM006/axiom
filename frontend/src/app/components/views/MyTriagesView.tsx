"use client";

const ACTIVE_TRIAGES = [
  { id: "db_cascade", name: "Cascading DB Failure", service: "payment-service", severity: "critical", status: "Investigating", owner: "Aman" },
  { id: "memory_leak", name: "Memory Leak", service: "image-processor", severity: "high", status: "Root Cause Found", owner: "Aman" },
];

interface MyTriagesViewProps {
  onOpenTriage: (id: string) => void;
}

export default function MyTriagesView({ onOpenTriage }: MyTriagesViewProps) {
  return (
    <div className="flex-1 p-10 bg-[#090909]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">My Triages</h1>
            <p className="text-[#939496]">Current incidents assigned to you or in progress.</p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm">
              <span className="text-[#939496]">Active:</span> <span className="font-semibold text-white ml-1">2</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm">
              <span className="text-[#939496]">Resolved (24h):</span> <span className="font-semibold text-white ml-1">12</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {ACTIVE_TRIAGES.map((triage) => (
            <div
              key={triage.id}
              onClick={() => onOpenTriage(triage.id)}
              className="group p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  triage.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                }`}>
                  {triage.severity[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-white transition-colors">{triage.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-[#939496] mt-1">
                    <span className="bg-white/[0.06] px-2 py-0.5 rounded text-[10px] font-mono">{triage.service}</span>
                    <span>•</span>
                    <span>Assigned to {triage.owner}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-[11px] text-[#939496] uppercase mb-1">Status</div>
                  <div className="text-sm font-medium text-blue-400">{triage.status}</div>
                </div>
                <button className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-sm font-medium transition-colors">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
