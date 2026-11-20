import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Nama, email, dan kata sandi wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        login(data.user, data.token);
        toast.success(data.message || 'Pendaftaran berhasil!');
        navigate('/');
      } else {
        toast.error(data.message || 'Gagal mendaftar');
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
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-coral-soft to-brand-soft p-10 flex-col justify-between text-left">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
            <span className="font-serif text-2xl font-bold text-brand-text">
              <span className="text-brand-gold">Z</span>Glowra
            </span>
          </Link>

          <div>
            <h2 className="font-serif text-3xl font-bold text-brand-text leading-snug">
              Bergabung Bersama Komunitas Cantik Zfree Glow
            </h2>
            <div className="w-12 h-1 bg-brand-gold rounded-full my-3" />
            <p className="text-xs text-brand-text-body leading-relaxed">
              Daftarkan diri Anda untuk pengalaman belanja perawatan tubuh yang mudah, cepat, dan raih potongan harga khusus anggota baru.
            </p>
          </div>

          <p className="text-[11px] text-brand-text-body/60">
            &copy; 2026 ZGlowra. Terdaftar Resmi BPOM RI.
          </p>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-text">
              Buat Akun Baru
            </h1>
            <p className="text-xs text-brand-text-body/70 mt-1">
              Lengkapi formulir singkat di bawah ini untuk memulai.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Nama Lengkap"
              placeholder="Contoh: Zahra Putri"
              icon={<User className="w-4 h-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              type="tel"
              label="Nomor WhatsApp"
              placeholder="0812xxxxxxxx"
              icon={<Phone className="w-4 h-4" />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              type="password"
              label="Kata Sandi"
              placeholder="Minimal 6 karakter"
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
              icon={<UserPlus className="w-5 h-5" />}
            >
              Daftar Akun Sekarang
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-brand-text-body">
            Sudah memiliki akun?{' '}
            <Link to="/masuk" className="font-bold text-brand-text hover:underline">
              Masuk di Sini &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
