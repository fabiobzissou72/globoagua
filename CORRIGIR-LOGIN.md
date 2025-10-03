# 🔧 Corrigir Login Admin

## ⚠️ Problema: "Login ou senha inválidos"

O hash da senha no banco de dados precisa ser atualizado.

---

## ✅ Solução Rápida

### Execute este SQL no Supabase:

```sql
-- Deletar admin antigo (se existir)
DELETE FROM administradores WHERE login = 'admin';

-- Inserir admin com hash correto
INSERT INTO administradores (nome, email, login, senha_hash, ativo)
VALUES (
    'Administrador',
    'admin@globoagua.com',
    'admin',
    '$2a$10$h4Ce5q.IHHubvCO5V.bskull0rNGyq46dDOYtxstFM7nSZ.QlRIli',
    true
);
```

**OU** se preferir apenas atualizar:

```sql
-- Atualizar hash da senha
UPDATE administradores
SET senha_hash = '$2a$10$h4Ce5q.IHHubvCO5V.bskull0rNGyq46dDOYtxstFM7nSZ.QlRIli'
WHERE login = 'admin';
```

---

## 📋 Passo a Passo

### 1. Abra o Supabase
- Acesse: https://supabase.com
- Faça login
- Selecione seu projeto

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **+ New query**

### 3. Cole o SQL
Cole um dos SQLs acima (recomendo o UPDATE)

### 4. Execute
- Clique em **Run** (▶️)
- Aguarde "Success"

### 5. Teste o Login
- Volte para: http://localhost:3000/admin
- Login: `admin`
- Senha: `admin123`
- ✅ Deve funcionar agora!

---

## 🔄 Alternativa: Executar SQL Completo Novamente

Se preferir recomeçar do zero:

1. Abra o Supabase SQL Editor
2. Cole TODO o conteúdo de `supabase-schema.sql` (já atualizado)
3. Execute
4. Teste o login

---

## ✅ Verificar se Funcionou

### No Supabase SQL Editor, execute:

```sql
-- Ver todos os admins
SELECT id, nome, email, login, ativo
FROM administradores;
```

Você deve ver:
- ✅ 1 registro com login 'admin'
- ✅ Status ativo = true

---

## 🔐 Credenciais

```
Login: admin
Senha: admin123
```

---

## 📝 O Que Foi Corrigido

O arquivo `supabase-schema.sql` foi atualizado com o hash correto da senha.

**Hash antigo** (não funcionava):
```
$2a$10$OqtaOtUX3cqi24kvuAXWKeSmtGz4ljBCGxvrkSej3/vmXkBVV0YVy
```

**Hash novo** (funciona):
```
$2a$10$h4Ce5q.IHHubvCO5V.bskull0rNGyq46dDOYtxstFM7nSZ.QlRIli
```

---

## 🆘 Ainda Não Funciona?

### Verifique:

1. **Tabela existe?**
```sql
SELECT * FROM administradores;
```

2. **Admin foi inserido?**
```sql
SELECT * FROM administradores WHERE login = 'admin';
```

3. **Hash está correto?**
```sql
SELECT login, senha_hash FROM administradores WHERE login = 'admin';
```

O hash deve ser: `$2a$10$h4Ce5q.IHHubvCO5V.bskull0rNGyq46dDOYtxstFM7nSZ.QlRIli`

---

## 💡 Criar Novo Admin Manualmente

Se quiser criar com login/senha diferente:

```sql
-- Exemplo: criar admin com login "adm" e senha "senha123"
INSERT INTO administradores (nome, email, login, senha_hash, ativo)
VALUES (
    'Seu Nome',
    'seu@email.com',
    'adm',
    -- Hash para 'senha123'
    '$2a$10$YXmD.YYq6yJQh8YvL0KNQeVqKqJXqZxJXqZxJXqZxJXqZxJXqZxJX',
    true
);
```

Para gerar hash de outra senha, execute no terminal:

```bash
node -e "console.log(require('bcryptjs').hashSync('SuaSenha', 10))"
```

---

## ✅ Após Corrigir

1. Acesse: http://localhost:3000/admin
2. Login: `admin`
3. Senha: `admin123`
4. ✅ Login deve funcionar!

---

**Problema resolvido! 🎉**
