import express from 'express';
import licenseService from '../services/license.service.js';

const router = express.Router();

/**
 * Endpoint publik untuk mengecek status lisensi aplikasi
 * Contoh pemanggilan: GET /api/system/license-status?force=true
 */
router.get('/license-status', async (req, res) => {
  const force = req.query.force === 'true' || req.query.force === '1';
  try {
    const status = await licenseService.checkStatus(force);
    res.json({
      success: true,
      ...status,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status lisensi: ' + err.message,
    });
  }
});

export default router;
