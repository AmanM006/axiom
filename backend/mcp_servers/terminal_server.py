"""
AXIOM Terminal MCP Server
FastMCP server on port 8001 — executes sandboxed shell commands.
"""

import asyncio
import json
import time
from typing import Any

from fastmcp import FastMCP

mcp = FastMCP("AXIOM Terminal Server")

BLOCKED_COMMANDS: list[str] = [
    "rm -rf /",
    "sudo rm",
    "mkfs",
    "dd if=",
    ":(){:|:&};:",
]

COMMAND_TIMEOUT_SECONDS = 10


def is_command_blocked(cmd: str) -> bool:
    """Check if a command matches any entry in the blocked list."""
    for blocked in BLOCKED_COMMANDS:
        if blocked in cmd:
            return True
    return False


@mcp.tool()
async def run_command(cmd: str) -> dict[str, Any]:
    """Execute a shell command inside the sandbox container.

    Args:
        cmd: The shell command to execute.

    Returns:
        Dict with stdout, stderr, exit_code, and duration_ms.
    """
    try:
        if is_command_blocked(cmd):
            return {
                "stdout": "",
                "stderr": f"Command blocked by security policy: {cmd}",
                "exit_code": -1,
                "duration_ms": 0,
            }

        start = time.monotonic()
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(),
                timeout=COMMAND_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            elapsed = int((time.monotonic() - start) * 1000)
            return {
                "stdout": "",
                "stderr": f"Command timed out after {COMMAND_TIMEOUT_SECONDS}s",
                "exit_code": -1,
                "duration_ms": elapsed,
            }

        elapsed = int((time.monotonic() - start) * 1000)
        return {
            "stdout": stdout_bytes.decode("utf-8", errors="replace"),
            "stderr": stderr_bytes.decode("utf-8", errors="replace"),
            "exit_code": process.returncode if process.returncode is not None else -1,
            "duration_ms": elapsed,
        }

    except Exception as exc:
        return {
            "stdout": "",
            "stderr": f"Execution error: {str(exc)}",
            "exit_code": -1,
            "duration_ms": 0,
        }


@mcp.custom_route("/health", methods=["GET"])
async def health(request):
    """Health check endpoint."""
    from starlette.responses import JSONResponse
    return JSONResponse({"status": "healthy", "service": "terminal-sandbox"})


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

    print("Starting AXIOM Terminal MCP Server on port 8001...")
    uvicorn.run(mcp.http_app(), host="0.0.0.0", port=8001, log_level="info")
