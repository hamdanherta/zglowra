import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Search, Menu, X, LogOut, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isSupplier } = useAuth();
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Close dropdown and drawer when route changes
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMouseEnterProfile = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setProfileDropdownOpen(true);
  };

  const handleMouseLeaveProfile = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setProfileDropdownOpen(false);
    }, 250);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produk?cari=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: 'Beranda', path: '/' },
    { label: 'Katalog Produk', path: '/produk' },
    { label: 'Tentang Kami', path: '/tentang' },
    { label: 'Kontak', path: '/kontak' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 bg-white ${
        isScrolled ? 'shadow-card' : ''
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 select-none group">
            <img
              src="/logo.png"
              alt="Logo ZGlowra"
              className="h-12 w-12 object-contain rounded-2xl transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-brand-text">
                <span className="text-brand-gold">Z</span>Glowra
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-brand-gold uppercase -mt-1">
                Zfree Glow
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'text-brand-text font-bold'
                      : 'text-brand-text-body hover:text-brand-text'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Search Box Desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center relative w-64"
          >
            <input
              type="text"
              placeholder="Cari body lotion, scrub..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-soft text-brand-text-body placeholder:text-brand-text-body/50 text-xs rounded-full py-2.5 pl-4 pr-10 focus:bg-white focus:shadow-focus-coral outline-none border-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-3 text-brand-text-body/60 hover:text-brand-text"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Wishlist */}
            <Link
              to="/akun/wishlist"
              className="w-10 h-10 rounded-full bg-brand-soft hover:bg-brand-coral-soft flex items-center justify-center text-brand-text-body hover:text-brand-text transition-colors"
              title="Wishlist Saya"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Icon */}
            <Link
              to="/keranjang"
              className="relative w-10 h-10 rounded-full bg-brand-soft hover:bg-brand-coral-soft flex items-center justify-center text-brand-text-body hover:text-brand-text transition-colors"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-text text-white text-[11px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-button animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile / Portal Link */}
            {user ? (
              <div
                ref={profileRef}
                className="relative"
                onMouseEnter={handleMouseEnterProfile}
                onMouseLeave={handleMouseLeaveProfile}
              >
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-brand-soft hover:bg-brand-coral-soft transition-colors cursor-pointer"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-brand-text text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-brand-text-body max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu Wrapper with 0-gap bridge */}
                <div
                  className={`absolute right-0 top-full pt-2 w-56 z-50 transition-all duration-200 ${
                    profileDropdownOpen
                      ? 'opacity-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 -translate-y-1 pointer-events-none'
                  }`}
                  onMouseEnter={handleMouseEnterProfile}
                  onMouseLeave={handleMouseLeaveProfile}
                >
                  <div className="bg-white rounded-card shadow-card-hover p-3">
                    <div className="px-3 py-2">
                      <p className="text-xs font-bold text-brand-text truncate">{user.name}</p>
                      <p className="text-[11px] text-brand-text-body/70 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-coral-soft text-brand-text uppercase">
                        {user.role}
                      </span>
                    </div>

                    <div className="my-1.5 h-px bg-brand-soft" />

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-text-body hover:bg-brand-soft hover:text-brand-text rounded-xl"
                      >
                        <Package className="w-4 h-4 text-brand-gold" />
                        Dashboard Admin
                      </Link>
                    )}

                    {isSupplier && (
                      <Link
                        to="/supplier"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-text-body hover:bg-brand-soft hover:text-brand-text rounded-xl"
                      >
                        <Package className="w-4 h-4 text-brand-gold" />
                        Portal Supplier
                      </Link>
                    )}

                    <Link
                      to="/akun/pesanan"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-text-body hover:bg-brand-soft hover:text-brand-text rounded-xl"
                    >
                      <Package className="w-4 h-4" />
                      Pesanan Saya
                    </Link>

                    <Link
                      to="/akun/profil"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-text-body hover:bg-brand-soft hover:text-brand-text rounded-xl"
                    >
                      <User className="w-4 h-4" />
                      Profil Akun
                    </Link>

                    <div className="my-1.5 h-px bg-brand-soft" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-danger hover:bg-brand-coral-soft rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/masuk"
                className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold text-white bg-brand-text rounded-full shadow-button hover:opacity-95 transition-all"
              >
                Masuk / Daftar
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center text-brand-text-body"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white px-6 pt-2 pb-6 shadow-card transition-all">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <input
              type="text"
              placeholder="Cari produk body care..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-soft text-brand-text-body text-sm rounded-full py-3 px-5 focus:bg-white focus:shadow-focus-coral outline-none border-none"
            />
          </form>

          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-brand-text-body hover:bg-brand-soft hover:text-brand-text"
              >
                {link.label}
              </Link>
            ))}

            {!user && (
              <Link
                to="/masuk"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 text-center py-3 bg-brand-text text-white rounded-full text-sm font-semibold shadow-button"
              >
                Masuk / Daftar Akun
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

