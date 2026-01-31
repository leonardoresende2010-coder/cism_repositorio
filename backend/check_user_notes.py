import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal
from backend.models import CommunityNote, Question

db = SessionLocal()
try:
    notes = db.query(CommunityNote).all()
    print(f"📊 Total de notas no banco: {len(notes)}")
    print("\n" + "="*60)
    
    if notes:
        print("\n🔍 Últimas 10 notas criadas:\n")
        for n in notes[-10:]:
            q = db.query(Question).filter(Question.id == n.question_id).first()
            q_preview = q.text[:50] if q else "Questão não encontrada"
            print(f"👤 Usuário: {n.user_name}")
            print(f"📝 Questão: {q_preview}...")
            print(f"💬 Comentário: {n.content[:60]}...")
            print(f"⏰ Data: {n.created_at}")
            print(f"🔑 Question ID: {n.question_id}")
            print("-" * 60)
    else:
        print("\n⚠️  Nenhuma nota encontrada no banco de dados!")
        
finally:
    db.close()
