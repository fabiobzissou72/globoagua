# 🌊 Globo Água - Sistema de Pedidos

Sistema completo de pedidos online desenvolvido como PWA (Progressive Web App) para a Globo Água.

## 🚀 Funcionalidades

### 👥 Área do Cliente
- **Catálogo de Produtos**
  - Grid responsivo com produtos
  - Busca em tempo real
  - Fotos, descrições e preços
  - Scroll infinito/paginação

- **Sistema de Pedidos**
  - Modal de pedido por produto
  - Formulário completo (nome, endereço, telefone, etc.)
  - Campo para empresa (opcional)
  - Observações
  - Cálculo automático de preço total

- **Login de Empresas**
  - Sistema de autenticação para empresas
  - Preços diferenciados após login
  - Persistência de sessão

### 🔧 Área Admin
- **Dashboard**
  - Estatísticas gerais
  - Pedidos recentes
  - Visão geral do sistema

- **Gestão de Produtos**
  - CRUD completo
  - Upload de fotos (Supabase Storage)
  - Ativar/desativar produtos
  - Preço base

- **Gestão de Empresas**
  - CRUD de empresas
  - Configuração de preços diferenciados por produto
  - Sistema de login e senha

- **Gestão de Administradores**
  - CRUD de administradores
  - Login e senha individual
  - Ativar/desativar administradores
  - Controle de acesso

- **Configurações**
  - URL do webhook para pedidos
  - Teste de webhook
  - Informações do sistema

## 🛠️ Tecnologias

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **PWA**: Service Worker, Manifest
- **Validação**: React Hook Form + Zod
- **Autenticação**: bcryptjs

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. **Clone o repositório**
```bash
cd GloboAgua
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Renomeie `.env.example` para `.env.local` e configure:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

4. **Configure o Supabase**

Execute o script SQL no Supabase SQL Editor:

```bash
# O arquivo supabase-schema.sql contém todas as tabelas e configurações
```

No Supabase:
- Vá em SQL Editor
- Cole o conteúdo de `supabase-schema.sql`
- Execute

5. **Gere os ícones PWA**

```bash
npm install sharp
node generate-icons.js
```

6. **Execute o projeto**

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📦 Deploy na Vercel

1. **Instale a CLI da Vercel**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Configure as variáveis de ambiente na Vercel**
- Vá em Project Settings > Environment Variables
- Adicione as mesmas variáveis do `.env.local`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **produtos**: Catálogo de produtos
- **administradores**: Administradores do sistema
- **empresas**: Empresas cadastradas
- **precos_empresas**: Preços especiais por empresa/produto
- **configuracoes**: Configurações do sistema (webhook)
- **pedidos**: Log de todos os pedidos

### Storage

- **produtos**: Bucket para fotos de produtos (público)

## 🔐 Acesso Admin

**URL**: `/admin`
**Login padrão**: `admin`
**Senha padrão**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login em `/admin/administradores`

## 📡 Webhook de Pedidos

Configure a URL do webhook em `/admin/configuracoes`

**Payload do Webhook (POST JSON)**:
```json
{
  "produto": {
    "id": "uuid",
    "nome": "Nome do Produto",
    "preco_unitario": 10.00
  },
  "cliente": {
    "nome": "Nome do Cliente",
    "endereco": "Endereço Completo",
    "telefone": "(00) 00000-0000",
    "isEmpresa": false,
    "nomeEmpresa": ""
  },
  "quantidade": 1,
  "preco_total": 10.00,
  "observacoes": "Observações",
  "data": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 Personalização

### Cores

Edite `tailwind.config.ts`:
```ts
colors: {
  primary: {
    DEFAULT: '#0066CC', // Azul principal
    light: '#3399FF',
    dark: '#004C99',
  },
}
```

### Logo

Substitua `logo.jpg` e execute:
```bash
node generate-icons.js
```

## 📱 PWA

O sistema é instalável em:
- 📱 Dispositivos móveis (Android/iOS)
- 💻 Desktop (Chrome, Edge, etc.)

**Funcionalidades PWA**:
- Instalação no dispositivo
- Funciona offline (cache básico)
- Ícone na tela inicial
- Splash screen

## 🔒 Segurança

- ✅ Row Level Security (RLS) no Supabase
- ✅ Senhas com hash bcrypt
- ✅ Validação de inputs
- ✅ Proteção XSS
- ✅ HTTPS obrigatório (Vercel)

## 📊 Performance

- ✅ Next.js Image Optimization
- ✅ Lazy Loading
- ✅ Cache do Service Worker
- ✅ Lighthouse Score > 90

## 🐛 Troubleshooting

### Erro ao fazer upload de imagens

Verifique as políticas de Storage no Supabase:
1. Vá em Storage > produtos
2. Verifique as policies de upload

### Webhook não funciona

1. Teste no Admin > Configurações
2. Verifique logs do servidor de destino
3. Certifique-se que a URL aceita POST JSON

### Empresas não conseguem fazer login

1. Verifique se a senha foi cadastrada corretamente
2. Verifique a tabela `empresas` no Supabase
3. Teste com o SQL Editor

## 📝 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # ESLint
```

## 🤝 Suporte

Para problemas ou dúvidas:
1. Verifique este README
2. Consulte a documentação do Next.js e Supabase
3. Verifique os logs do console do navegador

## 📄 Licença

Propriedade da Globo Água © 2024

---

**Desenvolvido com ❤️ para Globo Água**
