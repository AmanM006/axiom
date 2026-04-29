"use client";

import { AgentStatus } from "../hooks/useAgentStream";

interface StatusHeaderProps {
  status: AgentStatus;
  elapsedMs: number;
  totalReward: number;
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

export default function StatusHeader({
  status,
  elapsedMs,
  totalReward,
}: StatusHeaderProps) {
  const elapsedSeconds = elapsedMs / 1000;
  const costSaved =
    status === "idle"
      ? 0
      : Math.floor((elapsedSeconds / 60) * COST_PER_MINUTE);

  return (
    <header className="h-12 flex items-center justify-between px-4 linear-bg linear-border-b shrink-0 select-none">
      {/* Left section: Branding & Workspace */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-[var(--linear-hover)] cursor-pointer transition-colors">
          <div className="w-4 h-4 rounded-[3px] bg-white text-black flex items-center justify-center text-[10px] font-bold">
            A
          </div>
          <span className="text-[13px] font-medium text-primary">AXIOM Workspace</span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-tertiary">
            <path d="M4.5 6L8 9.5L11.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="h-3.5 w-px linear-bg linear-border-l border-[#27282B] mx-1" />

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-secondary flex items-center gap-1.5 bg-[#17181B] border border-[#27282B] px-2 py-0.5 rounded-full">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-[#5E6AD2]">
              <path d="M8 0L10.3 5.3L16 6.3L12 10.5L12.8 16L8 13.5L3.2 16L4 10.5L0 6.3L5.7 5.3L8 0Z" />
            </svg>
            MI300X
          </span>
        </div>
      </div>

      {/* Center section: Status */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        {status === "running" && (
          <div className="w-2 h-2 rounded-full bg-[#F2C94C] animate-pulse-subtle" />
        )}
        {status === "resolved" && (
          <div className="w-2 h-2 rounded-full bg-[#34A853]" />
        )}
        {status === "error" && (
          <div className="w-2 h-2 rounded-full bg-[#E95460]" />
        )}
        {status === "idle" && (
          <div className="w-2 h-2 rounded-full border border-[#60646C]" />
        )}
        <span className="text-[13px] text-secondary font-medium">
          {status === "idle" && "Ready"}
          {status === "running" && "Diagnosing..."}
          {status === "resolved" && "Resolved"}
          {status === "error" && "Error"}
        </span>
      </div>

      {/* Right section: Metrics */}
      <div className="flex items-center gap-4">
        {(status === "running" || status === "resolved") && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-tertiary font-medium">Saved</span>
            <span className="text-[13px] text-[#34A853] font-mono font-medium">
              {formatCurrency(costSaved)}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-tertiary font-medium">Time</span>
          <span className="text-[13px] text-primary font-mono font-medium w-[42px]">
            {formatTime(elapsedMs)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-tertiary font-medium">Score</span>
          <span className={`text-[13px] font-mono font-medium ${totalReward >= 0 ? "text-primary" : "text-[#E95460]"}`}>
            {totalReward >= 0 ? "+" : ""}{totalReward.toFixed(1)}
          </span>
        </div>
      </div>
    </header>
  );
}
