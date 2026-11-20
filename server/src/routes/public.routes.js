import { Router } from 'express';
import pool from '../database/db.js';

const router = Router();

// Catalog products
router.get('/products', async (req, res) => {
  try {
    const {
      search = '',
      kategori = '',
      sort = 'terbaru',
      min_price,
      max_price,
      page = 1,
      limit = 12,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let whereClause = 'WHERE p.is_active = 1 AND p.deleted_at IS NULL';

    if (search.trim()) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    if (kategori) {
      whereClause += ' AND c.slug = ?';
      params.push(kategori);
    }

    if (min_price) {
      whereClause += ' AND (COALESCE(p.discount_price, p.price) >= ?)';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      whereClause += ' AND (COALESCE(p.discount_price, p.price) <= ?)';
      params.push(parseFloat(max_price));
    }

    // Sort mapping
    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'terlaris') orderBy = 'ORDER BY p.sold_count DESC';
    else if (sort === 'termurah') orderBy = 'ORDER BY COALESCE(p.discount_price, p.price) ASC';
    else if (sort === 'termahal') orderBy = 'ORDER BY COALESCE(p.discount_price, p.price) DESC';
    else if (sort === 'a-z') orderBy = 'ORDER BY p.name ASC';

    // Count total
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Fetch items with primary image
    const dataSql = `
      SELECT p.id, p.category_id, p.name, p.slug, p.sku, p.description,
             p.price, p.discount_price, p.stock, p.weight_gram, p.is_featured, p.sold_count,
             c.name as category_name, c.slug as category_slug,
             img.path_medium, img.path_thumb,
             (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.is_visible = 1) as rating_avg,
             (SELECT COUNT(r.id) FROM reviews r WHERE r.product_id = p.id AND r.is_visible = 1) as review_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [products] = await pool.query(dataSql, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Fetch products error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat produk.' });
  }
});

// Featured & Best Sellers for homepage
router.get('/products/featured', async (req, res) => {
  try {
    const [featured] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.stock, p.sold_count,
             c.name as category_name, c.slug as category_slug,
             img.path_medium, img.path_thumb,
             (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.is_visible = 1) as rating_avg
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE p.is_active = 1 AND p.is_featured = 1 AND p.deleted_at IS NULL
      ORDER BY p.sold_count DESC
      LIMIT 8
    `);

    const [bestSellers] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.stock, p.sold_count,
             c.name as category_name, c.slug as category_slug,
             img.path_medium, img.path_thumb,
             (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.is_visible = 1) as rating_avg
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE p.is_active = 1 AND p.deleted_at IS NULL
      ORDER BY p.sold_count DESC
      LIMIT 8
    `);

    return res.json({
      success: true,
      featured,
      bestSellers,
    });
  } catch (err) {
    console.error('Featured error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat produk unggulan.' });
  }
});

// Single Product detail by slug
router.get('/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.is_visible = 1) as rating_avg,
             (SELECT COUNT(r.id) FROM reviews r WHERE r.product_id = p.id AND r.is_visible = 1) as review_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_active = 1 AND p.deleted_at IS NULL
    `, [slug]);

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    const product = products[0];

    // Images
    const [images] = await pool.query(`
      SELECT id, path_original, path_medium, path_thumb, is_primary, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, sort_order ASC
    `, [product.id]);

    // Reviews
    const [reviews] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_visible = 1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [product.id]);

    // Related products (same category)
    const [related] = await pool.query(`
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.stock,
             c.name as category_name,
             img.path_medium, img.path_thumb,
             (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.is_visible = 1) as rating_avg
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images img ON p.id = img.product_id AND img.is_primary = 1
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1 AND p.deleted_at IS NULL
      LIMIT 4
    `, [product.category_id, product.id]);

    return res.json({
      success: true,
      product: {
        ...product,
        images,
        reviews,
        related,
      },
    });
  } catch (err) {
    console.error('Product detail error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail produk.' });
  }
});

// Categories list
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1 AND p.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    return res.json({ success: true, categories });
  } catch (err) {
    console.error('Categories error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat kategori.' });
  }
});

// Banners
router.get('/banners', async (req, res) => {
  try {
    const [banners] = await pool.query(
      'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    return res.json({ success: true, banners });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat banner.' });
  }
});

// Testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const [testimonials] = await pool.query(
      'SELECT * FROM testimonials WHERE is_active = 1 ORDER BY id DESC'
    );
    return res.json({ success: true, testimonials });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat testimoni.' });
  }
});

// Static pages
router.get('/pages/:slug', async (req, res) => {
  try {
    const [pages] = await pool.query(
      'SELECT slug, title, content FROM pages WHERE slug = ?',
      [req.params.slug]
    );
    if (pages.length === 0) {
      return res.status(404).json({ success: false, message: 'Halaman tidak ditemukan.' });
    }
    return res.json({ success: true, page: pages[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat halaman.' });
  }
});

// Store Settings
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT `key`, value FROM settings');
    const map = {};
    for (const s of settings) {
      try {
        map[s.key] = JSON.parse(s.value);
      } catch {
        map[s.key] = s.value;
      }
    }
    return res.json({ success: true, settings: map });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat pengaturan toko.' });
  }
});

// Validate Voucher
router.post('/vouchers/check', async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Kode voucher wajib diisi.' });
    }

    const [vouchers] = await pool.query(`
      SELECT * FROM vouchers
      WHERE code = ? AND is_active = 1 AND quota > 0
        AND (starts_at IS NULL OR starts_at <= CURDATE())
        AND (ends_at IS NULL OR ends_at >= CURDATE())
    `, [code.toUpperCase().trim()]);

    if (vouchers.length === 0) {
      return res.status(400).json({ success: false, message: 'Kode voucher tidak valid atau telah habis.' });
    }

    const v = vouchers[0];
    const sub = parseFloat(subtotal);
    if (sub < parseFloat(v.min_purchase)) {
      return res.status(400).json({
        success: false,
        message: `Minimal belanja untuk voucher ini adalah Rp ${Math.round(v.min_purchase).toLocaleString('id-ID')}.`
      });
    }

    let discount = 0;
    if (v.type === 'percent') {
      discount = (sub * parseFloat(v.value)) / 100;
    } else {
      discount = parseFloat(v.value);
    }
    if (discount > sub) discount = sub;

    return res.json({
      success: true,
      voucher: {
        id: v.id,
        code: v.code,
        type: v.type,
        value: v.value,
        discount,
      },
      message: `Voucher ${v.code} berhasil digunakan! Hemat Rp ${Math.round(discount).toLocaleString('id-ID')}.`,
    });
  } catch (err) {
    console.error('Voucher check error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memvalidasi voucher.' });
  }
});

export default router;

