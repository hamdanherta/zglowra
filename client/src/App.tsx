import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LicenseProvider } from './context/LicenseContext';
import LicenseLockScreen from './components/common/LicenseLockScreen';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import SupplierLayout from './components/layout/SupplierLayout';

// Public Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentInstructionPage from './pages/PaymentInstructionPage';
import OrdersHistoryPage from './pages/OrdersHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import StaticPage from './pages/StaticPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminVerification from './pages/admin/AdminVerification';
import AdminPurchases from './pages/admin/AdminPurchases';
import AdminReports from './pages/admin/AdminReports';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminSettings from './pages/admin/AdminSettings';

// Supplier Pages
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierPurchases from './pages/supplier/SupplierPurchases';
import SupplierProducts from './pages/supplier/SupplierProducts';
import SupplierProfile from './pages/supplier/SupplierProfile';

// Route Guards
const ProtectedAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/masuk?redirect=/admin" replace />;
  return <>{children}</>;
};

const ProtectedSupplier: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'supplier') return <Navigate to="/masuk?redirect=/supplier" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LicenseProvider>
        <AuthProvider>
          <CartProvider>
            <LicenseLockScreen />
            <Routes>
            {/* PUBLIC & CUSTOMER ROUTES */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="produk" element={<CatalogPage />} />
              <Route path="produk/:slug" element={<ProductDetailPage />} />
              <Route path="keranjang" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="pesanan/:code/pembayaran" element={<PaymentInstructionPage />} />
              <Route path="akun/pesanan" element={<OrdersHistoryPage />} />
              <Route path="akun/pesanan/:code" element={<OrderDetailPage />} />
              <Route path="akun/riwayat" element={<OrdersHistoryPage />} />
              <Route path="akun/profil" element={<ProfilePage />} />
              <Route path="akun/wishlist" element={<WishlistPage />} />
              <Route path="tentang" element={<AboutPage />} />
              <Route path="kontak" element={<ContactPage />} />
              <Route path="faq" element={<StaticPage />} />
              <Route path="syarat-ketentuan" element={<StaticPage />} />
              <Route path="kebijakan-privasi" element={<StaticPage />} />
              <Route path="masuk" element={<LoginPage />} />
              <Route path="daftar" element={<RegisterPage />} />
              <Route path="admin/login" element={<LoginPage />} />
            </Route>

            {/* ADMIN ROUTES */}
            <Route
              path="/admin"
              element={
                <ProtectedAdmin>
                  <AdminLayout />
                </ProtectedAdmin>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="produk" element={<AdminProducts />} />
              <Route path="kategori" element={<AdminCategories />} />
              <Route path="pesanan" element={<AdminOrders />} />
              <Route path="verifikasi" element={<AdminVerification />} />
              <Route path="pembelian" element={<AdminPurchases />} />
              <Route path="laporan-penjualan" element={<AdminReports type="sales" />} />
              <Route path="laporan-pembelian" element={<AdminReports type="purchases" />} />
              <Route path="pelanggan" element={<AdminCustomers />} />
              <Route path="supplier" element={<AdminSuppliers />} />
              <Route path="voucher" element={<AdminVouchers />} />
              <Route path="ulasan" element={<AdminReviews />} />
              <Route path="pengaturan" element={<AdminSettings />} />
            </Route>

            {/* SUPPLIER ROUTES */}
            <Route
              path="/supplier"
              element={
                <ProtectedSupplier>
                  <SupplierLayout />
                </ProtectedSupplier>
              }
            >
              <Route index element={<SupplierDashboard />} />
              <Route path="pesanan" element={<SupplierPurchases />} />
              <Route path="produk" element={<SupplierProducts />} />
              <Route path="profil" element={<SupplierProfile />} />
            </Route>

            {/* 404 CATCH-ALL */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-brand-soft text-center">
                  <h1 className="font-serif text-6xl font-bold text-brand-text mb-2">404</h1>
                  <h2 className="font-serif text-2xl font-bold text-brand-text-body mb-4">Halaman Tidak Ditemukan</h2>
                  <p className="text-xs text-brand-text-body/70 max-w-sm mb-6">
                    Halaman yang Anda tuju mungkin telah dipindahkan atau tautan yang Anda ikuti sudah tidak berlaku.
                  </p>
                  <a href="/" className="px-8 py-3.5 bg-brand-text text-white rounded-full font-bold text-xs shadow-button">
                    Kembali ke Beranda
                  </a>
                </div>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </LicenseProvider>
  </BrowserRouter>
  );
};

export default App;

