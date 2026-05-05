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


async def _call_mcp(base_url: str, tool_name: str, arguments: dict[str, Any], session_config: dict[str, Any] = None) -> dict[str, Any]:
    """Generic MCP tool caller via HTTP POST, passing session config overrides."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            payload = {"tool_name": tool_name, "arguments": arguments}
            if session_config:
                payload["session_config"] = session_config
            
            resp = await client.post(f"{base_url}/call-tool", json=payload)
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
    return await _call_mcp(TERMINAL_MCP_URL, "run_command", {"cmd": cmd}, kwargs.get("session_config"))


# LogDB MCP tools
async def query_logs(service: str = None, minutes_back: int = 120, **kwargs) -> dict[str, Any]:
    """Query logs for a service. Supports 'query'/'filter' and 'limit'."""
    svc = service or kwargs.get("service") or "payment-service"
    query = kwargs.get("query") or kwargs.get("filter")
    limit = kwargs.get("limit") or 100
    level = kwargs.get("level")
    
    args = {"service": svc, "minutes_back": minutes_back, "limit": limit}
    if query: args["query"] = query
    if level: args["level"] = level
        
    return await _call_mcp(LOGDB_MCP_URL, "query_logs", args, kwargs.get("session_config"))


async def get_metrics(service: str, **kwargs) -> dict[str, Any]:
    """Get current metrics for a service."""
    return await _call_mcp(LOGDB_MCP_URL, "get_metrics", {"service": service}, kwargs.get("session_config"))


async def get_incident_history(service: str, **kwargs) -> dict[str, Any]:
    """Get incident history for a service."""
    return await _call_mcp(LOGDB_MCP_URL, "get_incident_history", {"service": service}, kwargs.get("session_config"))


# GitHub MCP tools
async def get_file(path: str = None, file: str = None, **kwargs) -> dict[str, Any]:
    """Get a file from the GitHub repo."""
    resolved_path = path or file or kwargs.get("path") or kwargs.get("file")
    if not resolved_path:
        return {"error": "get_file requires a 'path' argument"}
    return await _call_mcp(GITHUB_MCP_URL, "get_file", {"path": resolved_path}, kwargs.get("session_config"))


async def list_files(directory: str, **kwargs) -> dict[str, Any]:
    """List files in a repo directory."""
    return await _call_mcp(GITHUB_MCP_URL, "list_files", {"directory": directory}, kwargs.get("session_config"))


async def create_branch(branch_name: str, **kwargs) -> dict[str, Any]:
    """Create a new branch."""
    return await _call_mcp(GITHUB_MCP_URL, "create_branch", {"branch_name": branch_name}, kwargs.get("session_config"))


async def push_file(path: str, content: str, branch: str, commit_message: str, **kwargs) -> dict[str, Any]:
    """Push a file to the repo."""
    return await _call_mcp(GITHUB_MCP_URL, "push_file", {
        "path": path, "content": content, "branch": branch, "commit_message": commit_message,
    }, kwargs.get("session_config"))


async def open_pr(title: str, body: str, branch: str, **kwargs) -> dict[str, Any]:
    """Open a pull request."""
    return await _call_mcp(GITHUB_MCP_URL, "open_pr", {"title": title, "body": body, "branch": branch}, kwargs.get("session_config"))


async def check_buildkite_logs(branch: str, **kwargs) -> dict[str, Any]:
    """Check CI/CD test logs for a specific branch."""
    if "connection-pool" in branch or "db" in branch:
        return {"status": "failed", "logs": "test_db_connections FAILED: Expected 5 connections, found 10. Memory leak detected in pool."}
    return {"status": "success", "logs": "All tests passed successfully."}


async def search_knowledge_base(query: str, **kwargs) -> dict[str, Any]:
    """Search past incidents and internal knowledge base for similar issues."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(f"http://localhost:8080/api/v1/search", params={"q": query})
            resp.raise_for_status()
            return resp.json()
    except Exception as exc:
        return {"error": f"Failed to search knowledge base: {str(exc)}"}


async def validate_syntax(code: str, language: str = "python", **kwargs) -> dict[str, Any]:
    """Validate syntax of generated code before pushing it."""
    import asyncio
    await asyncio.sleep(0.5) # simulate work
    if language.lower() == "python":
        return {"status": "success", "message": "Syntax validation passed. 0 errors detected.", "linter_warnings": 0}
    return {"status": "success", "message": f"Syntax validation passed for {language}."}


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
    "search_knowledge_base": search_knowledge_base,
    "validate_syntax": validate_syntax,
}
