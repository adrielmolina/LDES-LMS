import sqlite3
from pathlib import Path

DB_PATH = Path("sql/LDES-LMS.db")
SCHEMA_PATH = Path("sql/sqlite_db.sql")


def init_db():
    # Create DB file if it doesn't exist
    conn = sqlite3.connect(DB_PATH)
    
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")

    # Read and execute schema
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = f.read()
        conn.executescript(schema)

    conn.commit()
    conn.close()

    print("Database initialized successfully.")


if __name__ == "__main__":
    init_db()