import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function wipeStaticData() {
  console.log('==================================================');
  console.log('       Pembersihan Data Statis / Dummy Data       ');
  console.log('==================================================');

  const connection = await pool.getConnection();

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Bersihkan transaksi demo
    console.log('[1/4] Mengosongkan data transaksi demo...');
    await connection.query('TRUNCATE TABLE order_items');
    await connection.query('TRUNCATE TABLE order_status_logs');
    await connection.query('TRUNCATE TABLE payments');
    await connection.query('TRUNCATE TABLE orders');
    await connection.query('TRUNCATE TABLE purchase_items');
    await connection.query('TRUNCATE TABLE purchases');
    await connection.query('TRUNCATE TABLE stock_movements');
    await connection.query('TRUNCATE TABLE supplier_products');

    // 2. Bersihkan interaksi pelanggan dummy
    console.log('[2/4] Mengosongkan keranjang, wishlist, ulasan, voucher dummy...');
    await connection.query('TRUNCATE TABLE cart_items');
    await connection.query('TRUNCATE TABLE wishlists');
    await connection.query('TRUNCATE TABLE reviews');
    await connection.query('TRUNCATE TABLE vouchers');
    await connection.query('TRUNCATE TABLE testimonials');
    await connection.query('TRUNCATE TABLE activity_logs');
    await connection.query('TRUNCATE TABLE notifications');

    // 3. Bersihkan seluruh produk dummy & gambarnya
    console.log('[3/4] Mengosongkan seluruh produk dan galeri produk...');
    await connection.query('TRUNCATE TABLE product_images');
    await connection.query('TRUNCATE TABLE products');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  -> Seluruh data dummy berhasil dikosongkan!');

    // 4. Bersihkan file gambar produk dummy di storage/uploads
    console.log('[4/4] Membersihkan file WebP produk dummy di server/uploads/products...');
    const productsUploadDir = path.resolve(__dirname, '../../uploads/products');
    if (fs.existsSync(productsUploadDir)) {
      const files = fs.readdirSync(productsUploadDir);
      let removedCount = 0;
      for (const file of files) {
        if (file.endsWith('.webp')) {
          fs.unlinkSync(path.join(productsUploadDir, file));
          removedCount++;
        }
      }
      console.log(`  -> Berhasil menghapus ${removedCount} file WebP produk dummy.`);
    }

    console.log('==================================================');
    console.log('  BERHASIL: Database bersih & siap untuk produk asli!  ');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('Pembersihan gagal:', err);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    process.exit(1);
  } finally {
    connection.release();
  }
}

wipeStaticData();
