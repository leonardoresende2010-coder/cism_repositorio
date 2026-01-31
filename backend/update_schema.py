from backend.database import engine
from sqlalchemy import text

def add_user_columns():
    print("Updating users table schema...")
    with engine.connect() as conn:
        # Add email column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
            conn.execute(text("CREATE UNIQUE INDEX ix_users_email ON users (email)"))
            print("Added email column.")
        except Exception as e:
            print(f"Email column might already exist: {e}")

        # Add google_sub column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR"))
            conn.execute(text("CREATE UNIQUE INDEX ix_users_google_sub ON users (google_sub)"))
            print("Added google_sub column.")
        except Exception as e:
            print(f"google_sub column might already exist: {e}")

        # Make password nullable
        try:
            conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
            print("Made hashed_password nullable.")
        except Exception as e:
            print(f"Could not alter password column: {e}")

        conn.commit()
    print("Schema update complete.")

if __name__ == "__main__":
    add_user_columns()
