import React, { useState, useEffect } from 'react';
import { Plus, Truck, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { toast } from 'sonner';

export const AdminPurchases: React.FC = () => {
  const { token } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [poQty, setPoQty] = useState('50');
  const [poCostPrice, setPoCostPrice] = useState('45000');
  const [poNote, setPoNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPurchases(data.purchases || []);
      }
    } catch {
      toast.error('Gagal memuat pesanan pembelian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    // Load suppliers
    fetch('/api/admin/suppliers', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.suppliers) {
          setSuppliers(d.suppliers);
          if (d.suppliers.length > 0) setSelectedSupplierId(String(d.suppliers[0].id));
        }
      });
    // Load products
    fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.products) {
          setProducts(d.products);
          if (d.products.length > 0) setSelectedProductId(String(d.products[0].id));
        }
      });
  }, [token]);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !selectedProductId || !poQty || !poCostPrice) {
      toast.error('Lengkapi semua data pesanan pembelian');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplier_id: selectedSupplierId,
          items: [
            {
              product_id: parseInt(selectedProductId, 10),
              qty: parseInt(poQty, 10),
              cost_price: parseFloat(poCostPrice),
            },
          ],
          note: poNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setModalOpen(false);
        fetchPurchases();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal membuat pesanan pembelian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivePurchase = async (id: number) => {
    if (!confirm('Tandai barang telah diterima? Stok produk akan otomatis bertambah.')) return;
    try {
      const res = await fetch(`/api/admin/purchases/${id}/receive`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchPurchases();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal memproses penerimaan barang');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-text">
            Pembelian Stok dari Supplier (PO)
          </h1>
          <p className="text-xs text-brand-text-body/70 mt-1">
            Buat pesanan pengadaan stok body care ke supplier dan pantau proses pengiriman hingga diterima.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Buat PO Baru
        </Button>
      </div>

      <Card className="p-6">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-brand-soft text-brand-text font-bold uppercase tracking-wider">
                <th className="p-3.5 rounded-l-2xl">Kode PO</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Ekspedisi / Resi</th>
                <th className="p-3.5">Total Biaya</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 rounded-r-2xl text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="">
              {purchases.map((po, i) => (
                <tr key={po.id} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-soft/40'}>
                  <td className="p-3.5 font-mono font-bold text-brand-text">{po.code}</td>
                  <td className="p-3.5 font-semibold text-brand-text-body">{po.supplier_name}</td>
                  <td className="p-3.5 text-brand-text-body/70">
                    {new Date(po.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-3.5">
                    {po.courier ? (
                      <div>
                        <span className="font-semibold text-brand-text-body">{po.courier}</span>
                        <span className="block font-mono text-[10px] text-brand-gold">{po.tracking_number}</span>
                      </div>
                    ) : (
                      <span className="text-brand-text-body/40">Belum Dikirim</span>
                    )}
                  </td>
                  <td className="p-3.5 font-serif font-bold text-brand-text">
                    Rp {parseFloat(po.total).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="p-3.5 text-right">
                    {po.status === 'Dikirim' ? (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleReceivePurchase(po.id)}
                        icon={<CheckCircle className="w-3.5 h-3.5" />}
                      >
                        Tandai Diterima
                      </Button>
                    ) : (
                      <span className="text-xs text-brand-text-body/50 italic">
                        {po.status === 'Diterima' ? 'Selesai' : 'Menunggu Supplier'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {purchases.map((po) => (
            <div key={po.id} className="p-4 bg-brand-soft rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-brand-text">{po.code}</span>
                <StatusBadge status={po.status} />
              </div>
              <p className="text-xs font-semibold text-brand-text-body">{po.supplier_name}</p>
              <div className="flex items-center justify-between pt-2 ">
                <span className="font-serif font-bold text-sm text-brand-text">
                  Rp {parseFloat(po.total).toLocaleString('id-ID')}
                </span>
                {po.status === 'Dikirim' && (
                  <Button size="sm" variant="gold" onClick={() => handleReceivePurchase(po.id)}>
                    Tandai Diterima
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CREATE PO MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Buat Pesanan Pembelian Stok (PO)"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Pilih Mitra Supplier
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full min-h-[48px] bg-brand-soft text-brand-text-body rounded-input px-4 text-xs font-semibold focus:shadow-focus-coral outline-none border-none"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.company_name} ({s.contact_person})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Pilih Produk yang Dipesan
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full min-h-[48px] bg-brand-soft text-brand-text-body rounded-input px-4 text-xs font-semibold focus:shadow-focus-coral outline-none border-none"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Stok saat ini: {p.stock} pcs)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Jumlah Pesanan (Qty)"
              value={poQty}
              onChange={(e) => setPoQty(e.target.value)}
              required
            />
            <Input
              type="number"
              label="Harga Beli Satuan (Rp)"
              value={poCostPrice}
              onChange={(e) => setPoCostPrice(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Catatan PO untuk Supplier
            </label>
            <textarea
              rows={3}
              value={poNote}
              onChange={(e) => setPoNote(e.target.value)}
              placeholder="Contoh: Pengiriman mohon diprioritaskan minggu ini..."
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-xs focus:bg-white focus:shadow-focus-coral outline-none border-none"
            />
          </div>

          <Button type="submit" size="md" isLoading={isSubmitting} className="w-full">
            Kirim Pesanan Pembelian
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPurchases;
