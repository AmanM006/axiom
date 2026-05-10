# AXIOM Architecture

## System Overview
User Dashboard (Next.js)
↕ SSE Stream
FastAPI Backend (port 8080)
↕ HTTP
LangGraph Agent ← Qwen2.5-72B via vLLM (AMD MI300X)
↕ MCP Protocol
┌──────────────┬──────────────┬──────────────┐
│ Terminal MCP │  LogDB MCP   │  GitHub MCP  │
│   :8001      │    :8002     │    :8003     │
│ Shell cmds   │ SQLite logs  │ PyGithub PR  │
└──────────────┴──────────────┴──────────────┘

## Why AMD MI300X
- Qwen2.5-72B requires ~144GB VRAM to load
- MI300X has 192GB — fits model + 32K context window
- Single card, no model splitting, no context fragmentation
- Every other GPU requires multi-card setup losing coherence

## Agent Loop (OODA)
1. **Observe** — query_logs + get_metrics + get_incident_history
2. **Hypothesize** — Qwen2.5-72B reasons, streams tokens live
3. **Act** — routes to terminal/github/logdb MCP tool
4. **Verify** — metrics compared, recovery confirmed
5. **Replan** — if not resolved, loop with full context

## MCP Servers
Each server is isolated, independently deployable, try/except wrapped.
No tool can crash the agent — errors return as structured dicts.

## Human-in-the-Loop
Dangerous actions (push_file, open_pr, run_command) emit
approval_required events. Frontend renders approve/deny UI.
Agent waits via asyncio.Event() — no polling.
