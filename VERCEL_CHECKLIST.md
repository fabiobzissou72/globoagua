# Checklist de Deploy na Vercel

## Problema: Cadastro não funciona (produtos, empresas, usuários)

### 1. Variáveis de Ambiente (Vercel Dashboard)
- [ ] NEXT_PUBLIC_SUPABASE_URL está configurada
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY está configurada
- [ ] Variáveis estão em Production, Preview e Development

### 2. Políticas RLS no Supabase (PROVÁVEL CAUSA)

Acesse: Supabase → Authentication → Policies

#### Tabela: produtos
```sql
-- Permitir INSERT
CREATE POLICY "Allow public insert" ON produtos
FOR INSERT TO anon, authenticated
USING (true);

-- Permitir UPDATE
CREATE POLICY "Allow public update" ON produtos
FOR UPDATE TO anon, authenticated
USING (true);

-- Permitir SELECT
CREATE POLICY "Allow public select" ON produtos
FOR SELECT TO anon, authenticated
USING (true);
```

#### Tabela: empresas
```sql
CREATE POLICY "Allow public insert" ON empresas
FOR INSERT TO anon, authenticated
USING (true);

CREATE POLICY "Allow public update" ON empresas
FOR UPDATE TO anon, authenticated
USING (true);

CREATE POLICY "Allow public select" ON empresas
FOR SELECT TO anon, authenticated
USING (true);
```

#### Tabela: administradores
```sql
CREATE POLICY "Allow public insert" ON administradores
FOR INSERT TO anon, authenticated
USING (true);

CREATE POLICY "Allow public update" ON administradores
FOR UPDATE TO anon, authenticated
USING (true);

CREATE POLICY "Allow public select" ON administradores
FOR SELECT TO anon, authenticated
USING (true);
```

### 3. Verificar Logs
Após deploy, verifique:
- Vercel Dashboard → Seu Projeto → Logs
- Procure por erros de Supabase
- Mensagens no console do navegador (F12)

### 4. Redeploy
Após configurar as políticas RLS:
- Vercel Dashboard → Deployments → ... → Redeploy

## Causa Mais Provável
**Row Level Security (RLS) bloqueando inserções/atualizações**
- Supabase ativa RLS por padrão
- Sem políticas, todas operações são bloqueadas
- Use anon key com políticas adequadas
