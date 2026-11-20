import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';

export const OrdersHistoryPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<any[]>([]);
  const [activeStatus, setActiveStatus] = useState('Semua');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (status: string) => {
    try {
      setLoading(true);
      const url = status === 'Semua' ? '/api/customer/orders' : `/api/customer/orders?status=${encodeURIComponent(status)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch {
      toast.error('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/masuk');
      return;
    }
    fetchOrders(activeStatus);
  }, [token, activeStatus, navigate]);

  const handleCompleteOrder = async (code: string) => {
    if (!confirm('Apakah Anda yakin pesanan telah diterima dengan baik?')) return;
    try {
      const res = await fetch(`/api/customer/orders/${code}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchOrders(activeStatus);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal menyelesaikan pesanan');
    }
  };

  const handleCancelOrder = async (code: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
    try {
      const res = await fetch(`/api/customer/orders/${code}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Dibatalkan oleh pelanggan via web' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchOrders(activeStatus);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal membatalkan pesanan');
    }
  };

  const tabs = [
    'Semua',
    'Menunggu Pembayaran',
    'Menunggu Verifikasi',
    'Diproses',
    'Dikirim',
    'Selesai',
    'Dibatalkan',
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Pesanan &amp; Transaksi Saya
        </h1>
        <div className="w-12 h-1 bg-brand-gold rounded-full mt-2" />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveStatus(tab)}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
              activeStatus === tab
                ? 'bg-brand-text text-white shadow-button'
                : 'bg-white text-brand-text-body hover:bg-brand-soft shadow-sm'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-brand-text-body font-medium">Memuat riwayat transaksi...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card key={order.id} className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4  gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-brand-text">
                      {order.code}
                    </span>
                    <span className="text-xs text-brand-text-body/60">&bull; {dateStr}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Body Preview */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={order.first_item_img || '/logo.png'}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl object-cover bg-brand-soft shrink-0"
                    />
                    <div>
                      <h4 className="font-serif font-bold text-brand-text text-base line-clamp-1">
                        {order.first_item_name || 'Produk Body Care Zfree Glow'}
                      </h4>
                      {order.item_count > 1 && (
                        <p className="text-xs text-brand-text-body/60 mt-0.5">
                          +{order.item_count - 1} produk lainnya
                        </p>
                      )}
                      {order.tracking_number && (
                        <p className="text-xs font-mono text-brand-gold font-semibold mt-1">
                          No. Resi: {order.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-brand-text-body/60 block">Total Tagihan:</span>
                    <span className="font-serif text-xl font-bold text-brand-text">
                      Rp {parseFloat(order.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4  flex flex-wrap items-center justify-end gap-3">
                  <Link to={`/akun/pesanan/${order.code}`}>
                    <Button variant="soft" size="sm" icon={<Eye className="w-4 h-4" />}>
                      Detail Pesanan
                    </Button>
                  </Link>

                  {order.status === 'Menunggu Pembayaran' && (
                    <>
                      <button
                        onClick={() => handleCancelOrder(order.code)}
                        className="px-4 py-2 text-xs font-semibold text-danger hover:bg-brand-coral-soft rounded-full transition-colors"
                      >
                        Batalkan
                      </button>
                      <Link to={`/pesanan/${order.code}/pembayaran`}>
                        <Button size="sm">
                          Bayar Sekarang
                        </Button>
                      </Link>
                    </>
                  )}

                  {order.status === 'Pembayaran Ditolak' && (
                    <Link to={`/pesanan/${order.code}/pembayaran`}>
                      <Button size="sm">
                        Unggah Ulang Bukti
                      </Button>
                    </Link>
                  )}

                  {order.status === 'Dikirim' && (
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => handleCompleteOrder(order.code)}
                      icon={<CheckCircle className="w-4 h-4" />}
                    >
                      Pesanan Diterima
                    </Button>
                  )}

                  {order.status === 'Selesai' && (
                    <Link to={`/akun/pesanan/${order.code}`}>
                      <Button variant="secondary" size="sm">
                        Beri Ulasan Produk
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="Tidak Ada Pesanan"
          description={`Anda belum memiliki pesanan dengan status "${activeStatus}". Mulai pesan produk kesayangan Anda sekarang.`}
          actionText="Belanja Produk Sekarang"
          onAction={() => navigate('/produk')}
        />
      )}
    </div>
  );
};

export default OrdersHistoryPage;
