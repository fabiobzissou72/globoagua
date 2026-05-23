// ============================================================
// TENANT CONFIG — troque estes dados para cada empresa cliente
// ============================================================
const tenant = {
  name: 'Globo Água',
  shortName: 'GA',
  tagline: 'Disk água, delivery rápido',
  seoTitle: 'Globo Água · disk água · Cervejas e Refrigerantes',
  seoDescription: 'Disk água, delivery de água, não fique com sede. A entrega é rápida!',
  seoKeywords: 'delivery, água, disk água, água rápida',
  whatsapp: '5511970307000',
  email: 'contato@globoagua.com.br',
  logo: '/logo.png',
  colors: {
    primary: '#1565C0',      // azul Globo Água
    primaryDark: '#0D47A1',
    accent: '#2E7D32',       // verde logo GA
    accentLight: '#43A047',
  },
  pix: '12533423858',
  orderPrefix: 'GA',
  // Rotas protegidas por role
  roles: {
    superAdmin: 'super_admin',
    admin: 'admin',
    entregador: 'entregador',
    cliente: 'cliente',
  },
}

export default tenant
