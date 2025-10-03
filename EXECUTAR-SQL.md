# 🗄️ Como Executar o SQL no Supabase

## 📋 Passo a Passo

### 1. Acesse o Supabase

1. Abra seu navegador
2. Vá para: [https://supabase.com](https://supabase.com)
3. Faça login com sua conta
4. Selecione seu projeto (ou crie um novo se necessário)

### 2. Abra o SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique em **SQL Editor**
3. Clique no botão **"+ New query"** (Nova consulta)

### 3. Copie o Script SQL

1. Abra o arquivo `supabase-schema.sql` deste projeto
2. Selecione **TODO** o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

### 4. Cole no Supabase

1. Volte para o SQL Editor no Supabase
2. Cole o conteúdo copiado (Ctrl+V)
3. Você verá todo o script SQL no editor

### 5. Execute o Script

1. Clique no botão **"Run"** (▶️) no canto inferior direito
2. Aguarde alguns segundos
3. Você deve ver: **"Success. No rows returned"**

### 6. Verifique as Tabelas

1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver 5 tabelas:
   - ✅ produtos
   - ✅ empresas
   - ✅ precos_empresas
   - ✅ configuracoes
   - ✅ pedidos

### 7. Verifique o Storage

1. No menu lateral, clique em **"Storage"**
2. Você deve ver 1 bucket:
   - ✅ produtos (público)

---

## ✅ Verificação Completa

Execute este SQL para verificar se tudo foi criado:

```sql
-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar configuração inicial
SELECT * FROM configuracoes;
```

Você deve ver:
- 5 tabelas listadas
- 1 registro em configuracoes

---

## 🚨 Possíveis Erros

### Erro: "relation already exists"
**Solução**: As tabelas já existem. Você pode:
- Ignorar (está tudo OK)
- Ou deletar as tabelas antes e executar novamente

### Erro: "permission denied"
**Solução**:
- Verifique se você é o owner do projeto
- Tente executar com outro usuário admin

### Erro: "syntax error"
**Solução**:
- Certifique-se de copiar TODO o conteúdo do arquivo
- Verifique se não faltou nenhuma linha

---

## 🔄 Como Resetar o Banco (Se Necessário)

Se precisar recomeçar do zero:

```sql
-- CUIDADO: Isso apaga TUDO!
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS precos_empresas CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;

-- Agora execute o supabase-schema.sql novamente
```

---

## 📊 O Que o Script Cria

### Tabelas

1. **produtos**
   - id, nome, descricao, preco_base, foto_url, ativo, created_at

2. **empresas**
   - id, nome, login, senha_hash, contato, telefone, created_at

3. **precos_empresas**
   - id, empresa_id, produto_id, preco_especial

4. **configuracoes**
   - id, webhook_url, outras_configs

5. **pedidos**
   - id, dados_json, created_at

### Índices
- 6 índices para performance

### Row Level Security (RLS)
- Políticas de acesso para cada tabela

### Storage
- Bucket "produtos" para fotos

---

## ✅ Pronto!

Após executar com sucesso, você pode:

1. ✅ Voltar ao projeto
2. ✅ Executar `npm run dev`
3. ✅ Acessar o admin em `/admin`
4. ✅ Criar produtos e empresas

---

## 🆘 Ajuda

Se tiver problemas:

1. **Copie o erro exato** que aparece
2. **Verifique** se copiou TODO o conteúdo do SQL
3. **Tente** executar linha por linha para encontrar o problema
4. **Consulte** a documentação do Supabase

---

**Após executar este SQL, seu banco estará 100% pronto para uso!**
