import sqlite3
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), 'hydro_monitor.db')

def get_connection():
    """Get a connection to the SQLite database."""
    # We use check_same_thread=False because FastAPI's async background tasks might 
    # run in different threads. As long as we use standard basic operations, sqlite3 
    # handles this safely if concurrency isn't massively extreme.
    return sqlite3.connect(DB_PATH, check_same_thread=False)

def init_db():
    """Initialize the database tables if they don't exist."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            
            # Create Dosing History Table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS dosing_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    parameter TEXT NOT NULL,
                    amount_ml REAL NOT NULL,
                    current_value REAL NOT NULL,
                    target_value REAL NOT NULL,
                    reason TEXT
                )
            ''')
            
            # Create an index on timestamp for faster retrieval of recent history
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_dosing_history_ts 
                ON dosing_history (timestamp DESC)
            ''')
            
            conn.commit()
            logger.info(f"SQLite database initialized at {DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

def log_dose(timestamp: str, parameter: str, amount_ml: float, current_value: float, target_value: float, reason: str = ""):
    """Record a dosing event directly to the SQLite database."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO dosing_history 
                (timestamp, parameter, amount_ml, current_value, target_value, reason)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (timestamp, parameter, amount_ml, current_value, target_value, reason))
            conn.commit()
    except Exception as e:
        logger.error(f"Failed to log dose to database: {e}")

def get_recent_doses(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve the most recent dosing events."""
    try:
        with get_connection() as conn:
            # Return rows as dictionaries
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM dosing_history 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = cursor.fetchall()
            
            # Convert to list of dicts & keep timestamp key expectations from frontend
            # We reverse the final list so it represents oldest-first in the UI chart 
            # if they expect chronological order, or we can just leave it newest-first.
            # We'll return newest first, exact same as current array slicing.
            result = []
            for row in rows:
                result.append({
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "parameter": row["parameter"],
                    "amount_ml": row["amount_ml"],
                    "current_value": row["current_value"],
                    "target_value": row["target_value"],
                    "reason": row["reason"]
                })
            
            # Current `get_history` returned [-limit:], which is chronological (oldest -> newest).
            # SQLite `ORDER BY timestamp DESC` gives newest first. 
            # We should reverse it so it matches chronological array appends natively.
            result.reverse()
            return result
            
    except Exception as e:
        logger.error(f"Failed to retrieve dosing history: {e}")
        return []
