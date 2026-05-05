"use client";

import React, { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function OnCallView() {
  const [oncall, setOncall] = useState<any>({ responders: [], schedule: [], escalation: [] });

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/infrastructure/oncall`);
        if (res.ok) setOncall(await res.json());
      } catch {}
    };
    fetch_();
  }, []);

  const ROTATION = oncall.responders || [];
  const UPCOMING = oncall.schedule || [];
  const ESCALATION = oncall.escalation || [];

  return (
    <div className="flex-1 bg-[#09090B] overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-white mb-2">On-call Rotation</h1>
            <p className="text-[14px] text-white/40 font-medium">Global escalation policies and active responder schedules.</p>
          </div>
          <button className="bg-[#5E6AD2] hover:bg-[#4C58C1] text-white text-[12px] font-bold px-4 py-2 rounded-md transition-colors shadow-lg shadow-[#5E6AD2]/20">
            Page Active Responder
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Active Responders */}
          <div className="col-span-2 space-y-8">
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Active Responders</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {ROTATION.filter((r: any) => r.level !== 'Escalation').map((person: any) => (
                  <div key={person.name} className="p-5 rounded-lg bg-[#121214] border border-white/5 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold text-white shadow-inner" style={{ backgroundColor: person.color }}>
                      {person.name[0]}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#5E6AD2] uppercase tracking-widest mb-0.5">{person.level}</div>
                      <div className="text-[16px] font-bold text-white/90">{person.name}</div>
                      <div className="text-[12px] text-white/30">{person.handle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Escalation Path</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>

              <div className="space-y-3 relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5 ml-[-0.5px]" />
                {(ESCALATION.length > 0 ? ESCALATION : [1,2,3].map(l => ({ level: l, role: l === 1 ? 'Primary Engineer' : l === 2 ? 'Secondary Engineer' : 'SRE Lead / Manager', rule: l === 1 ? 'Immediate notification via PagerDuty' : l === 2 ? 'Escalate after 15m of no response' : 'Critical escalation after 30m', ack_time: l === 1 ? '5m Ack' : l === 2 ? '15m Ack' : 'Immediate' }))).map((esc: any) => (
                  <div key={esc.level} className="relative flex items-center gap-6 p-4 rounded-lg bg-[#121214]/50 border border-white/5 ml-12">
                    <div className="absolute left-[-48px] w-6 h-6 rounded-full bg-[#121214] border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                      L{esc.level}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-white/80">{esc.role}</div>
                      <div className="text-[11px] text-white/30 mt-0.5">{esc.rule}</div>
                    </div>
                    <div className="text-[11px] font-bold text-white/20 uppercase tracking-wider">{esc.ack_time}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Schedule Sidebar */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 whitespace-nowrap">Schedule</h2>
                <div className="h-px w-full bg-white/[0.06]" />
              </div>

              <div className="rounded-lg bg-[#121214] border border-white/5 divide-y divide-white/5 overflow-hidden">
                {UPCOMING.map((shift: any) => (
                  <div key={shift.date} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-bold text-white/80">{shift.person}</span>
                      <span className="text-[11px] font-bold text-[#5E6AD2] uppercase tracking-wider">{shift.date}</span>
                    </div>
                    <div className="text-[11px] text-white/30">{shift.shift}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="p-5 rounded-lg bg-white/[0.02] border border-dashed border-white/10">
              <div className="text-[12px] font-medium text-white/60 mb-2">Need a swap?</div>
              <p className="text-[11px] text-white/30 leading-relaxed">
                Contact your team lead or use the `/oncall swap` command in Slack to request a rotation adjustment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
