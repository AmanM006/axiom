"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUpRight, Plus, Minus, ArrowDown, Terminal, Cloud, Layers,
  Calendar, FileText, CheckCircle2, Activity, Send, Settings, Sidebar,
  X, Bot, User, Check, Globe, Sparkles, Database, Shield, BookOpen,
  FlaskConical, BarChart3, Zap, ChevronRight, LucideIcon, Bell, Clock, Search, List, ChevronDown, Layout
} from "lucide-react";

// ── Dashboard Data ─────────────────────────────────────────────────────────────
const REASONING_STEPS = [
  "Fetching recent telemetry for payment-service in production namespace...",
  "Detected 503 Service Unavailable spikes correlating with db-cluster-01 latency.",
  "Analyzing database metrics: connection pool at 98% utilization.",
  "Found unclosed idle transactions from checkout-v2 deployment.",
  "Root cause identified: Connection pool exhaustion leading to cascading failures.",
  "Formulating mitigation strategy: scale connection pool and kill idle sessions."
];

const TOOL_ACTIVITY = [
  { time: "12:04:12", tool: "K8s Get Logs", status: "Success" },
  { time: "12:04:15", tool: "Prometheus Query", status: "Success" },
  { time: "12:04:22", tool: "SQL Describe Sessions", status: "Success" },
  { time: "12:04:28", tool: "K8s Patch Config", status: "Running" }
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

// ── Onboarding types ──────────────────────────────────────────────────────────
interface OnboardingMsg { role: "assistant" | "user"; content: string; type?: string; }
interface OnboardingState {
  step: number;
  plan?: string;   // "developer" | "startup" | "enterprise"
  orgName?: string;
  system?: string;
  portalUrl?: string;
  actions: string[];
  contact?: string;   // email for enterprise
}
interface ActionOption {
  label: string;
  value: string;
  icon: LucideIcon;
}

const ACTION_OPTIONS: ActionOption[] = [
  { label: "Analyze logs", value: "analyze_logs", icon: BarChart3 },
  { label: "Check metrics", value: "check_metrics", icon: Activity },
  { label: "Restart services", value: "restart_services", icon: Zap },
  { label: "Scale deployments", value: "scale_deploy", icon: Layers },
  { label: "Query databases", value: "query_db", icon: Database },
  { label: "Run playbooks", value: "run_playbooks", icon: Shield },
];

const SYSTEM_OPTIONS = ["Kubernetes", "AWS ECS", "Datadog", "Custom Cloud"];

const ACTION_LABELS: Record<string, string> = {
  analyze_logs: "Log analysis", check_metrics: "Metrics tracking",
  restart_services: "Service restarts", scale_deploy: "Auto-scaling",
  query_db: "Database queries", run_playbooks: "Playbook execution",
};

const AGENT_STEPS = [
  "Connecting to cluster…", "Authenticating credentials…",
  "Mapping microservices…", "Indexing logs & metrics…",
  "Learning architecture…", "Saving playbooks…", "Done ✓",
];

function detectPortalType(url: string) {
  if (url.includes("k8s") || url.includes("eks")) return "Kubernetes";
  if (url.includes("aws")) return "AWS ECS";
  if (url.includes("datadog")) return "Datadog";
  return "Custom Cloud";
}

// ── ONBOARDING MODAL ──────────────────────────────────────────────────────────
function OnboardingModal({ plan, onClose }: { plan: "developer" | "startup" | "enterprise"; onClose: () => void }) {
  const [messages, setMessages] = useState<OnboardingMsg[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [state, setState] = useState<OnboardingState>({ step: 0, plan, actions: [] });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [agentStep, setAgentStep] = useState<number>(-1);  // -1 = not running
  const [done, setDone] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, agentStep]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  const addAssistant = useCallback((text: string, extra?: Partial<OnboardingMsg>) => {
    setIsTyping(true);
    const delay = Math.min(1400, text.length * 14);
    setTimeout(() => {
      setMessages(p => [...p, { role: "assistant", content: text, ...extra }]);
      setIsTyping(false);
    }, delay);
  }, []);

  useEffect(() => {
    const planLabel = plan === "developer" ? "Developer Plan" : plan === "startup" ? "Startup Plan" : "Enterprise";
    const intro = plan === "enterprise"
      ? `Hey! 👋 You've selected the **${planLabel}** plan — great choice for multi-cloud deployments.\n\nLet's start. **What's your organization or company name?**`
      : `Hey! 👋 You've selected the **${planLabel}** plan.\n\nI'll walk you through connecting your cloud environment so engineers can resolve incidents, check metrics, and scale services through one AI chat.\n\n**What's your organization or company name?**`;
    setTimeout(() => addAssistant(intro), 400);
  }, []); // eslint-disable-line

  const addUser = (text: string) =>
    setMessages(p => [...p, { role: "user", content: text }]);

  const advance = useCallback((userText: string, patch: Partial<OnboardingState>) => {
    addUser(userText);
    const next: OnboardingState = { ...state, ...patch, step: state.step + 1 };
    setState(next);
    // Removed Supabase code, you can connect your backend here later
    console.log("Saving environment setup for:", next.orgName);

    setTimeout(() => {
      if (next.step === 1) {
        addAssistant(`Nice! And what **infrastructure system** does ${next.orgName} use?`);
      } else if (next.step === 2) {
        addAssistant(`Got it — **${next.system}**.\n\nNow paste your cluster or observability **endpoint URL**:\n(e.g. https://api.k8s.cluster.local)`);
      } else if (next.step === 3) {
        const type = detectPortalType(next.portalUrl || "");
        addAssistant(`✅ Environment detected: **${type}** at \`${next.portalUrl}\`\n\nWhich workflows should I automate? Select all that apply:`);
      }
    }, 200);
  }, [state, addAssistant]);

  const confirmActions = useCallback(async () => {
    if (selected.size === 0) return;
    const actions = Array.from(selected);
    addUser(`Automate: ${actions.map(a => ACTION_LABELS[a]).join(", ")}`);
    const next = { ...state, actions, step: state.step + 1 };
    setState(next);

    setTimeout(() => {
      addAssistant(`Perfect — ${actions.length} workflow${actions.length > 1 ? "s" : ""} selected.\n\nLet me **learn your architecture** now. I'll scan the cluster and map out the data endpoints. This takes about 30 seconds.`);
    }, 200);

    setTimeout(async () => {
      for (let i = 0; i < AGENT_STEPS.length; i++) {
        setAgentStep(i);
        await new Promise(r => setTimeout(r, i === 1 ? 900 : 500 + Math.random() * 300));
      }

      setAgentStep(AGENT_STEPS.length);

      setTimeout(() => {
        const planDetails = plan === "developer"
          ? "Your **Developer Plan** is live. You can start debugging immediately."
          : plan === "startup"
            ? "Your **Startup Plan** is configured. Head to the dashboard to invite your team."
            : "Our enterprise team will contact you within 24 hours to finalise your custom setup.";

        addAssistant(`🎉 **${next.orgName} is connected!**\n\nI've learned ${actions.length} workflow${actions.length > 1 ? "s" : ""}:\n${actions.map(a => `• ${ACTION_LABELS[a]}`).join("\n")}\n\n${planDetails}`);
        setDone(true);
      }, 600);
    }, 2200);
  }, [selected, state, plan, addAssistant]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    setInput("");

    if (state.step === 0) {
      advance(text, { orgName: text });
    } else if (state.step === 2) {
      if (!text.startsWith("http")) {
        addAssistant("⚠️ Please enter a valid URL starting with `http://` or `https://`");
        return;
      }
      advance(text, { portalUrl: text });
    } else if (plan === "enterprise" && state.step === 4) {
      addUser(text);
      setState(p => ({ ...p, contact: text, step: 5 }));
      addAssistant(`✅ Got it — we'll reach out to **${text}** within 24 hours.\n\nIn the meantime, want to configure which workflows to automate?`);
    }
  };

  const showInput = [0, 2].includes(state.step) && !done;
  const showSystemSelect = state.step === 1 && !isTyping;
  const showActionSelect = state.step === 3 && !isTyping && agentStep === -1;
  const agentRunning = agentStep >= 0 && agentStep < AGENT_STEPS.length;
  const agentDone = agentStep >= AGENT_STEPS.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      animation: "oFadeIn 0.25s ease",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: "100%", maxWidth: 640, height: "85vh", maxHeight: 780,
        background: "#0a0a10",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "oSlideUp 0.3s ease",
        boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(75,123,245,0.15)",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg,rgba(75,123,245,0.1),rgba(45,92,233,0.05))",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,#4b7bf5,#2d5ce9)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
                AXIOM Setup
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>
                {plan === "developer" ? "Developer Plan" : plan === "startup" ? "Startup Plan" : "Enterprise"} · AI Onboarding
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.07)", border: "none",
            color: "rgba(255,255,255,0.5)", width: 30, height: 30,
            borderRadius: 8, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Progress dots */}
        <div style={{
          display: "flex", gap: 6, padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}>
          {["Organization", "System", "Endpoint", "Automate", "Learning", "Done"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.4s",
                background: i < state.step ? "#10b981" : i === state.step ? "#4b7bf5" : "rgba(255,255,255,0.07)",
                color: i <= state.step ? "#fff" : "rgba(255,255,255,0.3)",
                border: i === state.step ? "2px solid rgba(75,123,245,0.4)" : "none",
              }}>
                {i < state.step ? <Check size={10} /> : i + 1}
              </div>
              <span style={{ fontSize: 9, color: i === state.step ? "#4b7bf5" : "rgba(255,255,255,0.2)", fontWeight: i === state.step ? 700 : 400, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {label}
              </span>
              {i < 5 && <div style={{ width: 16, height: 1, background: i < state.step ? "#10b981" : "rgba(255,255,255,0.07)", transition: "background 0.4s" }} />}
            </div>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex", gap: 10,
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              animation: "oFadeIn 0.25s ease",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: msg.role === "assistant" ? "linear-gradient(135deg,#4b7bf5,#2d5ce9)" : "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {msg.role === "assistant" ? <Bot size={13} color="#fff" /> : <User size={13} color="#fff" />}
              </div>
              <div style={{
                maxWidth: "78%", fontSize: 13, lineHeight: 1.7,
                color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.85)",
                background: msg.role === "user" ? "#4b7bf5" : "rgba(255,255,255,0.04)",
                border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                fontFamily: "'DM Sans',sans-serif",
                whiteSpace: "pre-wrap",
              }}
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/`(.*?)`/g, "<code style='background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.87em'>$1</code>")
                    .replace(/\n/g, "<br/>"),
                }}
              />
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: "flex", gap: 10, animation: "oFadeIn 0.2s ease" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#4b7bf5,#2d5ce9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={13} color="#fff" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px 14px 14px 14px" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4b7bf5", animation: `oDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* System select buttons */}
          {showSystemSelect && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingLeft: 38, animation: "oFadeIn 0.2s ease" }}>
              {SYSTEM_OPTIONS.map(opt => (
                <button key={opt} onClick={() => advance(opt, { system: opt })} style={{
                  padding: "8px 14px", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100,
                  color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                }}
                  onMouseOver={e => { (e.currentTarget.style.background = "rgba(75,123,245,0.15)"); (e.currentTarget.style.borderColor = "rgba(75,123,245,0.4)"); (e.currentTarget.style.color = "#fff"); }}
                  onMouseOut={e => { (e.currentTarget.style.background = "rgba(255,255,255,0.04)"); (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"); (e.currentTarget.style.color = "rgba(255,255,255,0.7)"); }}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Action multi-select */}
          {showActionSelect && (
            <div style={{ paddingLeft: 38, display: "flex", flexDirection: "column", gap: 10, animation: "oFadeIn 0.2s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {ACTION_OPTIONS.map(opt => {
                  const sel = selected.has(opt.value);
                  const Icon = opt.icon as LucideIcon;
                  return (
                    <button key={opt.value} onClick={() => setSelected(p => { const n = new Set(p); n.has(opt.value) ? n.delete(opt.value) : n.add(opt.value); return n; })} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                      background: sel ? "rgba(75,123,245,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${sel ? "rgba(75,123,245,0.4)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                      fontSize: 12, color: sel ? "#4b7bf5" : "rgba(255,255,255,0.65)", transition: "all 0.2s",
                      textAlign: "left",
                    }}>
                      <Icon size={13} style={{ color: sel ? "#4b7bf5" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                      {opt.label}
                      {sel && <Check size={11} style={{ color: "#4b7bf5", marginLeft: "auto", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={selected.size === 0}
                onClick={confirmActions}
                style={{
                  padding: "10px 18px", background: selected.size > 0 ? "#4b7bf5" : "rgba(255,255,255,0.04)",
                  border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: selected.size > 0 ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif",
                  opacity: selected.size > 0 ? 1 : 0.4, width: "fit-content",
                  display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s",
                }}>
                <Sparkles size={13} />
                Confirm {selected.size > 0 ? `${selected.size} workflow${selected.size > 1 ? "s" : ""}` : "selection"}
              </button>
            </div>
          )}

          {/* Agent execution panel */}
          {(agentRunning || agentDone) && (
            <div style={{
              marginLeft: 38,
              background: "#0a0a14",
              border: `1px solid ${agentDone ? "rgba(16,185,129,0.3)" : "rgba(14,165,233,0.25)"}`,
              borderRadius: 14, overflow: "hidden",
              animation: "oFadeIn 0.3s ease",
              transition: "border-color 0.4s",
            }}>
              <div style={{
                padding: "10px 14px",
                background: agentDone ? "rgba(16,185,129,0.08)" : "rgba(14,165,233,0.08)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {agentDone
                  ? <CheckCircle2 size={14} color="#10b981" />
                  : <div style={{ width: 14, height: 14, border: "2px solid rgba(14,165,233,0.3)", borderTopColor: "#0ea5e9", borderRadius: "50%", animation: "oSpin 0.7s linear infinite" }} />
                }
                <span style={{ fontSize: 11, fontWeight: 700, color: agentDone ? "#10b981" : "#0ea5e9", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {agentDone ? "Environment connected" : "AI agent running"}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono',monospace", marginLeft: "auto" }}>
                  {state.portalUrl}
                </span>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                {AGENT_STEPS.map((step, i) => {
                  const isRunning = i === agentStep && !agentDone;
                  const isDone = agentDone || i < agentStep;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      opacity: i > agentStep && !agentDone ? 0.3 : 1,
                      transition: "opacity 0.3s",
                    }}>
                      {isDone
                        ? <CheckCircle2 size={12} color="#10b981" style={{ flexShrink: 0 }} />
                        : isRunning
                          ? <div style={{ width: 12, height: 12, border: "2px solid rgba(14,165,233,0.3)", borderTopColor: "#0ea5e9", borderRadius: "50%", animation: "oSpin 0.7s linear infinite", flexShrink: 0 }} />
                          : <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0, margin: "0 3.5px" }} />
                      }
                      <span style={{
                        fontSize: 12, fontFamily: "'DM Mono',monospace",
                        color: isDone ? "rgba(255,255,255,0.7)" : isRunning ? "#fff" : "rgba(255,255,255,0.3)",
                        fontWeight: isRunning ? 600 : 400,
                      }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done CTA buttons */}
          {done && (
            <div style={{
              display: "flex", gap: 8, paddingLeft: 38,
              animation: "oFadeIn 0.3s ease", flexWrap: "wrap",
            }}>
              <a href="/chat" style={{
                padding: "9px 16px", background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10,
                color: "#10b981", fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                Agent Console <ChevronRight size={11} />
              </a>
              <a href="/dashboard" style={{
                padding: "9px 16px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                Infrastructure Dashboard <ChevronRight size={11} />
              </a>
              <button onClick={onClose} style={{
                padding: "9px 16px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
                color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}>
                Close
              </button>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input bar */}
        {showInput && (
          <div style={{ padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 12, padding: "9px 10px 9px 14px",
            }}>
              {state.step === 2 && <Globe size={13} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />}
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder={
                  state.step === 0 ? "Enter your company name…" :
                    state.step === 2 ? "https://your-cluster.api" :
                      "Type your answer…"
                }
                disabled={isTyping}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: input.trim() && !isTyping ? "#4b7bf5" : "rgba(255,255,255,0.07)",
                  border: "none", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: input.trim() && !isTyping ? 1 : 0.3, transition: "all 0.2s",
                }}>
                <Send size={13} color="#fff" />
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: 7, fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono',monospace" }}>
              {state.step === 0 && "Your company's official name"}
              {state.step === 2 && "Full URL including https://"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN LANDING PAGE ─────────────────────────────────────────────────────────
export default function AXIOM() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [extraMessages, setExtraMessages] = useState<{ role: string; text: string }[]>([]);

  // Onboarding modal state
  const [onboardingPlan, setOnboardingPlan] = useState<"developer" | "startup" | "enterprise" | null>(null);

  // Dashboard state
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageStep, setTriageStep] = useState(0);

  useEffect(() => {
    if (isTriaging && triageStep < REASONING_STEPS.length) {
      const timer = setTimeout(() => {
        setTriageStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTriaging, triageStep]);

  const handleStartTriage = () => {
    setIsTriaging(true);
    setTriageStep(0);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0a0a0a", color: "#fff", overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #4b7bf5; color: #fff; }
        a { text-decoration: none; color: inherit; }
        html { scroll-behavior: smooth; }

        @keyframes oFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes oSlideUp { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes oDot { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes oSpin { to{transform:rotate(360deg)} }

        .nav { position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:22px 40px;background:linear-gradient(to bottom,rgba(0,0,0,0.85) 0%,transparent 100%); }
        .nav-logo { font-size:18px;font-weight:700;letter-spacing:0.05em;color:#fff;cursor:pointer; }
        .nav-links { display:flex;gap:40px; }
        .nav-links a { font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:rgba(255,255,255,0.7);transition:color .2s;cursor:pointer;background:none;border:none; }
        .nav-links a:hover { color:#fff; }
        .nav-cta { font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:#fff;cursor:pointer;display:flex;align-items:center;gap:4px; }

        .s1 { position:relative;height:100vh;width:100vw;display:flex;flex-direction:column;background-color:#000;overflow:hidden; }
        .s1-gradient { position:absolute;inset:0;z-index:0;background-image:linear-gradient(180deg,transparent 65%,rgba(244,244,245,0.95) 90%,#f4f4f5 100%),radial-gradient(ellipse 170% 70% at 50% 85%,#4b7bf5 0%,#2d5ce9 20%,#0c1226 75%,#000 100%);pointer-events:none; }
        .s1-main { position:relative;z-index:2;flex:1;display:flex;justify-content:space-between;align-items:center;padding:0 40px;margin-top:40px; }
        .s1-left { display:flex;flex-direction:column;gap:24px; }
        .s1-headline { font-size:clamp(60px,8.5vw,120px);font-weight:500;line-height:0.95;letter-spacing:-0.03em;color:#fff; }
        .s1-headline-fade { color:rgba(255, 255, 255, 1); }
        .s1-right { max-width:280px;text-align:right;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.6);font-weight:400;align-self:flex-start;margin-top:80px; }

        .app-window-section { position:relative;z-index:5;background:#f4f4f5;padding:0 40px;display:flex;justify-content:center;margin-top:-40px; }
        .app-window-wrap { width:100%;max-width:1100px;margin:0 auto;transform:perspective(1800px) rotateX(2deg);transition:transform 0.4s ease; }
        .app-window-wrap:hover { transform:perspective(1800px) rotateX(0deg); }
        .window-chrome { background:#000;border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,0.08),0 40px 120px rgba(0,0,0,0.5),0 20px 40px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05); }
        .window-titlebar { background:#000;height:44px;display:flex;align-items:center;padding:0 16px;gap:8px;border-bottom:1px solid rgba(255,255,255,0.06); }
        .traffic-light { width:12px;height:12px;border-radius:50%; }
        .tl-red { background:#ff5f57; } .tl-yellow { background:#febc2e; } .tl-green { background:#28c840; }
        .window-title-center { flex:1;text-align:center;font-size:12px;color:rgba(255,255,255,0.4);font-family:'DM Mono',monospace;letter-spacing:0.02em; }
        
        .dash-layout { display:grid;grid-template-columns:220px 1fr;height:620px; }
        
        .dash-header-bar { height: 36px; background: #000; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b98166; }
        .dash-header-text { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); font-family: 'DM Mono', monospace; text-transform: uppercase; }

        .dash-sidebar { background: #000; border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; overflow-y: auto; scrollbar-width: none; }
        .dash-sidebar::-webkit-scrollbar { display: none; }
        .sidebar-section { padding: 16px 12px 8px; }
        .sidebar-label { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }
        .sidebar-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; font-size: 12px; color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s; margin-bottom: 1px; }
        .sidebar-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .sidebar-item.active { background: rgba(255,255,255,0.08); color: #fff; }
        .sidebar-item.incident { color: #f87171; background: rgba(248,113,113,0.05); border: 1px solid rgba(248,113,113,0.1); }
        
        .dash-main { background: #050505; display: flex; flex-direction: column; overflow: hidden; }
        .dash-top-action { padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; }
        .incident-badge { background: rgba(75,123,245,0.1); color: #4b7bf5; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
        .triage-btn { background: #fff; color: #000; font-size: 12px; font-weight: 700; padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: none; }
        .triage-btn:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); }
        .triage-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .dash-split { flex: 1; display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; }
        .dash-pane { border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; }
        .pane-header { padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }
        .pane-content { flex: 1; overflow-y: auto; padding: 24px; scrollbar-width: none; }
        .pane-content::-webkit-scrollbar { display: none; }
        
        .reasoning-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px; animation: oFadeIn 0.4s ease; border-left: 3px solid #4b7bf5; }
        .reasoning-text { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.6; font-family: 'DM Mono', monospace; }
        
        .activity-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 11px; font-family: 'DM Mono', monospace; }
        .activity-time { color: rgba(255,255,255,0.2); }
        .activity-tool { color: rgba(255,255,255,0.6); font-weight: 500; }
        .status-pill { padding: 2px 8px; border-radius: 40px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
        .status-success { background: rgba(16,185,129,0.1); color: #10b981; }
        .status-running { background: rgba(14,165,233,0.1); color: #0ea5e9; }

        .placeholder-text { color: rgba(255,255,255,0.15); font-size: 13px; text-align: center; margin-top: 100px; display: flex; flex-direction: column; align-items: center; gap: 16px; }

        .s2 { display:flex;flex-direction:column;height:95vh;align-items:center;background:#f4f4f5;padding:130px 40px 0; }
        .s2-grid { width:100%;max-width:1200px;display:grid;grid-template-columns:7fr 5fr;gap:80px;align-items:start; }
        .s2-headline { font-size:clamp(24px,3.5vw,44px);font-weight:400;line-height:1.25;letter-spacing:-0.02em;color:#111; }
        .s2-pill { display:inline-block;background:#111;color:#f4f4f5;padding:2px 20px 6px;border-radius:100px;font-size:clamp(22px,3.2vw,40px);font-weight:400;margin:0 4px;vertical-align:middle; }
        .s2-body { font-size:15px;color:rgba(0,0,0,0.6);line-height:1.7;margin-bottom:24px; }
        .s2-more { display:flex;align-items:center;gap:6px;padding-top:24px;border-top:1px solid rgba(0,0,0,0.1);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#000;cursor:pointer;transition:opacity .2s; }
        .s2-more:hover { opacity:0.6; }
        .s2-bottom-bar { display:flex;align-items:center;justify-content:space-between;padding:28px 0;border-top:1px solid rgba(0,0,0,0.9);margin-top:175px;width:100%;max-width:1500px; }
        .s2-b-text { font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:6px;color:#000; }
        .s2-b-tech { display:flex;gap:32px; }

        .s-image-section { min-height:100vh;position:relative;display:flex;align-items:center;padding:120px 40px;overflow:hidden; }
        .s-image-bg-right { position:absolute;right:0;top:0;width:55%;height:100%;background:url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000') center/cover;opacity:0.35;mask-image:linear-gradient(to left,black,transparent);-webkit-mask-image:linear-gradient(to left,black,transparent); }
        .s-image-bg-left { position:absolute;left:0;top:0;width:55%;height:100%;background:url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000') center/cover;opacity:0.3;mask-image:linear-gradient(to right,black,transparent);-webkit-mask-image:linear-gradient(to right,black,transparent); }
        .s-image-overlay { position:absolute;inset:0;background:linear-gradient(to bottom,#0a0a0a 0%,transparent 15%,transparent 85%,#0a0a0a 100%);z-index:1;pointer-events:none; }
        .s-image-content { position:relative;z-index:2;width:100%;max-width:1200px;margin:0 auto;display:flex; }
        .s-image-text { max-width:550px; }
        .s-image-eyebrow { font-family:'DM Mono',monospace;color:#4b7bf5;text-transform:uppercase;letter-spacing:0.2em;font-size:12px;margin-bottom:24px;display:block; }
        .s-image-title { font-size:clamp(40px,5vw,64px);font-weight:500;line-height:1.1;color:#fff;margin-bottom:24px; }
        .s-image-desc { font-size:18px;color:rgba(255,255,255,0.6);line-height:1.7; }

        .s5-cap { height:100vh;background:#000;padding:80px 40px 40px;display:flex;align-items:center; }
        .s5-grid { width:100%;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center; }
        .cap-item { padding:24px 0;border-top:1px solid rgba(255,255,255,0.1);display:grid;grid-template-columns:48px 1fr;gap:20px;transition:border-color 0.3s; }
        .cap-item:hover { border-top-color:#4b7bf5; }
        .cap-icon-box { width:48px;height:48px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center; }
        .cap-item-title { font-size:22px;font-weight:500;color:#fff;margin-bottom:10px; }
        .cap-item-desc { font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6; }

        /* ── PRICING ── */
        .pricing-section { height:100vh;padding:100px 40px 40px;background:#000;display:flex;align-items:center;overflow:hidden; }
        .pricing-inner { width:100%;max-width:1200px;margin:0 auto; }
        .pricing-header { display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:end;margin-bottom:24px; }
        .pricing-eyebrow { font-family:'DM Mono',monospace;color:#4b7bf5;text-transform:uppercase;letter-spacing:0.2em;font-size:12px;margin-bottom:20px;display:block; }
        .pricing-title { font-size:clamp(34px,4vw,52px);font-weight:500;line-height:1.05;color:#fff;letter-spacing:-0.03em; }
        .pricing-subtitle { font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;max-width:360px; }
        .pricing-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:18px; }
        .pricing-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:24px;display:flex;flex-direction:column;transition:border-color 0.3s,background 0.3s;position:relative;overflow:hidden; }
        .pricing-card:hover { border-color:rgba(75,123,245,0.4);background:rgba(75,123,245,0.04); }
        .pricing-card.featured { border-color:#4b7bf5;background:rgba(75,123,245,0.08); }
        .pricing-card.featured::before { content:'RECOMMENDED';position:absolute;top:18px;right:18px;font-size:9px;font-weight:700;letter-spacing:0.12em;color:#4b7bf5;background:rgba(75,123,245,0.15);padding:4px 10px;border-radius:100px;border:1px solid rgba(75,123,245,0.3); }
        .plan-name { font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:16px; }
        .plan-price { font-size:40px;font-weight:500;letter-spacing:-0.04em;color:#fff;line-height:1;margin-bottom:4px; }
        .plan-price span { font-size:16px;font-weight:400;color:rgba(255,255,255,0.4);vertical-align:top;margin-top:8px;display:inline-block; }
        .plan-unit { font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:20px; }
        .plan-divider { height:1px;background:rgba(255,255,255,0.08);margin-bottom:20px; }
        .plan-features { display:flex;flex-direction:column;gap:10px;flex:1; }
        .plan-feature { display:flex;align-items:flex-start;gap:8px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.4; }
        .plan-feature-dot { width:5px;height:5px;border-radius:50%;background:#4b7bf5;flex-shrink:0;margin-top:5px; }

        .plan-cta {
          margin-top:20px;padding:13px 0;
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
          border-radius:10px;font-size:11px;font-weight:700;letter-spacing:0.05em;
          text-transform:uppercase;color:rgba(255,255,255,0.6);
          cursor:pointer;text-align:center;transition:all 0.2s;
          display:flex;align-items:center;justify-content:center;gap:6px;
          font-family:'DM Sans',sans-serif;
        }
        .plan-cta:hover {
          background:rgba(255,255,255,0.12);color:#fff;
          border-color:rgba(255,255,255,0.25);
          transform:translateY(-1px);
          box-shadow:0 4px 20px rgba(0,0,0,0.3);
        }
        .pricing-card.featured .plan-cta {
          background:#4b7bf5;border-color:#4b7bf5;color:#fff;
        }
        .pricing-card.featured .plan-cta:hover {
          background:#2d5ce9;border-color:#2d5ce9;
          box-shadow:0 4px 24px rgba(75,123,245,0.5);
        }

        .pricing-market { margin-top:32px;padding:22px 32px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px; }
        .market-stat-num { font-size:34px;font-weight:500;letter-spacing:-0.03em;color:#fff;margin-bottom:3px; }
        .market-stat-label { font-size:12px;color:rgba(255,255,255,0.35); }

        .faq-section { height:100vh;padding:0 40px;background:#000000;padding-top:350px;display:flex;align-items:center; }
        .faq-inner { width:100%;max-width:1200px;margin:0 auto; }
        .faq-header { margin-bottom:48px; }
        .faq-title { font-size:clamp(36px,4.5vw,56px);font-weight:500;line-height:1.05;color:#fff;letter-spacing:-0.03em; }
        .faq-list { border-top:1px solid rgba(255,255,255,0.1); }
        .faq-row { border-bottom:1px solid rgba(255,255,255,0.08); }
        .faq-btn { display:flex;justify-content:space-between;align-items:center;gap:20px;padding:22px 0;cursor:pointer;transition:opacity .2s;width:100%;background:none;border:none;text-align:left; }
        .faq-btn:hover { opacity:0.7; }
        .faq-q { font-size:17px;font-weight:400;color:#fff; }
        .faq-ico { width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .25s;color:#fff; }
        .faq-ico.open { background:#4b7bf5;border-color:#4b7bf5; }
        .faq-ans { overflow:hidden;transition:max-height .4s ease,opacity .4s ease; }
        .faq-ans-inner { padding-bottom:20px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7;max-width:800px; }

        .footer { background:#000;padding:250px 40px 0;border-top:1px solid rgba(255,255,255,0.05); }
        .footer-top { display:flex;justify-content:space-between;align-items:center;padding-bottom:80px;flex-wrap:wrap;gap:24px; }
        .footer-links { display:flex;gap:32px;flex-wrap:wrap; }
        .footer-links a { font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:rgba(255,255,255,0.5);transition:color .2s;font-weight:500; }
        .footer-links a:hover { color:#fff; }
        .footer-word { font-size:clamp(80px,18vw,240px);font-weight:900;letter-spacing:-0.04em;line-height:0.75;text-align:center;color:#fff;user-select:none;overflow:hidden; }
      ` }} />

      {/* ── Onboarding modal ── */}
      {onboardingPlan && (
        <OnboardingModal plan={onboardingPlan} onClose={() => setOnboardingPlan(null)} />
      )}

      {/* ── NAV ── */}
      <nav className="nav">
        <span className="nav-logo" onClick={() => scrollTo("hero")}>AXIOM</span>
        <div className="nav-links">
          <a onClick={() => scrollTo("features")}>Features</a>
          <a onClick={() => scrollTo("pricing")}>Pricing</a>
          <a onClick={() => scrollTo("faq")}>FAQ</a>
        </div>
        <a href="/dashboard" className="nav-cta">DASHBOARD <ArrowUpRight size={14} /></a>
      </nav>

      {/* ══ S1: HERO ══ */}
      <section className="s1" id="hero">
        <div className="s1-gradient" />
        <div className="s1-main">
          <div className="s1-left">
            <h1 className="s1-headline">
              Orchestrating<br />cloud<br />
              <span className="s1-headline-fade">infrastructure<br />via AI</span>
            </h1>
          </div>
          <div className="s1-right">
            We believe an intelligent infrastructure is key to building frictionless engineering experiences. AXIOM is a hybrid RAG and tool-calling MCP server built on AMD MI300X.
          </div>
        </div>
      </section>

      {/* ══ APP WINDOW ══ */}
      <div className="app-window-section">
        <div className="app-window-wrap" style={{ maxWidth: 1200 }}>
          <div className="window-chrome">
            <div className="window-titlebar">
              <div className="traffic-light tl-red" />
              <div className="traffic-light tl-yellow" />
              <div className="traffic-light tl-green" />
              <div className="window-title-center">AXIOM — am_006</div>
            </div>

            <div className="dash-header-bar">
              <div className="flex items-center gap-3">
                <div className="status-dot" />
                <span className="dash-header-text">SYSTEM: HEALTHY</span>
              </div>
              <span className="dash-header-text" style={{ color: 'rgba(255,255,255,0.2)' }}>Ready</span>
              <div className="flex items-center gap-6">
                <span className="dash-header-text">Time 00:00</span>
                <span className="dash-header-text">Score +0.0</span>
              </div>
            </div>

            <div className="dash-layout">
              <div className="dash-sidebar">
                <div className="sidebar-section">
                  <span className="sidebar-label">AXIOM Workspace</span>
                  <div className="sidebar-item active"><Layout size={14} /> Alerts <span style={{ marginLeft: 'auto', background: 'rgba(248,113,113,0.2)', color: '#f87171', padding: '0 5px', borderRadius: 4, fontSize: 9 }}>3</span></div>
                </div>

                <div className="sidebar-section">
                  <span className="sidebar-label">Triage Dashboard</span>
                  <div className="sidebar-item incident"><Activity size={14} /> ACTIVE INCIDENTS</div>
                  <div className="sidebar-item" style={{ fontSize: 10, paddingLeft: 34, color: 'rgba(255,255,255,0.2)' }}>No past incidents yet</div>
                </div>

                <div className="sidebar-section">
                  <span className="sidebar-label">SRE Copilot</span>
                  <div className="sidebar-item"><Plus size={14} /> New Chat</div>
                  <div className="sidebar-item"><Terminal size={14} /> session_1777832237552</div>
                </div>

                <div className="sidebar-section">
                  <span className="sidebar-label">Infrastructure</span>
                  <div className="sidebar-item"><Activity size={14} /> Service Health</div>
                  <div className="sidebar-item"><BarChart3 size={14} /> SLO Tracking</div>
                  <div className="sidebar-item"><User size={14} /> On-call Rotation</div>
                </div>

                <div className="sidebar-section">
                  <span className="sidebar-label">Critical Services</span>
                  <div className="sidebar-item"><Database size={14} /> payment-service</div>
                  <div className="sidebar-item"><Layers size={14} /> api gateway</div>
                  <div className="sidebar-item"><Database size={14} /> db-cluster-01</div>
                </div>

                <div className="sidebar-section">
                  <span className="sidebar-label">Environments</span>
                  <div className="sidebar-item"><Cloud size={14} /> Production <ChevronRight size={12} style={{ marginLeft: 'auto' }} /></div>
                </div>
              </div>

              <div className="dash-main">
                <div className="dash-top-action">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <div className="status-dot" style={{ background: '#f87171', boxShadow: '0 0 8px #f8717166' }} />
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Cascading DB Failure</h2>
                      <span className="incident-badge">payment-service</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 21 }}>Connection pool exhausted • cascading 503s</p>
                  </div>
                  <button className="triage-btn" onClick={handleStartTriage} disabled={isTriaging}>
                    {isTriaging ? 'Triage Active' : 'Start Triage'}
                  </button>
                </div>

                <div className="dash-split">
                  <div className="dash-pane">
                    <div className="pane-header">Agent Reasoning</div>
                    <div className="pane-content">
                      {isTriaging ? (
                        REASONING_STEPS.slice(0, triageStep + 1).map((step, i) => (
                          <div key={i} className="reasoning-card">
                            <p className="reasoning-text">{step}</p>
                          </div>
                        ))
                      ) : (
                        <div className="placeholder-text">
                          <Clock size={32} />
                          Select an incident to view reasoning
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dash-pane" style={{ borderRight: 'none' }}>
                    <div className="pane-header">Tool Activity</div>
                    <div className="pane-content" style={{ padding: 0 }}>
                      {isTriaging && TOOL_ACTIVITY.map((act, i) => (
                        <div key={i} className="activity-row" style={{ padding: '12px 24px', opacity: i > triageStep ? 0.3 : 1 }}>
                          <div className="flex flex-col gap-1">
                            <span className="activity-tool">{act.tool}</span>
                            <span className="activity-time">{act.time}</span>
                          </div>
                          <span className={`status-pill ${act.status === 'Success' ? 'status-success' : 'status-running'}`}>
                            {act.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ S2: STATEMENT ══ */}
      <section className="s2">
        <div className="s2-grid">
          <h2 className="s2-headline">
            At AXIOM we believe that observability is not just about dashboards but also about creating —{" "}
            <span className="s2-pill">autonomous</span>{" "}and self-healing infrastructure.
          </h2>
          <div>
            <p className="s2-body">We met during an incident war-room and realized we were all wasting 45+ minutes a week navigating scattered dashboards for logs, metrics, and traces.</p>
            <p className="s2-body">Instead of building another dashboard, we built an agent that simultaneously retrieves context via RAG and actively fixes your infrastructure using MCP tools.</p>
            <div className="s2-more">Read our story <ArrowUpRight size={14} /></div>
          </div>
        </div>
        <div className="s2-bottom-bar">
          <div className="s2-b-text" onClick={() => scrollTo("features")}>SEE HOW IT WORKS</div>
          <div className="s2-b-tech">
          </div>
          <div className="s2-b-text" onClick={() => scrollTo("features")}>SCROLL NOW <ArrowDown size={14} /></div>
        </div>
      </section>

      {/* ══ S3: FEATURE ══ */}
      <section className="s-image-section" id="features" style={{ background: "#070707" }}>
        <div className="s-image-bg-right" /><div className="s-image-overlay" />
        <div className="s-image-content">
          <div className="s-image-text">
            <span className="s-image-eyebrow">Instant Context</span>
            <h3 className="s-image-title">Get fast answers<br />about architecture.</h3>
            <p className="s-image-desc">Give everyone instant access to infrastructure knowledge. Ask the Copilot about service dependencies, deployment runbooks, or SLA metrics, and it retrieves the exact data in seconds.</p>
          </div>
        </div>
      </section>

      {/* ══ S4: FEATURE ══ */}
      <section className="s-image-section" style={{ background: "#0a0a0a" }}>
        <div className="s-image-bg-left" /><div className="s-image-overlay" />
        <div className="s-image-content" style={{ justifyContent: "flex-end" }}>
          <div className="s-image-text" style={{ textAlign: "right" }}>
            <span className="s-image-eyebrow" style={{ color: "#0ea5e9" }}>Take Action</span>
            <h3 className="s-image-title">Manage your incidents<br />from one place.</h3>
            <p className="s-image-desc">Don't just observe — get things done. Tell the Copilot to restart a failing pod, scale up your database, or run a mitigation playbook, and it executes the action directly.</p>
          </div>
        </div>
      </section>

      {/* ══ CAPABILITIES ══ */}
      <section className="s5-cap" id="capabilities">
        <div className="s5-grid">
          <div>
            <span className="s-image-eyebrow">Capabilities</span>
            <h2 className="s-image-title" style={{ fontSize: "clamp(48px,6vw,68px)", margin: "24px 0 36px" }}>What you can<br />accomplish.</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", lineHeight: 1.6, maxWidth: "300px" }}>Stop switching between disjointed observability tools. Just ask Copilot.</p>
          </div>
          <div>
            {[
              { icon: <Zap size={26} color="#4b7bf5" />, title: "Resolve incidents autonomously", desc: "AXIOM detects anomalies and runs automated mitigation playbooks without human intervention." },
              { icon: <FileText size={26} color="#0ea5e9" />, title: "Navigate complex architectures", desc: "Instantly trace requests across microservices without digging through distributed traces manually." },
              { icon: <CheckCircle2 size={26} color="#10b981" />, title: "Track system health", desc: "Ask the bot to securely pull your current SLI/SLO metrics or outstanding vulnerability reports." },
              { icon: <Activity size={26} color="#f59e0b" />, title: "Automate routine maintenance", desc: "Engineers can automate certificate renewals and receive weekly performance analytics summaries." },
            ].map((s, i) => (
              <div key={i} className="cap-item">
                <div className="cap-icon-box">{s.icon}</div>
                <div><h4 className="cap-item-title">{s.title}</h4><p className="cap-item-desc">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-inner">
          <div className="pricing-header">
            <div>
              <span className="pricing-eyebrow">Pricing</span>
              <h2 className="pricing-title">Simple,<br />developer-first<br />pricing.</h2>
            </div>
            <p className="pricing-subtitle">Built to scale from a single project pilot to a full enterprise rollout.</p>
          </div>
          <div className="pricing-grid">
            {/* Starter */}
            <div className="pricing-card">
              <div className="plan-name">Developer Plan</div>
              <div className="plan-price"><span>$</span>29</div>
              <div className="plan-unit">per developer / month</div>
              <div className="plan-divider" />
              <div className="plan-features">
                {["Up to 5 nodes", "5 MCP tools included", "Basic RAG pipeline", "Web dashboard", "Best for side projects"].map((f, i) => (
                  <div key={i} className="plan-feature"><div className="plan-feature-dot" /><span>{f}</span></div>
                ))}
              </div>
              <a href="/onboarding?plan=developer" className="plan-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
                Get Started <span style={{ fontSize: 12 }}>→</span>
              </a>
            </div>

            {/* Campus Rollout (featured) */}
            <div className="pricing-card featured">
              <div className="plan-name">Startup Plan</div>
              <div className="plan-price"><span>$</span>99</div>
              <div className="plan-unit">per developer / month</div>
              <div className="plan-divider" />
              <div className="plan-features">
                {["Unlimited nodes", "Full MCP tool suite", "Custom RAG via Vector DB", "Analytics dashboards", "GitHub Copilot integration"].map((f, i) => (
                  <div key={i} className="plan-feature"><div className="plan-feature-dot" /><span>{f}</span></div>
                ))}
              </div>
              <a href="/onboarding?plan=startup" className="plan-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
                Get Started <span style={{ fontSize: 12 }}>→</span>
              </a>
            </div>

            {/* Enterprise */}
            <div className="pricing-card">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price" style={{ fontSize: 32, paddingTop: 6 }}>Custom</div>
              <div className="plan-unit">contact for pricing</div>
              <div className="plan-divider" />
              <div className="plan-features">
                {["Multi-cloud deployments", "SSO via Azure AD/Okta", "Strict SLAs guaranteed", "White-label options", "Dedicated engineering support"].map((f, i) => (
                  <div key={i} className="plan-feature"><div className="plan-feature-dot" /><span>{f}</span></div>
                ))}
              </div>
              <a href="/onboarding?plan=enterprise" className="plan-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
                Contact Sales <span style={{ fontSize: 12 }}>→</span>
              </a>
            </div>
          </div>


        </div>
      </section>
      {/* ══ FAQ ══ */}
      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <div className="faq-header">
            <span className="pricing-eyebrow">FAQ</span>
            <h2 className="faq-title">Everything you<br />need to know.</h2>
          </div>
          <div className="faq-list">
            {[
              { q: "What is the Model Context Protocol (MCP)?", a: "MCP is a standardized interface that connects AI models to external tools and APIs. It allows AXIOM to securely execute real actions — like restarting a pod or checking metric anomalies — instead of just retrieving text. Think of it as giving the AI real hands to interact with cloud systems." },
              { q: "How does the RAG pipeline work?", a: "We index your company's documents — runbooks, architecture diagrams, post-mortems — into our Vector DB. When an incident occurs, the system retrieves the most relevant excerpts and feeds them to the model, so every answer is grounded in your actual infrastructure data, not hallucinations." },
              { q: "Is production data secure?", a: "Yes. AXIOM can operate entirely within your VPC. Infrastructure data never leaves your environment. We support SSO via Okta/Azure AD, and all MCP tool calls are authenticated and logged for audit compliance." },
              { q: "How long does a deployment take?", a: "A Developer Pilot can be live in under a day — we handle the initial integrations. A full Enterprise Rollout with custom tools typically takes 1–2 weeks depending on the complexity of your existing infrastructure APIs." },
              { q: "Can non-engineers use it too?", a: "Absolutely. Product managers and customer support have a separate role with access to system health, uptime dashboards, and automated incident reports. We're building out post-mortem generation tools as part of the Enterprise tier." },
            ].map((f, i) => (
              <div key={i} className="faq-row">
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="faq-q">{f.q}</span>
                  <div className={`faq-ico${openFaq === i ? " open" : ""}`}>{openFaq === i ? <Minus size={15} /> : <Plus size={15} />}</div>
                </button>
                <div className="faq-ans" style={{ maxHeight: openFaq === i ? 160 : 0, opacity: openFaq === i ? 1 : 0 }}>
                  <div className="faq-ans-inner">{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-links">
            <a href="https://github.com/AmanM006/axiom" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://huggingface.co/spaces" target="_blank" rel="noopener noreferrer">Hugging Face Space</a>
            <a href="#" target="_blank" rel="noopener noreferrer">AMD MI300X</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Documentation</a>
          </div>
          <span style={{ fontSize: 11, letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)" }}>© 2026 AXIOM SYSTEMS</span>
        </div>
        <div className="footer-word">AXIOM</div>
      </footer>
    </div>
  );
}
