import { Router } from 'express';
import pool from '../database/db.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import supplierService from '../services/supplier.service.js';

const router = Router();
router.use(authenticateToken, requireRole('supplier'));

// Middleware helper to find supplier record for this user
async function getSupplierRecord(userId) {
  const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE user_id = ?', [userId]);
  return suppliers[0] || null;
}

// Supplier Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Data supplier tidak ditemukan.' });

    const [stats] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'Dibuat' THEN 1 END) as pending_confirm_count,
        COUNT(CASE WHEN status = 'Dikonfirmasi Supplier' THEN 1 END) as ready_to_ship_count,
        COUNT(CASE WHEN status = 'Dikirim' THEN 1 END) as shipped_count,
        COUNT(CASE WHEN status = 'Diterima' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN status = 'Diterima' THEN total ELSE 0 END), 0) as total_earnings
      FROM purchases
      WHERE supplier_id = ?
    `, [supplier.id]);

    const [recentPO] = await pool.query(`
      SELECT p.*, u.name as admin_name
      FROM purchases p
      JOIN users u ON p.admin_id = u.id
      WHERE p.supplier_id = ?
      ORDER BY p.id DESC
      LIMIT 5
    `, [supplier.id]);

    return res.json({
      success: true,
      supplier,
      stats: stats[0],
      recentPO,
    });
  } catch (err) {
    console.error('Supplier dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat dashboard supplier.' });
  }
});

// View Purchase Orders
router.get('/purchases', async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Data supplier tidak ditemukan.' });

    const [purchases] = await pool.query(`
      SELECT p.*, u.name as admin_name,
             (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as item_count
      FROM purchases p
      JOIN users u ON p.admin_id = u.id
      WHERE p.supplier_id = ?
      ORDER BY p.id DESC
    `, [supplier.id]);

    return res.json({ success: true, purchases });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pesanan pembelian.' });
  }
});

// PO Details
router.get('/purchases/:id', async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Data supplier tidak ditemukan.' });

    const [purchases] = await pool.query(`
      SELECT p.*, u.name as admin_name
      FROM purchases p
      JOIN users u ON p.admin_id = u.id
      WHERE p.id = ? AND p.supplier_id = ?
    `, [req.params.id, supplier.id]);

    if (purchases.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan pembelian tidak ditemukan.' });
    }

    const [items] = await pool.query(`
      SELECT pi.*, p.name as product_name, p.sku as product_sku, img.path_thumb
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE pi.purchase_id = ?
    `, [req.params.id]);

    return res.json({
      success: true,
      purchase: {
        ...purchases[0],
        items,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat detail pesanan.' });
  }
});

// Confirm PO
router.post('/purchases/:id/confirm', async (req, res) => {
  try {
    const { note } = req.body;
    await supplierService.updateStatusBySupplier(req.params.id, req.user.id, { action: 'confirm', note });
    return res.json({ success: true, message: 'Pesanan pembelian berhasil dikonfirmasi!' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengonfirmasi pesanan.' });
  }
});

// Reject PO
router.post('/purchases/:id/reject', async (req, res) => {
  try {
    const { note } = req.body;
    await supplierService.updateStatusBySupplier(req.params.id, req.user.id, { action: 'reject', note });
    return res.json({ success: true, message: 'Pesanan pembelian telah ditolak.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal menolak pesanan.' });
  }
});

// Ship PO
router.post('/purchases/:id/ship', async (req, res) => {
  try {
    const { courier, trackingNumber } = req.body;
    await supplierService.shipPurchase(req.params.id, req.user.id, { courier, trackingNumber });
    return res.json({ success: true, message: 'Pengiriman pesanan berhasil dicatat!' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Gagal mencatat pengiriman.' });
  }
});

// Manage Supplied Products
router.get('/products', async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Data supplier tidak ditemukan.' });

    const [products] = await pool.query(`
      SELECT sp.*, p.name, p.sku, p.stock as current_store_stock, img.path_thumb
      FROM supplier_products sp
      JOIN products p ON sp.product_id = p.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE sp.supplier_id = ?
      ORDER BY p.name ASC
    `, [supplier.id]);

    return res.json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat produk supplier.' });
  }
});

router.put('/products/:productId', async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Data supplier tidak ditemukan.' });

    const { cost_price, available_stock, is_available } = req.body;

    await pool.query(`
      UPDATE supplier_products
      SET cost_price = ?, available_stock = ?, is_available = ?
      WHERE supplier_id = ? AND product_id = ?
    `, [cost_price, available_stock, is_available ? 1 : 0, supplier.id, req.params.productId]);

    return res.json({ success: true, message: 'Ketersediaan stok & harga pasokan berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui stok produk.' });
  }
});

// Supplier Profile
router.get('/profile', async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    return res.json({ success: true, supplier });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat profil.' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { company_name, contact_person, phone, address } = req.body;
    await pool.query(`
      UPDATE suppliers
      SET company_name = ?, contact_person = ?, phone = ?, address = ?
      WHERE user_id = ?
    `, [company_name, contact_person, phone, address, req.user.id]);

    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [contact_person, phone, req.user.id]);

    return res.json({ success: true, message: 'Profil supplier berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
});

export default router;

