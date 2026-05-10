"use client";

import { useEffect, useRef, useMemo } from "react";
import { AgentEvent } from "../hooks/useAgentStream";

interface ReasoningTraceProps {
  events: AgentEvent[];
}

interface GroupedStep {
  step: number;
  type: string;
  content: string;
  confidence: number;
  isStreaming: boolean;
  isResolved: boolean;
}

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: JSX.Element;
    color: string;
  }
> = {
  hypothesis: {
    label: "Hypothesis",
    color: "text-[#5E6AD2]",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="currentColor">
        <path d="M8 2.5C5.5 2.5 3.5 4.5 3.5 7C3.5 8.5 4.2 9.8 5.4 10.6C5.7 10.8 6 11.2 6 11.6V12.5C6 13.1 6.4 13.5 7 13.5H9C9.6 13.5 10 13.1 10 12.5V11.6C10 11.2 10.3 10.8 10.6 10.6C11.8 9.8 12.5 8.5 12.5 7C12.5 4.5 10.5 2.5 8 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 15.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  action: {
    label: "Action",
    color: "text-secondary",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="currentColor">
         <path d="M13.5 8L8 13.5M8 2.5V13.5V2.5ZM2.5 8L8 2.5L2.5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  result: {
    label: "Result",
    color: "text-secondary",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="currentColor">
         <path d="M2.5 8H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
         <path d="M9.5 4L13.5 8L9.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  verify: {
    label: "Verify",
    color: "text-tertiary",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="currentColor">
         <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
         <path d="M15.5 15.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  replan: {
    label: "Replan",
    color: "text-[#F2C94C]",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="currentColor">
        <path d="M13.5 8C13.5 11.0376 11.0376 13.5 8 13.5C4.96243 13.5 2.5 11.0376 2.5 8C2.5 4.96243 4.96243 2.5 8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 5V2.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  resolved: {
    label: "Resolved",
    color: "text-[#34A853]",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="currentColor">
         <path d="M13.5 4.5L6.5 11.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  error: {
    label: "Error",
    color: "text-[#E95460]",
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="currentColor">
         <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

export default function ReasoningTrace({ events }: ReasoningTraceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupedSteps = useMemo(() => {
    const steps: GroupedStep[] = [];
    let currentHypothesis = "";

    for (const event of events) {
      if (event.type === "report") continue;
      if (
        event.type === "hypothesis" &&
        event.metadata.streaming &&
        !event.metadata.complete
      ) {
        currentHypothesis += event.content;
        const existing = steps.find(
          (s) => s.step === event.step && s.type === "hypothesis",
        );
        if (existing) {
          existing.content = currentHypothesis;
          existing.isStreaming = true;
        } else {
          steps.push({
            step: event.step,
            type: "hypothesis",
            content: currentHypothesis,
            confidence: 0,
            isStreaming: true,
            isResolved: false,
          });
        }
      } else if (event.type === "hypothesis" && event.metadata.complete) {
        const existing = steps.find(
          (s) => s.step === event.step && s.type === "hypothesis",
        );
        if (existing) {
          existing.isStreaming = false;
          existing.confidence = event.metadata.confidence || 0;
        }
        currentHypothesis = "";
      } else {
        steps.push({
          step: event.step,
          type: event.type,
          content: event.content,
          confidence: event.metadata.confidence || 0,
          isStreaming: false,
          isResolved: event.type === "resolved",
        });
      }
    }
    return steps;
  }, [events]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [groupedSteps]);

  return (
    <section className="flex-1 flex flex-col min-w-0 linear-bg">
      {/* Header */}
      <div className="px-6 py-3 border-b border-[var(--linear-border)] flex justify-between items-center bg-[var(--linear-bg)] z-10">
        <h2 className="text-[14px] font-medium text-primary flex items-center gap-2">
          Agent Reasoning
        </h2>
        {groupedSteps.length > 0 && (
          <span className="text-[12px] text-tertiary">
            {groupedSteps.length} steps
          </span>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {groupedSteps.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-tertiary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-50">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[13px]">Select an incident to view reasoning</p>
          </div>
        )}

        {groupedSteps.map((step, i) => {
          const cfg = TYPE_CONFIG[step.type] || TYPE_CONFIG.action;
          const isCode = step.type === "action" || step.type === "result";

          return (
            <div key={`${step.step}-${step.type}-${i}`} className="flex gap-4 group">
               {/* Left Timeline Column */}
               <div className="w-10 flex flex-col items-center shrink-0">
                  <div className={`w-6 h-6 rounded flex items-center justify-center bg-[var(--linear-surface)] border border-[var(--linear-border)] ${cfg.color}`}>
                     {cfg.icon}
                  </div>
                  {i < groupedSteps.length - 1 && (
                     <div className="w-px bg-[var(--linear-border)] flex-1 my-1.5" />
                  )}
               </div>

               {/* Right Content Column */}
               <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-1.5 pt-0.5">
                     <span className={`text-[12px] font-medium ${cfg.color}`}>
                       {cfg.label}
                     </span>
                     <span className="text-[11px] text-tertiary">
                       Step {step.step}
                     </span>
                     
                     {step.type === "hypothesis" && step.confidence > 0 && !step.isStreaming && (
                        <span className="ml-2 text-[11px] text-tertiary flex items-center gap-1">
                           Conf: 
                           <span className={step.confidence >= 0.8 ? "text-[#34A853]" : "text-[#F2C94C]"}>
                             {Math.round(step.confidence * 100)}%
                           </span>
                        </span>
                     )}
                  </div>
                  
                  <div className={`text-[13px] leading-relaxed ${isCode ? "font-mono text-secondary bg-[#121315] border border-[var(--linear-border)] rounded-md p-3 text-[12px] whitespace-pre-wrap break-all" : "text-primary"}`}>
                     {step.content}
                     {step.isStreaming && <span className="inline-block w-1.5 h-3.5 bg-[#5E6AD2] ml-1 align-middle animate-pulse" />}
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
