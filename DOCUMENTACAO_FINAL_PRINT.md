# DOCUMENTAÇÃO FINAL DE MIGRAÇÃO: CISM PREP
**Data:** 31 de Janeiro de 2026
**Status:** Deploy Concluído com Sucesso

---

## 1. VISÃO GERAL DA INFRAESTRUTURA (PROJECT.md)

O projeto CISM Prep foi migrado de uma arquitetura local para uma stack "Cloud-Native" gratuita e escalável.

*   **Frontend**: [Vercel](https://vercel.com) (React + Vite)
    - Conectado à branch `main` do GitHub.
    - Gerencia roteamento SPA via `vercel.json`.
*   **Backend (API)**: [Railway](https://railway.app) (Python FastAPI)
    - Servidor de produção: Gunicorn com Workers Uvicorn.
    - Configuração de inicialização via `Procfile`.
*   **Banco de Dados**: [Neon.tech](https://neon.tech) (PostgreSQL Serverless)
    - Tabelas criadas automaticamente na primeira conexão.
*   **Repositório**: [GitHub](https://github.com/leonardoresende2010-coder/cism_repositorio)

---

## 2. GUIA DE CONFIGURAÇÃO PASSO A PASSO (WALKTHROUGH)

### Passo 1: GitHub
O código local foi sincronizado com o GitHub após resolver conflitos de histórico e permissões.
- **Dica:** Para novos envios, use `git push github main`.

### Passo 2: Banco de Dados Neon
1. Utilize a string de conexão (DATABASE_URL) no Railway.
2. Certifique-se de que o modo "Direct Connection" está ativo.

### Passo 3: Backend no Railway
1. Importe o repositório do GitHub.
2. Adicione as Variáveis de Ambiente essenciais:
   - `DATABASE_URL`: Conexão Neon.
   - `GROQ_API_KEY`: Para inteligência artificial (Groq API, plano gratuito).
   - `CORS_ORIGINS`: URL do Vercel (ex: `https://site.vercel.app`).
   - `FRONTEND_URL`: Mesma URL do Vercel.
   - `USE_SQLITE`: `false` (obrigatório para usar Neon).

### Passo 4: Frontend no Vercel
1. Importe o repositório.
2. Selecione o Framework Preset: **Vite**.
3. Adicione Variáveis de Ambiente:
   - `VITE_API_URL`: URL gerada pelo Railway.
   - `VITE_GOOGLE_CLIENT_ID`: ID para autenticação Google.

---

## 3. HISTÓRICO DE SUPORTE E SOLUÇÕES (LOGS DE ERROS)

Durante a migração, resolvemos os seguintes pontos críticos. Esta seção serve como referência para manutenção futura.

### A. Erro de Permissão Git (403 Forbidden)
- **Problema:** O Windows tentava usar a conta `duedilligence1p1` em vez da conta correta do Leonardo.
- **Solução:** Limpamos o Gerenciador de Credenciais do Windows via terminal (`cmdkey /delete`) e forçamos o login correto através do comando:
  `git remote set-url github https://leonardoresende2010-coder@github.com/...`

### B. Estrutura de Pastas no GitHub
- **Problema:** O Git foi iniciado na pasta do usuário, criando uma estrutura aninhada (`Downloads/Cism/...`) que o Railway não conseguia ler.
- **Solução:** Re-iniciamos o Git na raiz correta do projeto e usamos `git push --force` para limpar o repositório e colocar o `render.yaml` e o `Procfile` na raiz.

### C. Comando 'Gunicorn not found' no Railway
- **Problema:** O container do Railway não encontrava o servidor web.
- **Solução:** Adicionamos `gunicorn` ao arquivo `requirements.txt` e **movemos este arquivo para a raiz do repositório**. O Railway só instala as dependências automaticamente se o arquivo estiver na pasta principal.

### D. Erro de Autorização Google (Origin Mismatch)
- **Problema:** Erro 400 ao tentar logar com Google no novo site.
- **Solução:** É necessário cadastrar a URL do Vercel no [Console do Google Cloud](https://console.cloud.google.com/) em "Origens JavaScript autorizadas".

---

## 4. LISTA DE VARIÁVEIS DE AMBIENTE (PARA COLAR)

**Vercel:**
- `VITE_API_URL`: URL_DO_RAILWAY
- `VITE_GOOGLE_CLIENT_ID`: (configurar no painel do Vercel)

**Railway:**
- `DATABASE_URL`: (string de conexão do Neon - configurar no painel do Railway)
- `GROQ_API_KEY`: (chave da API Groq - configurar no painel do Railway)
- `CORS_ORIGINS`: URL_DO_VERCEL (ou `*` para testes)
- `USE_SQLITE`: `false`

> ⚠️ **IMPORTANTE:** Nunca commitar secrets/chaves no repositório. Configure sempre via variáveis de ambiente nos painéis do Railway e Vercel.

---

**Documentação gerada por Antigravity AI.**
