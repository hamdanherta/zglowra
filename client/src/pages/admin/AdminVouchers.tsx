import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';

export const AdminVouchers: React.FC = () => {
  const { token } = useAuth();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '10',
    min_purchase: '50000',
    quota: '100',
  });

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVouchers(data.vouchers || []);
    } catch {}
  };

  useEffect(() => {
    fetchVouchers();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setModalOpen(false);
        fetchVouchers();
      }
    } catch {
      toast.error('Gagal membuat voucher');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kode voucher ini?')) return;
    try {
      await fetch(`/api/admin/vouchers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Voucher dihapus');
      fetchVouchers();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-text">Kupon &amp; Voucher Diskon</h1>
          <p className="text-xs text-brand-text-body/70 mt-1">Buat kode promo belanja untuk pelanggan setia.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Buat Kupon Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vouchers.map((v) => (
          <Card key={v.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-lg font-bold text-brand-text bg-brand-coral-soft px-3 py-1 rounded-full">
                  {v.code}
                </span>
                <span className="text-xs font-semibold text-brand-gold">
                  {v.type === 'percent' ? `${parseFloat(v.value)}% OFF` : `Potongan Rp ${parseFloat(v.value).toLocaleString('id-ID')}`}
                </span>
              </div>
              <p className="text-xs text-brand-text-body">
                Min. Belanja: <strong>Rp {parseFloat(v.min_purchase).toLocaleString('id-ID')}</strong>
              </p>
              <p className="text-xs text-brand-text-body mt-1">
                Sisa Kuota: <strong>{v.quota} kali pakai</strong>
              </p>
            </div>
            <div className="pt-4  flex justify-end">
              <button
                onClick={() => handleDelete(v.id)}
                className="p-2 text-danger hover:bg-[#FCE8E6] rounded-xl text-xs flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Buat Voucher Diskon Baru"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Kode Kupon"
            placeholder="Contoh: CANTIK10"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
                Tipe Diskon
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full min-h-[52px] bg-brand-soft text-brand-text-body rounded-input px-4 text-xs font-semibold focus:shadow-focus-coral outline-none border-none"
              >
                <option value="percent">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <Input
              type="number"
              label="Nilai Potongan"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Minimal Belanja (Rp)"
              value={formData.min_purchase}
              onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
              required
            />
            <Input
              type="number"
              label="Jumlah Kuota"
              value={formData.quota}
              onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
              required
            />
          </div>
          <Button type="submit" size="md" className="w-full">
            Simpan Voucher
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminVouchers;
