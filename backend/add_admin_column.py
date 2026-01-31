from database import engine
from sqlalchemy import text

def add_admin_column():
    print("Updating users table schema to add is_admin...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
            print("Added is_admin column.")
        except Exception as e:
            print(f"is_admin column might already exist: {e}")
        
        conn.commit()
    print("Schema update complete.")

if __name__ == "__main__":
    add_admin_column()
