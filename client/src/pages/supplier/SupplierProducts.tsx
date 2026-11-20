import React, { useState, useEffect } from 'react';
import { Package, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';

export const SupplierProducts: React.FC = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<any>(null);
  const [costPrice, setCostPrice] = useState('');
  const [availableStock, setAvailableStock] = useState('');
  const [isAvailable, setIsAvailable] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/supplier/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleOpenEdit = (p: any) => {
    setSelectedProd(p);
    setCostPrice(String(p.cost_price));
    setAvailableStock(String(p.available_stock));
    setIsAvailable(p.is_available);
    setModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/supplier/products/${selectedProd.product_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cost_price: parseFloat(costPrice),
          available_stock: parseInt(availableStock, 10),
          is_available: isAvailable,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setModalOpen(false);
        fetchProducts();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal memperbarui stok produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">
          Ketersediaan Stok &amp; Harga Pasokan
        </h1>
        <p className="text-xs text-brand-text-body/70 mt-1">
          Perbarui harga pasokan pabrik dan kuota stok yang siap disuplai ke ZGlowra.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {products.map((p) => (
            <div
              key={p.product_id}
              className="p-4 bg-brand-soft rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={p.path_thumb || '/logo.png'}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover bg-white shrink-0"
                />
                <div>
                  <h4 className="font-serif font-bold text-brand-text text-base">{p.name}</h4>
                  <p className="text-xs text-brand-text-body/70">SKU: {p.sku}</p>
                  <p className="text-xs text-brand-text-body mt-1">
                    Harga Pasokan: <strong>Rp {parseFloat(p.cost_price).toLocaleString('id-ID')}</strong> &bull; Kapasitas Pabrik: <strong>{p.available_stock} pcs</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  p.is_available ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-danger'
                }`}>
                  {p.is_available ? 'Siap Pasok' : 'Kosong'}
                </span>

                <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(p)} icon={<Edit2 className="w-3.5 h-3.5" />}>
                  Atur Stok &amp; Harga
                </Button>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <p className="text-center py-8 text-xs text-brand-text-body/60">
              Belum ada produk yang dipasok oleh perusahaan Anda.
            </p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Atur Pasokan: ${selectedProd?.name}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            type="number"
            label="Harga Pasokan ke Toko (Rp)"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            required
          />
          <Input
            type="number"
            label="Ketersediaan Stok di Pabrik (Pcs)"
            value={availableStock}
            onChange={(e) => setAvailableStock(e.target.value)}
            required
          />
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-brand-text-body cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable === 1}
                onChange={(e) => setIsAvailable(e.target.checked ? 1 : 0)}
                className="accent-brand-text"
              />
              Produk Siap Dipasok
            </label>
          </div>
          <Button type="submit" size="md" isLoading={isSubmitting} className="w-full mt-4">
            Simpan Perubahan
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default SupplierProducts;

