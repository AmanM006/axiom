"use client";

import { useState, useEffect, useRef } from "react";
import { AgentEvent } from "../hooks/useAgentStream";

interface ActionLogProps {
  events: AgentEvent[];
  incidentId: string;
  onOpenPR?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const TOOL_CONFIG: Record<
  string,
  { icon: JSX.Element; color: string }
> = {
  terminal: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4.5 5.5L8 9L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 12H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, color: "text-secondary" },
  run_command: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4.5 5.5L8 9L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 12H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, color: "text-secondary" },
  github: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 2.5C4.96243 2.5 2.5 4.96243 2.5 8C2.5 11.0376 4.96243 13.5 8 13.5C11.0376 13.5 13.5 11.0376 13.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, color: "text-[#5E6AD2]" },
  get_file: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3.5 3.5H9L12.5 7V12.5H3.5V3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: "text-[#5E6AD2]" },
  push_file: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 12.5V3.5M8 3.5L4.5 7M8 3.5L11.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: "text-[#5E6AD2]" },
  open_pr: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5V11.5M11.5 8.5V11.5M11.5 8.5C11.5 6.29086 9.70914 4.5 7.5 4.5H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="4.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="11.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="4.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>, color: "text-[#5E6AD2]" },
  logdb: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M2.5 5.5H13.5M2.5 10.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, color: "text-[#34A853]" },
  query_logs: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M2.5 5.5H13.5M2.5 10.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, color: "text-[#34A853]" },
  get_metrics: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M2.5 13.5V8.5H5.5V13.5H2.5ZM7.5 13.5V4.5H10.5V13.5H7.5ZM12.5 13.5V10.5H15.5V13.5H12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: "text-[#34A853]" },
  search_knowledge_base: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M7 2.5C4.51472 2.5 2.5 4.51472 2.5 7C2.5 9.48528 4.51472 11.5 7 11.5C9.48528 11.5 11.5 9.48528 11.5 7C11.5 4.51472 9.48528 2.5 7 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: "text-[#F4B400]" },
  validate_syntax: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 2.5L3.5 4.5V8.5C3.5 11.2614 5.73858 13.5 8.5 13.5C11.2614 13.5 13.5 11.2614 13.5 8.5V4.5L8 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: "text-[#326CE5]" },
  unknown: { icon: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/></svg>, color: "text-tertiary" },
};

const formatContent = (content: string) => {
  if (!content) return "";
  
  let result = content;
  try {
    // Try to parse the top-level string
    let parsed = JSON.parse(content);
    
    // If the result is another string (double-encoded), parse it again
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        // Stay with first-level string
      }
    }

    if (typeof parsed === 'object' && parsed !== null) {
      // 1. Handle standard tool output with 'content'
      if ('content' in parsed && typeof parsed.content === 'string') {
        result = parsed.content;
      } 
      // 2. Handle command results with stdout/stderr
      else if ('stdout' in parsed || 'stderr' in parsed) {
        result = [parsed.stdout, parsed.stderr].filter(Boolean).join('\n');
      }
      // 3. Fallback to pretty-print the object
      else {
        result = JSON.stringify(parsed, null, 2);
      }
    } else {
      result = String(parsed);
    }
  } catch {
    // Not valid JSON, keep as is
    result = content;
  }

  // Final cleanup: if the string still contains literal \n sequences 
  // (often happens when tools output raw Python/Shell strings)
  return result
    .replace(/\\n/g, '\n')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\"/g, '"');
};

