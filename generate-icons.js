// Script para gerar ícones PWA a partir da logo
// Execute: node generate-icons.js
// Requer: npm install sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = 'logo.jpg';
const outputDir = 'public/icons';

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

      console.log(`✓ Gerado icon-${size}x${size}.png`);
    }
    console.log('\n✅ Todos os ícones foram gerados com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
  }
}

generateIcons();
