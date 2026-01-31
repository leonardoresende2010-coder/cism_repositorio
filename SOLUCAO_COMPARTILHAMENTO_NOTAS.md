# 🔧 Solução: Compartilhamento de Notas Entre Usuários

## ❌ Problema Identificado

**Sintoma:** Quando o Usuário A deixava comentários em questões do Security+ e depois o Usuário B carregava o mesmo exame, os comentários não apareciam.

**Causa Raiz:**
- Cada vez que um usuário clica em "Autoload Security+" (ou qualquer exame), o sistema **baixa questões novas da internet**
- Essas questões recebem **IDs únicos** (UUID) no banco de dados
- As notas eram vinculadas ao `question_id` específico
- Resultado: Usuário A tinha questões com IDs `abc-123`, Usuário B tinha questões com IDs `xyz-789` (mesmo conteúdo, IDs diferentes)
- As notas do Usuário A estavam vinculadas a `abc-123`, então não apareciam para o Usuário B

## ✅ Solução Implementada

### 1. **Sistema de Hash de Conteúdo**
Adicionamos um campo `content_hash` à tabela `questions`:
- Hash SHA256 dos primeiros 16 caracteres do texto da questão (normalizado)
- Questões com **mesmo texto** têm o **mesmo hash**, independentemente do ID

### 2. **Vínculo de Notas por Hash**
Adicionamos um campo `question_hash` à tabela `community_notes`:
- As notas agora são vinculadas ao **conteúdo da questão** (hash), não ao ID específico
- Backend busca/salva notas usando o `question_hash`

### 3. **Retrocompatibilidade**
- `question_id` ainda existe (nullable) para notas antigas
- Se uma questão não tiver hash, sistema usa o ID (fallback)

## 🔄 Migrações Executadas

1. **add_hash_columns.py**: Adicionou colunas `content_hash` e `question_hash` ao SQLite
2. **migrate_hashes.py**: Populou os hashes para 52 questões e 36 notas existentes

## 📊 Resultado Atual

```
Total de questões: 52
Questões únicas (por hash): 23  
Questões duplicadas: 29 (em 21 grupos)
Total de notas: 36

Exemplo de compartilhamento:
  - Questão "Qual protocolo fornece comunicação segura..."
    → 2 cópias diferentes (IDs: 95cf2544..., 22974414...)
    → 1 nota compartilhada (de leonardo.resende2010)
    → Qualquer usuário que carregar essa questão verá a nota!
```

## 🚀 Como Funciona Agora

### Fluxo Completo:

1. **Usuário A carrega Security+**:
   - Sistema cria questão "Qual é HTTPS?" com ID `abc-123`
   - Hash calculado: `f044aae0383679c0`
   - Usuário A deixa nota: "HTTPS = HTTP + SSL/TLS"
   - Nota salva com `question_hash = f044aae0383679c0`

2. **Usuário B carrega Security+ (semanas depois)**:
   - Sistema cria questão "Qual é HTTPS?" com ID `xyz-789` (novo ID!)
   - Hash calculado: `f044aae0383679c0` (mesmo hash!)
   - Usuário B responde e vê notas...
   - Backend busca notas com `question_hash = f044aae0383679c0`
   - **BOOM!** A nota do Usuário A aparece! 🎉

3. **Usuário B adiciona sua própria dica**:
   - Nova nota salva com o mesmo `question_hash`
   - Usuário C verá **ambas as notas** quando carregar o exame

### Código Relevante:

**Backend (main.py) - GET endpoint:**
```python
@app.get("/community-notes/{question_id}")
def get_community_notes(question_id: str, db: Session):
    # Busca questão para pegar o hash
    question = db.query(models.Question).filter(
        models.Question.id == question_id
    ).first()
    
    # Busca TODAS as notas com esse hash (cross-user!)
    notes = db.query(models.CommunityNote).filter(
        models.CommunityNote.question_hash == question.content_hash
    ).order_by(models.CommunityNote.created_at.desc()).all()
    
    return notes
```

**Backend (main.py) - POST endpoint:**
```python
@app.post("/community-notes/")
def create_community_note(note: schemas.CommunityNoteCreate, db: Session):
    question = db.query(models.Question).filter(
        models.Question.id == note.question_id
    ).first()
    
    db_note = models.CommunityNote(
        question_id=note.question_id,  # Mantido para referência
        question_hash=question.content_hash,  # CHAVE para compartilhamento!
        user_id=current_user.id,
        user_name=note.user_name,
        content=note.content
    )
    # ...
```

## ✨ Benefícios

1. **Colaboração Real**: Notas são compartilhadas entre TODOS os usuários
2. **Economia de Espaço**: Questões duplicadas compartilham notas
3. **Experiência Melhorada**: Quanto mais usuários, mais dicas disponíveis
4. **Consistência**: Mesma pergunta = mesmas dicas, sempre

## 🧪 Como Testar

```bash
# Verificar status do compartilhamento
python backend/test_sharing.py

# Ver questões e notas
python backend/check_user_notes.py
```

## 📝 Notas Técnicas

- Hash usa SHA256 para evitar colisões
- Normalização: `.strip().lower()` antes de hash
- 16 caracteres do hash são suficientes (prob colisão ~1 em 10^19)
- SQLite suporta índices em `content_hash` e `question_hash` para performance
