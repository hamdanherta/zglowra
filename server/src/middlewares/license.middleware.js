import licenseService from '../services/license.service.js';

/**
 * Middleware untuk memblokir seluruh request API saat aplikasi dalam status terkunci.
 */
export async function checkLicenseMiddleware(req, res, next) {
  // Abaikan pemeriksaan untuk endpoint status lisensi dan health check
  if (
    req.path === '/health' ||
    req.path === '/system/license-status' ||
    req.path.startsWith('/system/license')
  ) {
    return next();
  }

  try {
    const status = await licenseService.checkStatus();
    if (status.isLocked) {
      return res.status(423).json({
        success: false,
        locked: true,
        code: 'APP_LOCKED',
        title: status.title,
        message: status.message,
        contact: status.contact,
        timestamp: status.lastCheckedAt,
      });
    }
    next();
  } catch (err) {
    // Jika ada error internal tak terduga, izinkan request lewat agar tidak memutus server
    next();
  }
}
