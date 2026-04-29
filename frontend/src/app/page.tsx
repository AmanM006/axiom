"use client";

import { useState, useMemo, useCallback } from "react";
import StatusHeader from "./components/StatusHeader";
import IncidentPanel from "./components/IncidentPanel";
import ReasoningTrace from "./components/ReasoningTrace";
import ActionLog from "./components/ActionLog";
import PRViewer from "./components/PRViewer";
import { useAgentStream } from "./hooks/useAgentStream";

export default function Home() {
  const [selectedIncident, setSelectedIncident] = useState("");
  const [showPR, setShowPR] = useState(true);
  const { events, status, elapsedMs, startStream } = useAgentStream();

  const totalReward = useMemo(() => {
    let reward = 0;
    for (const e of events) {
      if (e.metadata.reward !== undefined) {
        reward += e.metadata.reward;
      }
    }
    return reward;
  }, [events]);

  const hasPR = useMemo(() => {
    return events.some(
      (e) =>
        e.type === "result" &&
        e.metadata.diff !== undefined,
    );
  }, [events]);

  const handleStartAgent = useCallback(() => {
    if (selectedIncident && status !== "running") {
      setShowPR(true);
      startStream(selectedIncident);
    }
  }, [selectedIncident, status, startStream]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <StatusHeader
        status={status}
        elapsedMs={elapsedMs}
        totalReward={totalReward}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <IncidentPanel
          selectedIncident={selectedIncident}
          onSelectIncident={setSelectedIncident}
          onStartAgent={handleStartAgent}
          agentStatus={status}
        />
        <ReasoningTrace events={events} />
        <ActionLog events={events} />
      </div>

      {/* PR Viewer */}
      {hasPR && showPR && (
        <PRViewer events={events} onDismiss={() => setShowPR(false)} />
      )}
    </div>
  );
}
