import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

export const AdminSettings: React.FC = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<any>({
    store_name: '',
    store_phone: '',
    store_whatsapp: '',
    store_email: '',
    store_address: '',
    low_stock_threshold: '10',
    payment_timeout_hours: '24',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) {
          setSettings((prev: any) => ({
            ...prev,
            ...d.settings,
          }));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal memperbarui pengaturan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">Pengaturan Toko ZGlowra</h1>
        <p className="text-xs text-brand-text-body/70 mt-1">Konfigurasi kontak, batas waktu pembayaran, dan notifikasi stok.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Toko Resmi"
            value={settings.store_name}
            onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor WhatsApp Toko (Format: 628xxxx)"
              value={settings.store_whatsapp}
              onChange={(e) => setSettings({ ...settings, store_whatsapp: e.target.value })}
              required
            />
            <Input
              label="Nomor Telepon Kantor"
              value={settings.store_phone}
              onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
            />
          </div>

          <Input
            type="email"
            label="Email Customer Support"
            value={settings.store_email}
            onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Alamat Toko Lengkap
            </label>
            <textarea
              rows={3}
              value={settings.store_address}
              onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-xs focus:bg-white focus:shadow-focus-coral outline-none border-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              type="number"
              label="Batas Waktu Bayar (Jam)"
              value={settings.payment_timeout_hours}
              onChange={(e) => setSettings({ ...settings, payment_timeout_hours: e.target.value })}
              required
            />
            <Input
              type="number"
              label="Ambang Batas Stok Menipis"
              value={settings.low_stock_threshold}
              onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
              required
            />
          </div>

          <Button type="submit" size="md" isLoading={isSubmitting} className="w-full mt-4">
            Simpan Pengaturan
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminSettings;

