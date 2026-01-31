# CISM Prep Cloud Infrastructure

Este documento descreve a infraestrutura de nuvem configurada para o projeto CISM Prep.

---

## 🎨 Frontend (Vercel)
- **Hospedagem:** [Vercel](https://vercel.com)
- **Tecnologias:** React, TypeScript, Vite.
- **Configuração:** `vercel.json` gerencia o roteamento SPA.

---

## ⚙️ Backend (Railway)
- **Hospedagem:** [Railway](https://railway.app)
- **Servidor:** Gunicorn com workers Uvicorn (`gunicorn_conf.py`).
- **Configuração:** `Procfile` define o comando de inicialização.
- **Linguagem:** Python 3.10+ (FastAPI).

---

## 🐘 Database (Neon)
- **Hospedagem:** [Neon.tech](https://neon.tech)
- **Tipo:** PostgreSQL (Serverless).
- **Conexão:** Gerenciada via variável de ambiente `DATABASE_URL`.

---

## 📁 Dados de Exames
- **Localização:** `backend/data/Testescript/` (dentro do repositório GitHub).
- **Acesso:** O backend lê estes arquivos automaticamente ao iniciar.

---

## 🚀 Repositório
- **GitHub:** [leonardoresende2010-coder/cism_repositorio](https://github.com/leonardoresende2010-coder/cism_repositorio)
- **Branch Principal:** `main`
