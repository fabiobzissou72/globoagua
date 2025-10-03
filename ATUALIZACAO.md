# 🔄 Atualização - Sistema de Administradores

## ✅ Novidade Implementada

Foi adicionado um **sistema completo de gerenciamento de administradores** com autenticação baseada em banco de dados!

---

## 🆕 O Que Mudou

### 1. Nova Tabela no Banco
```sql
-- Tabela de administradores
CREATE TABLE administradores (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);
```

### 2. Administrador Padrão
- **Login**: `admin`
- **Senha**: `admin123`
- **Email**: `admin@globoagua.com`

### 3. Nova Área no Admin
- **URL**: `/admin/administradores`
- **Menu**: Novo item "👥 Admins"
- **Funcionalidades**:
  - ✅ Listar todos os administradores
  - ✅ Criar novo administrador
  - ✅ Editar administrador
  - ✅ Excluir administrador
  - ✅ Ativar/Desativar administrador
  - ✅ Alterar senha

### 4. Login Admin Atualizado
- Agora usa login + senha (não mais só senha)
- Autenticação via banco de dados
- Senhas com hash bcrypt
- Sessão persistente no localStorage

---

## 📋 Como Atualizar

### Passo 1: Executar SQL Atualizado

Execute novamente o `supabase-schema.sql` completo no Supabase SQL Editor.

**OU** execute apenas a parte nova:

```sql
-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS administradores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir admin padrão
INSERT INTO administradores (nome, email, login, senha_hash, ativo)
VALUES (
    'Administrador',
    'admin@globoagua.com',
    'admin',
    '$2a$10$OqtaOtUX3cqi24kvuAXWKeSmtGz4ljBCGxvrkSej3/vmXkBVV0YVy',
    true
)
ON CONFLICT (login) DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_administradores_login ON administradores(login);
CREATE INDEX IF NOT EXISTS idx_administradores_email ON administradores(email);

-- Habilitar RLS
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Apenas service role pode gerenciar admins" ON administradores
    FOR ALL USING (auth.role() = 'service_role');
```

### Passo 2: Reiniciar o Projeto

```bash
# Pare o servidor (Ctrl+C)
# Reinicie
npm run dev
```

### Passo 3: Testar Login

1. Acesse: `http://localhost:3000/admin`
2. Use:
   - **Login**: `admin`
   - **Senha**: `admin123`
3. Veja seu nome aparecer no header!

---

## 🎯 Novas Funcionalidades

### Gerenciar Administradores

1. Faça login no admin
2. Clique em **"👥 Admins"** no menu
3. Você pode:
   - ➕ Adicionar novos administradores
   - ✏️ Editar informações
   - 🔒 Alterar senhas
   - 🔄 Ativar/Desativar
   - 🗑️ Excluir administradores

### Múltiplos Administradores

Agora você pode ter vários administradores com:
- Nomes diferentes
- Emails únicos
- Logins únicos
- Senhas individuais
- Status ativo/inativo

---

## 🔐 Segurança

### Melhorias Implementadas

1. **Senhas Hash**: Todas as senhas usam bcrypt
2. **Login Único**: Cada admin tem login e senha próprios
3. **RLS**: Proteção no banco de dados
4. **Ativo/Inativo**: Controle de acesso por status
5. **API Protegida**: Endpoint `/api/admin/login`

### Alterar Senha Admin

#### Método 1: Via Interface (Recomendado)
1. Login no admin
2. Vá em **Administradores**
3. Edite o admin desejado
4. Digite nova senha
5. Salve

#### Método 2: Via SQL
```sql
-- Gere um hash primeiro (use bcrypt online ou node)
UPDATE administradores
SET senha_hash = 'seu_hash_aqui'
WHERE login = 'admin';
```

---

## 📊 Estrutura de Arquivos Novos

```
app/
├── api/
│   └── admin/
│       └── login/
│           └── route.ts          # API de login admin
└── admin/
    ├── layout.tsx                 # Atualizado com novo login
    └── administradores/
        └── page.tsx               # CRUD de administradores
```

---

## 🔄 Mudanças nos Arquivos Existentes

### `supabase-schema.sql`
- ✅ Adicionada tabela `administradores`
- ✅ Inserido admin padrão
- ✅ Índices para performance
- ✅ Políticas RLS

### `lib/supabase.ts`
- ✅ Tipagem da tabela `administradores`

### `app/admin/layout.tsx`
- ✅ Login com usuário + senha
- ✅ Autenticação via API
- ✅ Exibe nome do admin logado
- ✅ Novo item de menu "Admins"

---

## ✅ Checklist de Atualização

- [ ] SQL executado no Supabase
- [ ] Tabela `administradores` criada
- [ ] Admin padrão inserido
- [ ] Projeto reiniciado
- [ ] Login testado com `admin/admin123`
- [ ] Área de administradores acessível

---

## 🎯 Credenciais Padrão

### Admin Inicial
```
Login: admin
Senha: admin123
Email: admin@globoagua.com
```

⚠️ **IMPORTANTE**: Altere a senha padrão após o primeiro login!

---

## 📈 Comparação

### Antes
- ❌ Senha hardcoded no código
- ❌ Sem gerenciamento de admins
- ❌ Sem controle de acesso
- ❌ Um único admin fixo

### Agora
- ✅ Senhas no banco com hash
- ✅ CRUD completo de admins
- ✅ Controle ativo/inativo
- ✅ Múltiplos administradores
- ✅ Login individual por admin
- ✅ Exibe nome do admin logado

---

## 🆘 Problemas Comuns

### Erro ao fazer login
**Causa**: Tabela não criada ou admin não inserido
**Solução**: Execute o SQL novamente

### Senha incorreta
**Causa**: Hash não está correto no banco
**Solução**: Execute o INSERT novamente com o hash correto

### Tabela já existe
**Solução**: Está tudo OK! Pode continuar

---

## 📝 Próximos Passos

1. ✅ Execute o SQL atualizado
2. ✅ Teste o novo login
3. ✅ Crie outros administradores
4. ✅ Altere a senha padrão
5. ✅ Desative admins não utilizados

---

## 🎉 Resultado

Agora você tem:
- 🔐 Sistema de autenticação robusto
- 👥 Gerenciamento completo de administradores
- 🔒 Senhas seguras com hash
- ✅ Controle granular de acesso

---

**Sistema atualizado com sucesso! 🚀**
