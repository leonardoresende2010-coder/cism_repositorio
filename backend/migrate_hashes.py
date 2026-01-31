"""
Script para migrar questões existentes adicionando content_hash
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal
from backend.models import Question, CommunityNote, create_question_hash

def migrate():
    db = SessionLocal()
    try:
        # 1. Atualizar todas as questões com content_hash
        questions = db.query(Question).all()
        print(f"📊 Encontradas {len(questions)} questões para atualizar...")
        
        updated = 0
        for q in questions:
            if not q.content_hash:
                q.content_hash = create_question_hash(q.text)
                updated += 1
        
        db.commit()
        print(f"✅ {updated} questões atualizadas com content_hash")
        
        # 2. Atualizar notas existentes com question_hash
        notes = db.query(CommunityNote).all()
        print(f"\n📝 Encontradas {len(notes)} notas para atualizar...")
        
        updated_notes = 0
        for note in notes:
            if note.question_id and not note.question_hash:
                question = db.query(Question).filter(Question.id == note.question_id).first()
                if question and question.content_hash:
                    note.question_hash = question.content_hash
                    updated_notes += 1
        
        db.commit()
        print(f"✅ {updated_notes} notas atualizadas com question_hash")
        
        print("\n🎉 Migração concluída!")
        print("Agora as notas serão compartilhadas entre usuários para questões idênticas!")
        
    except Exception as e:
        print(f"❌ Erro durante migração: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
