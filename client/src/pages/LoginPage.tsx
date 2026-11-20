import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryRedirect = new URLSearchParams(location.search).get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan kata sandi wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        login(data.user, data.token);
        toast.success(data.message || 'Berhasil masuk!');

        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'supplier') {
          navigate('/supplier');
        } else {
          navigate(queryRedirect);
        }
      } else {
        toast.error(data.message || 'Email atau kata sandi salah');
      }
    } catch {
      toast.error('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-card shadow-card-hover overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Column (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-coral-soft to-brand-soft p-10 flex-col justify-between text-left">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
            <span className="font-serif text-2xl font-bold text-brand-text">
              <span className="text-brand-gold">Z</span>Glowra
            </span>
          </Link>

          <div>
            <h2 className="font-serif text-3xl font-bold text-brand-text leading-snug">
              Kemewahan Perawatan Kulit Alami
            </h2>
            <div className="w-12 h-1 bg-brand-gold rounded-full my-3" />
            <p className="text-xs text-brand-text-body leading-relaxed">
              Masuk ke akun Anda untuk mengelola pesanan, melihat status pengiriman, serta menikmati penawaran eksklusif dari Zfree Glow.
            </p>
          </div>

          <p className="text-[11px] text-brand-text-body/60">
            &copy; 2026 ZGlowra. Terdaftar Resmi BPOM RI.
          </p>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-text">
              Masuk ke Akun Anda
            </h1>
            <p className="text-xs text-brand-text-body/70 mt-1">
              Silakan masukkan email dan kata sandi yang telah terdaftar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Alamat Email"
              placeholder="nama@email.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Kata Sandi"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              icon={<LogIn className="w-5 h-5" />}
            >
              Masuk Sekarang
            </Button>
          </form>

          {/* Quick Demo Credentials Help */}
          <div className="mt-6 p-4 rounded-2xl bg-brand-soft text-[11px] text-brand-text-body/80 space-y-1">
            <p className="font-bold text-brand-text">Akun Demo Pengujian:</p>
            <p>&bull; Pelanggan: <code className="font-bold">pelanggan@zglowra.com</code> / <code className="font-bold">password123</code></p>
            <p>&bull; Admin: <code className="font-bold">admin@zglowra.com</code> / <code className="font-bold">password123</code></p>
            <p>&bull; Supplier: <code className="font-bold">supplier1@zglowra.com</code> / <code className="font-bold">password123</code></p>
          </div>

          <div className="mt-6 text-center text-xs text-brand-text-body">
            Belum memiliki akun ZGlowra?{' '}
            <Link to="/daftar" className="font-bold text-brand-text hover:underline">
              Daftar Sekarang &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
