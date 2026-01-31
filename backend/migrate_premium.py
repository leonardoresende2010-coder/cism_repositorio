import sqlite3
import os

db_path = '../cism_prepwise.db'
if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT 0")
        print("Column is_premium added successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error adding is_premium: {e}")
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN premium_until DATETIME")
        print("Column premium_until added successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error adding premium_until: {e}")
    
    conn.commit()
    conn.close()
    print("Migration finished.")
