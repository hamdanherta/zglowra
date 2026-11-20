import sharp from 'sharp';
import pool from '../database/db.js';

async function runTest() {
  console.log('===============================================================');
  console.log('  UJI LENGKAP FITUR PRODUK: TAMBAH, EDIT & HAPUS (CRUD TEST)   ');
  console.log('===============================================================\n');

  try {
    // 0. Bersihkan data sisa pengujian sebelumnya jika ada
    await pool.query("DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'ZG-SCRUB-TEST%')");
    await pool.query("DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'ZG-SCRUB-TEST%')");
    await pool.query("DELETE FROM products WHERE sku LIKE 'ZG-SCRUB-TEST%'");

    // 1. Login Admin untuk mendapatkan JWT Token
    console.log('[FASE 1] Autentikasi Admin (admin@zglowra.com)...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@zglowra.com',
        password: 'password123',
      }),
    });

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
      throw new Error(`Login gagal: ${loginData.message || JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    console.log('  -> Login Berhasil! JWT Token diperoleh.\n');

    // Buat dummy image buffer dengan Sharp untuk simulasi upload foto produk
    const dummyImageBuffer = await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 3,
        background: { r: 221, g: 105, b: 91 }, // #DD695B Brand color
      },
    })
      .png()
      .toBuffer();

    // 2. TAMBAH PRODUK (CREATE)
    console.log('[FASE 2] Menguji FITUR TAMBAH PRODUK (POST /api/admin/products)...');
    const createFormData = new FormData();
    createFormData.append('name', 'Zglowra Sakura Glow Body Scrub');
    createFormData.append('category_id', '2'); // Body Scrub
    createFormData.append('sku', 'ZG-SCRUB-TEST-001');
    createFormData.append('price', '85000');
    createFormData.append('discount_price', '75000');
    createFormData.append('stock', '50');
    createFormData.append('weight_gram', '250');
    createFormData.append('description', 'Scrub lembut pencerah kulit dengan partikel alami dan ekstrak bunga Sakura.');
    createFormData.append('ingredients', 'Aqua, Niacinamide, Prunus Serrulata Flower Extract, Walnut Shell');
    createFormData.append('how_to_use', 'Gunakan pada kulit lembap, pijat memutar, bilas dengan air hangat.');
    createFormData.append('is_active', '1');
    createFormData.append('is_featured', '1');

    const imageBlob = new Blob([dummyImageBuffer], { type: 'image/png' });
    createFormData.append('images', imageBlob, 'test-product.png');

    const createRes = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: createFormData,
    });

    const createData = await createRes.json();
    console.log('  Response Tambah Produk:', createData);
    if (!createData.success || !createData.productId) {
      throw new Error(`Gagal tambah produk: ${createData.message}`);
    }
    const productId = createData.productId;
    console.log(`  -> Produk berhasil ditambahkan dengan ID: ${productId}`);

    // Verifikasi Database setelah Tambah
    const [createdRows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (createdRows.length === 0) throw new Error('Produk tidak ditemukan di database!');
    const createdProduct = createdRows[0];
    console.log(`  -> Validasi DB Produk: Name="${createdProduct.name}", SKU="${createdProduct.sku}", Slug="${createdProduct.slug}", Stok=${createdProduct.stock}`);

    // Verifikasi Gambar WebP
    const [imageRows] = await pool.query('SELECT * FROM product_images WHERE product_id = ?', [productId]);
    console.log(`  -> Validasi DB Gambar: ${imageRows.length} gambar tersimpan di DB.`);
    if (imageRows.length > 0) {
      console.log(`     Path Medium: ${imageRows[0].path_medium}`);
      console.log(`     Path Thumb: ${imageRows[0].path_thumb}`);
    }

    // Verifikasi Riwayat Stok (Stock Movements)
    const [stockRows] = await pool.query('SELECT * FROM stock_movements WHERE product_id = ?', [productId]);
    console.log(`  -> Validasi Stok Awal: Tipe="${stockRows[0]?.type}", Qty=${stockRows[0]?.qty}, Balance=${stockRows[0]?.balance}`);

    // Verifikasi List Produk Admin
    const adminListRes = await fetch('http://localhost:5000/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const adminListData = await adminListRes.json();
    const foundInAdmin = adminListData.products?.find((p) => p.id === productId);
    console.log(`  -> Validasi List Admin: Produk ${foundInAdmin ? 'TERDAFTAR' : 'TIDAK terdaftar'}`);
    if (!foundInAdmin) throw new Error('Produk tidak ditemukan pada GET /api/admin/products!');

    // Verifikasi Katalog Publik
    const publicCatalogRes = await fetch('http://localhost:5000/api/products');
    const publicCatalogData = await publicCatalogRes.json();
    const publicList = publicCatalogData.data || publicCatalogData.products || [];
    const foundInPublic = publicList.find((p) => p.id === productId);
    console.log(`  -> Validasi Katalog Publik: Produk ${foundInPublic ? 'TERLIHAT di toko publik' : 'TIDAK terlihat di toko publik'}`);
    if (!foundInPublic) throw new Error('Produk baru tidak muncul di katalog publik!');
    console.log('  [PASS] Pengujian Tambah Produk: BERHASIL 100%\n');

    // 3. EDIT PRODUK (UPDATE)
    console.log('[FASE 3] Menguji FITUR EDIT PRODUK (PUT /api/admin/products/:id)...');
    const updateFormData = new FormData();
    updateFormData.append('category_id', '2');
    updateFormData.append('name', 'Zglowra Sakura Glow Body Scrub 300g (Special Gold Edition)');
    updateFormData.append('sku', 'ZG-SCRUB-TEST-001');
    updateFormData.append('price', '95000');
    updateFormData.append('discount_price', '89000');
    updateFormData.append('stock', '80'); // Perubahan stok dari 50 ke 80 (+30)
    updateFormData.append('weight_gram', '300');
    updateFormData.append('description', 'Formula baru dengan 5x Whitening Complex dan butiran scrub emas.');
    updateFormData.append('ingredients', 'Aqua, Niacinamide, Gold Flakes, Sakura Extract');
    updateFormData.append('how_to_use', 'Gunakan 2x seminggu untuk hasil maksimal.');
    updateFormData.append('is_active', '1');
    updateFormData.append('is_featured', '1');

    const updateRes = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: updateFormData,
    });

    const updateData = await updateRes.json();
    console.log('  Response Edit Produk:', updateData);
    if (!updateData.success) {
      throw new Error(`Gagal edit produk: ${updateData.message}`);
    }

    // Verifikasi Database setelah Update
    const [updatedRows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    const updatedProduct = updatedRows[0];
    console.log(`  -> Validasi DB Produk setelah Update: Name="${updatedProduct.name}", Harga=${updatedProduct.price}, Diskon=${updatedProduct.discount_price}, Stok=${updatedProduct.stock}`);
    if (Number(updatedProduct.price) !== 95000 || Number(updatedProduct.stock) !== 80) {
      throw new Error('Data di database tidak sesuai dengan hasil edit!');
    }

    // Verifikasi Penyesuaian Stok di Stock Movements
    const [updatedStockRows] = await pool.query(
      'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY id DESC LIMIT 1',
      [productId]
    );
    console.log(`  -> Validasi Log Stok Update: Qty=${updatedStockRows[0]?.qty} (penambahan selisih), Balance=${updatedStockRows[0]?.balance}, Note="${updatedStockRows[0]?.note}"`);
    console.log('  [PASS] Pengujian Edit Produk: BERHASIL 100%\n');

    // 4. HAPUS PRODUK (DELETE / SOFT DELETE)
    console.log('[FASE 4] Menguji FITUR HAPUS PRODUK (DELETE /api/admin/products/:id)...');
    const deleteRes = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const deleteData = await deleteRes.json();
    console.log('  Response Hapus Produk:', deleteData);
    if (!deleteData.success) {
      throw new Error(`Gagal hapus produk: ${deleteData.message}`);
    }

    // Verifikasi Soft Delete di Database
    const [deletedRows] = await pool.query('SELECT is_active, deleted_at FROM products WHERE id = ?', [productId]);
    console.log(`  -> Validasi DB Status Hapus: is_active=${deletedRows[0].is_active}, deleted_at=${deletedRows[0].deleted_at}`);
    if (deletedRows[0].is_active !== 0 || !deletedRows[0].deleted_at) {
      throw new Error('Produk belum terhapus/ternonaktifkan di database!');
    }

    // Verifikasi Produk Hilang dari Katalog Publik
    const catalogAfterDeleteRes = await fetch('http://localhost:5000/api/products');
    const catalogAfterDeleteData = await catalogAfterDeleteRes.json();
    const publicListAfterDelete = catalogAfterDeleteData.data || catalogAfterDeleteData.products || [];
    const stillInPublic = publicListAfterDelete.some((p) => p.id === productId);
    console.log(`  -> Validasi Katalog Publik setelah Hapus: Produk ${stillInPublic ? 'MASIH ADA (GAGAL)' : 'SUDAH HILANG dari katalog publik (BENAR)'}`);
    if (stillInPublic) {
      throw new Error('Produk yang sudah dihapus masih tampil di katalog publik!');
    }

    console.log('  [PASS] Pengujian Hapus Produk: BERHASIL 100%\n');

    // 5. Pembersihan data uji agar database kembali bersih total
    console.log('[FASE 5] Membersihkan sisa data pengujian dari database...');
    await pool.query('DELETE FROM stock_movements WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    console.log('  -> Data pengujian berhasil dibersihkan. Database bersih 100%!');

    console.log('\n===============================================================');
    console.log('  HASIL PENGUJIAN: SEMUA FUNGSI (TAMBAH, EDIT, HAPUS) NORMAL!   ');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n[GAGAL PENGUJIAN]:', err.message);
    process.exit(1);
  }
}

runTest();
