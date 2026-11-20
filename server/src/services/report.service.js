import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import pool from '../database/db.js';

class ReportService {
  /**
   * Fetch Sales Data with filters
   */
  async getSalesReport({ startDate, endDate, status }) {
    let sql = `
      SELECT o.id, o.code, o.total, o.subtotal, o.shipping_cost, o.discount,
             o.status, o.created_at, o.paid_at, u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND DATE(o.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATE(o.created_at) <= ?';
      params.push(endDate);
    }
    if (status && status !== 'Semua') {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.query(sql, params);

    // Calculate summaries
    let totalRevenue = 0;
    let totalOrders = rows.length;
    let successfulOrders = 0;

    for (const r of rows) {
      if (['Diproses', 'Dikirim', 'Selesai'].includes(r.status)) {
        totalRevenue += parseFloat(r.total);
        successfulOrders++;
      }
    }

    return {
      summary: {
        totalRevenue,
        totalOrders,
        successfulOrders,
      },
      orders: rows,
    };
  }

  /**
   * Fetch Purchase Orders Data with filters
   */
  async getPurchasesReport({ startDate, endDate, status }) {
    let sql = `
      SELECT p.id, p.code, p.total, p.status, p.created_at, p.shipped_at, p.received_at,
             s.company_name as supplier_name, u.name as admin_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN users u ON p.admin_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND DATE(p.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATE(p.created_at) <= ?';
      params.push(endDate);
    }
    if (status && status !== 'Semua') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(sql, params);

    let totalExpense = 0;
    for (const r of rows) {
      if (['Dikirim', 'Diterima'].includes(r.status)) {
        totalExpense += parseFloat(r.total);
      }
    }

    return {
      summary: {
        totalExpense,
        totalPurchases: rows.length,
      },
      purchases: rows,
    };
  }

  /**
   * Export Sales Report to Excel
   */
  async exportSalesExcel(data, res) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Penjualan');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Kode Pesanan', key: 'code', width: 22 },
      { header: 'Tanggal', key: 'date', width: 16 },
      { header: 'Pelanggan', key: 'customer', width: 24 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Subtotal (Rp)', key: 'subtotal', width: 16 },
      { header: 'Ongkir (Rp)', key: 'shipping', width: 14 },
      { header: 'Diskon (Rp)', key: 'discount', width: 14 },
      { header: 'Total (Rp)', key: 'total', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDD695B' },
    };

    data.orders.forEach((ord, idx) => {
      const dateStr = new Date(ord.created_at).toLocaleDateString('id-ID');
      sheet.addRow({
        no: idx + 1,
        code: ord.code,
        date: dateStr,
        customer: ord.customer_name,
        status: ord.status,
        subtotal: parseFloat(ord.subtotal),
        shipping: parseFloat(ord.shipping_cost),
        discount: parseFloat(ord.discount),
        total: parseFloat(ord.total),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Laporan-Penjualan-ZGlowra.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export Sales Report to PDF
   */
  exportSalesPDF(data, res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Laporan-Penjualan-ZGlowra.pdf"');

    doc.pipe(res);

    // Header
    doc.fillColor('#DD695B').fontSize(20).text('ZGlowra - Laporan Penjualan', { align: 'center' });
    doc.fillColor('#D4AF37').fontSize(12).text('Zfree Glow Official Store', { align: 'center' });
    doc.moveDown(1.5);

    // Summary box
    doc.fillColor('#6B4A47').fontSize(11);
    doc.text(`Total Pesanan: ${data.summary.totalOrders} transaksi`);
    doc.text(`Pesanan Sukses: ${data.summary.successfulOrders} transaksi`);
    doc.text(`Total Pendapatan: Rp ${Math.round(data.summary.totalRevenue).toLocaleString('id-ID')}`);
    doc.moveDown(1);

    // Table Header
    doc.fontSize(10).fillColor('#DD695B');
    doc.text('No   Kode Pesanan         Tanggal       Pelanggan             Status               Total', 40);
    doc.strokeColor('#DD695B').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fillColor('#6B4A47').fontSize(9);
    data.orders.slice(0, 35).forEach((ord, i) => {
      const d = new Date(ord.created_at).toLocaleDateString('id-ID');
      const name = (ord.customer_name || '').substring(0, 16);
      const totalStr = `Rp ${Math.round(ord.total).toLocaleString('id-ID')}`;
      doc.text(
        `${String(i + 1).padEnd(4)} ${ord.code.padEnd(20)} ${d.padEnd(13)} ${name.padEnd(20)} ${(ord.status || '').padEnd(18)} ${totalStr}`
      );
    });

    doc.end();
  }

  /**
   * Export Purchases Report to Excel
   */
  async exportPurchasesExcel(data, res) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Pembelian');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Kode PO', key: 'code', width: 22 },
      { header: 'Tanggal', key: 'date', width: 16 },
      { header: 'Supplier', key: 'supplier', width: 28 },
      { header: 'Admin', key: 'admin', width: 20 },
      { header: 'Status', key: 'status', width: 22 },
      { header: 'Total Biaya (Rp)', key: 'total', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDD695B' },
    };

    data.purchases.forEach((po, idx) => {
      const dateStr = new Date(po.created_at).toLocaleDateString('id-ID');
      sheet.addRow({
        no: idx + 1,
        code: po.code,
        date: dateStr,
        supplier: po.supplier_name,
        admin: po.admin_name,
        status: po.status,
        total: parseFloat(po.total),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Laporan-Pembelian-ZGlowra.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export Purchases Report to PDF
   */
  exportPurchasesPDF(data, res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Laporan-Pembelian-ZGlowra.pdf"');

    doc.pipe(res);

    doc.fillColor('#DD695B').fontSize(20).text('ZGlowra - Laporan Pembelian Stok', { align: 'center' });
    doc.fillColor('#D4AF37').fontSize(12).text('Zfree Glow Official Store', { align: 'center' });
    doc.moveDown(1.5);

    doc.fillColor('#6B4A47').fontSize(11);
    doc.text(`Total Pembelian PO: ${data.summary.totalPurchases} transaksi`);
    doc.text(`Total Pengeluaran: Rp ${Math.round(data.summary.totalExpense).toLocaleString('id-ID')}`);
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#DD695B');
    doc.text('No   Kode PO               Tanggal       Supplier               Status               Total', 40);
    doc.strokeColor('#DD695B').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fillColor('#6B4A47').fontSize(9);
    data.purchases.slice(0, 35).forEach((po, i) => {
      const d = new Date(po.created_at).toLocaleDateString('id-ID');
      const sup = (po.supplier_name || '').substring(0, 18);
      const totalStr = `Rp ${Math.round(po.total).toLocaleString('id-ID')}`;
      doc.text(
        `${String(i + 1).padEnd(4)} ${po.code.padEnd(20)} ${d.padEnd(13)} ${sup.padEnd(22)} ${(po.status || '').padEnd(18)} ${totalStr}`
      );
    });

    doc.end();
  }
}

export const reportService = new ReportService();
export default reportService;

