"use client";

import { useMemo } from "react";
import { AgentEvent } from "../hooks/useAgentStream";

interface PRViewerProps {
  events: AgentEvent[];
  onDismiss: () => void;
}

export default function PRViewer({ events, onDismiss }: PRViewerProps) {
  const prEvent = useMemo(() => {
    return events.find(
      (e) =>
        e.type === "result" &&
        e.metadata.pr_url !== undefined &&
        e.metadata.pr_url.length > 0,
    );
  }, [events]);

  const diffEvent = useMemo(() => {
    return events.find(
      (e) =>
        e.type === "result" &&
        e.metadata.diff !== undefined,
    );
  }, [events]);

  const sourceEvent = prEvent || diffEvent;
  if (!sourceEvent) return null;

  const prUrl = sourceEvent.metadata.pr_url || "";
  const prNumber = sourceEvent.metadata.pr_number || 0;
  const diff = sourceEvent.metadata.diff;
  const beforeLines = diff?.before?.split("\n") || [];
  const afterLines = diff?.after?.split("\n") || [];

  return (
    <div className="absolute bottom-6 right-6 left-[300px] bg-[var(--linear-surface)] border border-[var(--linear-border)] rounded-lg shadow-2xl overflow-hidden animate-slide-up max-w-[800px] z-50">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--linear-sidebar)] border-b border-[var(--linear-border)]">
        <div className="flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#5E6AD2]">
             <path d="M4.5 4.5V11.5M11.5 8.5V11.5M11.5 8.5C11.5 6.29086 9.70914 4.5 7.5 4.5H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             <circle cx="4.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
             <circle cx="11.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
             <circle cx="4.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <h3 className="text-[13px] font-medium text-primary">
            Pull Request{prNumber ? ` #${prNumber}` : ""}
          </h3>
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[#5E6AD2] hover:text-white transition-colors ml-2"
            >
              Open in GitHub ↗
            </a>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-tertiary hover:text-primary transition-colors p-1"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Diff viewer */}
      {diff && (
        <div className="grid grid-cols-2 gap-0 max-h-[400px] overflow-y-auto bg-[#121315]">
          {/* Before */}
          <div className="border-r border-[var(--linear-border)]">
            <div className="px-4 py-2 bg-[var(--linear-sidebar)] border-b border-[var(--linear-border)] sticky top-0 z-10 flex items-center">
              <span className="text-[11px] text-secondary font-mono">Original</span>
            </div>
            <div className="py-2">
              {beforeLines.map((line, idx) => {
                const hasComment = line.includes("# BUG:");
                return (
                  <div
                    key={`before-${idx}`}
                    className={`flex font-mono text-[12px] leading-relaxed ${
                      hasComment ? "bg-[#E95460]/10 text-[#E95460]" : "text-tertiary"
                    }`}
                  >
                    <span className="w-10 text-right pr-3 select-none opacity-40 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="px-2 whitespace-pre overflow-x-auto flex-1">
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* After */}
          <div>
            <div className="px-4 py-2 bg-[var(--linear-sidebar)] border-b border-[var(--linear-border)] sticky top-0 z-10 flex items-center">
              <span className="text-[11px] text-secondary font-mono">Fixed</span>
            </div>
            <div className="py-2">
              {afterLines.map((line, idx) => {
                const hasFix = line.includes("# FIX:");
                return (
                  <div
                    key={`after-${idx}`}
                    className={`flex font-mono text-[12px] leading-relaxed ${
                      hasFix ? "bg-[#34A853]/10 text-[#34A853]" : "text-primary"
                    }`}
                  >
                    <span className="w-10 text-right pr-3 select-none opacity-40 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="px-2 whitespace-pre overflow-x-auto flex-1">
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
