import React, { useState, useEffect } from 'react';
import { Plus, Factory } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';

export const AdminSuppliers: React.FC = () => {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    password: 'password123',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/admin/suppliers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSuppliers(data.suppliers || []);
    } catch {}
  };

  useEffect(() => {
    fetchSuppliers();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/suppliers', {
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
        fetchSuppliers();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal mendaftarkan supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-text">Mitra Supplier Resmi</h1>
          <p className="text-xs text-brand-text-body/70 mt-1">Daftar pabrik dan pemasok bahan baku body care.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Daftarkan Supplier Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.map((s) => (
          <Card key={s.id} className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-gold flex items-center justify-center shrink-0">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-brand-text text-base">{s.company_name}</h3>
                  <p className="text-xs text-brand-text-body/70">Kontak: {s.contact_person}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#E6F4EA] text-[#137333] text-xs font-bold rounded-full">
                Aktif
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-brand-text-body bg-brand-soft p-4 rounded-2xl">
              <p>Email Login: <strong>{s.email}</strong></p>
              <p>Nomor Telepon: <strong>{s.phone}</strong></p>
              <p className="line-clamp-2">Alamat: {s.address}</p>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Daftarkan Mitra Supplier Baru"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nama Perusahaan / PT"
            placeholder="Contoh: PT Natural Solusindo"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            required
          />
          <Input
            label="Nama Penanggung Jawab (Kontak)"
            placeholder="Contoh: Budi Santoso"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="email"
              label="Email Akun Login"
              placeholder="supplier@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="tel"
              label="Nomor Telepon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <Input
            type="password"
            label="Kata Sandi Login Supplier"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Alamat Pabrik / Gudang
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-xs focus:bg-white focus:shadow-focus-coral outline-none border-none"
              required
            />
          </div>
          <Button type="submit" size="md" isLoading={isSubmitting} className="w-full">
            Daftarkan Supplier
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSuppliers;

