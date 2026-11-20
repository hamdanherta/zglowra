import { Router } from 'express';
import multer from 'multer';
import pool from '../database/db.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import orderService from '../services/order.service.js';
import paymentService from '../services/payment.service.js';
import imageService from '../services/image.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();
router.use(authenticateToken);

// ================= ADDRESSES =================
router.get('/addresses', async (req, res) => {
  try {
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [req.user.id]
    );
    return res.json({ success: true, addresses });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat alamat.' });
  }
});

router.post('/addresses', async (req, res) => {
  try {
    const { label, penerima, telepon, provinsi, kota, kecamatan, kode_pos, alamat_lengkap, is_default } = req.body;
    if (!penerima || !telepon || !alamat_lengkap) {
      return res.status(400).json({ success: false, message: 'Data penerima, telepon, dan alamat lengkap wajib diisi.' });
    }

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await pool.query(`
      INSERT INTO addresses (user_id, label, penerima, telepon, provinsi, kota, kecamatan, kode_pos, alamat_lengkap, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      label || 'Rumah',
      penerima,
      telepon,
      provinsi || 'DKI Jakarta',
      kota || 'Jakarta Selatan',
      kecamatan || '-',
      kode_pos || '12000',
      alamat_lengkap,
      is_default ? 1 : 0,
    ]);

    return res.status(201).json({ success: true, message: 'Alamat berhasil disimpan.', addressId: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan alamat.' });
  }
});

router.put('/addresses/:id', async (req, res) => {
  try {
    const { label, penerima, telepon, provinsi, kota, kecamatan, kode_pos, alamat_lengkap, is_default } = req.body;
    const addressId = req.params.id;

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    await pool.query(`
      UPDATE addresses
      SET label = ?, penerima = ?, telepon = ?, provinsi = ?, kota = ?, kecamatan = ?, kode_pos = ?, alamat_lengkap = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `, [
      label || 'Rumah',
      penerima,
      telepon,
      provinsi,
      kota,
      kecamatan,
      kode_pos,
      alamat_lengkap,
      is_default ? 1 : 0,
      addressId,
      req.user.id
    ]);

    return res.json({ success: true, message: 'Alamat berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui alamat.' });
  }
});

router.delete('/addresses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Alamat telah dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus alamat.' });
  }
});

// ================= CART =================
router.get('/cart', async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT ci.id as cart_item_id, ci.qty,
             p.id as product_id, p.name, p.slug, p.price, p.discount_price, p.stock, p.weight_gram,
             img.path_medium, img.path_thumb
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE ci.user_id = ? AND p.is_active = 1 AND p.deleted_at IS NULL
    `, [req.user.id]);

    let subtotal = 0;
    const mapped = items.map(item => {
      const price = item.discount_price && item.discount_price > 0 ? parseFloat(item.discount_price) : parseFloat(item.price);
      const totalItem = price * item.qty;
      subtotal += totalItem;
      return {
        ...item,
        final_price: price,
        total_price: totalItem,
      };
    });

    return res.json({ success: true, cart: mapped, subtotal });
  } catch (err) {
    console.error('Cart error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat keranjang.' });
  }
});

router.post('/cart', async (req, res) => {
  try {
    const { product_id, qty = 1 } = req.body;
    const requestedQty = parseInt(qty, 10);

    const [prods] = await pool.query('SELECT id, stock, name FROM products WHERE id = ? AND is_active = 1', [product_id]);
    if (prods.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    const prod = prods[0];
    if (prod.stock < requestedQty) {
      return res.status(400).json({ success: false, message: `Stok produk "${prod.name}" hanya tersisa ${prod.stock} pcs.` });
    }

    await pool.query(`
      INSERT INTO cart_items (user_id, product_id, qty)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE qty = ?
    `, [req.user.id, product_id, requestedQty, requestedQty]);

    return res.json({ success: true, message: `Produk "${prod.name}" berhasil ditambahkan ke keranjang!` });
  } catch (err) {
    console.error('Add cart error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan ke keranjang.' });
  }
});

router.delete('/cart/:productId', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
    return res.json({ success: true, message: 'Item berhasil dihapus dari keranjang.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus item.' });
  }
});

router.delete('/cart', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'Keranjang telah dikosongkan.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengosongkan keranjang.' });
  }
});

// ================= WISHLIST =================
router.get('/wishlist', async (req, res) => {
  try {
    const [wishlist] = await pool.query(`
      SELECT w.id as wishlist_id, p.id, p.name, p.slug, p.price, p.discount_price, p.stock,
             img.path_medium, img.path_thumb
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE w.user_id = ? AND p.is_active = 1 AND p.deleted_at IS NULL
      ORDER BY w.created_at DESC
    `, [req.user.id]);

    return res.json({ success: true, wishlist });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat wishlist.' });
  }
});

