// Script executado pelo Vercel antes do deploy
// Gera o config.js a partir das variáveis de ambiente
const fs = require('fs');

const config = `window.APP_CONFIG = {
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}'
};`;

fs.writeFileSync('config.js', config);
console.log('config.js gerado com sucesso!');
