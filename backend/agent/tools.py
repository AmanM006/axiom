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
async def run_command(cmd: str) -> dict[str, Any]:
    """Execute a shell command in the sandbox."""
    return await _call_mcp(TERMINAL_MCP_URL, "run_command", {"cmd": cmd})


# LogDB MCP tools
async def query_logs(service: str, minutes_back: int = 60) -> dict[str, Any]:
    """Query logs for a service."""
    return await _call_mcp(LOGDB_MCP_URL, "query_logs", {"service": service, "minutes_back": minutes_back})


async def get_metrics(service: str) -> dict[str, Any]:
    """Get current metrics for a service."""
    return await _call_mcp(LOGDB_MCP_URL, "get_metrics", {"service": service})


async def get_incident_history(service: str) -> dict[str, Any]:
    """Get incident history for a service."""
    return await _call_mcp(LOGDB_MCP_URL, "get_incident_history", {"service": service})


# GitHub MCP tools
async def get_file(path: str) -> dict[str, Any]:
    """Get a file from the GitHub repo."""
    return await _call_mcp(GITHUB_MCP_URL, "get_file", {"path": path})


async def list_files(directory: str) -> dict[str, Any]:
    """List files in a repo directory."""
    return await _call_mcp(GITHUB_MCP_URL, "list_files", {"directory": directory})


async def create_branch(branch_name: str) -> dict[str, Any]:
    """Create a new branch."""
    return await _call_mcp(GITHUB_MCP_URL, "create_branch", {"branch_name": branch_name})


async def push_file(path: str, content: str, branch: str, commit_message: str) -> dict[str, Any]:
    """Push a file to the repo."""
    return await _call_mcp(GITHUB_MCP_URL, "push_file", {
        "path": path, "content": content, "branch": branch, "commit_message": commit_message,
    })


async def open_pr(title: str, body: str, branch: str) -> dict[str, Any]:
    """Open a pull request."""
    return await _call_mcp(GITHUB_MCP_URL, "open_pr", {"title": title, "body": body, "branch": branch})


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
}
