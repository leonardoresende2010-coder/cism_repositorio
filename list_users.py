import sqlite3
import os

db_path = "cism_prepwise.db"
if not os.path.exists(db_path):
    print(f"File {db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username FROM users;")
        users = cursor.fetchall()
        print(f"Users found: {users}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
