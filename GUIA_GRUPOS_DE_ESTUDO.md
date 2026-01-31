# 👥 Grupos de Estudo Privados - Guia de Uso

## 🎯 O que é?

A funcionalidade de **Grupos de Estudo** permite que você compartilhe suas dicas e macetes **apenas com usuários específicos**, criando um ambiente colaborativo privado para seu grupo de colegas!

---

## 📋 Como Funciona

### 1️⃣ **Tipos de Visibilidade**

Ao criar uma dica, você pode escolher:

#### 🌍 **Público** (padrão)
- Todos os usuários veem a dica
- Comportamento original do sistema
- Ideal para compartilhar conhecimento geral

#### 👥 **Grupo de Estudo**
- Apenas você e usuários selecionados veem a dica
- Perfeito para grupos fechados
- Mantém discussões privadas

---

## 🚀 Como Usar

### Passo a Passo:

1. **Responda uma Questão**
   - Role até a seção "💡 Dicas da Comunidade"

2. **Escolha a Visibilidade**
   - Veja dois botões: **🌍 Público** e **👥 Grupo de Estudo**
   - Clique em **👥 Grupo de Estudo**

3. **Adicionar Membros do Grupo**
   - Uma caixa roxa aparecerá
   - Digite o **username** de cada colega
   - Clique em **"+ Adicionar"** ou pressione **Enter**
   - Os nomes aparecem como chips roxos
   - Para remover: clique no **×** ao lado do nome

4. **Escreva sua Dica**
   - Digite normalmente no campo de texto

5. **Compartilhar**
   - Clique em **"Compartilhar Macete"**
   - Sua dica será visível apenas para você e os membros adicionados!

---

## 📊 Exemplo Prático

### Cenário:
Você está estudando com 3 colegas: `maria_santos`, `joao_silva` e `ana_costa`

### Criando uma Dica de Grupo:

1. Clique em **👥 Grupo de Estudo**
2. Digite `maria_santos` → **+ Adicionar**
3. Digite `joao_silva` → **+ Adicionar**
4. Digite `ana_costa` → **+ Adicionar**
5. Escreva: *"Pessoal do grupo: lembrem que COBIT tem 5 domínios agora!"*
6. Clique em **Compartilhar Macete**

### Resultado:
- ✅ Você vê a dica
- ✅ maria_santos vê a dica
- ✅ joao_silva vê a dica
- ✅ ana_costa vê a dica
- ❌ Outros usuários **NÃO veem**

---

## 🎨 Indicadores Visuais

### Dicas Públicas:
```
┌────────────────────────────────┐
│ leonardo.resende2010           │
│ "HTTPS usa certificado SSL!" │
└────────────────────────────────┘
```

### Dicas de Grupo:
```
┌────────────────────────────────┐
│ leonardo.resende2010  🔒 Grupo │
│ "Nossa senha do grupo: xyz"    │
│ ──────────────────────────────│
│ Compartilhado com:             │
│ 🏷️ maria  🏷️ joao  🏷️ ana     │
└────────────────────────────────┘
```

---

## 🔒 Regras de Privacidade

1. **Você sempre vê suas próprias dicas** (públicas ou privadas)
2. **Dicas públicas**: Todos veem
3. **Dicas de grupo**: Apenas autor + membros da lista veem
4. **Validação**: Usernames inválidos são ignorados automaticamente
5. **Sem limite**: Adicione quantos membros quiser!

---

## ⚠️ Casos Especiais

### Se você esquecer de adicionar membros:
- O botão **"Compartilhar Macete"** fica desabilitado
- Adicione pelo menos 1 username para habilitar

### Se digitar um username que não existe:
- O sistema ignora automaticamente
- Apenas usernames válidos são salvos
- Nenhum erro é exibido

### Se um membro sair do sistema:
- A dica continua armazenada
- Se ele voltar, verá a dica novamente

---

## 💡 Dicas de Uso

### ✅ **Boas Práticas:**
- Combine usernames com seus colegas antes
- Use nomes descritivos: `grupo_cism_2026`
- Crie grupos temáticos: `grupo_cobit`, `grupo_iso27001`

### ❌ **Evite:**
- Adicionar usuários sem permissão deles
- Compartilhar informações sensíveis em dicas públicas

---

## 🛠️ Detalhes Técnicos

### Backend:
- **Modelo**: `CommunityNote`
  - `visibility`: "public" | "group"
  - `shared_with`: lista JSON de usernames
- **Filtro**: Endpoint GET filtra baseado em `visibility` e `current_user`

### Frontend:
- **Componente**: `CommunityNotes.tsx`
- **State**: `visibility`, `sharedWith[]`
- **UI**: Botões toggle + input de chips

---

## 🎉 Exemplo de Fluxo Completo

**Usuário A** (leonardo.resende2010):
1. Carrega Security+
2. Responde questão 5
3. Cria dica de grupo para `maria` e `joao`
4. Dica salva com `visibility = "group"` e `shared_with = ["maria", "joao"]`

**Usuário B** (maria):
1. Carrega Security+
2. Responde questão 5
3. **VÊ a dica de leonardo** (porque está na lista)
4. Pode adicionar sua própria dica (pública ou grupo)

**Usuário C** (pedro):
1. Carrega Security+
2. Responde questão 5
3. **NÃO VÊ a dica de leonardo** (não está na lista)
4. Vê apenas dicas públicas

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique se os usernames estão corretos
2. Confira se o membro já está cadastrado no sistema
3. Lembre-se: a dica só aparece **após responder a questão**

**Bons estudos! 📚✨**
