import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db.js';
import { authenticateToken, JWT_SECRET } from '../middlewares/auth.middleware.js';

const router = Router();

// Register Customer
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan kata sandi wajib diisi.' });
    }

    // Check existing email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, "customer")',
      [name, email.toLowerCase().trim(), phone || null, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email: email.toLowerCase().trim(), role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil. Selamat datang di ZGlowra!',
      token,
      user: {
        id: result.insertId,
        name,
        email: email.toLowerCase().trim(),
        phone,
        role: 'customer',
        avatar: null,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mendaftar.' });
  }
});

// Login (Supports Customer, Admin, Supplier)
router.post('/login', async (req, res) => {
  try {
    const { email, password, requiredRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi.' });
    }

    const [users] = await pool.query(
      'SELECT id, name, email, phone, password, role, avatar, is_active FROM users WHERE email = ? AND deleted_at IS NULL',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi tidak sesuai.' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.' });
    }

    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).json({ success: false, message: `Halaman ini hanya untuk pengguna dengan peran ${requiredRole}.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi tidak sesuai.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Selamat datang kembali, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// Get current profile
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama tidak boleh kosong.' });
    }

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: 'Kata sandi saat ini wajib diisi untuk mengubah kata sandi.' });
      }

      const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
      const currentHash = rows[0]?.password;
      const isMatch = await bcrypt.compare(oldPassword, currentHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Kata sandi saat ini tidak cocok.' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?', [name, phone || null, newHash, userId]);
    } else {
      await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, userId]);
    }

    const [updated] = await pool.query('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [userId]);

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: updated[0],
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
});

export default router;

