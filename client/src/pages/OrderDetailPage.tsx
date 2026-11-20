import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Truck, Package, Star, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

export const OrderDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customer/orders/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        toast.error('Pesanan tidak ditemukan');
        navigate('/akun/pesanan');
      }
    } catch {
      toast.error('Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/masuk');
      return;
    }
    fetchDetail();
  }, [code, token]);

  const handleOpenReview = (item: any) => {
    setSelectedProduct(item);
    // If existing review
    const existing = order.reviews?.find((r: any) => r.product_id === item.product_id);
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment);
    } else {
      setRating(5);
      setComment('');
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Komentar ulasan tidak boleh kosong');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await fetch(`/api/customer/orders/${order.code}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: selectedProduct.product_id,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setReviewModalOpen(false);
        fetchDetail();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal mengirim ulasan');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center">
        <p className="text-brand-text-body font-medium">Memuat detail pesanan...</p>
      </div>
    );
  }

  const steps = [
    'Menunggu Pembayaran',
    'Menunggu Verifikasi',
    'Diproses',
    'Dikirim',
    'Selesai',
  ];
  const currentStepIdx = steps.indexOf(order.status);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <Link
        to="/akun/pesanan"
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-text-body hover:text-brand-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Pesanan
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Detail Transaksi
          </span>
          <h1 className="font-mono text-2xl sm:text-3xl font-bold text-brand-text">
            {order.code}
          </h1>
          <p className="text-xs text-brand-text-body/60 mt-1">
            Dibuat pada: {new Date(order.created_at).toLocaleString('id-ID')}
          </p>
        </div>
        <StatusBadge status={order.status} className="text-sm px-4 py-1.5" />
      </div>

      {/* TIMELINE PROGRESS */}
      {order.status !== 'Dibatalkan' && (
        <Card className="p-6 mb-8">
          <h3 className="font-serif font-bold text-brand-text text-base mb-6">
            Proses Pesanan
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {steps.map((st, idx) => {
              const isPassed = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={st} className="flex flex-col items-center text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                      isPassed
                        ? 'bg-brand-text text-white shadow-button'
                        : 'bg-brand-soft text-brand-text-body/40'
                    } ${isCurrent ? 'shadow-[0_0_0_4px_rgba(221,105,91,0.35)]' : ''}`}
                  >
                    {isPassed ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-brand-text font-bold' : isPassed ? 'text-brand-text-body' : 'text-brand-text-body/40'
                    }`}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ITEMS LIST */}
      <Card className="p-6 mb-8">
        <h3 className="font-serif font-bold text-brand-text text-lg mb-4">
          Daftar Produk yang Dipesan
        </h3>

        <div className="space-y-4">
          {order.items.map((item: any) => {
            const hasReview = order.reviews?.some((r: any) => r.product_id === item.product_id);
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-brand-soft"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.path_thumb || '/logo.png'}
                    alt={item.name_snapshot}
                    className="w-16 h-16 rounded-xl object-cover bg-white shrink-0"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-brand-text text-base">
                      {item.name_snapshot}
                    </h4>
                    <p className="text-xs text-brand-text-body/70 mt-0.5">
                      Rp {parseFloat(item.price_snapshot).toLocaleString('id-ID')} x {item.qty} pcs
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-serif font-bold text-brand-text text-base">
                    Rp {parseFloat(item.subtotal).toLocaleString('id-ID')}
                  </span>

                  {order.status === 'Selesai' && (
                    <Button
                      size="sm"
                      variant={hasReview ? 'soft' : 'secondary'}
                      onClick={() => handleOpenReview(item)}
                      icon={<Star className="w-3.5 h-3.5" />}
                    >
                      {hasReview ? 'Ubah Ulasan' : 'Beri Ulasan'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost Summary */}
        <div className="mt-6 pt-4 space-y-2 text-xs text-brand-text-body">
          <div className="flex justify-between">
            <span>Subtotal Produk</span>
            <span className="font-semibold text-brand-text">
              Rp {parseFloat(order.subtotal).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Ongkos Kirim ({order.courier})</span>
            <span className="font-semibold">
              Rp {parseFloat(order.shipping_cost).toLocaleString('id-ID')}
            </span>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div className="flex justify-between text-success">
              <span>Potongan Diskon Kupon</span>
              <span className="font-bold">
                - Rp {parseFloat(order.discount).toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <div className="pt-3 flex justify-between items-baseline">
            <span className="text-sm font-bold text-brand-text-body">Total Pembayaran</span>
            <span className="font-serif text-2xl font-bold text-brand-text">
              Rp {parseFloat(order.total).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </Card>

      {/* ADDRESS & SHIPPING INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="font-serif font-bold text-brand-text text-base mb-3">
            Tujuan Pengiriman
          </h3>
          <p className="text-sm font-bold text-brand-text-body">{order.address_snapshot?.penerima}</p>
          <p className="text-xs text-brand-text-body/70">{order.address_snapshot?.telepon}</p>
          <p className="text-xs text-brand-text-body mt-2 leading-relaxed">
            {order.address_snapshot?.alamat_lengkap}
          </p>
          <p className="text-xs text-brand-text-body/60 mt-0.5">
            {order.address_snapshot?.kota}, {order.address_snapshot?.provinsi} {order.address_snapshot?.kode_pos}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-serif font-bold text-brand-text text-base mb-3">
            Informasi Pengiriman &amp; Pembayaran
          </h3>
          <div className="space-y-2 text-xs text-brand-text-body">
            <p>
              Kurir: <strong>{order.courier}</strong>
            </p>
            <p>
              Nomor Resi: <strong className="font-mono text-brand-gold">{order.tracking_number || 'Sedang Dipersiapkan'}</strong>
            </p>
            <p>
              Metode Bayar: <strong>{order.payment_method}</strong>
            </p>
            {order.note && (
              <p className="italic text-brand-text-body/70 mt-2">
                Catatan: "{order.note}"
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* PAYMENT PROOF STATUS */}
      {order.payment && (
        <Card className="p-6 mb-8">
          <h3 className="font-serif font-bold text-brand-text text-base mb-4">
            Bukti Transfer yang Diunggah
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={order.payment.proof_path}
              alt="Bukti Transfer"
              className="max-h-48 rounded-2xl object-contain bg-brand-soft p-2 shadow-sm"
            />
            <div className="space-y-2 text-xs text-brand-text-body">
              <p>Bank Tujuan: <strong>{order.payment.bank}</strong></p>
              <p>Nominal Bukti: <strong>Rp {parseFloat(order.payment.amount).toLocaleString('id-ID')}</strong></p>
              <p>Status Verifikasi: <strong className="uppercase text-brand-text font-bold">{order.payment.status}</strong></p>
              {order.payment.rejected_reason && (
                <div className="p-3 bg-[#FCE8E6] text-[#C5221F] rounded-xl font-medium">
                  Alasan Penolakan: {order.payment.rejected_reason}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* STATUS ACTIVITY LOG */}
      <Card className="p-6">
        <h3 className="font-serif font-bold text-brand-text text-base mb-4">
          Riwayat Aktivitas Pesanan
        </h3>
        <div className="space-y-3">
          {order.logs?.map((l: any, i: number) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-brand-gold mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-brand-text">{l.status}</p>
                <p className="text-brand-text-body">{l.note}</p>
                <span className="text-[10px] text-brand-text-body/50">
                  {new Date(l.created_at).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* REVIEW MODAL */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Beri Ulasan: ${selectedProduct?.name_snapshot}`}
      >
        <form onSubmit={handleSubmitReview} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-body mb-2">
              Rating Kepuasan
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-brand-gold text-brand-gold' : 'text-brand-soft fill-brand-soft'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-body mb-2">
              Komentar &amp; Ulasan Anda
            </label>
            <textarea
              rows={4}
              placeholder="Ceritakan pengalaman Anda setelah memakai produk body care ini..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-brand-soft text-brand-text-body p-4 rounded-input text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
              required
            />
          </div>

          <Button type="submit" size="md" isLoading={isSubmittingReview} className="w-full">
            Kirim Ulasan
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
