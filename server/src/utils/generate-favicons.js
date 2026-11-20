import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcLogo = path.resolve(__dirname, '../../../logo/zfreelogo.png');
const publicDir = path.resolve(__dirname, '../../../client/public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function processLogos() {
  console.log('Processing logos and favicons from:', srcLogo);
  
  // 1. High-res webp logo
  await sharp(srcLogo)
    .webp({ quality: 95 })
    .toFile(path.join(publicDir, 'logo.webp'));

  // 2. High-res png logo (512x512)
  await sharp(srcLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // 3. Favicon 16x16
  await sharp(srcLogo)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // 4. Favicon 32x32
  await sharp(srcLogo)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  // 5. Favicon 64x64
  await sharp(srcLogo)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // 6. Apple touch icon 180x180
  await sharp(srcLogo)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 7. Android chrome icons
  await sharp(srcLogo)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'android-chrome-192x192.png'));

  await sharp(srcLogo)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'android-chrome-512x512.png'));

  // Copy 32x32 as favicon.ico
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));

  console.log('All favicons and logos generated successfully and proportionally (1:1 square ratio preserved)!');
}

processLogos().catch(err => {
  console.error('Error generating logos/favicons:', err);
  process.exit(1);
});

