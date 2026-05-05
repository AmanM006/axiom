"""
AXIOM Backend — FastAPI app with REST endpoints and SSE streaming.
"""

import asyncio
import json
import os
import re
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel

from agent.graph import run_agent_loop, INCIDENT_SERVICE_MAP
from agent import tools as tool_mod
import supabase_client as sb

app = FastAPI(title="AXIOM API", version="1.0.0", description="Autonomous Infrastructure Repair Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Data ───────────────────────────────────────────────────────────────

INCIDENTS = [
    {
        "id": "db_cascade",
        "name": "Cascading DB Failure",
        "service": "payment-service",
        "description": "Connection pool exhausted causing cascading 503 errors across payment pipeline",
        "severity": "critical",
        "key_metric": "Error rate: 67%",
    },
    {
        "id": "memory_leak",
        "name": "Memory Leak",
        "service": "image-processor",
        "description": "Unbounded cache list causing RSS to climb from 512MB toward OOM at 4096MB",
        "severity": "high",
        "key_metric": "Memory: 3800MB / 4096MB",
    },
    {
        "id": "exception_loop",
        "name": "Exception Loop",
        "service": "api-gateway",
        "description": "Unhandled KeyError causing crash loop every ~30 seconds, error rate at 95%",
        "severity": "critical",
        "key_metric": "Error rate: 95%",
    },
]

SERVICES = [
    {"id": "payment-service", "name": "Payment Service", "category": "Core Services", "env": "Production"},
    {"id": "api-gateway", "name": "API Gateway", "category": "Gateway & Routing", "env": "Production"},
    {"id": "auth-provider", "name": "Auth Provider", "category": "Gateway & Routing", "env": "Production"},
    {"id": "image-processor", "name": "Image Processor", "category": "Core Services", "env": "Staging"},
    {"id": "db-cluster-01", "name": "DB Cluster 01", "category": "Data Stores", "env": "Production"},
    {"id": "redis-cache", "name": "Redis Cache", "category": "Data Stores", "env": "Production"},
]

SERVICE_ENV_MAP = {s["id"]: s["env"] for s in SERVICES}

ONCALL_DATA = {
    "responders": [
        {"name": "Aman", "handle": "@aman", "level": "Primary", "color": "#5E6AD2", "status": "ON-CALL"},
        {"name": "Sarah", "handle": "@sarah", "level": "Secondary", "color": "#34A853", "status": "SECONDARY"},
        {"name": "Chen", "handle": "@chen", "level": "Escalation", "color": "#F4B400", "status": "STANDBY"},
    ],
    "schedule": [
        {"date": "May 8", "person": "Sarah", "shift": "00:00 - 00:00"},
        {"date": "May 15", "person": "Chen", "shift": "00:00 - 00:00"},
        {"date": "May 22", "person": "Aman", "shift": "00:00 - 00:00"},
    ],
    "escalation": [
        {"level": 1, "role": "Primary Engineer", "rule": "Immediate notification via PagerDuty", "ack_time": "5m Ack"},
        {"level": 2, "role": "Secondary Engineer", "rule": "Escalate after 15m of no response", "ack_time": "15m Ack"},
        {"level": 3, "role": "SRE Lead / Manager", "rule": "Critical escalation after 30m", "ack_time": "Immediate"},
    ]
}

INTEGRATIONS_DATA = [
    {"id": "ES", "name": "Elasticsearch", "status": "CONNECTED", "color": "#F04E98"},
    {"id": "SP", "name": "Splunk", "status": "CONNECTED", "color": "#65A637"},
    {"id": "DD", "name": "Datadog", "status": "AVAILABLE", "color": "#632CA6"},
    {"id": "PD", "name": "PagerDuty", "status": "CONNECTED", "color": "#06AC38"},
    {"id": "GH", "name": "GitHub", "status": "CONNECTED", "color": "#FFFFFF"},
    {"id": "K8", "name": "Kubernetes", "status": "CONNECTED", "color": "#326CE5"},
]

active_runs: dict[str, bool] = {}
_resolved_incidents_cache: list[dict] = []  # In-memory cache if Supabase is down


# ── Health & Discovery ────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "axiom-backend", "version": "1.0.0"}


@app.get("/services")
async def list_services():
    return {"services": SERVICES}


# ── Incidents ─────────────────────────────────────────────────────────────────

@app.get("/incidents")
async def list_incidents():
    return {"incidents": INCIDENTS}


@app.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    for inc in INCIDENTS:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")


@app.post("/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str, body: dict = None):
    """Mark an incident as resolved, persist to Supabase."""
    inc = next((i for i in INCIDENTS if i["id"] == incident_id), None)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    summary = (body or {}).get("summary", f"Triage completed for {inc['name']}")
    
    # Persist to Supabase (no-op if unavailable)
    await sb.save_resolved_incident(incident_id, inc["name"], inc["service"], summary)
    
    # Also store in memory cache as fallback
    existing_ids = {r["id"] for r in _resolved_incidents_cache}
    if incident_id not in existing_ids:
        _resolved_incidents_cache.insert(0, {
            "id": incident_id,
            "name": inc["name"],
            "service": inc["service"],
            "summary": summary,
        })
    
    return {"ok": True, "incident_id": incident_id}


@app.get("/incidents/resolved/list")
async def get_resolved_incidents():
    """Return resolved incidents from Supabase, with in-memory fallback."""
    resolved = await sb.get_resolved_incidents()
    if not resolved:
        resolved = _resolved_incidents_cache
    return {"resolved": resolved}


# ── Metrics ───────────────────────────────────────────────────────────────────

@app.get("/metrics/{service}")
async def get_metrics(service: str):
    try:
        result = await tool_mod.get_metrics(service)
        return result
    except Exception as exc:
        return {"error": str(exc), "cpu_percent": 0, "memory_mb": 0, "error_rate": 0, "latency_ms": 0, "connections": 0, "status": "unknown"}


# ── Infrastructure APIs ───────────────────────────────────────────────────────

@app.get("/api/v1/infrastructure/health")
async def infrastructure_health():
    """Batch metrics for all services — polled every 5s by the frontend."""
    results = []
    for svc in SERVICES:
        try:
            m = await tool_mod.get_metrics(svc["id"])
            status = "healthy"
            if m.get("error_rate", 0) > 20 or m.get("latency_ms", 0) > 2000:
                status = "degraded"
            elif m.get("error_rate", 0) > 5 or m.get("latency_ms", 0) > 800:
                status = "warning"
            results.append({
                "id": svc["id"],
                "name": svc["name"],
                "env": svc["env"],
                "status": status,
                "cpu_percent": m.get("cpu_percent", 0),
                "memory_mb": m.get("memory_mb", 0),
                "error_rate": m.get("error_rate", 0),
                "latency_ms": m.get("latency_ms", 0),
                "connections": m.get("connections", 0),
            })
        except Exception:
            results.append({
                "id": svc["id"], "name": svc["name"], "env": svc["env"],
                "status": "unknown", "cpu_percent": 0, "memory_mb": 0,
                "error_rate": 0, "latency_ms": 0, "connections": 0,
            })
    
    # Calculate global status
    global_status = "healthy"
    if any(s["status"] == "degraded" for s in results):
        global_status = "critical"
    elif any(s["status"] == "warning" for s in results):
        global_status = "warning"

    return {
        "status": global_status,
        "services": results,
        "infra": {
            "nodes": "42",
            "cpu_percent": 64 if global_status == "healthy" else 88,
            "memory": "1.2TB",
            "ingress": "12.4k"
        }
    }


@app.get("/api/v1/infrastructure/oncall")
async def oncall():
    return ONCALL_DATA


@app.get("/api/v1/integrations/status")
async def integrations_status():
    return {"integrations": INTEGRATIONS_DATA}


@app.get("/api/v1/services/{service_id}/telemetry")
async def service_telemetry(service_id: str):
    """Deep telemetry for a single service."""
    try:
        m = await tool_mod.get_metrics(service_id)
        error_rate = m.get("error_rate", 0)
        latency = m.get("latency_ms", 0)
        return {
            "service_id": service_id,
            "success_rate": round(100 - error_rate, 3),
            "p99_latency_ms": latency,
            "p50_latency_ms": round(latency * 0.6, 1),
            "error_rate": error_rate,
            "throughput_rps": round(m.get("connections", 0) * 2.5, 1),
            "cpu_percent": m.get("cpu_percent", 0),
            "memory_mb": m.get("memory_mb", 0),
            "connections": m.get("connections", 0),
            "dependencies": ["postgres-primary", "redis-cache", "auth-provider"],
            "recent_deployments": [
                {"title": "fix: connection pool bounds", "author": "aman", "time": "2h ago", "status": "deployed"},
                {"title": "feat: retry backoff", "author": "sarah", "time": "1d ago", "status": "deployed"},
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/incidents/{incident_id}/approve")
async def approve_action(incident_id: str, payload: dict):
    """Human-in-the-Loop (HITL) approval endpoint for dangerous agent actions."""
    from agent.graph import APPROVAL_EVENTS, APPROVAL_RESULTS
    
    approved = payload.get("approved", True)
    if incident_id in APPROVAL_EVENTS:
        APPROVAL_RESULTS[incident_id] = approved
        APPROVAL_EVENTS[incident_id].set()
        return {"status": "ok", "approved": approved}
    
    raise HTTPException(status_code=404, detail="No action pending approval for this incident")



# ── Chat (messages persistence) ───────────────────────────────────────────────

@app.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    """Fetch persisted chat messages for a session."""
    messages = await sb.get_chat_messages(session_id)
    return {"messages": messages}


@app.get("/chat/sessions")
async def get_chat_sessions():
    """Fetch unique chat session IDs from Supabase."""
    sessions = await sb.get_unique_sessions()
    return {"sessions": sessions}


@app.get("/api/v1/search")
async def rag_search(q: str = ""):
    """RAG search endpoint querying Supabase knowledge_base."""
    try:
        client = sb.get_client()
        if client and q:
            # Simple text search fallback if vector search isn't available
            # We search the content column for the query string
            resp = client.table("knowledge_base").select("title, content").ilike("content", f"%{q}%").limit(5).execute()
            if resp.data:
                return {"results": resp.data}
    except Exception as e:
        print(f"Supabase RAG search error: {e}")
        pass

    # Fallback mock data if Supabase is down, table doesn't exist, or no query
    return {
        "results": [
            {"title": "Handling Cascading DB Failures", "content": "When payment-service reports connection pool exhaustion, check the primary-db cluster health and ensure pool eviction policies are active."},
            {"title": "Redis Cache Eviction Policy", "content": "If latency spikes on image-processor, verify if Redis is under memory pressure or if unbounded lists are growing without maxlen."},
            {"title": "API Gateway Timeout Tuning", "content": "Gateway timeouts are often caused by upstream service degradation. Ensure input validation exists to prevent unhandled KeyError crash loops."}
        ]
    }


# ── Agent Run ─────────────────────────────────────────────────────────────────

@app.get("/run/{incident_id}")
async def run_incident(
    incident_id: str, 
    github_token: str | None = None,
    repo_name: str | None = None,
    supabase_url: str | None = None,
    supabase_key: str | None = None
):
    if incident_id not in INCIDENT_SERVICE_MAP:
        raise HTTPException(status_code=404, detail=f"Unknown incident: {incident_id}")

    # For demo, if already running, we return a 200 but yield an error event immediately
    already_running = active_runs.get(incident_id, False)

    # Create a config dict to pass to the agent
    config = {
        "GITHUB_TOKEN": github_token,
        "GITHUB_REPO": repo_name,
        "SUPABASE_URL": supabase_url,
        "SUPABASE_KEY": supabase_key,
    }

    async def event_generator():
        if already_running:
            yield {"event": "message", "data": json.dumps({"type": "error", "step": 0, "content": "Agent is already running for this incident context.", "metadata": {}})}
            return

        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

        async def stream_callback(event: dict[str, Any]) -> None:
            await queue.put(event)

        active_runs[incident_id] = True

        async def run_agent():
            try:
                await run_agent_loop(incident_id, stream_callback, config=config)
            except Exception as exc:
                await queue.put({"type": "error", "step": 0, "content": str(exc), "metadata": {}})
            finally:
                await queue.put(None)
                active_runs[incident_id] = False

        task = asyncio.create_task(run_agent())

        try:
            while True:
                event = await queue.get()
                if event is None:
                    break
                event.setdefault("metadata", {})
                yield {"event": "message", "data": json.dumps(event)}
        except asyncio.CancelledError:
            task.cancel()
            active_runs[incident_id] = False

    return EventSourceResponse(event_generator())

@app.get("/chat/sessions")
async def get_chat_sessions():
    """Return a list of session objects {id, title} that have chat history."""
    try:
        session_ids = await sb.get_unique_sessions()
        results = []
        for sid in session_ids:
            # If it's a known incident, use its name
            if sid in INCIDENT_SERVICE_MAP:
                title = INCIDENT_SERVICE_MAP[sid]['name']
            else:
                # Try to get the first message to generate a title
                messages = await sb.get_chat_messages(sid, limit=1)
                if messages:
                    content = messages[0]['content']
                    # Clean up the content for a title
                    title = content[:30] + '...' if len(content) > 30 else content
                else:
                    title = f"Thread: {sid[-4:]}" if len(sid) > 4 else sid
            
            results.append({"id": sid, "title": title})
        
        return {"sessions": results}
    except Exception as e:
        print(f"Error fetching sessions: {e}")
    
    return {"sessions": []}


# ── Chat Q&A ──────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    session_id: str | None = None

TRIGGER_VERBS = {"triage", "start", "fix", "investigate", "run", "diagnose", "debug"}
INCIDENT_KEYWORDS = {
    "payment": "db_cascade", "db": "db_cascade", "cascade": "db_cascade",
    "connection pool": "db_cascade", "memory": "memory_leak", "leak": "memory_leak",
    "image": "memory_leak", "oom": "memory_leak", "gateway": "exception_loop",
    "exception": "exception_loop", "keyerror": "exception_loop", "crash loop": "exception_loop",
}


def detect_trigger(text: str) -> str | None:
    lower = text.lower()
    has_verb = any(v in lower for v in TRIGGER_VERBS)
    if not has_verb:
        return None
    for keyword, incident_id in INCIDENT_KEYWORDS.items():
        if keyword in lower:
            return incident_id
    return None


@app.post("/chat/{incident_id}")
async def chat_with_agent(incident_id: str, request: ChatRequest):
    """Enhanced chat: trigger detection + streaming log-aware Q&A with Groq."""
    user_msg = request.messages[-1].content
    session_id = request.session_id or incident_id

    # Persist the user message (no-op if Supabase unavailable)
    await sb.save_chat_message(session_id, "user", user_msg)

    # 1. Check for agent trigger commands
    triggered = detect_trigger(user_msg)
    if triggered:
        service = INCIDENT_SERVICE_MAP.get(triggered, "unknown")
        return JSONResponse({
            "type": "trigger",
            "incident_id": triggered,
            "service": service,
            "message": f"Starting triage on {service}..."
        })

    # 2. Log-aware Q&A with SSE streaming via Groq
    incident_meta = INCIDENT_SERVICE_MAP.get(incident_id, {"name": "General Chat", "service": "payment-service"})
    incident_name = incident_meta.get("name", "General Chat")
    service = incident_meta.get("service", "payment-service")

    # System prompt to ensure AI doesn't use raw IDs
    system_prompt = f"""You are AXIOM, an elite SRE Copilot. 
You are currently assisting with {incident_name} on the {service}.
CRITICAL: Never mention internal session IDs like 'session_177...' in your response. 
Refer to the situation as 'this incident', 'the {service} issue', or '{incident_name}'.
Be concise, technical, and helpful. Use markdown for highlighting metrics or logs.
"""
    log_context = "No logs available."
    try:
        logs_result = await tool_mod.query_logs(service, 60, limit=30)
        log_lines = logs_result.get("logs", [])
        if log_lines:
            log_context = "\n".join([
                f"[{l.get('timestamp', '?')}] [{l.get('level', '?')}] {l.get('message', '')}"
                for l in log_lines[:30]
            ])
    except Exception:
        pass

    # Fetch real metrics
    metrics_context = ""
    metrics_raw = {}
    try:
        metrics_raw = await tool_mod.get_metrics(service)
        if "error" not in metrics_raw:
            metrics_context = (
                f"CPU: {metrics_raw.get('cpu_percent', '?')}%, "
                f"Memory: {metrics_raw.get('memory_mb', '?')}MB, "
                f"Error Rate: {metrics_raw.get('error_rate', '?')}%, "
                f"Latency: {metrics_raw.get('latency_ms', '?')}ms, "
                f"Connections: {metrics_raw.get('connections', '?')}"
            )
    except Exception:
        pass

    system_prompt = f"""You are AXIOM, an expert SRE AI assistant. You are currently focused on incident '{incident_id}' affecting '{service}'.

LIVE METRICS ({service}):
{metrics_context or "Unavailable"}

RECENT LOGS ({service}, last 30 entries):
{log_context}

Instructions:
- You are a helpful SRE assistant. You can handle casual greetings and small talk naturally.
- When the user asks technical questions, provide direct, concise, and technical answers.
- Reference specific log lines or metric values when relevant to technical queries.
- Do NOT repeat the metrics back verbatim unless asked or relevant to the answer.
- If you don't have enough data to answer a technical question, say so.
"""

    messages_for_llm = [{"role": "system", "content": system_prompt}]
    for msg in request.messages[-8:]:
        messages_for_llm.append({"role": msg.role if msg.role != "system" else "assistant", "content": msg.content})

    async def sse_generator():
        full_response = []
        try:
            from agent.graph import llm_client, MODEL_NAME
            stream = await llm_client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages_for_llm,
                temperature=0.3,
                max_tokens=600,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response.append(token)
                    yield {"event": "message", "data": json.dumps({"type": "token", "content": token})}
            yield {"event": "message", "data": json.dumps({"type": "done"})}
        except Exception:
            fallback = _generate_fallback_response(user_msg, incident_id, service, log_context, metrics_raw)
            full_response.append(fallback)
            yield {"event": "message", "data": json.dumps({"type": "token", "content": fallback})}
            yield {"event": "message", "data": json.dumps({"type": "done"})}
        
        # Persist assistant response
        if full_response:
            await sb.save_chat_message(session_id, "assistant", "".join(full_response))

    return EventSourceResponse(sse_generator())


def _generate_fallback_response(question: str, incident_id: str, service: str, logs: str, metrics: dict) -> str:
    """Generate a useful fallback from REAL log/metric data when LLM is unreachable."""
    q = question.lower()
    er = metrics.get("error_rate", None)
    lat = metrics.get("latency_ms", None)
    mem = metrics.get("memory_mb", None)
    cpu = metrics.get("cpu_percent", None)

    if any(w in q for w in ["hi", "hello", "hey", "greetings", "sup", "how are you", "who are you"]):
        return f"Hi! I'm AXIOM, your AIGC-powered SRE assistant. I'm currently monitoring the `{incident_id}` incident on `{service}`. I have access to live logs and metrics to help you triage. What's on your mind?"

    if any(w in q for w in ["error rate", "errors", "how bad"]) and er is not None:
        return f"Current error rate on `{service}`: **{er}%**. " + (
            "This is critically high. " if er > 50 else "This is elevated. " if er > 5 else "This is within normal bounds. "
        ) + (f"Logs show: `{logs.splitlines()[0]}`" if logs and logs != "No logs available." else "")

    if any(w in q for w in ["latency", "slow", "p99", "p95", "fast"]) and lat is not None:
        return f"Current P99 latency on `{service}`: **{lat}ms**. " + (
            "This is severely degraded (>2s). " if lat > 2000 else "This is elevated. " if lat > 500 else "This is healthy. "
        )

    if any(w in q for w in ["memory", "rss", "oom", "ram"]) and mem is not None:
        return f"Current RSS on `{service}`: **{mem}MB**. " + (
            "Approaching OOM threshold. " if mem > 3500 else "Memory usage is elevated. " if mem > 2000 else "Memory is normal. "
        )

    if any(w in q for w in ["cpu", "processor", "load"]) and cpu is not None:
        return f"Current CPU on `{service}`: **{cpu}%**. " + (
            "CPU is critically high. " if cpu > 90 else "CPU is elevated. " if cpu > 70 else "CPU is normal. "
        )

    if any(w in q for w in ["root cause", "why", "what happened", "cause", "problem"]):
        causes = {
            "db_cascade": f"`{service}` connection pool (max=200) reached 100% utilization. Logs show no eviction policy — connections accumulate and block. This caused cascading 503s across the payment pipeline.",
            "memory_leak": f"`{service}` has an unbounded global cache list in `process_image()`. It appends entries without eviction, causing RSS to grow from 512MB to {mem or '?'}MB toward OOM at 4096MB.",
            "exception_loop": f"`{service}` crashes on `payload['user_id']` (KeyError) in `handle_request()`. The fix is `payload.get('user_id')`. This causes a crash loop every ~30 seconds.",
        }
        return causes.get(incident_id, f"Analyzing root cause for `{service}`... Check the logs for the most recent ERROR entries.")

    # Generic — use real metrics
    parts = []
    if er is not None: parts.append(f"Error Rate: {er}%")
    if lat is not None: parts.append(f"Latency: {lat}ms")
    if cpu is not None: parts.append(f"CPU: {cpu}%")
    if mem is not None: parts.append(f"Memory: {mem}MB")
    metric_str = ", ".join(parts) if parts else "metrics unavailable"
    return f"**`{service}` live status** — {metric_str}. Ask me about error rates, latency, root cause, memory usage, or type 'run triage' to start the autonomous agent."


@app.get("/chat/{incident_id}/history")
async def get_history(incident_id: str):
    """Fetch chat history for a session."""
    try:
        messages = await sb.get_chat_messages(incident_id)
        return {"messages": messages}
    except Exception as e:
        print(f"Error fetching history: {e}")
        return {"messages": []}


@app.get("/")
async def root():
    return {"message": "AXIOM API is running. See /docs for endpoints."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=True)
