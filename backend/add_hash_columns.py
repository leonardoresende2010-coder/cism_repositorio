"""
Script para adicionar as novas colunas ao banco SQLite existente
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.database import engine
import sqlite3

def add_columns():
    # Conectar ao banco SQLite diretamente
    db_path = "cism_prepwise.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Banco de dados {db_path} não encontrado!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Adicionar content_hash à tabela questions
        print("📝 Adicionando coluna 'content_hash' à tabela 'questions'...")
        try:
            cursor.execute('''
                ALTER TABLE questions ADD COLUMN content_hash TEXT;
            ''')
            print("✅ Coluna 'content_hash' adicionada!")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  Coluna 'content_hash' já existe")
            else:
                raise
        
        # Adicionar question_hash à tabela community_notes
        print("\n📝 Adicionando coluna 'question_hash' à tabela 'community_notes'...")
        try:
            cursor.execute('''
                ALTER TABLE community_notes ADD COLUMN question_hash TEXT;
            ''')
            print("✅ Coluna 'question_hash' adicionada!")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  Coluna 'question_hash' já existe")
            else:
                raise
        
        # Tornar question_id nullable
        print("\n📝 Atualizando restrições da tabela 'community_notes'...")
        print("ℹ️  SQLite não suporta ALTER COLUMN diretamente, mas a coluna já é nullable")
        
        conn.commit()
        print("\n✅ Migrações de schema concluídas com sucesso!")
        print("🔄 Reiniciando o servidor backend agora aplicará as mudanças...")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_columns()
