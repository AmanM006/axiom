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
    | "error"
    | "approval_required"
    | "report";
  step: number;
  content: string;
  metadata: AgentEventMetadata & { report_id?: string; step?: number; args?: Record<string, unknown> };
}

export type AgentStatus = "idle" | "running" | "resolved" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface IncidentState {
  events: AgentEvent[];
  status: AgentStatus;
  isPaused: boolean;
  elapsedMs: number;
}

const DEFAULT_STATE: IncidentState = {
  events: [],
  status: "idle",
  isPaused: false,
  elapsedMs: 0,
};

export function useAgentStream() {
  const [stateMap, setStateMap] = useState<Record<string, IncidentState>>({});
  const [currentIncidentId, setCurrentIncidentId] = useState<string | null>(null);
  
  const eventSourcesRef = useRef<Record<string, EventSource>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const startTimeRef = useRef<Record<string, number>>({});
  const pausedAtRef = useRef<Record<string, number>>({});
  const totalPausedMsRef = useRef<Record<string, number>>({});

  const stopStream = useCallback((incidentId: string) => {
    if (eventSourcesRef.current[incidentId]) {
      eventSourcesRef.current[incidentId].close();
      delete eventSourcesRef.current[incidentId];
    }
    if (timersRef.current[incidentId]) {
      clearInterval(timersRef.current[incidentId]);
      delete timersRef.current[incidentId];
    }
  }, []);

  const startStream = useCallback(
    (incidentId: string) => {
      stopStream(incidentId);
      setCurrentIncidentId(incidentId);
      
      setStateMap(prev => ({
        ...prev,
        [incidentId]: { ...DEFAULT_STATE, status: "running" }
      }));
      
      startTimeRef.current[incidentId] = Date.now();
      totalPausedMsRef.current[incidentId] = 0;
      pausedAtRef.current[incidentId] = 0;

      timersRef.current[incidentId] = setInterval(() => {
        if (!pausedAtRef.current[incidentId]) {
          const elapsed = Date.now() - startTimeRef.current[incidentId] - (totalPausedMsRef.current[incidentId] || 0);
          setStateMap(prev => ({
            ...prev,
            [incidentId]: { ...prev[incidentId], elapsedMs: elapsed }
          }));
        }
      }, 100);

      // Load config from local storage
      let queryParams = "";
      const savedConfig = localStorage.getItem("axiom_config");
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          const params = new URLSearchParams();
          if (config.githubToken) params.append("github_token", config.githubToken);
          if (config.repoName) params.append("repo_name", config.repoName);
          if (config.supabaseUrl) params.append("supabase_url", config.supabaseUrl);
          if (config.supabaseKey) params.append("supabase_key", config.supabaseKey);
          if (params.toString()) queryParams = `?${params.toString()}`;
        } catch (e) {
          console.error("Failed to parse config for stream", e);
        }
      }

      const es = new EventSource(`${API_URL}/run/${incidentId}${queryParams}`, {
        withCredentials: false,
      });
      eventSourcesRef.current[incidentId] = es;

      es.onmessage = (e: MessageEvent) => {
        try {
          const event: AgentEvent = JSON.parse(e.data);
          
          setStateMap(prev => {
            const current = prev[incidentId] || { ...DEFAULT_STATE };
            const newEvents = [...current.events, event];
            let newStatus = current.status;
            let newPaused = current.isPaused;

            if (event.type === "approval_required") {
              newPaused = true;
              pausedAtRef.current[incidentId] = Date.now();
            } else if (event.type === "result") {
              if (pausedAtRef.current[incidentId]) {
                totalPausedMsRef.current[incidentId] = (totalPausedMsRef.current[incidentId] || 0) + (Date.now() - pausedAtRef.current[incidentId]);
                pausedAtRef.current[incidentId] = 0;
              }
              newPaused = false;
            }

            if (event.type === "resolved") {
              newStatus = "resolved";
              stopStream(incidentId);
              // Notify backend so it flips metrics to healthy
              fetch(`${API_URL}/incidents/${incidentId}/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summary: event.content }),
              }).catch(() => {});
            } else if (event.type === "error") {
              newStatus = "error";
              stopStream(incidentId);
            }

            return {
              ...prev,
              [incidentId]: { ...current, events: newEvents, status: newStatus, isPaused: newPaused }
            };
          });
        } catch {
          console.error("Failed to parse SSE event:", e.data);
        }
      };

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          setStateMap(prev => ({
            ...prev,
            [incidentId]: { ...prev[incidentId], status: prev[incidentId]?.status === "running" ? "resolved" : prev[incidentId]?.status }
          }));
          stopStream(incidentId);
        }
      };
    },
    [stopStream],
  );

  useEffect(() => {
    return () => {
      Object.keys(eventSourcesRef.current).forEach(id => stopStream(id));
    };
  }, [stopStream]);

  // Return the state for a specific incident if requested, or the current one
  const getIncidentData = (id: string) => stateMap[id] || DEFAULT_STATE;

  return { getIncidentData, startStream, stopStream };
}
