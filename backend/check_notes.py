import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from backend.database import SessionLocal
from backend.models import CommunityNote, Question

db = SessionLocal()
try:
    count = db.query(CommunityNote).count()
    print(f"Total de notas no banco: {count}")
    
    # Ver notas por questão
    q_notes = db.query(CommunityNote.question_id).distinct().all()
    print(f"Questões com notas: {len(q_notes)}")
    
    for q_id in q_notes:
        q = db.query(Question).filter(Question.id == q_id[0]).first()
        n_count = db.query(CommunityNote).filter(CommunityNote.question_id == q_id[0]).count()
        print(f" - Questão: '{q.text[:40]}...' | ID: {q.id} | Notas: {n_count}")
        
finally:
    db.close()