export default function ActionLog({ events, incidentId, onOpenPR }: ActionLogProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const actionEvents = events.filter(
    (e) => e.type === "action" || e.type === "result" || e.type === "approval_required",
  );

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [actionEvents.length]);

  const handleApprove = async (step: number, approved: boolean) => {
    setIsSubmitting(true);
    try {
      await fetch(`${API_URL}/api/v1/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, step }),
      });
    } catch (err) {
      console.error("Failed to approve action:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResolved = events.some(e => e.type === "resolved");
  const hasReport = events.some(e => e.type === "report");

  const handleDownloadReport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/incidents/${incidentId}/report`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const report = await res.json();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.report_id || incidentId}_report.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report:", err);
    }
  };

  return (
    <aside className="w-full flex flex-col linear-sidebar shrink-0 h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--linear-border)] flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-primary">Tool Activity</h2>
        <div className="flex gap-2">
        {(isResolved || hasReport) && (
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#5E6AD2] hover:text-white bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/30 px-2.5 py-1 rounded-md border border-[#5E6AD2]/20 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2.5V10.5M8 10.5L4.5 7M8 10.5L11.5 7M3.5 13.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Report
          </button>
        )}
        {events.some(e => e.type === "result" && e.metadata.diff) && onOpenPR && (
          <button
            onClick={onOpenPR}
            className="flex items-center gap-1.5 text-[11px] font-medium text-[#34A853] hover:text-white bg-[#34A853]/10 hover:bg-[#34A853]/30 px-2.5 py-1 rounded-md border border-[#34A853]/20 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 11l6 3 6-3M2 8l6 3 6-3M2 5l6-3 6 3-6 3-6-3Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            View PR Diff
          </button>
        )}
        </div>
      </div>

      {/* Timeline */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scroll-smooth"
      >
        {actionEvents.length === 0 && (
          <div className="px-4 py-6 text-center text-tertiary text-[13px]">
            No activity yet.
          </div>
        )}

        {actionEvents.map((event, i) => {
          const tool = event.metadata.tool || "unknown";
          const cfg = TOOL_CONFIG[tool] || TOOL_CONFIG.unknown;
          const isResult = event.type === "result";
          const isApproval = event.type === "approval_required";
          const isHandled = i < actionEvents.length - 1;
          const hasError = event.content.toLowerCase().includes("error") || event.content.toLowerCase().includes("denied");
          const isExpanded = expandedIndex === i;
          
          const formatted = formatContent(event.content);
          let displayContent = formatted;
          if (!isExpanded && formatted.length > 60) {
            displayContent = formatted.slice(0, 60) + "...";
          }

          return (
            <div
              key={`action-${i}`}
              className={`w-full text-left px-3 py-2 rounded-[6px] transition-colors group ${
                isApproval && !isHandled 
                  ? "bg-[#E95460]/10 border border-[#E95460]/30" 
                  : isExpanded 
                    ? "bg-[var(--linear-hover-active)]" 
                    : "hover:bg-[var(--linear-hover)]"
              }`}
            >
              <div 
                className="flex items-start gap-2.5 cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <div className={`mt-0.5 ${cfg.color}`}>
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-primary flex items-center gap-2">
                      {tool}
                      {isApproval && !isHandled && (
                        <span className="bg-[#E95460] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Action Required
                        </span>
                      )}
                    </span>
                    {isResult && (
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wide ${
                          hasError ? "text-[#E95460]" : "text-[#34A853]"
                        }`}
                      >
                        {hasError ? "FAIL" : "OK"}
                      </span>
                    )}
                  </div>

                  <div className={`text-[12px] font-mono leading-relaxed break-words ${
                    isExpanded ? "text-primary whitespace-pre-wrap mt-1.5" : "text-tertiary truncate"
                  }`}>
                    {displayContent}
                  </div>

                  {/* Approval UI */}
                  {isApproval && !isHandled && (
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleApprove(event.step, true)}
                        disabled={isSubmitting}
                        className="flex-1 bg-[#34A853] hover:bg-[#34A853]/80 text-white text-[12px] font-medium py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(event.step, false)}
                        disabled={isSubmitting}
                        className="flex-1 bg-[#E95460] hover:bg-[#E95460]/80 text-white text-[12px] font-medium py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  )}

                  {event.metadata.pr_url && (
                    <a
                      href={event.metadata.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[#5E6AD2] hover:text-white transition-colors group/link bg-[#5E6AD2]/10 px-2.5 py-1 rounded-md border border-[#5E6AD2]/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5V11.5M11.5 8.5V11.5M11.5 8.5C11.5 6.29086 9.70914 4.5 7.5 4.5H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="4.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="11.5" cy="12.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="4.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                      View Pull Request
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
