import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';

export const CartPage: React.FC = () => {
  const { cart, updateQty, removeFromCart, subtotal, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    try {
      setIsValidatingVoucher(true);
      const res = await fetch('/api/vouchers/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.success && data.voucher) {
        setAppliedVoucher(data.voucher);
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Voucher tidak valid');
        setAppliedVoucher(null);
      }
    } catch {
      toast.error('Gagal memvalidasi voucher');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const estimatedTotal = Math.max(0, subtotal - discountAmount);

  const handleProceedToCheckout = () => {
    if (!user) {
      toast.info('Silakan masuk terlebih dahulu untuk melanjutkan proses checkout pesanan.');
      navigate('/masuk?redirect=/checkout');
      return;
    }
    // Pass applied voucher to checkout state
    navigate('/checkout', { state: { appliedVoucher } });
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="Keranjang Belanja Masih Kosong"
          description="Anda belum menambahkan produk body care pilihan ke keranjang belanja. Jelajahi katalog kami untuk menemukan produk idaman Anda."
          actionText="Mulai Belanja Sekarang"
          onAction={() => navigate('/produk')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Keranjang Belanja ({cartCount} Item)
        </h1>
        <div className="w-12 h-1 bg-brand-gold rounded-full mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Items Table / List */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {cart.map((item) => (
            <Card key={item.product_id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-5 justify-between">
              {/* Product Thumbnail & Details */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img
                  src={item.path_thumb || item.path_medium || '/logo.png'}
                  alt={item.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-brand-soft shrink-0"
                />
                <div>
                  <Link to={`/produk/${item.slug}`}>
                    <h3 className="font-serif font-bold text-brand-text text-base hover:text-[#e88d85] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-brand-text-body/60 mt-0.5">
                    Harga Satuan: Rp {item.final_price.toLocaleString('id-ID')}
                  </p>
                  {item.stock <= 5 && item.stock > 0 && (
                    <span className="text-[11px] text-warning font-semibold mt-1 inline-block">
                      Tersisa {item.stock} pcs lagi
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0">
                {/* Quantity */}
                <div className="flex items-center bg-brand-soft rounded-full p-1">
                  <button
                    onClick={() => updateQty(item.product_id, item.qty - 1)}
                    className="w-7 h-7 rounded-full bg-white text-brand-text-body flex items-center justify-center hover:bg-brand-coral-soft"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center text-xs font-bold text-brand-text-body">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product_id, item.qty + 1)}
                    disabled={item.qty >= item.stock}
                    className="w-7 h-7 rounded-full bg-white text-brand-text-body flex items-center justify-center hover:bg-brand-coral-soft disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <span className="font-serif font-bold text-brand-text text-base sm:text-lg min-w-[110px] text-right">
                  Rp {item.total_price.toLocaleString('id-ID')}
                </span>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="w-8 h-8 rounded-full bg-brand-soft hover:bg-brand-coral-soft text-brand-text-body hover:text-danger flex items-center justify-center transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Right: Order Summary & Voucher */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="font-serif text-xl font-bold text-brand-text mb-4">
              Ringkasan Belanja
            </h2>

            {/* Voucher input form */}
            <form onSubmit={handleApplyVoucher} className="mb-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-gold" />
                Kupon / Kode Voucher
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Contoh: GLOWBARU"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 min-h-[44px] bg-brand-soft text-brand-text-body uppercase text-xs font-bold rounded-2xl px-4 focus:bg-white focus:shadow-focus-coral outline-none border-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  isLoading={isValidatingVoucher}
                  className="min-h-[44px]"
                >
                  Pakai
                </Button>
              </div>
            </form>

            {/* Cost Breakdown */}
            <div className="space-y-3 text-sm text-brand-text-body pt-2">
              <div className="flex justify-between">
                <span>Total Harga ({cartCount} Barang)</span>
                <span className="font-semibold text-brand-text">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {appliedVoucher && (
                <div className="flex justify-between text-success">
                  <span>Diskon Kupon ({appliedVoucher.code})</span>
                  <span className="font-bold">
                    - Rp {discountAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div className="pt-3 flex justify-between items-baseline">
                <span className="font-bold text-base text-brand-text-body">Estimasi Total</span>
                <span className="font-serif text-2xl font-bold text-brand-text">
                  Rp {estimatedTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Button
              onClick={handleProceedToCheckout}
              size="lg"
              className="w-full mt-6"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Lanjut ke Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
