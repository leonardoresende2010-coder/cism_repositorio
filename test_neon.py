import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def test_neon():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found in .env")
        return
    
    print(f"Testing connection to: {url.split('@')[1]}")
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        
        # Check users table
        try:
            cur.execute("SELECT COUNT(*) FROM users")
            u = cur.fetchone()[0]
        except:
            u = "Table 'users' not found"
            conn.rollback()
            
        # Check quizzes table
        try:
            cur.execute("SELECT COUNT(*) FROM quizzes")
            q = cur.fetchone()[0]
        except:
            q = "Table 'quizzes' not found"
            conn.rollback()

        print(f"Neon Users: {u}, Neon Quizzes: {q}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Neon connection failed: {e}")

if __name__ == "__main__":
    test_neon()
