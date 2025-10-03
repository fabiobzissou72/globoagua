# 🚀 Guia de Instalação - Globo Água

## Passo 1: Configurar o Supabase

### 1.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha os dados do projeto
4. Aguarde a criação (2-3 minutos)

### 1.2 Criar Tabelas

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor e clique em **Run**
5. Aguarde a execução (deve aparecer "Success")

### 1.3 Configurar Storage

O script SQL já cria o bucket, mas verifique:

1. Vá em **Storage** no menu lateral
2. Deve existir um bucket chamado `produtos`
3. Se não existir, crie manualmente:
   - Nome: `produtos`
   - Public: ✅ Ativado

### 1.4 Copiar Credenciais

1. Vá em **Project Settings** > **API**
2. Copie:
   - `Project URL` (já configurado)
   - `anon public` key (já configurado)
   - `service_role` key (já configurado)

## Passo 2: Configurar o Projeto

### 2.1 Instalar Dependências

```bash
npm install
```

### 2.2 Variáveis de Ambiente

As variáveis já estão configuradas em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://oncrgluidswyvndrzwcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 2.3 Gerar Ícones PWA

```bash
npm install sharp
npm run generate-icons
```

Isso criará todos os ícones PWA a partir do `logo.jpg`

## Passo 3: Executar Localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## Passo 4: Testar o Sistema

### 4.1 Criar Produto de Teste

1. Acesse: `http://localhost:3000/admin`
2. Senha: `admin123`
3. Vá em **Produtos**
4. Clique em **+ Novo Produto**
5. Preencha os dados e faça upload de uma foto
6. Clique em **Salvar**

### 4.2 Criar Empresa de Teste

1. No Admin, vá em **Empresas**
2. Clique em **+ Nova Empresa**
3. Preencha:
   - Nome: Empresa Teste
   - Login: teste
   - Senha: teste123
   - Contato e Telefone
4. Clique em **Salvar**
5. Clique em **Preços** na empresa criada
6. Configure preços especiais
7. Salve

### 4.3 Testar Login de Empresa

1. Saia do admin
2. Vá para a home `http://localhost:3000`
3. Clique em **Login Empresas**
4. Use: login `teste`, senha `teste123`
5. Veja os preços diferenciados

### 4.4 Fazer Pedido de Teste

1. Na home, clique em **Pedir** em um produto
2. Preencha o formulário
3. Clique em **Enviar Pedido**

### 4.5 Configurar Webhook (Opcional)

1. Acesse `/admin/configuracoes`
2. Configure uma URL de webhook (pode usar [webhook.site](https://webhook.site))
3. Clique em **Testar Webhook**
4. Verifique se recebeu o payload

## Passo 5: Deploy na Vercel

### 5.1 Instalar Vercel CLI

```bash
npm i -g vercel
```

### 5.2 Deploy

```bash
vercel
```

Siga as instruções:
- Setup and deploy? **Yes**
- Which scope? Escolha sua conta
- Link to existing project? **No**
- Project name: `globoagua` (ou outro nome)
- Directory: `./` (Enter)
- Override settings? **No**

### 5.3 Configurar Variáveis de Ambiente

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Cole o valor e pressione Enter

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Cole o valor e pressione Enter

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Cole o valor e pressione Enter
```

Ou configure no dashboard da Vercel:
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione o projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione as 3 variáveis

### 5.4 Deploy de Produção

```bash
vercel --prod
```

Pronto! Seu sistema está no ar! 🎉

## Passo 6: Configurações Pós-Deploy

### 6.1 Atualizar Senha do Admin

**IMPORTANTE**: Por segurança, altere a senha do admin:

1. Edite `app/admin/layout.tsx`
2. Linha ~42: `if (senha === 'admin123')`
3. Altere `'admin123'` para sua senha segura
4. Faça commit e push
5. Deploy novamente

### 6.2 Configurar Domínio Customizado (Opcional)

1. No Vercel Dashboard, vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

### 6.3 HTTPS

A Vercel já fornece HTTPS automaticamente ✅

## Troubleshooting

### Erro: "Invalid API key"

- Verifique se as variáveis de ambiente estão corretas
- Recarregue o projeto Supabase e copie as chaves novamente

### Erro no upload de imagens

- Verifique se o bucket `produtos` está público
- Verifique as policies no Supabase Storage

### PWA não instala

- Verifique se os ícones foram gerados: `npm run generate-icons`
- Acesse via HTTPS (localhost ou deploy)
- Use Chrome/Edge para testar

### Webhook não funciona

- Teste com [webhook.site](https://webhook.site)
- Verifique se a URL aceita POST com JSON
- Veja logs no Admin > Dashboard

## Checklist Final

- [ ] Supabase configurado e tabelas criadas
- [ ] Ícones PWA gerados
- [ ] Produto de teste criado
- [ ] Empresa de teste criada
- [ ] Pedido de teste funcionando
- [ ] Deploy na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Senha do admin alterada
- [ ] Sistema acessível online
- [ ] PWA instalável

## Suporte

Documentação completa: `README.md`

---

**Globo Água © 2024**
