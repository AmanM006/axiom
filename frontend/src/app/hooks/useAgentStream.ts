"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface AgentEventMetadata {
  confidence?: number;
  tool?: string;
  action_args?: Record<string, unknown>;
  reward?: number;
  pr_url?: string;
  pr_number?: number;
  diff?: { before: string; after: string };
  streaming?: boolean;
  complete?: boolean;
  parsed?: Record<string, unknown>;
  error_rate?: number;
  latency_ms?: number;
  fallback?: boolean;
  error?: string;
}

export interface AgentEvent {
  type:
    | "hypothesis"
    | "action"
    | "result"
    | "verify"
    | "replan"
    | "resolved"
    | "error";
  step: number;
  content: string;
  metadata: AgentEventMetadata;
}

export type AgentStatus = "idle" | "running" | "resolved" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useAgentStream() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    (incidentId: string) => {
      stopStream();
      setEvents([]);
      setStatus("running");
      setElapsedMs(0);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);

      const es = new EventSource(`${API_URL}/run/${incidentId}`, {
        withCredentials: false,
      });
      eventSourceRef.current = es;

      es.onmessage = (e: MessageEvent) => {
        try {
          const event: AgentEvent = JSON.parse(e.data);
          setEvents((prev) => [...prev, event]);

          if (event.type === "resolved") {
            setStatus("resolved");
            stopStream();
          } else if (event.type === "error") {
            setStatus("error");
            stopStream();
          }
        } catch {
          console.error("Failed to parse SSE event:", e.data);
        }
      };

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          setStatus((prev) => (prev === "running" ? "resolved" : prev));
          stopStream();
        }
      };
    },
    [stopStream],
  );

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return { events, status, elapsedMs, startStream, stopStream };
}
