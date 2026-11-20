import pool from '../database/db.js';

class SupplierService {
  generatePurchaseCode() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PO-${y}${m}${d}-${rand}`;
  }

  /**
   * Admin creates a purchase order to a supplier
   */
  async createPurchase(adminId, { supplierId, items, note }) {
    if (!items || items.length === 0) {
      throw new Error('Daftar produk pembelian tidak boleh kosong.');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let total = 0;
      const code = this.generatePurchaseCode();

      for (const item of items) {
        total += parseFloat(item.cost_price) * parseInt(item.qty, 10);
      }

      const [pRes] = await connection.query(`
        INSERT INTO purchases (code, supplier_id, admin_id, status, total, note)
        VALUES (?, ?, ?, 'Dibuat', ?, ?)
      `, [code, supplierId, adminId, total, note || null]);

      const purchaseId = pRes.insertId;

      for (const item of items) {
        const qty = parseInt(item.qty, 10);
        const costPrice = parseFloat(item.cost_price);
        const subtotal = costPrice * qty;

        await connection.query(`
          INSERT INTO purchase_items (purchase_id, product_id, qty, cost_price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `, [purchaseId, item.product_id, qty, costPrice, subtotal]);
      }

      await connection.commit();
      return { id: purchaseId, code, total };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Supplier confirms or rejects the PO
   */
  async updateStatusBySupplier(purchaseId, supplierUserId, { action, note }) {
    // action: 'confirm' or 'reject'
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [suppliers] = await connection.query(
        'SELECT id FROM suppliers WHERE user_id = ?',
        [supplierUserId]
      );
      if (suppliers.length === 0) {
        throw new Error('Data supplier tidak ditemukan.');
      }
      const supplierId = suppliers[0].id;

      const [purchases] = await connection.query(
        'SELECT id, status FROM purchases WHERE id = ? AND supplier_id = ? FOR UPDATE',
        [purchaseId, supplierId]
      );

      if (purchases.length === 0) {
        throw new Error('Pesanan pembelian tidak ditemukan atau bukan milik Anda.');
      }

      const newStatus = action === 'confirm' ? 'Dikonfirmasi Supplier' : 'Ditolak';
      await connection.query(`
        UPDATE purchases
        SET status = ?, note = CONCAT(IFNULL(note, ''), ' | Catatan Supplier: ', ?)
        WHERE id = ?
      `, [newStatus, note || (action === 'confirm' ? 'Dikonfirmasi' : 'Ditolak'), purchaseId]);

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Supplier marks shipment as sent
   */
  async shipPurchase(purchaseId, supplierUserId, { courier, trackingNumber }) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [suppliers] = await connection.query(
        'SELECT id FROM suppliers WHERE user_id = ?',
        [supplierUserId]
      );
      if (suppliers.length === 0) throw new Error('Data supplier tidak ditemukan.');
      const supplierId = suppliers[0].id;

      const [purchases] = await connection.query(
        'SELECT id, status FROM purchases WHERE id = ? AND supplier_id = ? FOR UPDATE',
        [purchaseId, supplierId]
      );

      if (purchases.length === 0) throw new Error('Pesanan pembelian tidak ditemukan.');

      await connection.query(`
        UPDATE purchases
        SET status = 'Dikirim', courier = ?, tracking_number = ?, shipped_at = NOW()
        WHERE id = ?
      `, [courier || 'Ekspedisi Khusus', trackingNumber || '-', purchaseId]);

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Admin marks purchase as received -> automatically increments product stock & logs movement
   */
  async receivePurchase(purchaseId, adminId) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [purchases] = await connection.query(
        'SELECT id, code, status FROM purchases WHERE id = ? FOR UPDATE',
        [purchaseId]
      );

      if (purchases.length === 0) throw new Error('Pesanan pembelian tidak ditemukan.');
      const po = purchases[0];

      if (po.status === 'Diterima') {
        throw new Error('Pesanan pembelian ini sudah pernah ditandai Diterima.');
      }

      // Fetch items
      const [items] = await connection.query(
        'SELECT product_id, qty FROM purchase_items WHERE purchase_id = ?',
        [purchaseId]
      );

      for (const item of items) {
        const [prods] = await connection.query(
          'SELECT id, stock FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );

        if (prods.length > 0) {
          const newBal = prods[0].stock + item.qty;
          await connection.query(
            'UPDATE products SET stock = ? WHERE id = ?',
            [newBal, item.product_id]
          );

          await connection.query(`
            INSERT INTO stock_movements (product_id, type, qty, balance, reference_type, reference_id, note)
            VALUES (?, 'pembelian', ?, ?, 'purchase', ?, 'Penambahan stok dari pesanan pembelian ${po.code}')
          `, [item.product_id, item.qty, newBal, purchaseId]);
        }
      }

      await connection.query(`
        UPDATE purchases
        SET status = 'Diterima', received_at = NOW()
        WHERE id = ?
      `, [purchaseId]);

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

export const supplierService = new SupplierService();
export default supplierService;

