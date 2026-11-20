import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

export const SupplierProfile: React.FC = () => {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<any>({
    company_name: '',
    contact_person: '',
    phone: '',
    address: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch('/api/supplier/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.supplier) {
          setProfile(d.supplier);
        }
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const res = await fetch('/api/supplier/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">Profil Perusahaan Supplier</h1>
        <p className="text-xs text-brand-text-body/70 mt-1">Data identitas pabrik / distributor pasokan resmi ZGlowra.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Perusahaan / Pabrik"
            value={profile.company_name}
            onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
            required
          />

          <Input
            label="Nama Penanggung Jawab (PIC)"
            value={profile.contact_person}
            onChange={(e) => setProfile({ ...profile, contact_person: e.target.value })}
            required
          />

          <Input
            type="email"
            label="Email Akun Login"
            value={user?.email || ''}
            disabled
          />

          <Input
            type="tel"
            label="Nomor Telepon / WhatsApp PIC"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Alamat Lengkap Pabrik / Kantor
            </label>
            <textarea
              rows={3}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-xs focus:bg-white focus:shadow-focus-coral outline-none border-none"
              required
            />
          </div>

          <Button type="submit" size="md" isLoading={isUpdating} className="w-full mt-4">
            Simpan Perubahan
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SupplierProfile;

