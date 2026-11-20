import jwt from 'jsonwebtoken';
import pool from '../database/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'zglowra_super_secret_jwt_key_2026_bodycare';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user data
    const [users] = await pool.query(
      'SELECT id, name, email, phone, role, avatar, is_active FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.id]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(403).json({ success: false, message: 'Akun tidak aktif atau tidak ditemukan.' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Silakan masuk terlebih dahulu.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Fitur ini khusus untuk peran: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

