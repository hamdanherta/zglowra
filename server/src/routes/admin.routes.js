import { Router } from 'express';
import multer from 'multer';
import pool from '../database/db.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import imageService from '../services/image.service.js';
import paymentService from '../services/payment.service.js';
import supplierService from '../services/supplier.service.js';
import reportService from '../services/report.service.js';
import bcrypt from 'bcryptjs';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();
router.use(authenticateToken, requireRole('admin'));

// ================= DASHBOARD =================
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Sales today
    const [salesToday] = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders_count
      FROM orders
      WHERE DATE(created_at) = CURDATE() AND status IN ('Diproses', 'Dikirim', 'Selesai')
    `);

    // 2. Sales this month
    const [salesMonth] = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders_count
      FROM orders
      WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        AND status IN ('Diproses', 'Dikirim', 'Selesai')
    `);

    // 3. New orders count
    const [newOrders] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'Menunggu Pembayaran'"
    );

    // 4. Pending verification payments count
    const [pendingPayments] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'Menunggu Verifikasi'"
    );

    // 5. Low stock products (stock <= 10)
    const [lowStock] = await pool.query(`
      SELECT id, name, sku, stock, price
      FROM products
      WHERE stock <= 10 AND is_active = 1 AND deleted_at IS NULL
      ORDER BY stock ASC
      LIMIT 6
    `);

    // 6. Total active customers
    const [customerCount] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND deleted_at IS NULL"
    );

    // 7. 30-day sales chart
    const [chartData] = await pool.query(`
      SELECT DATE(created_at) as date,
             COALESCE(SUM(CASE WHEN status IN ('Diproses', 'Dikirim', 'Selesai') THEN total ELSE 0 END), 0) as revenue,
             COUNT(*) as order_count
      FROM orders
      WHERE created_at >= CURDATE() - INTERVAL 29 DAY
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 8. Top 5 selling products
    const [topProducts] = await pool.query(`
      SELECT p.id, p.name, p.sku, p.sold_count, p.price, p.stock,
             img.path_thumb
      FROM products p
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE p.deleted_at IS NULL
      ORDER BY p.sold_count DESC
      LIMIT 5
    `);

    // 9. Recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.id, o.code, o.total, o.status, o.created_at, u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: {
        todayRevenue: salesToday[0]?.revenue || 0,
        todayOrders: salesToday[0]?.orders_count || 0,
        monthRevenue: salesMonth[0]?.revenue || 0,
        monthOrders: salesMonth[0]?.orders_count || 0,
        newOrdersCount: newOrders[0]?.count || 0,
        pendingPaymentsCount: pendingPayments[0]?.count || 0,
        totalCustomers: customerCount[0]?.count || 0,
      },
      lowStock,
      chartData,
      topProducts,
      recentOrders,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat dashboard admin.' });
  }
});

// ================= PRODUCTS CRUD =================
router.get('/products', async (req, res) => {
  try {
    const { search = '', category_id, is_active } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name,
             img.path_medium, img.path_thumb
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE p.deleted_at IS NULL
    `;
    const params = [];

    if (search.trim()) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }
    if (is_active !== undefined && is_active !== '') {
      sql += ' AND p.is_active = ?';
      params.push(parseInt(is_active, 10));
    }

    sql += ' ORDER BY p.id DESC';

    const [products] = await pool.query(sql, params);
    return res.json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat produk.' });
  }
});

