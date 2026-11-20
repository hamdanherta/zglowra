import React, { useState, useEffect } from 'react';
import { Eye, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { toast } from 'sonner';

export const SupplierPurchases: React.FC = () => {
  const { token } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Ship Modal
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [courier, setCourier] = useState('Ekspedisi Truk Mandiri');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isShipping, setIsShipping] = useState(false);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/supplier/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPurchases(data.purchases || []);
    } catch {
      toast.error('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [token]);

  const handleOpenDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/supplier/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.purchase) {
        setSelectedPO(data.purchase);
        setDetailModalOpen(true);
      }
    } catch {
      toast.error('Gagal memuat detail PO');
    }
  };

  const handleConfirmPO = async (id: number) => {
    try {
      const res = await fetch(`/api/supplier/purchases/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: 'Pesanan pasokan telah disetujui pabrik dan sedang disiapkan.' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDetailModalOpen(false);
        fetchPurchases();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal mengonfirmasi');
    }
  };

  const handleRejectPO = async (id: number) => {
    const reason = prompt('Masukkan alasan penolakan pesanan pembelian:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/supplier/purchases/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDetailModalOpen(false);
        fetchPurchases();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal menolak pesanan');
    }
  };

  const handleOpenShip = (po: any) => {
    setSelectedPO(po);
    setCourier('JNE Trucking');
    setTrackingNumber(`TRK-${Date.now().toString().slice(-6)}`);
    setShipModalOpen(true);
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courier || !trackingNumber) {
      toast.error('Kurir dan nomor resi wajib diisi');
      return;
    }

    try {
      setIsShipping(true);
      const res = await fetch(`/api/supplier/purchases/${selectedPO.id}/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courier, trackingNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShipModalOpen(false);
        fetchPurchases();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal mencatat pengiriman');
    } finally {
      setIsShipping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">
          Pesanan Pembelian dari Toko (PO)
        </h1>
        <p className="text-xs text-brand-text-body/70 mt-1">
          Konfirmasi pesanan pasokan dari ZGlowra dan kelola status pengiriman produk ke gudang toko.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {purchases.map((po) => (
            <div
              key={po.id}
              className="p-5 bg-brand-soft rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-sm text-brand-text">{po.code}</span>
                  <StatusBadge status={po.status} />
                </div>
                <p className="text-xs text-brand-text-body">
                  Dipesan oleh Admin: <strong>{po.admin_name}</strong> &bull; {new Date(po.created_at).toLocaleDateString('id-ID')}
                </p>
                {po.tracking_number && (
                  <p className="text-xs font-mono text-brand-gold mt-1">
                    Resi: {po.courier} - {po.tracking_number}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="font-serif font-bold text-base text-brand-text">
                  Rp {parseFloat(po.total).toLocaleString('id-ID')}
                </span>

                <Button size="sm" variant="secondary" onClick={() => handleOpenDetail(po.id)}>
                  Detail PO
                </Button>

                {po.status === 'Dikonfirmasi Supplier' && (
                  <Button size="sm" variant="primary" onClick={() => handleOpenShip(po)} icon={<Truck className="w-3.5 h-3.5" />}>
                    Input Pengiriman
                  </Button>
                )}
              </div>
            </div>
          ))}

          {purchases.length === 0 && (
            <p className="text-center py-10 text-xs text-brand-text-body/60">
              Belum ada pesanan pembelian yang ditujukan ke supplier Anda.
            </p>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Detail PO: ${selectedPO?.code}`}
        maxWidth="lg"
      >
        {selectedPO && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs bg-brand-soft p-4 rounded-xl">
              <span>Status PO:</span>
              <StatusBadge status={selectedPO.status} />
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text mb-3">
                Daftar Produk yang Diminta
              </h4>
              <div className="space-y-3">
                {selectedPO.items?.map((item: any) => (
                  <div key={item.id} className="p-3 bg-brand-soft rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-brand-text">{item.product_name}</p>
                      <p className="text-[11px] text-brand-text-body/60">SKU: {item.product_sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-text-body">{item.qty} pcs @ Rp {parseFloat(item.cost_price).toLocaleString('id-ID')}</p>
                      <p className="font-serif font-bold text-brand-text">Rp {parseFloat(item.subtotal).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2  text-sm font-bold text-brand-text-body">
              <span>Total Nilai Pesanan:</span>
              <span className="font-serif text-xl font-bold text-brand-text">
                Rp {parseFloat(selectedPO.total).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Actions if still Dibuat */}
            {selectedPO.status === 'Dibuat' && (
              <div className="flex items-center gap-3 pt-4 ">
                <Button
                  size="md"
                  variant="primary"
                  className="flex-1"
                  onClick={() => handleConfirmPO(selectedPO.id)}
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Konfirmasi &amp; Siapkan Barang
                </Button>
                <Button
                  size="md"
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleRejectPO(selectedPO.id)}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Tolak Pesanan Ini
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Ship Modal */}
      <Modal
        isOpen={shipModalOpen}
        onClose={() => setShipModalOpen(false)}
        title="Input Pengiriman Barang ke Toko"
      >
        <form onSubmit={handleShipSubmit} className="space-y-4">
          <Input
            label="Nama Jasa Pengiriman / Ekspedisi"
            placeholder="Contoh: JNE Trucking / Mobil Box Pabrik"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            required
          />
          <Input
            label="Nomor Resi / Surat Jalan"
            placeholder="Contoh: SJ-2026-0012"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            required
          />
          <Button type="submit" size="md" isLoading={isShipping} className="w-full">
            Kirimkan Barang Sekarang
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default SupplierPurchases;