router.post('/wishlist/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const [existing] = await pool.query('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);

    if (existing.length > 0) {
      await pool.query('DELETE FROM wishlists WHERE id = ?', [existing[0].id]);
      return res.json({ success: true, is_wishlisted: false, message: 'Dihapus dari wishlist.' });
    } else {
      await pool.query('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
      return res.json({ success: true, is_wishlisted: true, message: 'Disimpan ke wishlist!' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui wishlist.' });
  }
});

// ================= ORDERS =================
router.post('/orders', async (req, res) => {
  try {
    const { items, addressSnapshot, courier, shippingCost, voucherCode, paymentMethod, note } = req.body;

    const result = await orderService.createOrder(req.user.id, {
      items,
      addressSnapshot,
      courier,
      shippingCost,
      voucherCode,
      paymentMethod,
      note,
    });

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      order: result,
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Gagal membuat pesanan.' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT o.id, o.code, o.total, o.shipping_cost, o.discount, o.subtotal,
             o.status, o.created_at, o.expired_at, o.tracking_number,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
             (SELECT p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id LIMIT 1) as first_item_name,
             (SELECT img.path_thumb FROM order_items oi JOIN product_images img ON oi.product_id = img.product_id WHERE oi.order_id = o.id AND img.is_primary = 1 LIMIT 1) as first_item_img
      FROM orders o
      WHERE o.user_id = ?
    `;
    const params = [req.user.id];

    if (status && status !== 'Semua') {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.query(sql, params);
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pesanan.' });
  }
});

router.get('/orders/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE code = ? AND user_id = ?',
      [code, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const order = orders[0];
    try {
      order.address_snapshot = JSON.parse(order.address_snapshot);
    } catch {}

    // Items
    const [items] = await pool.query(`
      SELECT oi.*, p.slug, img.path_thumb
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE oi.order_id = ?
    `, [order.id]);

    // Payment info
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [order.id]);

    // Logs
    const [logs] = await pool.query(
      'SELECT status, note, created_at FROM order_status_logs WHERE order_id = ? ORDER BY id ASC',
      [order.id]
    );

    // Reviews submitted by customer for this order
    const [reviews] = await pool.query('SELECT product_id, rating, comment FROM reviews WHERE order_id = ?', [order.id]);

    return res.json({
      success: true,
      order: {
        ...order,
        items,
        payment: payments[0] || null,
        logs,
        reviews,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat detail pesanan.' });
  }
});

// Cancel Order
router.post('/orders/:code/cancel', async (req, res) => {
  try {
    const { code } = req.params;
    const { reason = 'Dibatalkan oleh pelanggan' } = req.body;

    const [orders] = await pool.query('SELECT id FROM orders WHERE code = ? AND user_id = ?', [code, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    await orderService.cancelOrder(orders[0].id, reason, req.user.id);
    return res.json({ success: true, message: 'Pesanan berhasil dibatalkan.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal membatalkan pesanan.' });
  }
});

// Mark Order as Received / Completed
router.post('/orders/:code/complete', async (req, res) => {
  try {
    const { code } = req.params;
    const [orders] = await pool.query('SELECT id, status FROM orders WHERE code = ? AND user_id = ?', [code, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    const order = orders[0];
    if (order.status !== 'Dikirim') {
      return res.status(400).json({ success: false, message: 'Pesanan belum dalam status Dikirim.' });
    }

    await pool.query('UPDATE orders SET status = "Selesai", completed_at = NOW() WHERE id = ?', [order.id]);
    await pool.query(`
      INSERT INTO order_status_logs (order_id, status, note, user_id)
      VALUES (?, 'Selesai', 'Pesanan telah diterima dengan baik oleh pelanggan.', ?)
    `, [order.id, req.user.id]);

    return res.json({ success: true, message: 'Terima kasih! Pesanan telah ditandai selesai.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menyelesaikan pesanan.' });
  }
});

// Upload Payment Proof (WebP Conversion via imageService)
router.post('/orders/:code/payment', upload.single('proof'), async (req, res) => {
  try {
    const { code } = req.params;
    const { bank, amount } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File bukti transfer wajib diunggah.' });
    }

    const [orders] = await pool.query('SELECT id, total FROM orders WHERE code = ? AND user_id = ?', [code, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    // Process and convert image to WebP
    const imgVariants = await imageService.store(req.file.buffer, 'payments');

    await paymentService.submitPayment(orders[0].id, req.user.id, {
      bank: bank || 'BCA',
      amount: amount || orders[0].total,
      proofPath: imgVariants.path_medium || imgVariants.path_original,
    });

    return res.json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah! Mohon menunggu verifikasi admin.',
    });
  } catch (err) {
    console.error('Payment upload error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah bukti pembayaran.' });
  }
});

// Submit Product Review
router.post('/orders/:code/review', async (req, res) => {
  try {
    const { code } = req.params;
    const { product_id, rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating dan komentar ulasan wajib diisi.' });
    }

    const [orders] = await pool.query('SELECT id, status FROM orders WHERE code = ? AND user_id = ?', [code, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    if (orders[0].status !== 'Selesai') {
      return res.status(400).json({ success: false, message: 'Ulasan hanya dapat diberikan untuk pesanan yang sudah Selesai.' });
    }

    await pool.query(`
      INSERT INTO reviews (user_id, product_id, order_id, rating, comment, is_visible)
      VALUES (?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = NOW()
    `, [req.user.id, product_id, orders[0].id, rating, comment]);

    return res.json({ success: true, message: 'Terima kasih atas ulasan Anda!' });
  } catch (err) {
    console.error('Review submit error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengirim ulasan.' });
  }
});

export default router;

