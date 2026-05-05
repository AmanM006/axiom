"""
AXIOM Supabase client — gracefully no-ops when env vars are unset.
Tables used:
  - chat_messages  (session_id, role, content, created_at)
  - resolved_incidents (id, name, service, resolved_at, summary)
"""
import os
from typing import Optional

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

_client = None

def get_client():
    global _client
    if _client:
        return _client
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        from supabase import create_client
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _client
    except Exception:
        return None


async def save_chat_message(session_id: str, role: str, content: str) -> bool:
    """Persist a single chat message. Returns False silently if Supabase is unavailable."""
    client = get_client()
    if not client:
        return False
    try:
        client.table("chat_messages").insert({
            "session_id": session_id,
            "role": role,
            "content": content,
        }).execute()
        return True
    except Exception:
        return False


async def get_chat_messages(session_id: str, limit: int = 50) -> list[dict]:
    """Fetch recent messages for a session. Returns [] silently if unavailable."""
    client = get_client()
    if not client:
        return []
    try:
        resp = (
            client.table("chat_messages")
            .select("role, content, created_at")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


async def save_resolved_incident(incident_id: str, name: str, service: str, summary: str = "") -> bool:
    """Mark an incident as resolved in Supabase."""
    client = get_client()
    if not client:
        return False
    try:
        client.table("resolved_incidents").upsert({
            "id": incident_id,
            "name": name,
            "service": service,
            "summary": summary,
        }).execute()
        return True
    except Exception:
        return False


async def get_resolved_incidents() -> list[dict]:
    """Fetch all resolved incidents. Returns [] if unavailable."""
    client = get_client()
    if not client:
        return []
    try:
        resp = (
            client.table("resolved_incidents")
            .select("id, name, service, summary, resolved_at")
            .order("resolved_at", desc=True)
            .limit(20)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


async def get_unique_sessions() -> list[str]:
    """Fetch unique session_ids from chat_messages."""
    client = get_client()
    if not client:
        return []
    try:
        # Fetch session_ids and uniqueify in Python for simplicity
        resp = client.table("chat_messages").select("session_id").execute()
        if not resp.data:
            return []
        return sorted(list(set(item["session_id"] for item in resp.data)))
    except Exception:
        return []
