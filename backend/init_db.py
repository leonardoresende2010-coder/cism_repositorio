from database import engine
import models

def init():
    print("Initializing database tables...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tables created/verified successfully.")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    init()
