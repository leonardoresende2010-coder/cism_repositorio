# Estrutura do Projeto (Cloud Native)

Este documento descreve a localização e a infraestrutura do projeto após a migração para a nuvem.

---

## 🎨 Frontend (Vercel)
- **Hospedagem:** [Vercel](https://vercel.com)
- **Localização:** Raiz do projeto e diretório `components/`.
- **Configuração:** `vercel.json` gerencia o roteamento SPA.
- **Tecnologias:** React, TypeScript, Vite.

---

## ⚙️ Backend (Render)
- **Hospedagem:** [Render](https://render.com)
- **Localização:** [backend/](file:///c:/Users/cadas/Downloads/Cism/Dumps/exports_json/cism-prep-master-antigravity/backend/)
- **Servidor:** Gunicorn com workers Uvicorn (`gunicorn_conf.py`).
- **Recursos:** Blueprint disponível em `render.yaml`.
- **Tecnologias:** Python, FastAPI, SQLAlchemy.

---

## 🗄️ Banco de Dados (Neon)
- **Provedor:** [Neon PostgreSQL](https://neon.tech)
- **Configuração:** Gerenciado via variável de ambiente `DATABASE_URL` no Render.
- **Migrações:** Tabelas criadas automaticamente via SQLAlchemy no startup do backend.

---

## 📦 Repositório (GitHub)
- **Hospedagem:** [GitHub](https://github.com)
- **Sincronização:** Deploy automático habilitado via conexões Render/Vercel -> GitHub.

---

## 📁 Dados de Exames
- **Localização:** `backend/data/Testescript/` (dentro do repositório).
- **Acesso:** O backend utiliza o caminho relativo definido pela variável `EXAMS_BASE_PATH`.