router.post('/products', upload.array('images', 6), async (req, res) => {
  try {
    const {
      category_id, name, sku, description, ingredients, how_to_use,
      price, discount_price, stock, weight_gram, is_active = 1, is_featured = 0
    } = req.body;

    if (!name || !category_id || !price || !sku) {
      return res.status(400).json({ success: false, message: 'Kategori, Nama, SKU, dan Harga wajib diisi.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const [result] = await pool.query(`
      INSERT INTO products (
        category_id, name, slug, sku, description, ingredients, how_to_use,
        price, discount_price, stock, weight_gram, is_active, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      category_id, name, slug, sku, description || '', ingredients || '', how_to_use || '',
      price, discount_price || null, stock || 0, weight_gram || 250, is_active ? 1 : 0, is_featured ? 1 : 0
    ]);
    const productId = result.insertId;

    // Process uploaded images into WebP
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const variants = await imageService.store(file.buffer, 'products');
        await pool.query(`
          INSERT INTO product_images (product_id, path_original, path_medium, path_thumb, is_primary, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [productId, variants.path_original, variants.path_medium, variants.path_thumb, i === 0 ? 1 : 0, i]);
      }
    }

    // Initial stock movement
    if (stock > 0) {
      await pool.query(`
        INSERT INTO stock_movements (product_id, type, qty, balance, reference_type, note)
        VALUES (?, 'penyesuaian', ?, ?, 'product', 'Stok awal produk baru')
      `, [productId, stock, stock]);
    }

    return res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan!', productId });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan produk.' });
  }
});

router.put('/products/:id', upload.array('images', 6), async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      category_id, name, sku, description, ingredients, how_to_use,
      price, discount_price, stock, weight_gram, is_active, is_featured
    } = req.body;

    const [oldProds] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
    if (oldProds.length === 0) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });

    const oldStock = oldProds[0].stock;
    const newStock = parseInt(stock, 10);

    await pool.query(`
      UPDATE products
      SET category_id = ?, name = ?, sku = ?, description = ?, ingredients = ?,
          how_to_use = ?, price = ?, discount_price = ?, stock = ?, weight_gram = ?,
          is_active = ?, is_featured = ?
      WHERE id = ?
    `, [
      category_id, name, sku, description, ingredients, how_to_use,
      price, discount_price || null, newStock, weight_gram, is_active ? 1 : 0, is_featured ? 1 : 0,
      productId
    ]);

    // If stock changed manually by admin
    if (newStock !== oldStock) {
      const diff = newStock - oldStock;
      await pool.query(`
        INSERT INTO stock_movements (product_id, type, qty, balance, reference_type, note)
        VALUES (?, 'penyesuaian', ?, ?, 'admin', 'Penyesuaian stok manual oleh Admin')
      `, [productId, diff, newStock]);
    }

    // If new images uploaded
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const variants = await imageService.store(file.buffer, 'products');
        await pool.query(`
          INSERT INTO product_images (product_id, path_original, path_medium, path_thumb, is_primary, sort_order)
          VALUES (?, ?, ?, ?, 0, ?)
        `, [productId, variants.path_original, variants.path_medium, variants.path_thumb, i + 10]);
      }
    }

    return res.json({ success: true, message: 'Produk berhasil diperbarui!' });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui produk.' });
  }
});

// Soft Delete Product
router.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('UPDATE products SET deleted_at = NOW(), is_active = 0 WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Produk telah dinonaktifkan/dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
  }
});

// ================= CATEGORIES CRUD =================
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return res.json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat kategori.' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const [resDb] = await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );

    return res.status(201).json({ success: true, message: 'Kategori berhasil dibuat.', categoryId: resDb.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menambahkan kategori.' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description, req.params.id]
    );
    return res.json({ success: true, message: 'Kategori berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui kategori.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Kategori telah dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus kategori. Pastikan tidak ada produk yang terkait.' });
  }
});

// ================= ORDERS MANAGEMENT =================
router.get('/orders', async (req, res) => {
  try {
    const { status, search = '' } = req.query;
    let sql = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'Semua') {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (search.trim()) {
      sql += ' AND (o.code LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.query(sql, params);
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pesanan.' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    const order = orders[0];
    try {
      order.address_snapshot = JSON.parse(order.address_snapshot);
    } catch {}

    const [items] = await pool.query(`
      SELECT oi.*, img.path_thumb
      FROM order_items oi
      LEFT JOIN product_images img ON oi.product_id = img.product_id AND img.is_primary = 1
      WHERE oi.order_id = ?
    `, [order.id]);

    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [order.id]);
    const [logs] = await pool.query('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY id ASC', [order.id]);

    return res.json({
      success: true,
      order: {
        ...order,
        items,
        payment: payments[0] || null,
        logs,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat detail pesanan.' });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, tracking_number, note } = req.body;
    const orderId = req.params.id;

    const [orders] = await pool.query('SELECT id, code, status FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });

    let updateSql = 'UPDATE orders SET status = ?';
    const params = [status];

    if (tracking_number) {
      updateSql += ', tracking_number = ?';
      params.push(tracking_number);
    }
    if (status === 'Selesai') {
      updateSql += ', completed_at = NOW()';
    }

    updateSql += ' WHERE id = ?';
    params.push(orderId);

    await pool.query(updateSql, params);

    await pool.query(`
      INSERT INTO order_status_logs (order_id, status, note, user_id)
      VALUES (?, ?, ?, ?)
    `, [orderId, status, note || `Status diperbarui menjadi ${status} oleh Admin.`, req.user.id]);

    return res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah status pesanan.' });
  }
});

// ================= PAYMENT VERIFICATION =================
router.get('/payments/pending', async (req, res) => {
  try {
    const [payments] = await pool.query(`
      SELECT p.*, o.code as order_code, o.total as order_total, u.name as customer_name, u.email as customer_email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `);

    return res.json({ success: true, payments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat antrean pembayaran.' });
  }
});

router.post('/payments/:orderId/approve', async (req, res) => {
  try {
    await paymentService.approvePayment(req.params.orderId, req.user.id);
    return res.json({ success: true, message: 'Pembayaran disetujui! Status pesanan kini Diproses.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal menyetujui pembayaran.' });
  }
});

router.post('/payments/:orderId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    await paymentService.rejectPayment(req.params.orderId, req.user.id, reason);
    return res.json({ success: true, message: 'Pembayaran telah ditolak.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal menolak pembayaran.' });
  }
});

// ================= CUSTOMERS MANAGEMENT =================
router.get('/customers', async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
             COUNT(o.id) as order_count,
             COALESCE(SUM(CASE WHEN o.status = 'Selesai' THEN o.total ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer' AND u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return res.json({ success: true, customers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat data pelanggan.' });
  }
});

router.put('/customers/:id/toggle', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ? AND role = "customer"', [req.params.id]);
    return res.json({ success: true, message: 'Status pelanggan berhasil diubah.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah status pelanggan.' });
  }
});

// ================= SUPPLIERS MANAGEMENT =================
router.get('/suppliers', async (req, res) => {
  try {
    const [suppliers] = await pool.query(`
      SELECT s.*, u.email, u.is_active
      FROM suppliers s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.id ASC
    `);
    return res.json({ success: true, suppliers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat data supplier.' });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { company_name, contact_person, phone, email, address, password } = req.body;
    if (!company_name || !contact_person || !email || !password) {
      return res.status(400).json({ success: false, message: 'Perusahaan, kontak, email, dan kata sandi wajib diisi.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userRes] = await pool.query(`
      INSERT INTO users (name, email, phone, password, role)
      VALUES (?, ?, ?, ?, 'supplier')
    `, [contact_person, email.toLowerCase().trim(), phone, hashedPassword]);

    const [supRes] = await pool.query(`
      INSERT INTO suppliers (user_id, company_name, contact_person, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `, [userRes.insertId, company_name, contact_person, phone, address || '']);

    return res.status(201).json({ success: true, message: 'Supplier berhasil didaftarkan.', supplierId: supRes.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menambahkan supplier.' });
  }
});

// ================= PURCHASES (STOCK PROCUREMENT) =================
router.get('/purchases', async (req, res) => {
  try {
    const [purchases] = await pool.query(`
      SELECT p.*, s.company_name as supplier_name, u.name as admin_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN users u ON p.admin_id = u.id
      ORDER BY p.id DESC
    `);
    return res.json({ success: true, purchases });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pesanan pembelian.' });
  }
});

router.post('/purchases', async (req, res) => {
  try {
    const { supplier_id, items, note } = req.body;
    const po = await supplierService.createPurchase(req.user.id, {
      supplierId: supplier_id,
      items,
      note,
    });
    return res.status(201).json({ success: true, message: 'Pesanan pembelian berhasil dibuat!', purchase: po });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal membuat pesanan pembelian.' });
  }
});

router.put('/purchases/:id/receive', async (req, res) => {
  try {
    await supplierService.receivePurchase(req.params.id, req.user.id);
    return res.json({ success: true, message: 'Barang telah diterima! Stok produk otomatis bertambah.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal menerima pesanan pembelian.' });
  }
});

// ================= REPORTS & EXPORTS =================
router.get('/reports/sales', async (req, res) => {
  try {
    const data = await reportService.getSalesReport(req.query);
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat laporan penjualan.' });
  }
});

router.get('/reports/sales/excel', async (req, res) => {
  try {
    const data = await reportService.getSalesReport(req.query);
    await reportService.exportSalesExcel(data, res);
  } catch (err) {
    console.error('Export sales excel error:', err);
    res.status(500).send('Gagal mengekspor Excel.');
  }
});

router.get('/reports/sales/pdf', async (req, res) => {
  try {
    const data = await reportService.getSalesReport(req.query);
    reportService.exportSalesPDF(data, res);
  } catch (err) {
    console.error('Export sales pdf error:', err);
    res.status(500).send('Gagal mengekspor PDF.');
  }
});

router.get('/reports/purchases', async (req, res) => {
  try {
    const data = await reportService.getPurchasesReport(req.query);
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat laporan pembelian.' });
  }
});

router.get('/reports/purchases/excel', async (req, res) => {
  try {
    const data = await reportService.getPurchasesReport(req.query);
    await reportService.exportPurchasesExcel(data, res);
  } catch (err) {
    console.error('Export purchases excel error:', err);
    res.status(500).send('Gagal mengekspor Excel.');
  }
});

router.get('/reports/purchases/pdf', async (req, res) => {
  try {
    const data = await reportService.getPurchasesReport(req.query);
    reportService.exportPurchasesPDF(data, res);
  } catch (err) {
    console.error('Export purchases pdf error:', err);
    res.status(500).send('Gagal mengekspor PDF.');
  }
});

// ================= VOUCHERS CRUD =================
router.get('/vouchers', async (req, res) => {
  try {
    const [vouchers] = await pool.query('SELECT * FROM vouchers ORDER BY id DESC');
    return res.json({ success: true, vouchers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat voucher.' });
  }
});

router.post('/vouchers', async (req, res) => {
  try {
    const { code, type, value, min_purchase, quota, starts_at, ends_at, is_active } = req.body;
    await pool.query(`
      INSERT INTO vouchers (code, type, value, min_purchase, quota, starts_at, ends_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.toUpperCase().trim(), type || 'percent', value, min_purchase || 0,
      quota || 100, starts_at || null, ends_at || null, is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);
    return res.status(201).json({ success: true, message: 'Voucher berhasil dibuat.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal membuat voucher.' });
  }
});

router.delete('/vouchers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Voucher telah dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus voucher.' });
  }
});

// ================= SETTINGS UPDATE =================
router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, val] of Object.entries(updates)) {
      const storedVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      await pool.query(`
        INSERT INTO settings (\`key\`, value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE value = ?
      `, [key, storedVal, storedVal]);
    }
    return res.json({ success: true, message: 'Pengaturan toko berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan.' });
  }
});

// ================= REVIEWS MODERATION =================
router.get('/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT r.*, u.name as customer_name, p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    return res.json({ success: true, reviews });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat ulasan.' });
  }
});

router.put('/reviews/:id/toggle', async (req, res) => {
  try {
    await pool.query('UPDATE reviews SET is_visible = NOT is_visible WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Visibilitas ulasan berhasil diubah.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengubah visibilitas ulasan.' });
  }
});

export default router;

