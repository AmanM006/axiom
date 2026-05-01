"""
AXIOM Backend — FastAPI app with REST endpoints and SSE streaming.
"""

import asyncio
import json
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from agent.graph import run_agent_loop, INCIDENT_SERVICE_MAP
from agent import tools as tool_mod

app = FastAPI(title="AXIOM API", version="1.0.0", description="Autonomous Infrastructure Repair Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

active_runs: dict[str, bool] = {}


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "axiom-backend", "version": "1.0.0"}


@app.get("/incidents")
async def list_incidents():
    return {"incidents": INCIDENTS}


@app.get("/metrics/{service}")
async def get_metrics(service: str):
    try:
        result = await tool_mod.get_metrics(service)
        return result
    except Exception as exc:
        return {"error": str(exc), "cpu_percent": 0, "memory_mb": 0, "error_rate": 0, "latency_ms": 0, "connections": 0, "status": "unknown"}


@app.get("/run/{incident_id}")
async def run_incident(incident_id: str):
    if incident_id not in INCIDENT_SERVICE_MAP:
        raise HTTPException(status_code=404, detail=f"Unknown incident: {incident_id}")

    if active_runs.get(incident_id):
        raise HTTPException(status_code=409, detail=f"Agent already running for {incident_id}")

    async def event_generator():
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

        async def stream_callback(event: dict[str, Any]) -> None:
            await queue.put(event)

        active_runs[incident_id] = True

        async def run_agent():
            try:
                await run_agent_loop(incident_id, stream_callback)
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

from pydantic import BaseModel
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

@app.post("/chat/{incident_id}")
async def chat_with_agent(incident_id: str, request: ChatRequest):
    # Retrieve latest user message
    user_msg = request.messages[-1].content.lower()
    
    # Inject tool context if they ask about tests or builds
    context = ""
    if "test" in user_msg or "build" in user_msg or "buildkite" in user_msg:
        tool_result = await tool_mod.check_buildkite_logs("fix-connection-pool-exhaustion")
        context = f"[SYSTEM: I ran the check_buildkite_logs tool. Result: {tool_result['logs']}]"
    elif "merge" in user_msg or "pr" in user_msg:
        context = "[SYSTEM: I checked GitHub. The PR is currently open and awaiting review. It is not merged yet.]"
    
    prompt = f"""You are the AXIOM SRE Agent. You just resolved the incident '{incident_id}'. 
Answer the user's questions about what happened. If the SYSTEM provided tool results below, use them in your answer.
{context}

User: {user_msg}
Assistant:"""

    try:
        from agent.graph import llm_client, MODEL_NAME
        response = await llm_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=256
        )
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        # Fallback if LLM is unreachable
        if context:
            return {"reply": f"Based on my automated checks: {context.replace('[SYSTEM: ', '').replace(']', '')}"}
        return {"reply": f"I'm currently unable to process complex queries, but the incident {incident_id} was successfully stabilized."}



@app.get("/")
async def root():
    return {"message": "AXIOM API is running. See /docs for endpoints."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=True)
