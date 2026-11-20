import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bannersDir = path.resolve(__dirname, '../../uploads/banners');

if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

async function makeBanner(filename, title, subtitle, bgFrom, bgTo) {
  const svg = `
    <svg width="1440" height="600" viewBox="0 0 1440 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgFrom}" />
          <stop offset="100%" stop-color="${bgTo}" />
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F6E7B4" />
          <stop offset="100%" stop-color="#D4AF37" />
        </linearGradient>
      </defs>
      <rect width="1440" height="600" fill="url(#bg)" rx="32"/>
      
      <!-- Ambient Circles -->
      <circle cx="1200" cy="300" r="280" fill="#FFFFFF" opacity="0.4" />
      <circle cx="1150" cy="250" r="180" fill="none" stroke="#D4AF37" stroke-width="2" stroke-dasharray="10,10" opacity="0.3" />
      <circle cx="300" cy="500" r="200" fill="#FFFFFF" opacity="0.3" />

      <!-- Content text -->
      <rect x="120" y="140" width="160" height="32" rx="16" fill="#FFE9E6" />
      <text x="200" y="161" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="bold" letter-spacing="2" fill="#DD695B" text-anchor="middle">ZFREE GLOW OFFICIAL</text>

      <text x="120" y="240" font-family="'Playfair Display', Georgia, serif" font-size="48" font-weight="bold" fill="#DD695B">${title}</text>
      
      <rect x="120" y="270" width="64" height="4" rx="2" fill="url(#gold)" />

      <text x="120" y="320" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" fill="#6B4A47" font-weight="500">${subtitle}</text>
      <text x="120" y="350" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" fill="#6B4A47" font-weight="500">Terdaftar BPOM RI &amp; Tersertifikasi Halal untuk Perawatan Kulit Terbaik.</text>

      <!-- Decorative Bottle Art on right side -->
      <g transform="translate(1050, 120)">
        <rect x="80" y="40" width="80" height="30" rx="6" fill="url(#gold)" />
        <rect x="30" y="70" width="180" height="280" rx="28" fill="#FFFFFF" filter="drop-shadow(0 20px 30px rgba(221,105,91,0.25))" />
        <rect x="50" y="110" width="140" height="180" rx="16" fill="#FFF8F7" />
        <text x="120" y="170" font-family="'Playfair Display', Georgia, serif" font-size="22" font-weight="bold" fill="#DD695B" text-anchor="middle">ZGlowra</text>
        <text x="120" y="195" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="bold" fill="#D4AF37" letter-spacing="2" text-anchor="middle">BODY CARE</text>
        <rect x="80" y="220" width="80" height="18" rx="9" fill="#DD695B" />
        <text x="120" y="233" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PREMIUM</text>
      </g>
    </svg>
  `;
  const buf = Buffer.from(svg);
  await sharp(buf).webp({ quality: 90 }).toFile(path.join(bannersDir, filename));
}

async function run() {
  await makeBanner('banner1.webp', 'Kemewahan Perawatan Kulit Tubuh', 'Diformulasikan dengan Niacinamide, Glutathione, dan Shea Butter Alami.', '#FFF8F7', '#FFE9E6');
  await makeBanner('banner2.webp', 'Kulit Cerah, Lembut &amp; Harum Memikat', 'Rasakan sensasi spa eksklusif di rumah setiap hari bersama Zfree Glow.', '#FFFBF7', '#FFF0ED');
  console.log('Banners generated successfully in WebP!');
}

run();

