import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Grid, ShoppingBag, CheckCircle, Truck,
  BarChart3, Users, Factory, Ticket, MessageSquare, Settings, LogOut,
  ExternalLink, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'sonner';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/masuk');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
    { label: 'Kelola Produk', path: '/admin/produk', icon: <Package className="w-4 h-4" /> },
    { label: 'Kategori', path: '/admin/kategori', icon: <Grid className="w-4 h-4" /> },
    { label: 'Pesanan Pelanggan', path: '/admin/pesanan', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Verifikasi Pembayaran', path: '/admin/verifikasi', icon: <CheckCircle className="w-4 h-4" /> },
    { label: 'Pembelian Stok (PO)', path: '/admin/pembelian', icon: <Truck className="w-4 h-4" /> },
    { label: 'Laporan Penjualan', path: '/admin/laporan-penjualan', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Laporan Pembelian', path: '/admin/laporan-pembelian', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Data Pelanggan', path: '/admin/pelanggan', icon: <Users className="w-4 h-4" /> },
    { label: 'Data Supplier', path: '/admin/supplier', icon: <Factory className="w-4 h-4" /> },
    { label: 'Voucher & Promo', path: '/admin/voucher', icon: <Ticket className="w-4 h-4" /> },
    { label: 'Moderasi Ulasan', path: '/admin/ulasan', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Pengaturan Toko', path: '/admin/pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-brand-soft flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-card z-20 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3">
          <img src="/logo.png" alt="Logo ZGlowra" className="w-10 h-10 object-contain rounded-xl" />
          <div>
            <h1 className="font-serif text-xl font-bold text-brand-text">
              <span className="text-brand-gold">Z</span>Glowra
            </h1>
            <span className="text-[10px] font-bold tracking-wider text-brand-gold uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-coral-soft text-brand-text font-bold shadow-sm'
                    : 'text-brand-text-body hover:bg-brand-soft hover:text-brand-text'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 flex flex-col gap-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-brand-text-body hover:bg-brand-soft rounded-2xl"
          >
            <ExternalLink className="w-4 h-4 text-brand-gold" />
            Lihat Toko Publik
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-danger hover:bg-brand-coral-soft rounded-2xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-serif font-bold text-brand-text text-lg">Admin ZGlowra</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-brand-soft text-brand-text-body"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="md:hidden bg-white p-4 shadow-card">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold ${
                      isActive
                        ? 'bg-brand-coral-soft text-brand-text font-bold'
                        : 'text-brand-text-body hover:bg-brand-soft'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-danger"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </nav>
          </div>
        )}

        {/* Top Header desktop */}
        <header className="hidden md:flex items-center justify-between bg-white px-8 py-4 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
              Panel Pengelola Toko
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-text text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-brand-text leading-tight">{user?.name}</p>
                <p className="text-[10px] text-brand-text-body/70">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1440px] w-full">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default AdminLayout;

