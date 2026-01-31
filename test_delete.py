import sys
import os
sys.path.append(os.getcwd())
from backend.database import SessionLocal
from backend import models

def test_delete():
    db = SessionLocal()
    try:
        # Get first quiz
        quiz = db.query(models.Quiz).first()
        if not quiz:
            print("No quiz found to test delete")
            return
            
        print(f"Testing delete for quiz: {quiz.id} - {quiz.title}")
        db.delete(quiz)
        db.commit()
        print("✅ Delete successful")
    except Exception as e:
        print(f"❌ Delete failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_delete()
