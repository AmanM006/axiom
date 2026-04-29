"""
AXIOM seed_logs.py — Seeds the SQLite database with incident scenarios.
This module is imported by logdb_server.py; it can also be run standalone.
"""

import sqlite3
import os
from datetime import datetime, timedelta


DB_PATH = os.environ.get("DB_PATH", "data/incidents.db")


def seed():
    """Seed the database. Delegates to logdb_server.py inline seeding."""
    print(f"Seeding is handled inline by logdb_server.py at {DB_PATH}")
    print("Run logdb_server.py to seed the database.")


if __name__ == "__main__":
    seed()
