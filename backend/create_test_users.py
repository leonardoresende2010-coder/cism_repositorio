import os
import sys
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Add current directory to path
sys.path.append(os.getcwd())

from backend.database import SessionLocal, engine
from backend import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_test_users():
    db = SessionLocal()
    try:
        test_users = [
            {
                "username": "carvalho",
                "full_name": "Usuário Carvalho",
                "email": "carvalho@example.com",
                "password": "password123"
            },
            {
                "username": "carlos_silva",
                "full_name": "Carlos Silva",
                "email": "carlos.silva@example.com",
                "password": "password123"
            }
        ]

        print("🚀 Criando usuários de teste...")
        for user_data in test_users:
            exists = db.query(models.User).filter(models.User.username == user_data["username"]).first()
            if not exists:
                hashed = get_password_hash(user_data["password"])
                db_user = models.User(
                    username=user_data["username"],
                    full_name=user_data["full_name"],
                    email=user_data["email"],
                    hashed_password=hashed
                )
                db.add(db_user)
                print(f"✅ Usuário criado: {user_data['username']} ({user_data['full_name']})")
            else:
                # Force update password for test stability
                exists.hashed_password = get_password_hash(user_data["password"])
                exists.full_name = user_data["full_name"]
                exists.email = user_data["email"]
                print(f"🔄 Usuário resetado/atualizado: {user_data['username']}")
        
        db.commit()
        print("✨ Tudo pronto!")
    except Exception as e:
        print(f"❌ Erro ao criar usuários: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
