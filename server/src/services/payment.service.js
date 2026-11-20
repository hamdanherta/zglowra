import pool from '../database/db.js';

class PaymentService {
  /**
   * Submit payment proof from customer
   */
  async submitPayment(orderId, userId, { bank, amount, proofPath }) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [orders] = await connection.query(
        'SELECT id, code, status, total, user_id FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      const order = orders[0];
      if (order.user_id !== userId) {
        throw new Error('Akses tidak sah untuk pesanan ini.');
      }

      if (!['Menunggu Pembayaran', 'Pembayaran Ditolak'].includes(order.status)) {
        throw new Error(`Status pesanan (${order.status}) tidak mengizinkan unggah bukti pembayaran.`);
      }

      // Check if payment already exists
      const [existingPay] = await connection.query(
        'SELECT id FROM payments WHERE order_id = ?',
        [orderId]
      );

      if (existingPay.length > 0) {
        await connection.query(`
          UPDATE payments
          SET bank = ?, amount = ?, proof_path = ?, status = 'pending', rejected_reason = NULL, updated_at = NOW()
          WHERE order_id = ?
        `, [bank, amount || order.total, proofPath, orderId]);
      } else {
        await connection.query(`
          INSERT INTO payments (order_id, bank, amount, proof_path, status)
          VALUES (?, ?, ?, ?, 'pending')
        `, [orderId, bank, amount || order.total, proofPath]);
      }

      // Update order status to Menunggu Verifikasi
      await connection.query(
        'UPDATE orders SET status = "Menunggu Verifikasi" WHERE id = ?',
        [orderId]
      );

      await connection.query(`
        INSERT INTO order_status_logs (order_id, status, note, user_id)
        VALUES (?, 'Menunggu Verifikasi', 'Pelanggan telah mengunggah bukti pembayaran transfer bank.', ?)
      `, [orderId, userId]);

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
   * Admin approves payment
   */
  async approvePayment(orderId, adminId) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [orders] = await connection.query(
        'SELECT id, code, status FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      // Update payment
      await connection.query(`
        UPDATE payments
        SET status = 'approved', verified_by = ?, verified_at = NOW()
        WHERE order_id = ?
      `, [adminId, orderId]);

      // Update order
      await connection.query(`
        UPDATE orders
        SET status = 'Diproses', paid_at = NOW()
        WHERE id = ?
      `, [orderId]);

      await connection.query(`
        INSERT INTO order_status_logs (order_id, status, note, user_id)
        VALUES (?, 'Diproses', 'Pembayaran telah diverifikasi oleh Admin. Pesanan sedang disiapkan.', ?)
      `, [orderId, adminId]);

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
   * Admin rejects payment with reason
   */
  async rejectPayment(orderId, adminId, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('Alasan penolakan pembayaran wajib diisi.');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [orders] = await connection.query(
        'SELECT id, code, status FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      // Update payment
      await connection.query(`
        UPDATE payments
        SET status = 'rejected', rejected_reason = ?, verified_by = ?, verified_at = NOW()
        WHERE order_id = ?
      `, [reason, adminId, orderId]);

      // Update order status
      await connection.query(`
        UPDATE orders
        SET status = 'Pembayaran Ditolak'
        WHERE id = ?
      `, [orderId]);

      await connection.query(`
        INSERT INTO order_status_logs (order_id, status, note, user_id)
        VALUES (?, 'Pembayaran Ditolak', ?, ?)
      `, [orderId, `Pembayaran ditolak: ${reason}. Silakan unggah bukti pembayaran yang valid.`, adminId]);

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

export const paymentService = new PaymentService();
export default paymentService;

