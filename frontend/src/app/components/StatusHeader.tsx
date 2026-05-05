"use client";

import { AgentStatus } from "../hooks/useAgentStream";
import React, { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface StatusHeaderProps {
  status: AgentStatus;
  isPaused: boolean;
  elapsedMs: number;
  totalReward: number;
  onOpenConfig?: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US");
}

const COST_PER_MINUTE = 4200;

export default function StatusHeader({ status, isPaused, elapsedMs, totalReward, onOpenConfig }: StatusHeaderProps) {
  const [globalHealth, setGlobalHealth] = useState<string>('healthy');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/infrastructure/health`);
        if (res.ok) {
          const data = await res.json();
          setGlobalHealth(data.status || 'healthy');
        }
      } catch {}
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = elapsedMs / 1000;
  const costSaved = status === "idle" ? 0 : Math.floor((elapsedSeconds / 60) * COST_PER_MINUTE);

  return (
    <header
      className="h-11 flex items-center justify-between px-4 shrink-0 select-none relative"
      style={{
        backgroundColor: 'rgba(10, 11, 13, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
      }}
    >
      {/* Left: Global Health */}
      <div className="flex items-center gap-3 w-[200px]">
        <div className={`w-2 h-2 rounded-full ${globalHealth === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : globalHealth === 'warning' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse'}`} />
        <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">
          System: <span className={globalHealth === 'healthy' ? 'text-green-500/80' : globalHealth === 'warning' ? 'text-yellow-500/80' : 'text-red-500/80'}>{globalHealth}</span>
        </span>
      </div>

      {/* Center: Status */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[7px]">
        {isPaused && <div className="w-[7px] h-[7px] rounded-full bg-[#E95460] animate-pulse" />}
        {!isPaused && status === "running" && <div className="w-[7px] h-[7px] rounded-full bg-[#F2C94C] animate-pulse" />}
        {status === "resolved" && <div className="w-[7px] h-[7px] rounded-full bg-[#34A853]" />}
        {status === "error" && <div className="w-[7px] h-[7px] rounded-full bg-[#E95460]" />}
        {status === "idle" && <div className="w-[7px] h-[7px] rounded-full" style={{ border: '1px solid #555B65' }} />}
        <span style={{ fontSize: 13, fontWeight: 500, color: isPaused ? '#E95460' : '#8A8F9A', letterSpacing: '-0.01em' }}>
          {status === "idle" && "Ready"}
          {isPaused ? "Awaiting Approval" : (status === "running" ? "Diagnosing..." : "")}
          {status === "resolved" && "Resolved"}
          {status === "error" && "Error"}
        </span>
      </div>

      {/* Right: Metrics & Config */}
      <div className="flex items-center gap-[20px]">
        {(status === "running" || status === "resolved") && (
          <div className="flex items-center gap-[6px]">
            <span style={{ fontSize: 12, color: '#555B65', fontWeight: 500 }}>Saved</span>
            <span style={{ fontSize: 13, color: '#34A853', fontFamily: 'ui-monospace, "SF Mono", monospace', fontWeight: 500 }}>
              {formatCurrency(costSaved)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-[6px]">
          <span style={{ fontSize: 12, color: '#555B65', fontWeight: 500 }}>Time</span>
          <span style={{ fontSize: 13, color: '#E0E1E4', fontFamily: 'ui-monospace, "SF Mono", monospace', fontWeight: 500, width: 40 }}>
            {formatTime(elapsedMs)}
          </span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span style={{ fontSize: 12, color: '#555B65', fontWeight: 500 }}>Score</span>
          <span style={{
            fontSize: 13,
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontWeight: 500,
            color: totalReward >= 0 ? '#E0E1E4' : '#E95460',
          }}>
            {totalReward >= 0 ? "+" : ""}{totalReward.toFixed(1)}
          </span>
        </div>
        
        {/* Settings Gear */}
        <button 
          onClick={onOpenConfig}
          className="ml-2 p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          title="Configure Environment"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </header>
  );
}