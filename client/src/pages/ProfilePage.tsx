import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, MapPin, Plus, Trash2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Rumah',
    penerima: user?.name || '',
    telepon: user?.phone || '',
    provinsi: 'DKI Jakarta',
    kota: 'Jakarta Selatan',
    kecamatan: '',
    kode_pos: '',
    alamat_lengkap: '',
    is_default: 0,
  });

  useEffect(() => {
    if (!token) {
      navigate('/masuk');
      return;
    }
    fetchAddresses();
  }, [token, navigate]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch {}
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          oldPassword: oldPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
        toast.success(data.message || 'Profil berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
      } else {
        toast.error(data.message || 'Gagal memperbarui profil');
      }
    } catch {
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Alamat berhasil disimpan');
        setAddressModalOpen(false);
        fetchAddresses();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal menyimpan alamat');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Hapus alamat ini?')) return;
    try {
      await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Alamat dihapus');
      fetchAddresses();
    } catch {
      toast.error('Gagal menghapus alamat');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Pengaturan Akun &amp; Profil
        </h1>
        <div className="w-12 h-1 bg-brand-gold rounded-full mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Profile & Password Form */}
        <div className="lg:col-span-6 space-y-8">
          <Card className="p-6">
            <h2 className="font-serif text-xl font-bold text-brand-text mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-gold" />
              Data Pribadi
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Alamat Email (Tidak Dapat Diubah)"
                value={user?.email || ''}
                disabled
              />
              <Input
                label="Nomor Telepon / WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div className="pt-4 ">
                <h3 className="font-serif font-bold text-brand-text text-base mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-gold" />
                  Ganti Kata Sandi (Opsional)
                </h3>
                <div className="space-y-3">
                  <Input
                    type="password"
                    label="Kata Sandi Saat Ini"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    label="Kata Sandi Baru"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isUpdatingProfile}
                size="md"
                className="w-full mt-4"
              >
                Simpan Perubahan
              </Button>
            </form>
          </Card>
        </div>

        {/* Right: Address Book */}
        <div className="lg:col-span-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-gold" />
                Buku Alamat Pengiriman
              </h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAddressModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Tambah
              </Button>
            </div>

            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-2xl bg-brand-soft flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-brand-text bg-brand-coral-soft px-3 py-1 rounded-full">
                      {addr.label}
                    </span>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-brand-text-body/60 hover:text-danger p-1"
                      title="Hapus Alamat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-brand-text-body">{addr.penerima}</p>
                    <p className="text-xs text-brand-text-body/70">{addr.telepon}</p>
                    <p className="text-xs text-brand-text-body mt-1.5 leading-relaxed">
                      {addr.alamat_lengkap}
                    </p>
                    <p className="text-xs text-brand-text-body/60 mt-0.5">
                      {addr.kota}, {addr.provinsi} {addr.kode_pos}
                    </p>
                  </div>
                </div>
              ))}

              {addresses.length === 0 && (
                <p className="text-center py-8 text-xs text-brand-text-body/60">
                  Belum ada alamat pengiriman yang tersimpan.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Tambah Alamat Pengiriman"
      >
        <form onSubmit={handleCreateAddress} className="space-y-4">
          <Input
            label="Label Alamat"
            placeholder="Contoh: Rumah, Kantor"
            value={newAddress.label}
            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Penerima"
              value={newAddress.penerima}
              onChange={(e) => setNewAddress({ ...newAddress, penerima: e.target.value })}
              required
            />
            <Input
              label="Telepon"
              value={newAddress.telepon}
              onChange={(e) => setNewAddress({ ...newAddress, telepon: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Provinsi"
              value={newAddress.provinsi}
              onChange={(e) => setNewAddress({ ...newAddress, provinsi: e.target.value })}
              required
            />
            <Input
              label="Kota"
              value={newAddress.kota}
              onChange={(e) => setNewAddress({ ...newAddress, kota: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kecamatan"
              value={newAddress.kecamatan}
              onChange={(e) => setNewAddress({ ...newAddress, kecamatan: e.target.value })}
              required
            />
            <Input
              label="Kode Pos"
              value={newAddress.kode_pos}
              onChange={(e) => setNewAddress({ ...newAddress, kode_pos: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Alamat Lengkap
            </label>
            <textarea
              rows={3}
              value={newAddress.alamat_lengkap}
              onChange={(e) => setNewAddress({ ...newAddress, alamat_lengkap: e.target.value })}
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
              required
            />
          </div>
          <Button type="submit" size="md" className="w-full">
            Simpan Alamat
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
