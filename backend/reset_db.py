from backend.database import engine, Base
from backend.models import Quiz, Question, UserProgress, User
from sqlalchemy import text

def reset_content_tables():
    print("Resetting content tables...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS user_progress CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS questions CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS quizzes CASCADE"))
        conn.commit()
    
    print("Recreating tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    reset_content_tables()
