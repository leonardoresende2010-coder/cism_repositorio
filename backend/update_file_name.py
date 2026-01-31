from backend.database import engine
from sqlalchemy import text

def update_quizzes_table():
    print("Updating quizzes table schema (adding file_name)...")
    with engine.connect() as conn:
        # Add file_name column
        try:
            conn.execute(text("ALTER TABLE quizzes ADD COLUMN file_name VARCHAR"))
            print("Added file_name column to quizzes.")
        except Exception as e:
            print(f"file_name column might already exist: {e}")

        conn.commit()
    print("Schema update complete.")

if __name__ == "__main__":
    update_quizzes_table()
