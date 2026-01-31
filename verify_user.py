from passlib.context import CryptContext
import sqlite3

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

db_path = "cism_prepwise.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT username, hashed_password FROM users WHERE username = 'carvalho';")
row = cursor.fetchone()
conn.close()

if row:
    username, hashed = row
    print(f"User: {username}")
    print(f"Hashed: {hashed}")
    matches = verify_password("password123", hashed)
    print(f"Matches 'password123'?: {matches}")
else:
    print("User carvalho not found")
