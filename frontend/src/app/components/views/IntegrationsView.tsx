"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function IntegrationsView({ selectedIntegration = 'logs' }: { selectedIntegration?: string }) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/integrations/status`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          for (const item of (data.integrations || [])) {
            map[item.id] = item.status;
          }
          setLiveStatuses(map);
        }
      } catch {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const CONTENT: Record<string, any> = {
    'logs': {
      title: 'Log Streams',
      desc: 'Connect your observability stack to allow the agent to query real-time logs.',
      providers: [
        { name: 'Elasticsearch', status: liveStatuses['ES'] || 'CONNECTED', icon: 'EL' },
        { name: 'Splunk', status: liveStatuses['SP'] || 'AVAILABLE', icon: 'SP' },
        { name: 'Datadog', status: liveStatuses['DD'] || 'AVAILABLE', icon: 'DD' },
      ],
      setup: 'Enter your LogDB endpoint and API key to start ingestion.'
    },
    'cloud': {
      title: 'Cloud Infrastructure',
      desc: 'Link your cloud providers to enable automated infrastructure repairs.',
      providers: [
        { name: 'AWS', status: liveStatuses['AW'] || 'AVAILABLE', icon: 'AW' },
        { name: 'Google Cloud', status: 'AVAILABLE', icon: 'GC' },
        { name: 'Azure', status: 'AVAILABLE', icon: 'AZ' },
      ],
      setup: 'Provision a readonly IAM role for the Axiom agent to begin cluster discovery.'
    },
    'github': {
      title: 'GitHub & Version Control',
      desc: 'Connect repositories to allow the agent to read code and open Pull Requests.',
      providers: [
        { name: 'GitHub Enterprise', status: liveStatuses['GH'] || 'CONNECTED', icon: 'GH' },
        { name: 'GitLab', status: 'AVAILABLE', icon: 'GL' },
      ],
      setup: 'Install the Axiom GitHub App on your organization to allow repository access.'
    }
  };

  const data = CONTENT[selectedIntegration] || CONTENT['logs'];

  const handleConnect = (id: string) => {
    setConnecting(id);
    setTimeout(() => setConnecting(null), 1500);
  };

  return (
    <div className="flex-1 bg-[#09090B] overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E6AD2]/10 text-[#5E6AD2] uppercase tracking-widest">Setup</span>
            <h1 className="text-[28px] font-bold tracking-tight text-white">{data.title}</h1>
          </div>
          <p className="text-[14px] text-white/40 font-medium max-w-2xl">{data.desc}</p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
             {data.providers.map((p: any) => (
                <div key={p.name} className="p-6 rounded-lg bg-[#121214] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[13px] font-bold text-white/40 group-hover:text-white transition-colors">
                      {p.icon}
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-white/90">{p.name}</div>
                      <div className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${p.status === 'Connected' ? 'text-green-500/60' : 'text-white/20'}`}>
                        {p.status}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleConnect(p.name)}
                    disabled={p.status === 'Connected' || connecting === p.name}
                    className={`px-4 py-2 rounded-md text-[12px] font-bold transition-all ${
                      p.status === 'Connected' 
                        ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                        : connecting === p.name ? 'bg-white/10 text-white animate-pulse' : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    {p.status === 'Connected' ? 'Installed' : connecting === p.name ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
             ))}
          </div>

          <div className="space-y-6">
             <div className="p-6 rounded-lg bg-[#121214] border border-white/5">
                <h3 className="text-[12px] font-bold text-white/20 uppercase tracking-[0.15em] mb-4">How it works</h3>
                <p className="text-[12px] text-white/40 leading-relaxed mb-6">
                  {data.setup}
                </p>
                <div className="flex items-center gap-2 text-[#5E6AD2] cursor-pointer hover:underline text-[12px] font-bold">
                   <span>Read Documentation</span>
                   <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </div>
             </div>

             <div className="p-5 rounded-lg bg-[#5E6AD2]/5 border border-dashed border-[#5E6AD2]/20">
                <div className="text-[12px] font-bold text-[#5E6AD2] mb-2 uppercase tracking-widest">Axiom Tip</div>
                <p className="text-[11px] text-white/40 leading-relaxed italic">
                  "Most users start with GitHub to allow the agent to suggest code fixes immediately."
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
