import React, { useState, useEffect } from 'react';
import { Eye, Search, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { toast } from 'sonner';

export const AdminOrders: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail & Status Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `/api/admin/orders?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'Semua') url += `&status=${encodeURIComponent(statusFilter)}`;

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
    fetchOrders();
  }, [token, statusFilter]);

  const handleOpenDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
        setNewStatus(data.order.status);
        setTrackingNumber(data.order.tracking_number || '');
        setStatusNote('');
        setDetailModalOpen(true);
      }
    } catch {
      toast.error('Gagal memuat detail pesanan');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumber || undefined,
          note: statusNote || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDetailModalOpen(false);
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal memperbarui status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">Kelola Pesanan Pelanggan</h1>
        <p className="text-xs text-brand-text-body/70 mt-1">
          Pantau status pesanan, input nomor resi pengiriman kurir, dan verifikasi status transaksi.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari kode pesanan / pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full bg-brand-soft text-brand-text-body text-xs rounded-full py-2.5 pl-10 pr-4 focus:bg-white focus:shadow-focus-coral outline-none border-none"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-body/50" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['Semua', 'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-brand-text text-white shadow-button'
                  : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="p-6">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-brand-soft text-brand-text font-bold uppercase tracking-wider">
                <th className="p-3.5 rounded-l-2xl">Kode Pesanan</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kurir</th>
                <th className="p-3.5">Total Tagihan</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 rounded-r-2xl text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="">
              {orders.map((ord, i) => (
                <tr key={ord.id} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-soft/40'}>
                  <td className="p-3.5 font-mono font-bold text-brand-text">{ord.code}</td>
                  <td className="p-3.5 font-semibold text-brand-text-body">
                    {ord.customer_name}
                    <span className="block text-[10px] text-brand-text-body/60 font-normal">{ord.customer_email}</span>
                  </td>
                  <td className="p-3.5 text-brand-text-body/70">
                    {new Date(ord.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-3.5 font-medium">{ord.courier}</td>
                  <td className="p-3.5 font-serif font-bold text-brand-text">
                    Rp {parseFloat(ord.total).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="p-3.5 text-right">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenDetail(ord.id)} icon={<Eye className="w-3.5 h-3.5" />}>
                      Kelola
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {orders.map((ord) => (
            <div key={ord.id} className="p-4 bg-brand-soft rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-brand-text">{ord.code}</span>
                <StatusBadge status={ord.status} />
              </div>
              <p className="text-xs font-semibold text-brand-text-body">{ord.customer_name}</p>
              <div className="flex items-center justify-between pt-2 ">
                <span className="font-serif font-bold text-sm text-brand-text">
                  Rp {parseFloat(ord.total).toLocaleString('id-ID')}
                </span>
                <Button size="sm" variant="secondary" onClick={() => handleOpenDetail(ord.id)}>
                  Kelola
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ORDER DETAIL & STATUS UPDATE MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Kelola Pesanan: ${selectedOrder?.code}`}
        maxWidth="lg"
      >
        {selectedOrder && (
          <form onSubmit={handleUpdateStatus} className="space-y-6">
            {/* Status change controls */}
            <div className="p-4 bg-brand-soft rounded-2xl space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text">
                Perbarui Status Pesanan
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full min-h-[48px] bg-white text-brand-text-body rounded-xl px-4 text-xs font-bold focus:shadow-focus-coral outline-none border-none"
              >
                <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Diproses">Diproses</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
                <option value="Pembayaran Ditolak">Pembayaran Ditolak</option>
              </select>

              {newStatus === 'Dikirim' && (
                <Input
                  label="Nomor Resi Pengiriman"
                  placeholder="Contoh: JT8899776655"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                />
              )}

              <Input
                label="Catatan Tambahan untuk Pelanggan (Opsional)"
                placeholder="Contoh: Paket telah diserahkan ke kurir J&T..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            {/* Items summary */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text mb-2">
                Daftar Barang ({selectedOrder.items?.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-brand-soft rounded-xl">
                    <span className="font-semibold text-brand-text-body">{item.name_snapshot} x{item.qty}</span>
                    <span className="font-serif font-bold text-brand-text">
                      Rp {parseFloat(item.subtotal).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="text-xs text-brand-text-body bg-brand-soft/60 p-3 rounded-xl">
              <p className="font-bold text-brand-text">Alamat Penerima:</p>
              <p>{selectedOrder.address_snapshot?.penerima} ({selectedOrder.address_snapshot?.telepon})</p>
              <p>{selectedOrder.address_snapshot?.alamat_lengkap}, {selectedOrder.address_snapshot?.kota}</p>
            </div>

            <Button type="submit" size="md" isLoading={isUpdating} className="w-full">
              Simpan Perubahan Status
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
