import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

// Ensure root upload directories exist
['products', 'payments', 'avatars', 'banners', 'misc'].forEach(sub => {
  const dir = path.join(UPLOADS_ROOT, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class ImageService {
  /**
   * Process and store an image buffer into WebP with 3 variants (original, medium, thumb)
   * @param {Buffer} buffer 
   * @param {string} folder - subfolder e.g. 'products', 'payments'
   * @returns {Promise<{path_original: string, path_medium: string, path_thumb: string}>}
   */
  async store(buffer, folder = 'products') {
    const targetDir = path.join(UPLOADS_ROOT, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileId = uuidv4();
    const originalFilename = `${fileId}-orig.webp`;
    const mediumFilename = `${fileId}-med.webp`;
    const thumbFilename = `${fileId}-thumb.webp`;

    const originalPath = path.join(targetDir, originalFilename);
    const mediumPath = path.join(targetDir, mediumFilename);
    const thumbPath = path.join(targetDir, thumbFilename);

    // 1. Original (max 2000px, quality 88)
    await sharp(buffer)
      .rotate() // preserve EXIF orientation
      .resize({
        width: 2000,
        height: 2000,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 88, effort: 4 })
      .toFile(originalPath);

    // 2. Medium (800px, quality 85)
    await sharp(buffer)
      .rotate()
      .resize({
        width: 800,
        height: 800,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toFile(mediumPath);

    // 3. Thumb (320px, quality 80)
    await sharp(buffer)
      .rotate()
      .resize({
        width: 320,
        height: 320,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 3 })
      .toFile(thumbPath);

    return {
      path_original: `/uploads/${folder}/${originalFilename}`,
      path_medium: `/uploads/${folder}/${mediumFilename}`,
      path_thumb: `/uploads/${folder}/${thumbFilename}`,
    };
  }

  /**
   * Delete image files from disk given a relative or full path
   * @param {string|string[]} paths 
   */
  async delete(paths) {
    if (!paths) return;
    const list = Array.isArray(paths) ? paths : [paths];

    for (const relPath of list) {
      if (!relPath || typeof relPath !== 'string') continue;
      // Strip leading '/uploads/' or 'uploads/'
      const cleanPath = relPath.replace(/^\/?uploads\//, '');
      const fullPath = path.join(UPLOADS_ROOT, cleanPath);

      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.warn(`Could not delete file ${fullPath}:`, err.message);
        }
      }
    }
  }
}

export const imageService = new ImageService();
export default imageService;

