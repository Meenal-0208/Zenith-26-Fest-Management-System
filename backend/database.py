import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "fest.db"

def get_db_connection() -> sqlite3.Connection:
    """Connects to the SQLite database and configures row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        event_date TEXT NOT NULL,
        event_time TEXT NOT NULL,
        venue TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        fee INTEGER NOT NULL DEFAULT 0,
        icon TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL REFERENCES events(id),
        student_name TEXT NOT NULL,
        roll_number TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        registered_at TEXT NOT NULL,
        UNIQUE(event_id, email)
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
