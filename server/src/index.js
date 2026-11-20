import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import customerRoutes from './routes/customer.routes.js';
import adminRoutes from './routes/admin.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import systemRoutes from './routes/system.routes.js';
import { checkLicenseMiddleware } from './middlewares/license.middleware.js';
import orderService from './services/order.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Rate limit on login/register to satisfy Security requirement
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { success: false, message: 'Terlalu banyak percobaan. Silakan coba lagi beberapa saat kemudian.' },
});

// System / License Status Check (Always accessible)
app.use('/api/system', systemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'ZGlowra API', timestamp: new Date().toISOString() });
});

// Remote License Lock Middleware (Blocks API requests when locked via Google Sheets)
app.use(checkLicenseMiddleware);

// Application Business Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', publicRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/supplier', supplierRoutes);

// Periodic background check to cancel expired unpaid orders (every 5 minutes)
setInterval(() => {
  orderService.cancelExpiredOrders().catch(err => {
    console.error('Error running auto-cancel job:', err.message);
  });
}, 5 * 60 * 1000);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ZGlowra Backend] Server berjalan di http://localhost:${PORT}`);
  // Run initial expire check on startup
  orderService.cancelExpiredOrders().catch(() => {});
});

