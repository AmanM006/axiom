"""
AXIOM Agent Tools — HTTP clients calling the three MCP servers.
Each function is async, wrapped in try/except, returns a dict.
"""

import os
import httpx
from typing import Any

TERMINAL_MCP_URL = os.environ.get("TERMINAL_MCP_URL", "http://localhost:8001")
LOGDB_MCP_URL = os.environ.get("LOGDB_MCP_URL", "http://localhost:8002")
GITHUB_MCP_URL = os.environ.get("GITHUB_MCP_URL", "http://localhost:8003")

TIMEOUT = 15.0


async def _call_mcp(base_url: str, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Generic MCP tool caller via HTTP POST."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                f"{base_url}/call-tool",
                json={"tool_name": tool_name, "arguments": arguments},
            )
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, dict) and "content" in data:
                for block in data["content"]:
                    if block.get("type") == "text":
                        import json
                        try:
                            return json.loads(block["text"])
                        except (json.JSONDecodeError, KeyError):
                            return {"result": block["text"]}
            return data
    except httpx.TimeoutException:
        return {"error": f"Timeout calling {tool_name} on {base_url}"}
    except Exception as exc:
        return {"error": f"Error calling {tool_name}: {str(exc)}"}


# Terminal MCP tools
async def run_command(cmd: str, **kwargs) -> dict[str, Any]:
    """Execute a shell command in the sandbox."""
    return await _call_mcp(TERMINAL_MCP_URL, "run_command", {"cmd": cmd})


# LogDB MCP tools
async def query_logs(service: str = None, minutes_back: int = 120, **kwargs) -> dict[str, Any]:
    """Query logs for a service. Supports 'query'/'filter' and 'limit'."""
    # Default to payment-service if missing (common in this demo)
    svc = service or kwargs.get("service") or "payment-service"
    
    # Map 'filter' to 'query' since LLMs often use 'filter'
    query = kwargs.get("query") or kwargs.get("filter")
    limit = kwargs.get("limit") or 100
    level = kwargs.get("level")
    
    args = {
        "service": svc,
        "minutes_back": minutes_back,
        "limit": limit
    }
    if query:
        args["query"] = query
    if level:
        args["level"] = level
        
    return await _call_mcp(LOGDB_MCP_URL, "query_logs", args)


async def get_metrics(service: str, **kwargs) -> dict[str, Any]:
    """Get current metrics for a service."""
    return await _call_mcp(LOGDB_MCP_URL, "get_metrics", {"service": service})


async def get_incident_history(service: str, **kwargs) -> dict[str, Any]:
    """Get incident history for a service."""
    return await _call_mcp(LOGDB_MCP_URL, "get_incident_history", {"service": service})


# GitHub MCP tools
async def get_file(path: str = None, file: str = None, **kwargs) -> dict[str, Any]:
    """Get a file from the GitHub repo."""
    # handle LLMs that use 'file' instead of 'path'
    resolved_path = path or file or kwargs.get("path") or kwargs.get("file")
    if not resolved_path:
        return {"error": "get_file requires a 'path' argument"}
    return await _call_mcp(GITHUB_MCP_URL, "get_file", {"path": resolved_path})


async def list_files(directory: str, **kwargs) -> dict[str, Any]:
    """List files in a repo directory."""
    return await _call_mcp(GITHUB_MCP_URL, "list_files", {"directory": directory})


async def create_branch(branch_name: str, **kwargs) -> dict[str, Any]:
    """Create a new branch."""
    return await _call_mcp(GITHUB_MCP_URL, "create_branch", {"branch_name": branch_name})


async def push_file(path: str, content: str, branch: str, commit_message: str, **kwargs) -> dict[str, Any]:
    """Push a file to the repo."""
    return await _call_mcp(GITHUB_MCP_URL, "push_file", {
        "path": path, "content": content, "branch": branch, "commit_message": commit_message,
    })


async def open_pr(title: str, body: str, branch: str, **kwargs) -> dict[str, Any]:
    """Open a pull request."""
    return await _call_mcp(GITHUB_MCP_URL, "open_pr", {"title": title, "body": body, "branch": branch})

async def check_buildkite_logs(branch: str, **kwargs) -> dict[str, Any]:
    """Check CI/CD test logs for a specific branch."""
    if "connection-pool" in branch or "db" in branch:
        return {"status": "failed", "logs": "test_db_connections FAILED: Expected 5 connections, found 10. Memory leak detected in pool."}
    return {"status": "success", "logs": "All tests passed successfully."}


TOOL_REGISTRY: dict[str, Any] = {
    "run_command": run_command,
    "query_logs": query_logs,
    "get_metrics": get_metrics,
    "get_incident_history": get_incident_history,
    "get_file": get_file,
    "list_files": list_files,
    "create_branch": create_branch,
    "push_file": push_file,
    "open_pr": open_pr,
    "check_buildkite_logs": check_buildkite_logs,
}
