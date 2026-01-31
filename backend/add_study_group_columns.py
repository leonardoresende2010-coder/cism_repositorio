"""
Script para adicionar colunas de Study Group ao banco de dados
"""
import sqlite3
import os

def add_study_group_columns():
    db_path = "cism_prepwise.db"
    
    if not os.path.exists(db_path):
        print(f"❌ Banco de dados {db_path} não encontrado!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Adicionar visibility à tabela community_notes
        print("📝 Adicionando coluna 'visibility' à tabela 'community_notes'...")
        try:
            cursor.execute('''
                ALTER TABLE community_notes ADD COLUMN visibility TEXT DEFAULT 'public';
            ''')
            print("✅ Coluna 'visibility' adicionada!")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  Coluna 'visibility' já existe")
            else:
                raise
        
        # Adicionar shared_with à tabela community_notes
        print("\n📝 Adicionando coluna 'shared_with' à tabela 'community_notes'...")
        try:
            cursor.execute('''
                ALTER TABLE community_notes ADD COLUMN shared_with TEXT;
            ''')
            print("✅ Coluna 'shared_with' adicionada!")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️  Coluna 'shared_with' já existe")
            else:
                raise
        
        # Atualizar notas existentes para ter visibility = 'public'
        print("\n📝 Atualizando notas existentes para visibilidade pública...")
        cursor.execute('''
            UPDATE community_notes 
            SET visibility = 'public' 
            WHERE visibility IS NULL;
        ''')
        
        conn.commit()
        print("\n✅ Migrações de Study Group concluídas com sucesso!")
        print("🎉 Agora você pode criar grupos de estudo privados!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_study_group_columns()
