import pytest
import asyncio
import sys
import os
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

from agent.tools import (
    query_logs, get_metrics, get_incident_history,
    run_command, get_file, create_branch, open_pr
)

# ── LogDB MCP Tests ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_query_logs_returns_logs():
    result = await query_logs("payment-service", 1440)
    assert "logs" in result
    assert isinstance(result["logs"], list)
    assert len(result["logs"]) > 0

@pytest.mark.asyncio
async def test_query_logs_has_required_fields():
    result = await query_logs("payment-service", 1440)
    log = result["logs"][0]
    assert "timestamp" in log
    assert "level" in log
    assert "message" in log
    assert "service" in log

@pytest.mark.asyncio
async def test_get_metrics_payment_service():
    result = await get_metrics("payment-service")
    assert "error_rate" in result
    assert "latency_ms" in result
    assert "cpu_percent" in result
    assert "memory_mb" in result
    assert result["error_rate"] > 0

@pytest.mark.asyncio
async def test_get_metrics_memory_leak():
    result = await get_metrics("image-processor")
    assert "memory_mb" in result
    assert result["memory_mb"] > 512

@pytest.mark.asyncio
async def test_get_metrics_exception_loop():
    result = await get_metrics("api-gateway")
    assert "error_rate" in result
    assert result["error_rate"] > 50

@pytest.mark.asyncio
async def test_get_incident_history():
    result = await get_incident_history("payment-service")
    assert "incidents" in result
    assert len(result["incidents"]) > 0
    assert "description" in result["incidents"][0]

@pytest.mark.asyncio
async def test_query_logs_db_cascade_has_critical():
    result = await query_logs("payment-service", 1440)
    levels = [l["level"] for l in result["logs"]]
    assert "CRITICAL" in levels or "ERROR" in levels

@pytest.mark.asyncio
async def test_query_logs_memory_leak_service():
    result = await query_logs("image-processor", 1440)
    assert "logs" in result
    assert len(result["logs"]) > 0

@pytest.mark.asyncio
async def test_query_logs_exception_loop_service():
    result = await query_logs("api-gateway", 1440)
    assert "logs" in result
    assert len(result["logs"]) > 0

# ── Terminal MCP Tests ────────────────────────────────────────

@pytest.mark.asyncio
async def test_run_command_basic():
    result = await run_command("echo hello")
    assert "stdout" in result
    assert "hello" in result["stdout"]
    assert result["exit_code"] == 0

@pytest.mark.asyncio
async def test_run_command_returns_exit_code():
    result = await run_command("exit 0")
    assert "exit_code" in result

@pytest.mark.asyncio
async def test_run_command_blocks_dangerous():
    result = await run_command("rm -rf /")
    assert "error" in result or result.get("exit_code") == -1

@pytest.mark.asyncio
async def test_run_command_ps():
    result = await run_command("ps aux | head -5")
    assert "stdout" in result
    assert result["exit_code"] == 0

@pytest.mark.asyncio
async def test_run_command_free_memory():
    result = await run_command("free -m")
    assert "stdout" in result

# ── GitHub MCP Tests ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_file_demo_service():
    result = await get_file("data/demo_service/app.py")
    assert "content" in result
    assert "BUG" in result["content"]

@pytest.mark.asyncio
async def test_get_file_returns_sha():
    result = await get_file("data/demo_service/app.py")
    assert "sha" in result
    assert len(result["sha"]) > 0

@pytest.mark.asyncio
async def test_get_file_nonexistent_returns_error():
    result = await get_file("nonexistent/file.py")
    assert "error" in result

# ── Agent Logic Tests ─────────────────────────────────────────

def test_incident_service_map():
    from agent.graph import INCIDENT_SERVICE_MAP
    assert "db_cascade" in INCIDENT_SERVICE_MAP
    assert "memory_leak" in INCIDENT_SERVICE_MAP
    assert "exception_loop" in INCIDENT_SERVICE_MAP
    assert INCIDENT_SERVICE_MAP["db_cascade"] == "payment-service"

def test_tool_registry_complete():
    from agent.tools import TOOL_REGISTRY
    required = ["run_command", "query_logs", "get_metrics",
                "get_incident_history", "get_file", "create_branch",
                "push_file", "open_pr"]
    for tool in required:
        assert tool in TOOL_REGISTRY, f"Missing tool: {tool}"

def test_system_prompt_exists():
    from agent.prompts import SYSTEM_PROMPT
    assert len(SYSTEM_PROMPT) > 100
    assert "action" in SYSTEM_PROMPT.lower()
    assert "hypothesis" in SYSTEM_PROMPT.lower()

def test_build_hypothesis_prompt():
    from agent.prompts import build_hypothesis_prompt
    result = build_hypothesis_prompt(
        "db_cascade", "payment-service", [], [], []
    )
    assert "db_cascade" in result
    assert "payment-service" in result

def test_agent_state_defaults():
    from agent.state import AgentState
    state = AgentState(incident_id="db_cascade")
    assert state.incident_id == "db_cascade"
    assert state.resolved == False
    assert state.total_reward == 0.0
    assert isinstance(state.observations, list)
    assert isinstance(state.actions_taken, list)
