"""
Script para testar compartilhamento de notas entre usuários
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.database import SessionLocal
from backend.models import Question, CommunityNote, create_question_hash

def test_sharing():
    db = SessionLocal()
    try:
        # Buscar questões com mesmo texto (mas IDs diferentes)
        all_questions = db.query(Question).all()
        
        # Agrupar por hash
        hash_groups = {}
        for q in all_questions:
            if q.content_hash:
                if q.content_hash not in hash_groups:
                    hash_groups[q.content_hash] = []
                hash_groups[q.content_hash].append(q)
        
        print("🔍 Análise de Compartilhamento de Notas:\n")
        print("=" * 70)
        
        # Mostrar grupos com mais de uma questão (duplicadas)
        duplicates_found = False
        for hash_val, questions in hash_groups.items():
            if len(questions) > 1:
                duplicates_found = True
                # Buscar notas para este hash
                notes = db.query(CommunityNote).filter(
                    CommunityNote.question_hash == hash_val
                ).all()
                
                print(f"\n📝 Questão Compartilhada ({len(questions)} cópias):")
                print(f"   Texto: \"{questions[0].text[:60]}...\"")
                print(f"   Hash: {hash_val}")
                print(f"   IDs: {', '.join([q.id[:8] + '...' for q in questions])}")
                print(f"   💬 {len(notes)} notas compartilhadas:")
                
                for note in notes:
                    print(f"      - {note.user_name}: \"{note.content[:50]}...\"")
        
        if not duplicates_found:
            print("\nℹ️  Nenhuma questão duplicada encontrada ainda.")
            print("   As notas serão compartilhadas quando diferentes usuários")
            print("   carregarem o mesmo exame (ex: Security+)")
        
        print("\n" + "=" * 70)
        print(f"\n📊 Resumo:")
        print(f"   - Total de questões: {len(all_questions)}")
        print(f"   - Questões únicas (por hash): {len(hash_groups)}")
        print(f"   - Total de notas: {db.query(CommunityNote).count()}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_sharing()
