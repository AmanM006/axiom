
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO")
GITHUB_MCP_URL = "http://localhost:8003"

BUGGY_APP_CODE = '''"""
AXIOM Demo Service — Buggy version for triage demo.
"""

from flask import Flask, request, jsonify
import sqlite3
import os
import time

app = Flask(__name__)

DATABASE = os.environ.get("DATABASE_URL", "demo.db")

# BUG: Global connection pool with no eviction/cleanup
# This will grow indefinitely and cause "db_cascade" failures
connection_pool = []

def get_db_connection():
    """Simulate a connection pool that never releases connections."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    connection_pool.append(conn) # BUG: Never removed from list
    return conn

@app.route("/api/v1/payments", methods=["POST"])
def process_payment():
    try:
        data = request.json
        user_id = data.get("user_id")
        amount = data.get("amount")
        
        # Simulating heavy DB work
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO transactions (user_id, amount, status) VALUES (?, ?, ?)", 
                       (user_id, amount, 'completed'))
        conn.commit()
        
        return jsonify({"status": "success", "transaction_id": cursor.lastrowid})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
'''

async def seed():
    print(f"Seeding {GITHUB_REPO}...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Try to push the file
        resp = await client.post(
            f"{GITHUB_MCP_URL}/call-tool",
            json={
                "tool_name": "push_file",
                "arguments": {
                    "path": "data/demo_service/app.py",
                    "content": BUGGY_APP_CODE,
                    "branch": "main",
                    "commit_message": "chore: initialize demo service with buggy code"
                }
            }
        )
        print(resp.status_code, resp.text)

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed())
