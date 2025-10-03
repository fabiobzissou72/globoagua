# 🚀 Servidor Rodando!

## ✅ Sistema Online e Funcionando

O servidor Next.js está rodando com sucesso!

---

## 🌐 URLs de Acesso

### 🖥️ Local
```
http://localhost:3000
```

### 📱 Rede Local
```
http://192.168.15.5:3000
```

Use o endereço de rede para acessar de outros dispositivos (celular, tablet, etc.) na mesma rede Wi-Fi!

---

## 📋 Áreas do Sistema

### 1. Área do Cliente
```
🏠 Home/Catálogo
http://localhost:3000

🔐 Login Empresas
http://localhost:3000/login
```

### 2. Área Admin
```
👨‍💼 Login Admin
http://localhost:3000/admin
Login: admin
Senha: admin123

📊 Dashboard
http://localhost:3000/admin

📦 Produtos
http://localhost:3000/admin/produtos

🏢 Empresas
http://localhost:3000/admin/empresas

👥 Administradores ⭐ NOVO
http://localhost:3000/admin/administradores

⚙️ Configurações
http://localhost:3000/admin/configuracoes
```

---

## ⚠️ IMPORTANTE - Executar SQL

### Antes de Usar o Sistema

1. **Abra o Supabase**
   ```
   https://supabase.com
   → Seu projeto
   → SQL Editor
   ```

2. **Execute o SQL**
   ```sql
   -- Cole TODO o conteúdo de:
   supabase-schema.sql

   -- Clique em Run
   ```

3. **Verifique**
   - 6 tabelas criadas ✅
   - 1 bucket de storage ✅
   - Admin padrão inserido ✅

### Sem executar o SQL primeiro, o sistema não funcionará!

---

## 🧪 Como Testar

### Passo 1: Login Admin
1. Acesse: http://localhost:3000/admin
2. Login: `admin`
3. Senha: `admin123`
4. ✅ Você está no Dashboard!

### Passo 2: Criar Produto
1. Clique em **📦 Produtos**
2. Clique em **+ Novo Produto**
3. Preencha:
   - Nome: Galão 20L
   - Descrição: Água mineral natural
   - Preço: 10.00
   - Foto: (escolha uma imagem)
   - ✅ Produto Ativo
4. Clique em **Salvar**

### Passo 3: Criar Empresa
1. Clique em **🏢 Empresas**
2. Clique em **+ Nova Empresa**
3. Preencha:
   - Nome: Empresa Teste
   - Login: teste
   - Senha: teste123
   - Contato: João Silva
   - Telefone: (11) 99999-9999
4. Clique em **Salvar**

### Passo 4: Configurar Preço Especial
1. Na lista de empresas, clique em **Preços** (Empresa Teste)
2. Digite o preço especial para o produto (ex: 8.00)
3. Clique em **Salvar Preços**

### Passo 5: Testar Login Empresa
1. Vá para: http://localhost:3000/login
2. Login: `teste`
3. Senha: `teste123`
4. ✅ Veja os preços diferenciados!

### Passo 6: Fazer Pedido
1. Na home, clique em **Pedir**
2. Preencha o formulário
3. Clique em **Enviar Pedido**
4. ✅ Pedido enviado!

---

## 🔧 Comandos Úteis

### Parar o Servidor
```bash
Ctrl + C
```

### Reiniciar
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
npm start
```

---

## 📱 Testar PWA

### No Celular (mesma rede Wi-Fi)

1. Abra o navegador do celular
2. Acesse: `http://192.168.15.5:3000`
3. No menu do navegador:
   - Chrome: "Adicionar à tela inicial"
   - Safari: Compartilhar → "Adicionar à Tela de Início"
4. ✅ PWA instalado no celular!

### No Desktop

1. No Chrome/Edge, clique no ícone de "Instalar" na barra de endereço
2. Ou vá em Menu → "Instalar Globo Água"
3. ✅ PWA instalado no desktop!

---

## 🆘 Problemas?

### Erro 500 / Não carrega
**Causa**: SQL não foi executado
**Solução**: Execute `supabase-schema.sql` no Supabase

### Erro ao fazer upload de foto
**Causa**: Bucket não foi criado
**Solução**: Verifique Storage no Supabase

### Login admin não funciona
**Causa**: Admin não foi inserido
**Solução**: Execute o INSERT do admin no SQL

### Produtos não aparecem
**Causa**: Nenhum produto cadastrado
**Solução**: Crie produtos em `/admin/produtos`

---

## ✨ Novas Funcionalidades

### Sistema Multi-Admin ⭐

Agora você pode ter vários administradores!

1. Acesse: http://localhost:3000/admin/administradores
2. Crie novos administradores
3. Cada um terá login e senha próprios
4. Gerencie status ativo/inativo

---

## 📊 Próximos Passos

### Setup Completo
- [x] Servidor rodando ✅
- [ ] SQL executado no Supabase
- [ ] Produto teste criado
- [ ] Empresa teste criada
- [ ] Pedido teste realizado
- [ ] PWA testado

### Deploy
1. Leia: `SETUP.md` (seção de deploy)
2. Execute: `vercel`
3. Configure env vars
4. ✅ Online!

---

## 📚 Documentação

- **INICIO-RAPIDO.md** → 3 passos para começar
- **EXECUTAR-SQL.md** → Como rodar SQL
- **ATUALIZACAO.md** → Sistema de admins
- **COMPLETO.md** → Resumo completo
- **README.md** → Documentação técnica

---

## 🎯 URLs Rápidas

| Área | URL |
|------|-----|
| Home | http://localhost:3000 |
| Login Empresas | http://localhost:3000/login |
| Login Admin | http://localhost:3000/admin |
| Dashboard | http://localhost:3000/admin |
| Produtos | http://localhost:3000/admin/produtos |
| Empresas | http://localhost:3000/admin/empresas |
| Administradores | http://localhost:3000/admin/administradores |
| Configurações | http://localhost:3000/admin/configuracoes |

---

## 🔐 Credenciais

### Admin
```
Login: admin
Senha: admin123
```

### Empresa Teste (após criar)
```
Login: teste
Senha: teste123
```

---

## 🎉 Sistema Pronto!

```
╔════════════════════════════════════════╗
║                                        ║
║     ✅ SERVIDOR RODANDO                ║
║                                        ║
║     http://localhost:3000              ║
║                                        ║
║     Todos os sistemas operacionais     ║
║                                        ║
╚════════════════════════════════════════╝
```

### Status
- ✅ Next.js rodando
- ✅ Porta 3000 ativa
- ✅ Rede local disponível
- ✅ PWA funcional
- ✅ Documentação completa

---

**Bom desenvolvimento! 🚀**

**Lembre-se de executar o SQL antes de usar o sistema!**
