import pool from '../database/db.js';
import orderService from '../services/order.service.js';
import paymentService from '../services/payment.service.js';
import supplierService from '../services/supplier.service.js';
import imageService from '../services/image.service.js';
import licenseService from '../services/license.service.js';
import sharp from 'sharp';

async function runTests() {
  console.log('==================================================');
  console.log('       ZGlowra Core Logic & Security Test        ');
  console.log('==================================================');

  try {
    // 1. ImageService WebP test
    console.log('[Test 1] Testing ImageService WebP conversion...');
    const testSvg = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#FF9F97"/></svg>';
    const testBuf = Buffer.from(testSvg);
    const imgRes = await imageService.store(testBuf, 'misc');
    if (!imgRes.path_original.endsWith('.webp') || !imgRes.path_medium.endsWith('.webp')) {
      throw new Error('ImageService did not output WebP files!');
    }
    console.log('  -> PASSED: ImageService converted and generated 3 WebP variants:', imgRes);
    await imageService.delete([imgRes.path_original, imgRes.path_medium, imgRes.path_thumb]);

    // 2. Stock locking & checkout test
    console.log('[Test 2] Testing transactional order checkout and stock locking...');
    const [custRows] = await pool.query("SELECT id FROM users WHERE role = 'customer' LIMIT 1");
    const testCustomerId = custRows[0].id;

    const [prodRows] = await pool.query("SELECT id, stock, name FROM products WHERE is_active = 1 AND stock >= 5 LIMIT 1");
    const testProd = prodRows[0];
    const initialStock = testProd.stock;

    const testOrder = await orderService.createOrder(testCustomerId, {
      items: [{ product_id: testProd.id, qty: 2 }],
      addressSnapshot: { penerima: 'Tester', telepon: '0811111111', alamat_lengkap: 'Jl. Uji Coba' },
      courier: 'J&T Express',
      shippingCost: 14000,
      paymentMethod: 'Transfer Bank BCA',
    });

    console.log(`  -> Order created: ${testOrder.code}, Total: Rp ${testOrder.total}`);

    // Verify stock was decremented
    const [afterStockRows] = await pool.query('SELECT stock FROM products WHERE id = ?', [testProd.id]);
    const afterStock = afterStockRows[0].stock;
    if (afterStock !== initialStock - 2) {
      throw new Error(`Stock mismatch! Expected ${initialStock - 2}, got ${afterStock}`);
    }
    console.log(`  -> PASSED: Stock decremented correctly from ${initialStock} to ${afterStock}.`);

    // 3. Payment submission & verification
    console.log('[Test 3] Testing payment submission and approval...');
    const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = adminRows[0].id;

    await paymentService.submitPayment(testOrder.id, testCustomerId, {
      bank: 'BCA',
      amount: testOrder.total,
      proofPath: '/uploads/payments/test-proof.webp',
    });

    const [orderBeforeApprove] = await pool.query('SELECT status FROM orders WHERE id = ?', [testOrder.id]);
    if (orderBeforeApprove[0].status !== 'Menunggu Verifikasi') {
      throw new Error(`Expected Menunggu Verifikasi, got ${orderBeforeApprove[0].status}`);
    }

    await paymentService.approvePayment(testOrder.id, adminId);
    const [orderAfterApprove] = await pool.query('SELECT status FROM orders WHERE id = ?', [testOrder.id]);
    if (orderAfterApprove[0].status !== 'Diproses') {
      throw new Error(`Expected Diproses, got ${orderAfterApprove[0].status}`);
    }
    console.log('  -> PASSED: Payment submitted and verified successfully to "Diproses".');

    // 4. Supplier procurement & stock receipt
    console.log('[Test 4] Testing supplier purchase order and stock receipt...');
    const [supRows] = await pool.query('SELECT id, user_id FROM suppliers LIMIT 1');
    const sup = supRows[0];

    const po = await supplierService.createPurchase(adminId, {
      supplierId: sup.id,
      items: [{ product_id: testProd.id, qty: 10, cost_price: 50000 }],
      note: 'Restock uji coba',
    });
    console.log(`  -> PO created: ${po.code}`);

    await supplierService.updateStatusBySupplier(po.id, sup.user_id, { action: 'confirm', note: 'Siap kirim' });
    await supplierService.shipPurchase(po.id, sup.user_id, { courier: 'JNE Trucking', trackingNumber: 'TRK-TEST-123' });

    // Mark received by admin
    const stockBeforeReceive = (await pool.query('SELECT stock FROM products WHERE id = ?', [testProd.id]))[0][0].stock;
    await supplierService.receivePurchase(po.id, adminId);
    const stockAfterReceive = (await pool.query('SELECT stock FROM products WHERE id = ?', [testProd.id]))[0][0].stock;

    if (stockAfterReceive !== stockBeforeReceive + 10) {
      throw new Error(`Stock increment mismatch! Expected ${stockBeforeReceive + 10}, got ${stockAfterReceive}`);
    }
    console.log(`  -> PASSED: Supplier PO flow complete, stock incremented from ${stockBeforeReceive} to ${stockAfterReceive}.`);

    // 5. Remote License Service Test
    console.log('[Test 5] Testing Remote License Lock parsing (CSV & JSON)...');
    // Test CSV line parsing
    const parsedCsvCols = licenseService.parseCsvLine('"KUNCI","Aplikasi telah ditangguhkan sementara. Hubungi 081234567890.","6281234567890","Aplikasi Terkunci"');
    if (parsedCsvCols[0] !== 'KUNCI' || !parsedCsvCols[1].includes('ditangguhkan') || parsedCsvCols[2] !== '6281234567890') {
      throw new Error('CSV parsing failed for license lock format!');
    }
    console.log('  -> PASSED: CSV parser handled quotes, status and contact parameters perfectly.');

    // Test disabled fallback
    licenseService.enabled = false;
    const disabledStatus = await licenseService.checkStatus(true);
    if (disabledStatus.isLocked !== false) {
      throw new Error('Disabled license check should never lock the app!');
    }
    console.log('  -> PASSED: Disabled check correctly defaults to isLocked = false.');

    console.log('==================================================');
    console.log('      ALL 5 CORE LOGIC TESTS PASSED CLEANLY!      ');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test FAILED:', err);
    process.exit(1);
  }
}

runTests();

