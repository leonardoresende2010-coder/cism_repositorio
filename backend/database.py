import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Get the DATABASE_URL from environment variables
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "")
USE_SQLITE_FALLBACK = os.getenv("USE_SQLITE", "false").lower() == "true"

# Check if we should use SQLite fallback
if USE_SQLITE_FALLBACK or not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./cism_prepwise.db"
    print("⚠️  Using SQLite local database (fallback mode)")
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Neon PostgreSQL configuration
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    print(f"🐘 Attempting connection to Neon PostgreSQL...")
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True, 
        pool_recycle=300,
        connect_args={'connect_timeout': 10}
    )

from sqlalchemy import event
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
