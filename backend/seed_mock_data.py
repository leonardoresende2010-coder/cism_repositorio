"""
Script para popular o banco de dados com usuários fictícios e notas da comunidade.
Este script agora é robusto: ele procura questões existentes por texto (ex: COBIT) e adiciona notas a elas.
"""
import sys
import os

# Adiciona o diretório raiz ao path para permitir importações do pacote backend
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from backend.database import SessionLocal
    from backend.models import User, Question, CommunityNote
    from passlib.context import CryptContext
    import datetime
except ImportError:
    # Fallback para execução local
    sys.path.insert(0, os.path.dirname(__file__))
    from database import SessionLocal
    from models import User, Question, CommunityNote
    from passlib.context import CryptContext
    import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    db = SessionLocal()
    try:
        # 1. Garantir que usuários existam
        mock_users_data = [
            {"username": "ana_silva", "password": "senha123"},
            {"username": "bruno_costa", "password": "senha123"},
            {"username": "carla_mendes", "password": "senha123"}
        ]
        
        users = []
        for u_data in mock_users_data:
            user = db.query(User).filter(User.username == u_data["username"]).first()
            if not user:
                user = User(
                    username=u_data["username"],
                    hashed_password=pwd_context.hash(u_data["password"])
                )
                db.add(user)
                db.flush()
                print(f"✅ Usuário criado: {u_data['username']}")
            users.append(user)
        
        db.commit()

        # 2. Buscar TODAS as questões que mencionam COBIT ou CIA ou Riscos
        questions = db.query(Question).all()
        if not questions:
            print("❌ Nenhuma questão encontrada no banco! Importe o arquivo Questoes_Teste.txt primeiro.")
            return

        print(f"📊 Encontradas {len(questions)} questões no total.")

        mock_notes_content = [
            {
                "keyword": "COBIT",
                "notes": [
                    "Dica: O COBIT foca em GOVERNANÇA e GESTÃO. Lembre-se que Governança é avaliar, direcionar e monitorar (EDM).",
                    "Macete: Se a questão fala em 'entrega de valor' e 'alinhamento estratégico', a resposta costuma ser COBIT.",
                    "Cuidado: Não confunda COBIT com ITIL. COBIT é o 'O QUE' (Governança), ITIL é o 'COMO' (Gestão de Serviços)."
                ]
            },
            {
                "keyword": "CIA",
                "notes": [
                    "Tríade CIA: Confidencialidade (Segredo), Integridade (Verdade), Disponibilidade (Acesso).",
                    "Dica de prova: Se falar em criptografia, geralmente é Confidencialidade. Se falar em Hash, é Integridade."
                ]
            },
            {
                "keyword": "risco",
                "notes": [
                    "Gestão de Riscos: Identificar -> Analisar -> Avaliar -> Tratar.",
                    "Macete: O risco residual é o que sobra depois dos controles. Nunca é zero!"
                ]
            }
        ]

        notes_count = 0
        for q in questions:
            q_text_lower = q.text.lower()
            for group in mock_notes_content:
                if group["keyword"].lower() in q_text_lower:
                    # Adicionar as notas deste grupo para esta questão específica
                    for i, content in enumerate(group["notes"]):
                        # Usar um usuário diferente para cada nota
                        author = users[i % len(users)]
                        
                        # Verificar se já existe exatamente essa nota para essa questão
                        existing = db.query(CommunityNote).filter(
                            CommunityNote.question_id == q.id,
                            CommunityNote.content == content
                        ).first()
                        
                        if not existing:
                            note = CommunityNote(
                                question_id=q.id,
                                user_id=author.id,
                                user_name=author.username,
                                content=content,
                                created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=i*2)
                            )
                            db.add(note)
                            notes_count += 1
        
        db.commit()
        print(f"✅ Sucesso! Adicionadas {notes_count} novas notas distribuídas pelas questões identificadas.")
        print("💡 Agora, ao responder questões sobre COBIT, CIA ou Riscos, as dicas aparecerão!")

    except Exception as e:
        print(f"❌ Erro durante o seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
