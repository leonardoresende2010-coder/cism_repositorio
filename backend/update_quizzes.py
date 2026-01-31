from backend.database import engine
from sqlalchemy import text

def update_quizzes_table():
    print("Updating quizzes table schema...")
    with engine.connect() as conn:
        # Add provider column
        try:
            conn.execute(text("ALTER TABLE quizzes ADD COLUMN provider VARCHAR"))
            print("Added provider column to quizzes.")
        except Exception as e:
            print(f"Provider column might already exist: {e}")

        conn.commit()
    print("Schema update complete.")

if __name__ == "__main__":
    update_quizzes_table()
