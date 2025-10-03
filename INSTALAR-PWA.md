# 📱 Como Instalar o PWA - Globo Água

## ✅ Ícones e PWA Configurados!

Os ícones PWA foram gerados e o banner de instalação foi adicionado!

---

## 🎯 Como Funciona

### Banner Automático (Desktop e Mobile)

Quando você acessa o site pela primeira vez, um **banner azul aparecerá no rodapé** com:

```
📱 Instale nosso app!
Acesse rápido e use offline. Adicione à tela inicial!

[Agora não] [Instalar App]
```

Este banner só aparece quando:
- ✅ O navegador suporta PWA
- ✅ O site não está instalado ainda
- ✅ Você está em HTTPS (ou localhost)

---

## 💻 Como Instalar no Desktop

### Google Chrome / Microsoft Edge

**Método 1: Banner Automático**
1. Acesse: http://localhost:3000
2. Aguarde o banner azul aparecer no rodapé
3. Clique em **"Instalar App"**
4. ✅ App instalado!

**Método 2: Botão do Navegador**
1. Acesse o site
2. Procure o ícone **⊕** ou **+** na barra de endereço
3. Clique nele
4. Clique em "Instalar"
5. ✅ App instalado!

**Método 3: Menu do Navegador**
1. Clique no menu (⋮) do Chrome/Edge
2. Clique em "Instalar Globo Água"
3. Confirme
4. ✅ App instalado!

### Após Instalação Desktop
- Um atalho será criado na área de trabalho
- O app abre em janela própria (sem barra de endereço)
- Funciona como app nativo
- Pode ser fixado na barra de tarefas

---

## 📱 Como Instalar no Mobile

### Android (Chrome)

**Método 1: Banner Automático**
1. Acesse pelo navegador Chrome
2. O banner azul aparecerá no rodapé
3. Toque em **"Instalar App"**
4. ✅ App instalado na tela inicial!

**Método 2: Menu do Navegador**
1. Acesse o site
2. Toque no menu (⋮)
3. Toque em "Adicionar à tela inicial"
4. Escolha o nome (ou mantenha "Globo Água")
5. Toque em "Adicionar"
6. ✅ Ícone aparece na tela inicial!

### iPhone/iPad (Safari)

**Safari não mostra o banner automático**, mas você pode instalar manualmente:

1. Abra o site no Safari
2. Toque no botão **Compartilhar** (📤)
3. Role para baixo
4. Toque em **"Adicionar à Tela de Início"**
5. Edite o nome se quiser
6. Toque em **"Adicionar"**
7. ✅ Ícone aparece na tela inicial!

---

## ✨ Recursos do PWA Instalado

### Funciona Offline
- Cache básico de páginas
- Service Worker ativo
- Navegação sem internet (páginas já visitadas)

### Experiência App Nativo
- Abre em janela própria
- Sem barra de endereço
- Ícone personalizado
- Splash screen

### Notificações (futuro)
- Pode receber notificações push
- Atualizações em segundo plano

---

## 🔍 Verificar se Está Instalado

### Desktop
- Procure "Globo Água" nos aplicativos instalados
- Ou veja se há um ícone na área de trabalho

### Mobile
- Procure o ícone na tela inicial
- O ícone é redondo com a logo da Globo Água

---

## ⚙️ Configurações do PWA

### Arquivos Importantes

**Manifest** (`public/manifest.json`):
```json
{
  "name": "Globo Água - Sistema de Pedidos",
  "short_name": "Globo Água",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066CC"
}
```

**Ícones** (`public/icons/`):
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Service Worker** (`public/sw.js`):
- Cache de páginas
- Funcionamento offline

---

## 🚨 Troubleshooting

### Banner não aparece?

**Possíveis causas:**

1. **Já está instalado**
   - Desinstale e reinstale

2. **Navegador não suporta**
   - Use Chrome, Edge ou Safari
   - Firefox tem suporte limitado

3. **Não está em HTTPS**
   - Localhost funciona
   - Em produção precisa HTTPS

4. **Service Worker não carregou**
   - Abra DevTools (F12)
   - Vá em Application > Service Workers
   - Veja se está registrado

### Ícones não aparecem?

Execute novamente:
```bash
npm run generate-icons
```

### Como desinstalar?

**Desktop:**
- Windows: Configurações > Apps > Globo Água > Desinstalar
- Mac: Arrastar para lixeira
- Chrome: chrome://apps → botão direito → Remover

**Mobile:**
- Android: Manter pressionado o ícone → Desinstalar
- iOS: Manter pressionado o ícone → Remover App

---

## 📊 Estatísticas PWA

### Tamanhos dos Ícones
```
72x72    - Android Launcher
96x96    - Android Launcher
128x128  - Chrome Web Store
144x144  - Windows Tile
152x152  - iOS Touch Icon
192x192  - Android Chrome (padrão)
384x384  - Android Chrome (alta res)
512x512  - Splash Screen
```

### Cores
```
Primária:    #0066CC (Azul Globo Água)
Background:  #FFFFFF (Branco)
Theme:       #0066CC
```

---

## 🎯 Teste o PWA

### Checklist

- [ ] Acesse http://localhost:3000
- [ ] Banner azul aparece no rodapé?
- [ ] Clique em "Instalar App"
- [ ] App abre em janela própria?
- [ ] Ícone está correto?
- [ ] Funciona offline?

### DevTools (para desenvolvedores)

1. Abra DevTools (F12)
2. Vá em **Application**
3. Veja:
   - Manifest: Carregado?
   - Service Workers: Ativo?
   - Cache Storage: Tem conteúdo?

---

## 🌐 Acesso via Rede

Para testar no celular:

1. Use o mesmo Wi-Fi
2. Acesse: `http://192.168.15.5:3000`
3. O banner deve aparecer
4. Instale normalmente

---

## ✅ Resultado

Agora você tem:
- ✅ PWA totalmente funcional
- ✅ Banner de instalação automático
- ✅ Ícones em todos os tamanhos
- ✅ Service Worker ativo
- ✅ Funciona offline
- ✅ Experiência app nativo

---

**Aproveite o PWA Globo Água! 📱💧**
