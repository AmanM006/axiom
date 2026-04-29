"""
AXIOM Demo Service — A Flask microservice with 3 intentional bugs.
This is the target service the agent will diagnose and fix.
"""

from flask import Flask, request, jsonify
import sqlite3
import os

app = Flask(__name__)

DATABASE = os.environ.get("DATABASE_URL", "demo.db")


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
    )""")
    # Insert sample data
    conn.execute("INSERT OR IGNORE INTO users (id, name, email) VALUES ('u_001', 'Alice', 'alice@example.com')")
    conn.execute("INSERT OR IGNORE INTO users (id, name, email) VALUES ('u_002', 'Bob', 'bob@example.com')")
    for i in range(10):
        conn.execute(
            "INSERT OR IGNORE INTO transactions (id, user_id, amount, status) VALUES (?, ?, ?, ?)",
            (i + 1, f"u_00{(i % 2) + 1}", round(10.0 + i * 7.5, 2), "completed"),
        )
    conn.commit()
    conn.close()


# BUG: Memory leak — cache list grows unbounded, never evicted.
# The agent should find this and replace it with an LRU cache with maxsize.
cache = []


@app.route("/process-image", methods=["POST"])
def process_image():
    """Process an uploaded image. Contains a memory leak bug."""
    data = request.get_json(force=True, silent=True) or {}
    image_data = data.get("image", "placeholder_image_data_" + "x" * 1024)

    # BUG: Memory leak — appends to global list without eviction.
    # Fix: use functools.lru_cache or limit cache size with maxlen.
    cache.append(image_data)

    return jsonify({
        "status": "processed",
        "cache_size": len(cache),
        "message": f"Image processed. Cache entries: {len(cache)}"
    })


@app.route("/handle-request", methods=["POST"])
def handle_request_endpoint():
    """Handle an incoming API request. Contains an unhandled exception bug."""
    payload = request.get_json(force=True, silent=True) or {}

    # BUG: Unhandled exception — KeyError if 'user_id' is missing from payload.
    # Fix: use payload.get("user_id") with proper validation.
    user_id = payload["user_id"]

    return jsonify({
        "status": "ok",
        "user_id": user_id,
        "message": f"Request handled for user {user_id}"
    })


@app.route("/user/<user_id>/transactions", methods=["GET"])
def get_user_transactions(user_id):
    """Get transactions for a specific user. Contains a wrong query bug."""
    conn = get_db()

    # BUG: Missing WHERE clause — returns ALL transactions instead of filtering by user_id.
    # Fix: add WHERE user_id = ? and pass user_id as parameter.
    rows = conn.execute("SELECT * FROM transactions").fetchall()

    conn.close()
    return jsonify({
        "user_id": user_id,
        "transactions": [dict(r) for r in rows],
        "count": len(rows)
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "demo-service"})


@app.route("/metrics", methods=["GET"])
def metrics():
    return jsonify({
        "cache_size": len(cache),
        "status": "running"
    })


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5001, debug=True)
