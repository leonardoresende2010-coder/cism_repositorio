import sqlite3

db_path = "cism_prepwise.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Adding workplace_id to quizzes...")
    cursor.execute("ALTER TABLE quizzes ADD COLUMN workplace_id TEXT")
except sqlite3.OperationalError as e:
    print(f"Note: {e}")

try:
    print("Adding description to quizzes...")
    cursor.execute("ALTER TABLE quizzes ADD COLUMN description TEXT")
except sqlite3.OperationalError as e:
    print(f"Note: {e}")

conn.commit()
conn.close()
print("Migration completed.")
