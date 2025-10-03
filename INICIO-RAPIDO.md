# 🚀 Início Rápido - Globo Água

## ⚡ 3 Passos para Começar

### 1️⃣ Configurar Supabase (5 minutos)

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Vá em **SQL Editor** no seu projeto
3. Copie e cole TODO o conteúdo de `supabase-schema.sql`
4. Clique em **Run** ▶️
5. Aguarde "Success" ✅

### 2️⃣ Gerar Ícones PWA (1 minuto)

```bash
npm install sharp
npm run generate-icons
```

### 3️⃣ Rodar o Projeto (30 segundos)

```bash
npm run dev
```

Acesse: **http://localhost:3000** 🎉

---

## 🧪 Teste Rápido

### Criar Produto
1. Vá em: `http://localhost:3000/admin`
2. Senha: `admin123`
3. Clique em **Produtos** > **+ Novo Produto**
4. Preencha e salve

### Criar Empresa
1. No Admin, clique em **Empresas** > **+ Nova Empresa**
2. Preencha (login: `teste`, senha: `teste123`)
3. Clique em **Preços** e configure valores
4. Salve

### Fazer Pedido
1. Volte para home: `http://localhost:3000`
2. Faça login com empresa (teste/teste123)
3. Clique em **Pedir** em um produto
4. Preencha e envie

---

## 🌐 Deploy na Vercel (2 minutos)

```bash
npm i -g vercel
vercel
```

Configure as env vars quando solicitado ou depois no dashboard.

---

## 📋 Checklist Pré-Deploy

- [ ] SQL executado no Supabase
- [ ] Ícones gerados
- [ ] Produto de teste criado
- [ ] Sistema testado localmente
- [ ] Senha do admin alterada (produção)

---

## 🆘 Problemas?

### Erro nas tabelas
- Verifique se executou TODO o `supabase-schema.sql`
- Tente executar novamente

### Erro no upload de imagens
- Vá em Supabase > Storage
- Verifique se o bucket `produtos` existe e está público

### PWA não instala
- Execute: `npm run generate-icons`
- Acesse via HTTPS (deploy ou localhost)

---

## 📚 Mais Informações

- **Documentação completa**: `README.md`
- **Guia detalhado**: `SETUP.md`
- **Resumo do projeto**: `PROJETO.md`

---

## 🎯 URLs Importantes

- **Home**: `/`
- **Login Empresas**: `/login`
- **Admin**: `/admin` (senha: admin123)
- **Dashboard**: `/admin`
- **Produtos**: `/admin/produtos`
- **Empresas**: `/admin/empresas`
- **Configurações**: `/admin/configuracoes`

---

**Globo Água - Sistema de Pedidos © 2024**
