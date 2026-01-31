# 📚 Sistema de "Dicas da Comunidade" - Como Funciona

## 🎯 Objetivo
Permitir que usuários compartilhem **macetes e dicas** sobre questões específicas de forma colaborativa, ajudando outros estudantes.

## 🔄 Fluxo Completo

### 1️⃣ **Quando o Usuário Resolve uma Questão**
- O usuário lê a questão e seleciona uma resposta (qualquer opção A, B, C, D)
- Assim que a resposta é submetida, o gabarito é revelado
- **IMPORTANTE**: As dicas só aparecem APÓS responder (para evitar spoilers)

### 2️⃣ **Visualização das Dicas da Comunidade**
Após responder, uma nova seção aparece logo abaixo da explicação oficial:

```
┌─────────────────────────────────────────────────┐
│  💡 Dicas da Comunidade                    3 Dicas│
├─────────────────────────────────────────────────┤
│  Card 1:                                        │
│  👤 ana_silva             📅 05/01/2026          │
│  "Dica importante: COBIT é focado em           │
│   GOVERNANÇA, não apenas em controles..."       │
├─────────────────────────────────────────────────┤
│  Card 2:                                        │
│  👤 bruno_costa           📅 03/01/2026          │
│  "Macete que me ajudou: COBIT = CO (Controle) │
│   + BIT (TI). Mas o foco é GESTÃO..."          │
├─────────────────────────────────────────────────┤
│  Card 3:                                        │
│  👤 carla_mendes          📅 04/01/2026          │
│  "Caiu na minha prova! A pegadinha é          │
│   confundir COBIT com ISO 27001..."            │
└─────────────────────────────────────────────────┘
```

### 3️⃣ **Compartilhando Sua Própria Dica**
Na parte inferior da seção, há:
- 📝 **Campo de texto**: Grande, expansível, com placeholder "Compartilhe um macete..."
- 🔘 **Botão "Compartilhar Macete"**: Roxo/Indigo, com estilo premium

**O que acontece ao clicar:**

```javascript
// Frontend (CommunityNotes.tsx)
1. Usuário digita: "Minha dica: Sempre associe COBIT com processos..."
2. Clica em "Compartilhar Macete"
3. O sistema chama: 
   api.createCommunityNote(questionId, userName, content)
   
// Backend (main.py)
4. POST /community-notes/
   {
     "question_id": "abc-123-def",
     "user_name": "testeuser",
     "content": "Minha dica: Sempre associe..."
   }
   
5. Salva no banco de dados:
   - Vincula à questão específica
   - Registra o autor (testeuser)
   - Marca a data/hora atual
   
6. Retorna a nota criada com ID

// Frontend novamente
7. A nova dica aparece no topo da lista
8. O campo de texto é limpo
9. Contador aumenta: "4 Dicas"
```

## 🌐 Exemplo Prático

### Situação Inicial:
- **testeuser** responde a Questão 1 sobre COBIT
- Vê 3 dicas de outros usuários (ana_silva, bruno_costa, carla_mendes)

### Ação do Usuário:
```
testeuser escreve:
"Eu memorizei assim: COBIT = Controle Objetivos de TI.
Foca em PROCESSOS e GOVERNANÇA, não em técnicas!"

[Clica em "Compartilhar Macete"]
```

### Resultado:
```
┌─────────────────────────────────────────────────┐
│  💡 Dicas da Comunidade                    4 Dicas│
├─────────────────────────────────────────────────┤
│  ✨ Card NOVO (no topo):                         │
│  👤 testeuser             📅 HOJE                │
│  "Eu memorizei assim: COBIT = Controle         │
│   Objetivos de TI. Foca em PROCESSOS..."        │
├─────────────────────────────────────────────────┤
│  Card 1:                                        │
│  👤 ana_silva             📅 05/01/2026          │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

### O que outros usuários verão:
- **qualquer_usuario** que responder a mesma Questão 1 futuramente
- Verá as **4 dicas** (incluindo a de testeuser)
- Pode adicionar sua própria dica também
- As dicas ficam ordenadas da mais recente para a mais antiga

## 📊 Banco de Dados (SQLite / PostgreSQL)

### Tabela: `community_notes`
```sql
| id      | question_id | user_id | user_name    | content        | created_at          |
|---------|-------------|---------|--------------|----------------|---------------------|
| uuid-1  | q-abc-123   | u-001   | ana_silva    | "Dica 1..."    | 2026-01-01 10:00:00 |
| uuid-2  | q-abc-123   | u-002   | bruno_costa  | "Macete 2..."  | 2026-01-03 14:30:00 |
| uuid-3  | q-abc-123   | u-003   | carla_mendes | "Caiu na..."   | 2026-01-04 09:15:00 |
| uuid-4  | q-abc-123   | u-004   | testeuser    | "Eu memorizei" | 2026-01-05 15:05:00 |
```

- **Relação**: Cada nota está vinculada a uma `question_id` específica
- **Consulta**: `SELECT * FROM community_notes WHERE question_id = 'q-abc-123' ORDER BY created_at DESC`

## 🎨 Design
- **Cores**: Tons de cinza, azul escuro, branco (tema técnico)
- **Ícone**: 💡 Lâmpada ao lado do título
- **Cards**: Limpos, espaçados, com sombra sutil
- **Interatividade**: Hover effects, animações suaves

## ⚠️ Regras de Segurança/Validação
✅ **Implementado:**
- Usuário precisa estar autenticado
- Nota vinculada ao usuário logado
- Data/hora automática

🔜 **Futuras Melhorias:**
- Limite de caracteres (ex: 500)
- Botão "Editar" / "Deletar" para autor
- Sistema de "Útil" / Curtidas
- Moderação / Denúncia de conteúdo inadequado

## 🚀 Status Atual
✅ Backend implementado (models, schemas, endpoints)
✅ Frontend implementado (componente CommunityNotes.tsx)
✅ Integração funcional  
✅ Usuários mockados criados
✅ Notas de exemplo adicionadas na Questão 1

Para testar:
1. Faça login com qualquer usuário (ou crie novo)
2. Inicie o quiz "Questoes_Teste - Parte 1"
3. Responda a primeira questão (qualquer opção)
4. Role para baixo → verá "Dicas da Comunidade"
5. Digite sua dica e clique em "Compartilhar Macete"
6. Sua dica aparecerá no topo da lista!
