import requests
import sys
import os

# Script para simular o recebimento de um webhook do Mercado Pago
# Isso permite testar se a lógica de ativação premium está funcionando sem gastar dinheiro real.

BASE_URL = "http://127.0.0.1:8000"

def simulate_payment(user_id):
    webhook_data = {
        "type": "payment",
        "data": {
            "id": "123456789" # ID fictício
        },
        "external_reference": user_id
    }
    
    # Nota: Em um cenário real, o backend chamaria a API do Mercado Pago para validar o ID.
    # Por segurança, o backend valida o status 'approved' e o 'external_reference'.
    # Como queremos APENAS simular o fluxo de ativação, vamos garantir que o backend
    # processe a lógica corretamente.
    
    print(f"🚀 Simulando aprovação de pagamento para o User ID: {user_id}")
    
    try:
        # Enviamos o webhook para a rota local
        response = requests.post(f"{BASE_URL}/payments/webhook", json=webhook_data)
        
        if response.status_code == 200:
            print("✅ Webhook enviado com sucesso!")
            print("Resposta do servidor:", response.json())
            print("\n💡 Agora verifique no sistema se o usuário já tem acesso às funções premium.")
        else:
            print(f"❌ Erro ao enviar webhook: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Falha de conexão: {e}")

if __name__ == "__main__":
    # Para o teste, vamos pegar o ID do usuário 'carvalho'
    import sqlite3
    db_path = "cism_prepwise.db"
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = 'carvalho';")
        user = cursor.fetchone()
        conn.close()
        
        if user:
            simulate_payment(user[0])
        else:
            print("Usuário 'carvalho' não encontrado no banco.")
    else:
        print("Arquivo de banco de dados não encontrado.")
