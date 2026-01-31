import os
import sys
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import datetime

# Add current directory to path
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from backend import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_admin_user():
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin123"
        full_name = "System Administrator"
        email = "admin@prepwise.com"

        print(f"🚀 Criando usuário administrador: {username}")
        
        exists = db.query(models.User).filter(models.User.username == username).first()
        if not exists:
            hashed = get_password_hash(password)
            db_user = models.User(
                username=username,
                full_name=full_name,
                email=email,
                hashed_password=hashed,
                is_premium=True,
                is_admin=True,
                premium_until=datetime.datetime.utcnow() + datetime.timedelta(days=3650) # 10 years
            )
            db.add(db_user)
            print(f"✅ Usuário administrador criado: {username}")
        else:
            # Force update password and roles
            exists.hashed_password = get_password_hash(password)
            exists.full_name = full_name
            exists.email = email
            exists.is_premium = True
            exists.is_admin = True
            exists.premium_until = datetime.datetime.utcnow() + datetime.timedelta(days=3650)
            print(f"🔄 Usuário administrador resetado/atualizado: {username}")
        
        db.commit()
        print("✨ Tudo pronto! Credenciais: admin / admin123")
    except Exception as e:
        print(f"❌ Erro ao criar administrador: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
