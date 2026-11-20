import pool from '../database/db.js';

class OrderService {
  /**
   * Generates a unique order code with format ZG-YYYYMMDD-XXXX
   */
  generateOrderCode() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ZG-${y}${m}${d}-${rand}`;
  }

  /**
   * Creates an order with database transaction and row-level locking to prevent negative stock
   */
  async createOrder(userId, { items, addressSnapshot, courier, shippingCost, voucherCode, paymentMethod, note }) {
    if (!items || items.length === 0) {
      throw new Error('Keranjang belanja kosong.');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let subtotal = 0;
      const orderItemsToInsert = [];

      for (const item of items) {
        // Lock the product row with FOR UPDATE
        const [prodRows] = await connection.query(
          'SELECT id, name, price, discount_price, stock FROM products WHERE id = ? AND is_active = 1 FOR UPDATE',
          [item.product_id]
        );

        if (prodRows.length === 0) {
          throw new Error(`Produk dengan ID #${item.product_id} tidak ditemukan atau nonaktif.`);
        }

        const product = prodRows[0];
        const requestedQty = parseInt(item.qty, 10);

        if (product.stock < requestedQty) {
          throw new Error(`Stok produk "${product.name}" tidak mencukupi (tersisa ${product.stock} pcs).`);
        }

        const finalPrice = product.discount_price !== null && product.discount_price > 0
          ? parseFloat(product.discount_price)
          : parseFloat(product.price);

        const itemSubtotal = finalPrice * requestedQty;
        subtotal += itemSubtotal;

        // Decrement stock
        const newBalance = product.stock - requestedQty;
        await connection.query(
          'UPDATE products SET stock = ?, sold_count = sold_count + ? WHERE id = ?',
          [newBalance, requestedQty, product.id]
        );

        orderItemsToInsert.push({
          product_id: product.id,
          name_snapshot: product.name,
          price_snapshot: finalPrice,
          qty: requestedQty,
          subtotal: itemSubtotal,
          newBalance,
        });
      }

      // Handle Voucher
      let discount = 0;
      let voucherId = null;

      if (voucherCode) {
        const [vouchers] = await connection.query(
          'SELECT * FROM vouchers WHERE code = ? AND is_active = 1 AND quota > 0 AND (starts_at IS NULL OR starts_at <= CURDATE()) AND (ends_at IS NULL OR ends_at >= CURDATE()) FOR UPDATE',
          [voucherCode.toUpperCase().trim()]
        );

        if (vouchers.length > 0) {
          const v = vouchers[0];
          if (subtotal >= parseFloat(v.min_purchase)) {
            voucherId = v.id;
            if (v.type === 'percent') {
              discount = (subtotal * parseFloat(v.value)) / 100;
            } else {
              discount = parseFloat(v.value);
            }
            if (discount > subtotal) discount = subtotal;

            // Decrement voucher quota
            await connection.query('UPDATE vouchers SET quota = quota - 1 WHERE id = ?', [v.id]);
          }
        }
      }

      const shipCost = parseFloat(shippingCost || 0);
      const total = subtotal - discount + shipCost;
      const orderCode = this.generateOrderCode();

      // Expired in 24 hours
      const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [orderRes] = await connection.query(`
        INSERT INTO orders (
          code, user_id, address_snapshot, courier, shipping_cost, subtotal,
          discount, total, voucher_id, status, payment_method, note, expired_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Pembayaran', ?, ?, ?)
      `, [
        orderCode,
        userId,
        JSON.stringify(addressSnapshot),
        courier || 'J&T Express',
        shipCost,
        subtotal,
        discount,
        total,
        voucherId,
        paymentMethod || 'Transfer Bank',
        note || null,
        expiredAt
      ]);

      const orderId = orderRes.insertId;

      // Insert order items & log stock movement
      for (const oi of orderItemsToInsert) {
        await connection.query(`
          INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, qty, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [orderId, oi.product_id, oi.name_snapshot, oi.price_snapshot, oi.qty, oi.subtotal]);

        await connection.query(`
          INSERT INTO stock_movements (product_id, type, qty, balance, reference_type, reference_id, note)
          VALUES (?, 'penjualan', ?, ?, 'order', ?, 'Pengurangan stok untuk pesanan ${orderCode}')
        `, [oi.product_id, -oi.qty, oi.newBalance, orderId]);

        // Remove from user's cart
        await connection.query(
          'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
          [userId, oi.product_id]
        );
      }

      // Log initial order status
      await connection.query(`
        INSERT INTO order_status_logs (order_id, status, note, user_id)
        VALUES (?, 'Menunggu Pembayaran', 'Pesanan dibuat. Silakan lakukan pembayaran dalam 24 jam.', ?)
      `, [orderId, userId]);

      await connection.commit();

      return {
        id: orderId,
        code: orderCode,
        subtotal,
        discount,
        shipping_cost: shipCost,
        total,
        expired_at: expiredAt,
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Cancel an order and safely return the reserved stock
   */
  async cancelOrder(orderId, reason = 'Pesanan dibatalkan', userId = null) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [orders] = await connection.query(
        'SELECT id, code, status, voucher_id FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      const order = orders[0];
      if (['Dibatalkan', 'Selesai'].includes(order.status)) {
        throw new Error(`Pesanan dengan status "${order.status}" tidak dapat dibatalkan.`);
      }

      // Restore stock for items
      const [items] = await connection.query(
        'SELECT product_id, qty FROM order_items WHERE order_id = ?',
        [orderId]
      );

      for (const item of items) {
        const [prods] = await connection.query(
          'SELECT id, stock FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );
        if (prods.length > 0) {
          const newBal = prods[0].stock + item.qty;
          await connection.query(
            'UPDATE products SET stock = ?, sold_count = GREATEST(0, sold_count - ?) WHERE id = ?',
            [newBal, item.qty, item.product_id]
          );

          await connection.query(`
            INSERT INTO stock_movements (product_id, type, qty, balance, reference_type, reference_id, note)
            VALUES (?, 'pembatalan', ?, ?, 'order', ?, 'Pengembalian stok pesanan ${order.code} dibatalkan')
          `, [item.product_id, item.qty, newBal, orderId]);
        }
      }

      // Restore voucher quota if applicable
      if (order.voucher_id) {
        await connection.query('UPDATE vouchers SET quota = quota + 1 WHERE id = ?', [order.voucher_id]);
      }

      // Update order status
      await connection.query(
        'UPDATE orders SET status = "Dibatalkan" WHERE id = ?',
        [orderId]
      );

      await connection.query(`
        INSERT INTO order_status_logs (order_id, status, note, user_id)
        VALUES (?, 'Dibatalkan', ?, ?)
      `, [orderId, reason, userId]);

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
   * Auto-cancels expired unpaid orders
   */
  async cancelExpiredOrders() {
    const [expired] = await pool.query(`
      SELECT id, code FROM orders
      WHERE status = 'Menunggu Pembayaran' AND expired_at IS NOT NULL AND expired_at < NOW()
    `);

    for (const ord of expired) {
      try {
        await this.cancelOrder(ord.id, 'Dibatalkan otomatis oleh sistem karena melewati batas waktu pembayaran 24 jam.');
        console.log(`[Auto-Expire] Order ${ord.code} cancelled.`);
      } catch (err) {
        console.error(`Error auto-cancelling order ${ord.code}:`, err.message);
      }
    }
  }
}

export const orderService = new OrderService();
export default orderService;

