import requests
import json

# Try to log in first to get a token
login_url = "http://localhost:8000/token"
# We need to know a user to test this. I created 'admin' / 'admin123' previously?
# Let's check existing users.
from backend import models, database
from sqlalchemy.orm import Session

db = database.SessionLocal()
user = db.query(models.User).first()
db.close()

if not user:
    print("No users found in database.")
    exit()

print(f"Testing with user: {user.username}")

# Hardcoded login for testing if we know the password, but we don't.
# Alternatively, we can bypass auth for this test script if we modify main.py temporarily,
# or better, use a script that uses the session and manually calls the function.

import backend.main as main
from backend import schemas

def test_create_workplace():
    db = database.SessionLocal()
    try:
        current_user = db.query(models.User).filter(models.User.username == user.username).first()
        wp_data = schemas.WorkplaceCreate(name="Diagnostico Workplace")
        new_wp = main.create_workplace(wp_data, db, current_user)
        print(f"Successfully created workplace: {new_wp.id}")
    except Exception as e:
        print(f"Failed to create workplace: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

test_create_workplace()
