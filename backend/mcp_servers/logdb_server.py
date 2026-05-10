"""
AXIOM LogDB MCP Server — FastMCP on port 8002.
SQLite-backed log queries, metrics, and incident history.
Seeds DB on startup if empty.
"""

import sqlite3
import os
import json
import random
from datetime import datetime, timedelta
from typing import Any
from fastmcp import FastMCP

mcp = FastMCP("AXIOM LogDB Server")

DB_PATH = os.environ.get("DB_PATH", "/data/incidents.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def seed_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    c = conn.cursor()

    c.execute("DROP TABLE IF EXISTS logs")
    c.execute("DROP TABLE IF EXISTS metrics")
    c.execute("DROP TABLE IF EXISTS incidents")

    c.execute("""CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        service TEXT NOT NULL
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        service TEXT NOT NULL,
        cpu_percent REAL,
        memory_mb REAL,
        error_rate REAL,
        latency_ms REAL,
        connections INTEGER,
        status TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        service TEXT NOT NULL,
        description TEXT NOT NULL,
        resolution TEXT DEFAULT ''
    )""")

    now = datetime.utcnow()

    # === Scenario 1: db_cascade ===
    svc1 = "payment-service"
    inc1_logs = [
        (now - timedelta(minutes=46), "CRITICAL", f"{svc1}: transaction processing halted — estimated revenue impact $4,200/minute"),
        (now - timedelta(minutes=45), "INFO", f"{svc1}: Connection pool initialized (max=200)"),
        (now - timedelta(minutes=44), "INFO", f"{svc1}: Transaction processing started for batch_id=b_1001"),
        (now - timedelta(minutes=42), "WARN", f"{svc1}: Connection pool usage at 60% (120/200 connections active)"),
        (now - timedelta(minutes=40), "WARN", f"{svc1}: Slow query detected: SELECT * FROM ledger WHERE account_id=acc_442 took 2800ms"),
        (now - timedelta(minutes=38), "WARN", f"{svc1}: Connection pool usage at 75% (150/200 connections active)"),
        (now - timedelta(minutes=37), "ERROR", f"{svc1}: Query timeout after 15000ms for transaction_id=txn_7712"),
        (now - timedelta(minutes=36), "WARN", f"{svc1}: db-proxy latency spike detected: avg=850ms p99=3200ms"),
        (now - timedelta(minutes=35), "ERROR", f"{svc1}: Connection pool usage at 90% (180/200 connections active)"),
        (now - timedelta(minutes=34), "ERROR", f"{svc1}: Query timeout after 25000ms for transaction_id=txn_8103"),
        (now - timedelta(minutes=33), "ERROR", f"{svc1}: Connection pool exhausted (200/200 connections active)"),
        (now - timedelta(minutes=32), "ERROR", f"{svc1}: Failed to acquire connection within 5000ms"),
        (now - timedelta(minutes=31), "ERROR", f"{svc1}: Transaction txn_8210 rolled back: connection unavailable"),
        (now - timedelta(minutes=30), "WARN", f"{svc1}: query timeout after 30000ms for transaction_id=txn_8821"),
        (now - timedelta(minutes=29), "ERROR", f"{svc1}: 15 queries queued waiting for connection pool"),
        (now - timedelta(minutes=28), "ERROR", f"{svc1}: Connection pool deadlock detected — all 200 connections held"),
        (now - timedelta(minutes=27), "CRITICAL", f"{svc1}: Circuit breaker OPEN — failing fast all new requests"),
        (now - timedelta(minutes=26), "ERROR", f"api-gateway: upstream {svc1} returning 503 (attempt 1/3)"),
        (now - timedelta(minutes=25), "ERROR", f"api-gateway: upstream {svc1} returning 503 (attempt 2/3)"),
        (now - timedelta(minutes=24), "ERROR", f"api-gateway: upstream {svc1} returning 503 (attempt 3/3)"),
        (now - timedelta(minutes=23), "ERROR", f"api-gateway: {svc1} circuit breaker tripped, returning 502 to clients"),
        (now - timedelta(minutes=22), "ERROR", f"{svc1}: db-proxy health check failed: connection refused"),
        (now - timedelta(minutes=21), "WARN", f"order-service: dependency {svc1} unavailable, queuing orders"),
        (now - timedelta(minutes=20), "ERROR", f"{svc1}: connection reset by peer from db-proxy:5432"),
        (now - timedelta(minutes=19), "ERROR", f"{svc1}: Retry attempt 1/5 to reconnect to db-proxy"),
        (now - timedelta(minutes=18), "ERROR", f"{svc1}: Retry attempt 2/5 to reconnect to db-proxy"),
        (now - timedelta(minutes=17), "ERROR", f"{svc1}: Retry attempt 3/5 failed: ETIMEDOUT"),
        (now - timedelta(minutes=16), "CRITICAL", f"{svc1}: All retry attempts exhausted for db-proxy"),
        (now - timedelta(minutes=15), "ERROR", f"api-gateway: 503 rate at 67% for path /api/v1/payments"),
        (now - timedelta(minutes=14), "WARN", f"notification-service: payment webhook failures increasing"),
        (now - timedelta(minutes=13), "ERROR", f"{svc1}: Stale connections detected: 45 connections idle > 300s"),
        (now - timedelta(minutes=12), "ERROR", f"{svc1}: Memory pressure from connection objects: RSS=2.1GB"),
        (now - timedelta(minutes=11), "WARN", f"api-gateway: latency p99=4500ms for /api/v1/payments"),
        (now - timedelta(minutes=10), "ERROR", f"{svc1}: GC pause 1200ms — connection object accumulation"),
        (now - timedelta(minutes=9), "CRITICAL", f"{svc1}: Service degraded — error_rate=67% latency_p99=4500ms"),
        (now - timedelta(minutes=8), "ERROR", f"api-gateway: cascade failure detected across 3 downstream services"),
        (now - timedelta(minutes=7), "WARN", f"order-service: order queue depth at 1250, processing halted"),
        (now - timedelta(minutes=6), "ERROR", f"{svc1}: New connections rejected: pool_status=EXHAUSTED"),
        (now - timedelta(minutes=5), "ERROR", f"{svc1}: Transaction failure rate 72% in last 5 minutes"),
        (now - timedelta(minutes=4), "CRITICAL", f"api-gateway: SLA breach — availability dropped to 33%"),
        (now - timedelta(minutes=3), "ERROR", f"{svc1}: db-proxy returning intermittent connection resets"),
        (now - timedelta(minutes=2), "ERROR", f"{svc1}: Connection pool cleanup attempted — 0 connections freed"),
        (now - timedelta(minutes=1), "CRITICAL", f"{svc1}: INCIDENT ACTIVE — cascading DB failure affecting payments pipeline — revenue loss $4,200/min"),
        (now, "ERROR", f"{svc1}: Awaiting manual intervention — connection pool must be reset — cumulative revenue impact: $189,000"),
    ]
    # Pad to 50
    for i in range(len(inc1_logs), 50):
        t = now - timedelta(minutes=45 - i)
        inc1_logs.append((t, "ERROR", f"{svc1}: Connection pool still exhausted — request #{i} dropped"))

    for ts, level, msg in inc1_logs:
        c.execute("INSERT INTO logs (timestamp, level, message, service) VALUES (?, ?, ?, ?)",
                  (ts.isoformat(), level, msg, svc1))

    for i in range(20):
        t = now - timedelta(minutes=40 - i * 2)
        frac = i / 19.0
        c.execute("INSERT INTO metrics (timestamp, service, cpu_percent, memory_mb, error_rate, latency_ms, connections, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  (t.isoformat(), svc1,
                   17 + frac * 50,
                   512 + frac * 1600,
                   0 + frac * 67,
                   120 + frac * 4380,
                   int(45 + frac * 155),
                   "degraded" if frac > 0.3 else "healthy"))

    c.execute("INSERT INTO incidents (id, timestamp, service, description, resolution) VALUES (?, ?, ?, ?, ?)",
              ("db_cascade", now.isoformat(), svc1,
               "Cascading database failure: connection pool exhausted causing timeouts and 503s across payment pipeline",
               ""))

    # === Scenario 2: memory_leak ===
    svc2 = "image-processor"
    inc2_logs = [
        (now - timedelta(minutes=51), "CRITICAL", f"{svc2}: image pipeline stalled — estimated revenue impact $1,800/minute from delayed content delivery"),
        (now - timedelta(minutes=50), "INFO", f"{svc2}: Service started, PID=1842, RSS=512MB"),
        (now - timedelta(minutes=48), "INFO", f"{svc2}: Processing batch of 50 images from queue"),
        (now - timedelta(minutes=46), "INFO", f"{svc2}: Batch complete, RSS=680MB"),
        (now - timedelta(minutes=44), "WARN", f"{svc2}: RSS memory at 890MB — above baseline of 512MB"),
        (now - timedelta(minutes=42), "INFO", f"{svc2}: Processing batch of 75 images"),
        (now - timedelta(minutes=40), "WARN", f"{svc2}: RSS memory at 1200MB — growth rate 15MB/min"),
        (now - timedelta(minutes=38), "WARN", f"{svc2}: GC collection took 450ms — heap pressure increasing"),
        (now - timedelta(minutes=36), "INFO", f"{svc2}: Object count: cache=12450 active_requests=3"),
        (now - timedelta(minutes=34), "WARN", f"{svc2}: RSS memory at 1650MB — growth not stabilizing"),
        (now - timedelta(minutes=32), "WARN", f"{svc2}: Full GC triggered, freed only 45MB, RSS=1605MB"),
        (now - timedelta(minutes=30), "WARN", f"{svc2}: cache list contains 18200 entries — no eviction policy"),
        (now - timedelta(minutes=28), "ERROR", f"{svc2}: RSS memory at 2100MB — approaching container limit 4096MB"),
        (now - timedelta(minutes=26), "WARN", f"{svc2}: GC overhead at 12% of CPU time"),
        (now - timedelta(minutes=24), "WARN", f"{svc2}: Processing latency increased: avg=850ms (baseline=120ms)"),
        (now - timedelta(minutes=22), "ERROR", f"{svc2}: RSS memory at 2600MB — 63% of container limit"),
        (now - timedelta(minutes=20), "WARN", f"{svc2}: Swap usage detected: 256MB swapped out"),
        (now - timedelta(minutes=18), "ERROR", f"{svc2}: cache list at 28900 entries — unbounded growth confirmed"),
        (now - timedelta(minutes=16), "ERROR", f"{svc2}: RSS memory at 3100MB — OOM kill risk HIGH"),
        (now - timedelta(minutes=14), "WARN", f"{svc2}: GC pause 2200ms — stop-the-world event"),
        (now - timedelta(minutes=12), "ERROR", f"{svc2}: RSS memory at 3400MB — page faults increasing"),
        (now - timedelta(minutes=10), "CRITICAL", f"{svc2}: OOM warning — RSS=3600MB, limit=4096MB"),
        (now - timedelta(minutes=9), "ERROR", f"{svc2}: New allocation failed: cannot allocate 128MB buffer"),
        (now - timedelta(minutes=8), "ERROR", f"{svc2}: Image processing request failed: MemoryError"),
        (now - timedelta(minutes=7), "CRITICAL", f"{svc2}: RSS=3800MB — service will be OOM-killed imminently"),
        (now - timedelta(minutes=6), "ERROR", f"{svc2}: 5 consecutive processing failures due to memory"),
        (now - timedelta(minutes=5), "ERROR", f"{svc2}: cache list at 42100 entries — THIS IS THE LEAK SOURCE"),
        (now - timedelta(minutes=4), "CRITICAL", f"{svc2}: RSS=3800MB, swap=512MB, OOM score=950/1000"),
        (now - timedelta(minutes=3), "ERROR", f"{svc2}: Dropping incoming requests — insufficient memory"),
        (now - timedelta(minutes=2), "ERROR", f"{svc2}: Traceback: process_image() appends to global cache without eviction"),
        (now - timedelta(minutes=1), "CRITICAL", f"{svc2}: INCIDENT ACTIVE — memory leak causing OOM, fix required in app.py"),
        (now, "ERROR", f"{svc2}: Service at risk of container OOM kill"),
    ]
    for i in range(len(inc2_logs), 50):
        t = now - timedelta(minutes=50 - i)
        inc2_logs.append((t, "WARN", f"{svc2}: Memory still growing — RSS={3800 + i}MB"))

    for ts, level, msg in inc2_logs:
        c.execute("INSERT INTO logs (timestamp, level, message, service) VALUES (?, ?, ?, ?)",
                  (ts.isoformat(), level, msg, svc2))

    for i in range(20):
        t = now - timedelta(minutes=40 - i * 2)
        frac = i / 19.0
        c.execute("INSERT INTO metrics (timestamp, service, cpu_percent, memory_mb, error_rate, latency_ms, connections, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  (t.isoformat(), svc2, 25 + frac * 60, 512 + frac * 3288, frac * 35, 120 + frac * 2880, 10, "degraded" if frac > 0.4 else "healthy"))

    c.execute("INSERT INTO incidents (id, timestamp, service, description, resolution) VALUES (?, ?, ?, ?, ?)",
              ("memory_leak", now.isoformat(), svc2,
               "Memory leak in image-processor: unbounded cache list growing without eviction, approaching OOM",
               ""))

    # === Scenario 3: exception_loop ===
    svc3 = "api-gateway"
    inc3_logs = [
        (now - timedelta(minutes=31), "CRITICAL", f"{svc3}: all API traffic blocked — estimated revenue impact $7,500/minute across all downstream services"),
        (now - timedelta(minutes=30), "INFO", f"{svc3}: Service started on port 8080, PID=2201"),
        (now - timedelta(minutes=29), "INFO", f"{svc3}: Health check passed, accepting traffic"),
        (now - timedelta(minutes=28), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=28, seconds=1), "ERROR", f"{svc3}: Traceback: payload['user_id'] — key not found in request body"),
        (now - timedelta(minutes=27, seconds=48), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=27, seconds=36), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=27, seconds=24), "ERROR", f"{svc3}: Request from IP=10.0.3.42 missing 'user_id' field"),
        (now - timedelta(minutes=27, seconds=12), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=27), "WARN", f"{svc3}: Error rate at 45% in last 60s"),
        (now - timedelta(minutes=26, seconds=48), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=26, seconds=36), "ERROR", f"{svc3}: Process crash — restarting (attempt 1)"),
        (now - timedelta(minutes=26, seconds=24), "INFO", f"{svc3}: Service restarted, PID=2245"),
        (now - timedelta(minutes=26, seconds=12), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=26), "ERROR", f"{svc3}: Same malformed request pattern repeating every ~200ms"),
        (now - timedelta(minutes=25, seconds=48), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=25, seconds=36), "ERROR", f"{svc3}: Crash loop: 3 restarts in 120s"),
        (now - timedelta(minutes=25), "ERROR", f"{svc3}: Process crash — restarting (attempt 2)"),
        (now - timedelta(minutes=24, seconds=30), "INFO", f"{svc3}: Service restarted, PID=2289"),
        (now - timedelta(minutes=24), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=23, seconds=48), "ERROR", f"{svc3}: Malformed payload: {{'action': 'purchase', 'amount': 99.99}} — missing user_id"),
        (now - timedelta(minutes=23, seconds=36), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=23), "ERROR", f"{svc3}: Error rate at 85%"),
        (now - timedelta(minutes=22), "ERROR", f"{svc3}: Process crash — restarting (attempt 3)"),
        (now - timedelta(minutes=21), "WARN", f"{svc3}: Latency spike during restart: p99=8500ms"),
        (now - timedelta(minutes=20), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=19), "ERROR", f"{svc3}: 500 Internal Server Error returned to client 10.0.3.42"),
        (now - timedelta(minutes=18), "ERROR", f"{svc3}: Exception loop: same KeyError repeating continuously"),
        (now - timedelta(minutes=17), "CRITICAL", f"{svc3}: Error rate at 95% — service effectively down"),
        (now - timedelta(minutes=16), "ERROR", f"{svc3}: Upstream clients receiving 500 for all requests"),
        (now - timedelta(minutes=15), "ERROR", f"{svc3}: handle_request needs input validation for 'user_id' field"),
        (now - timedelta(minutes=14), "ERROR", f"{svc3}: Crash count: 5 in last 15 minutes"),
        (now - timedelta(minutes=13), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=12), "CRITICAL", f"{svc3}: SLA breach — uptime below 10% in monitoring window"),
        (now - timedelta(minutes=10), "ERROR", f"{svc3}: Fix required: add input validation in handle_request()"),
        (now - timedelta(minutes=8), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=6), "ERROR", f"{svc3}: Process crash — restarting (attempt 7)"),
        (now - timedelta(minutes=5), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=4), "CRITICAL", f"{svc3}: INCIDENT ACTIVE — exception loop crashing service every ~30s"),
        (now - timedelta(minutes=3), "ERROR", f"{svc3}: Root cause: payload['user_id'] in app.py handle_request — no KeyError handling"),
        (now - timedelta(minutes=2), "ERROR", f"{svc3}: Unhandled KeyError in handle_request: 'user_id'"),
        (now - timedelta(minutes=1), "CRITICAL", f"{svc3}: Service in crash loop — requires code fix and deploy"),
        (now, "ERROR", f"{svc3}: Awaiting fix — add payload.get('user_id') with validation"),
    ]
    for i in range(len(inc3_logs), 50):
        t = now - timedelta(minutes=30 - i * 0.5)
        inc3_logs.append((t, "ERROR", f"{svc3}: KeyError: 'user_id' in handle_request (repeat #{i})"))

    for ts, level, msg in inc3_logs:
        c.execute("INSERT INTO logs (timestamp, level, message, service) VALUES (?, ?, ?, ?)",
                  (ts.isoformat(), level, msg, svc3))

    for i in range(20):
        t = now - timedelta(minutes=30 - i * 1.5)
        frac = i / 19.0
        c.execute("INSERT INTO metrics (timestamp, service, cpu_percent, memory_mb, error_rate, latency_ms, connections, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  (t.isoformat(), svc3, 20 + frac * 70, 256 + frac * 400, 5 + frac * 90, 50 + frac * 8450, int(100 + frac * 50), "critical" if frac > 0.3 else "healthy"))

    c.execute("INSERT INTO incidents (id, timestamp, service, description, resolution) VALUES (?, ?, ?, ?, ?)",
              ("exception_loop", now.isoformat(), svc3,
               "Exception loop in api-gateway: unhandled KeyError on missing user_id crashing service every ~30 seconds",
               ""))

    conn.commit()
    conn.close()
    print(f"Database seeded with 3 incident scenarios at {DB_PATH}")


seed_db()


@mcp.tool()
async def query_logs(service: str, minutes_back: int = 120, query: str = None, limit: int = 100, level: str = None) -> dict[str, Any]:
    """Query log entries for a service within a time window with optional text filter."""
    try:
        conn = get_db()
        cutoff = (datetime.utcnow() - timedelta(minutes=minutes_back)).isoformat()
        
        sql = "SELECT timestamp, level, message, service FROM logs WHERE service = ? AND timestamp >= ?"
        params = [service, cutoff]
        
        if query:
            sql += " AND message LIKE ?"
            params.append(f"%{query}%")
            
        if level:
            sql += " AND level = ?"
            params.append(level.upper())
            
        sql += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(sql, tuple(params)).fetchall()
        conn.close()
        return {"logs": [dict(r) for r in rows]}
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return {"error": str(exc), "logs": []}


@mcp.tool()
async def get_metrics(service: str) -> dict[str, Any]:
    """Get the latest metrics for a service."""
    try:
        conn = get_db()
        row = conn.execute(
            "SELECT cpu_percent, memory_mb, error_rate, latency_ms, connections, status FROM metrics WHERE service = ? ORDER BY timestamp DESC LIMIT 1",
            (service,)
        ).fetchone()
        conn.close()
        if row is None:
            return {"error": f"No metrics found for service '{service}'"}
        return dict(row)
    except Exception as exc:
        return {"error": str(exc)}


@mcp.tool()
async def get_incident_history(service: str) -> dict[str, Any]:
    """Get incident history for a service."""
    try:
        conn = get_db()
        rows = conn.execute(
            "SELECT id, timestamp, description, resolution FROM incidents WHERE service = ? ORDER BY timestamp DESC",
            (service,)
        ).fetchall()
        conn.close()
        return {"incidents": [dict(r) for r in rows]}
    except Exception as exc:
        return {"error": str(exc), "incidents": []}


@mcp.custom_route("/health", methods=["GET"])
async def health(request):
    from starlette.responses import JSONResponse
    return JSONResponse({"status": "healthy", "service": "logdb"})


@mcp.custom_route("/call-tool", methods=["POST"])
async def call_tool(request):
    from starlette.responses import JSONResponse
    try:
        data = await request.json()
        tool_name = data.get("tool_name")
        arguments = data.get("arguments", {})
        result = await mcp.call_tool(tool_name, arguments)
        return JSONResponse(result.model_dump())
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    print("Starting AXIOM LogDB MCP Server on port 8002...")
    uvicorn.run(mcp.http_app(), host="0.0.0.0", port=8002, log_level="info")
