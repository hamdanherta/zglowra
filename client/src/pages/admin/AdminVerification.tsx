import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';

export const AdminVerification: React.FC = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPay, setSelectedPay] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Image Preview Modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payments/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch {
      toast.error('Gagal memuat antrean pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token]);

  const handleApprove = async (orderId: number) => {
    if (!confirm('Apakah bukti transfer valid dan ingin disetujui?')) return;
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/admin/payments/${orderId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchPayments();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal menyetujui pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (pay: any) => {
    setSelectedPay(pay);
    setRejectReason('Nominal transfer tidak sesuai / mutasi tidak ditemukan');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/admin/payments/${selectedPay.order_id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setRejectModalOpen(false);
        fetchPayments();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal menolak pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">
          Verifikasi Bukti Pembayaran
        </h1>
        <p className="text-xs text-brand-text-body/70 mt-1">
          Periksa kecocokan foto mutasi transfer bank dengan total tagihan pesanan sebelum diproses.
        </p>
      </div>

      {payments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map((p) => (
            <Card key={p.id} className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono font-bold text-sm text-brand-text">
                    {p.order_code}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FEF7E0] text-[#B06000]">
                    Menunggu Verifikasi
                  </span>
                </div>

                {/* Proof Image Click to preview */}
                <div
                  onClick={() => {
                    setPreviewImg(p.proof_path);
                    setImageModalOpen(true);
                  }}
                  className="relative aspect-video rounded-2xl bg-brand-soft overflow-hidden mb-4 cursor-pointer group flex items-center justify-center"
                >
                  <img
                    src={p.proof_path}
                    alt="Bukti Transfer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-brand-text-body/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5">
                    <Eye className="w-4 h-4" />
                    Lihat Bukti Utuh
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-brand-text-body">
                  <p>Pelanggan: <strong className="text-brand-text">{p.customer_name}</strong></p>
                  <p>Bank Pengirim/Tujuan: <strong>{p.bank}</strong></p>
                  <p>Nominal Bukti: <strong>Rp {parseFloat(p.amount).toLocaleString('id-ID')}</strong></p>
                  <p>Total Tagihan Pesanan: <strong className="font-serif text-sm text-brand-text">Rp {parseFloat(p.order_total).toLocaleString('id-ID')}</strong></p>
                  <p className="text-[10px] text-brand-text-body/60 pt-1">
                    Diunggah: {new Date(p.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-6 ">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleApprove(p.order_id)}
                  disabled={isProcessing}
                  className="flex-1"
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Setujui
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleOpenReject(p)}
                  disabled={isProcessing}
                  className="flex-1"
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Tolak
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-brand-text">
            Semua Pembayaran Telah Terverifikasi
          </h3>
          <p className="text-xs text-brand-text-body mt-1">
            Tidak ada antrean bukti transfer yang perlu diverifikasi saat ini.
          </p>
        </Card>
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        title="Pratinjau Bukti Pembayaran"
        maxWidth="lg"
      >
        <div className="flex items-center justify-center p-2">
          <img
            src={previewImg}
            alt="Bukti Transfer Penuh"
            className="max-h-[75vh] rounded-2xl object-contain"
          />
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Tolak Bukti Pembayaran"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-brand-text-body">
            Silakan tuliskan alasan penolakan agar pelanggan dapat mengunggah bukti pembayaran yang valid.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full bg-brand-soft text-brand-text-body p-3 rounded-input text-xs focus:bg-white focus:shadow-focus-coral outline-none border-none"
            placeholder="Contoh: Nominal transfer kurang, atau gambar bukti buram..."
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="soft" size="sm" onClick={() => setRejectModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isProcessing}>
              Konfirmasi Tolak
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminVerification;
