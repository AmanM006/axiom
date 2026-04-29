"""
AXIOM GitHub MCP Server
FastMCP server on port 8003 — GitHub operations via PyGithub.
"""

import os
from typing import Any

from fastmcp import FastMCP
from github import Github, GithubException

mcp = FastMCP("AXIOM GitHub Server")

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO = os.environ.get("GITHUB_REPO", "")

_github_client: Github | None = None
_repo = None


def _connect():
    global _github_client, _repo
    if _github_client is not None:
        return _github_client, _repo
    try:
        _github_client = Github(GITHUB_TOKEN)
        _repo = _github_client.get_repo(GITHUB_REPO)
        print(f"GitHub connected: {_repo.owner.login}/{_repo.name}")
        return _github_client, _repo
    except Exception as exc:
        print(f"GitHub connection failed: {exc}")
        _github_client = None
        _repo = None
        return None, None


_connect()


@mcp.tool()
async def get_file(path: str) -> dict[str, Any]:
    """Get file contents from the GitHub repository."""
    try:
        _, repo = _connect()
        if repo is None:
            return {"error": "GitHub not connected"}
        contents = repo.get_contents(path)
        if isinstance(contents, list):
            return {"error": f"Path '{path}' is a directory"}
        return {
            "content": contents.decoded_content.decode("utf-8", errors="replace"),
            "sha": contents.sha,
            "path": contents.path,
        }
    except GithubException as exc:
        return {"error": f"GitHub API error: {exc.data.get('message', str(exc))}"}
    except Exception as exc:
        return {"error": str(exc)}


@mcp.tool()
async def list_files(directory: str) -> dict[str, Any]:
    """List files in a directory of the GitHub repository."""
    try:
        _, repo = _connect()
        if repo is None:
            return {"error": "GitHub not connected"}
        contents = repo.get_contents(directory)
        if not isinstance(contents, list):
            contents = [contents]
        files = [{"path": item.path, "type": item.type, "size": item.size} for item in contents]
        return {"files": files}
    except GithubException as exc:
        return {"error": f"GitHub API error: {exc.data.get('message', str(exc))}"}
    except Exception as exc:
        return {"error": str(exc)}


@mcp.tool()
async def create_branch(branch_name: str) -> dict[str, Any]:
    """Create a new branch from the default branch."""
    try:
        _, repo = _connect()
        if repo is None:
            return {"error": "GitHub not connected", "success": False}
        source = repo.get_branch(repo.default_branch)
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=source.commit.sha)
        return {"success": True, "branch_name": branch_name}
    except GithubException as exc:
        return {"error": f"GitHub API error: {exc.data.get('message', str(exc))}", "success": False}
    except Exception as exc:
        return {"error": str(exc), "success": False}


@mcp.tool()
async def push_file(path: str, content: str, branch: str, commit_message: str) -> dict[str, Any]:
    """Push a file to the repository on a specific branch."""
    try:
        _, repo = _connect()
        if repo is None:
            return {"error": "GitHub not connected", "success": False}
        try:
            existing = repo.get_contents(path, ref=branch)
            if isinstance(existing, list):
                return {"error": f"Path is a directory", "success": False}
            result = repo.update_file(path=path, message=commit_message, content=content, sha=existing.sha, branch=branch)
        except GithubException:
            result = repo.create_file(path=path, message=commit_message, content=content, branch=branch)
        return {"success": True, "commit_sha": result["commit"].sha}
    except GithubException as exc:
        return {"error": f"GitHub API error: {exc.data.get('message', str(exc))}", "success": False}
    except Exception as exc:
        return {"error": str(exc), "success": False}


@mcp.tool()
async def open_pr(title: str, body: str, branch: str) -> dict[str, Any]:
    """Open a pull request from the given branch to the default branch."""
    try:
        _, repo = _connect()
        if repo is None:
            return {"error": "GitHub not connected", "success": False}
        pr = repo.create_pull(title=title, body=body, head=branch, base=repo.default_branch)
        return {"success": True, "pr_url": pr.html_url, "pr_number": pr.number}
    except GithubException as exc:
        return {"error": f"GitHub API error: {exc.data.get('message', str(exc))}", "success": False}
    except Exception as exc:
        return {"error": str(exc), "success": False}


@mcp.custom_route("/health", methods=["GET"])
async def health(request):
    from starlette.responses import JSONResponse
    _, repo = _connect()
    if repo is not None:
        return JSONResponse({"status": "connected", "repo": GITHUB_REPO})
    return JSONResponse({"status": "disconnected", "error": "GitHub not connected"}, status_code=503)


if __name__ == "__main__":
    import uvicorn
    print("Starting AXIOM GitHub MCP Server on port 8003...")
    uvicorn.run(mcp.get_app(), host="0.0.0.0", port=8003, log_level="info")
