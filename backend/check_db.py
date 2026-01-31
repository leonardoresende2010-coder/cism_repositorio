import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    print("❌ No DATABASE_URL found in .env")
    exit(1)

try:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(database_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT inet_server_addr(), version();"))
        row = result.fetchone()
        print("✅ Connection Successful!")
        print(f"🌍 Server IP: {row[0]}")
        print(f"🐘 Database Version: {row[1]}")
        
        if "neon" in database_url or "neon.tech" in str(row[1]):
             print("🚀 Confirmed: Connected to Neon Tech PostgreSQL")
        else:
             print("ℹ️ Connected to a PostgreSQL database (Check hostname in .env to confirm Neon)")

except Exception as e:
    print(f"❌ Connection Failed: {e}")
