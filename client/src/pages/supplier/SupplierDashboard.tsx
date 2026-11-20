import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';

export const SupplierDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supplier/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-brand-text-body font-medium">Memuat dashboard supplier...</p>
      </div>
    );
  }

  const { supplier, stats, recentPO } = data;

  const statCards = [
    {
      title: 'Perlu Konfirmasi Segera',
      value: `${stats.pending_confirm_count || 0} PO`,
      desc: 'Pesanan baru dari Admin Toko',
      icon: <Clock className="w-5 h-5 text-[#B06000]" />,
      bg: 'bg-[#FEF7E0]',
    },
    {
      title: 'Siap Dikirim',
      value: `${stats.ready_to_ship_count || 0} PO`,
      desc: 'Telah Anda konfirmasi',
      icon: <Package className="w-5 h-5 text-brand-gold" />,
      bg: 'bg-brand-gold-soft',
    },
    {
      title: 'Dalam Perjalanan Kurir',
      value: `${stats.shipped_count || 0} PO`,
      desc: 'Menunggu diterima di gudang',
      icon: <Truck className="w-5 h-5 text-brand-text" />,
      bg: 'bg-brand-coral-soft',
    },
    {
      title: 'Selesai & Diterima',
      value: `${stats.completed_count || 0} PO`,
      desc: 'Stok berhasil masuk ke toko',
      icon: <CheckCircle className="w-5 h-5 text-[#137333]" />,
      bg: 'bg-[#E6F4EA]',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">
          Selamat Datang, {supplier.company_name}
        </h1>
        <p className="text-xs text-brand-text-body/70 mt-1">
          Kelola pesanan pasokan produk body care dan perbarui ketersediaan stok pabrik Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c, i) => (
          <Card key={i} className="p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-brand-text-body/70">{c.title}</span>
              <h3 className="font-serif text-2xl font-bold text-brand-text mt-1">{c.value}</h3>
              <span className="text-[11px] text-brand-text-body/60 mt-0.5 block">{c.desc}</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center shrink-0`}>
              {c.icon}
            </div>
          </Card>
        ))}
      </div>

      {/* Recent PO list */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-brand-text">
            Pesanan Pembelian Terbaru (PO)
          </h3>
          <Link to="/supplier/pesanan">
            <Button size="sm" variant="secondary">
              Lihat Semua PO
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {recentPO?.map((po: any) => (
            <div
              key={po.id}
              className="p-4 bg-brand-soft rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-sm text-brand-text">{po.code}</span>
                  <StatusBadge status={po.status} />
                </div>
                <p className="text-xs text-brand-text-body">
                  Admin Pemesan: <strong>{po.admin_name}</strong> &bull; Dibuat: {new Date(po.created_at).toLocaleDateString('id-ID')}
                </p>
                {po.note && <p className="text-xs text-brand-text-body/70 mt-1 italic">"{po.note}"</p>}
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <span className="font-serif font-bold text-sm text-brand-text">
                  Rp {parseFloat(po.total).toLocaleString('id-ID')}
                </span>
                <Link to="/supplier/pesanan">
                  <Button size="sm" variant="primary">
                    Buka PO
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {recentPO?.length === 0 && (
            <p className="text-center py-8 text-xs text-brand-text-body/60">
              Belum ada pesanan pembelian dari toko.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SupplierDashboard;

