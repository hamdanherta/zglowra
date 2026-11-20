import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Truck, CreditCard, ShieldCheck, ArrowRight, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const appliedVoucher = location.state?.appliedVoucher || null;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BCA');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address Modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Rumah',
    penerima: user?.name || '',
    telepon: user?.phone || '',
    provinsi: 'DKI Jakarta',
    kota: 'Jakarta Selatan',
    kecamatan: '',
    kode_pos: '',
    alamat_lengkap: '',
    is_default: 1,
  });

  useEffect(() => {
    if (!token) {
      navigate('/masuk?redirect=/checkout');
      return;
    }

    // Load addresses
    fetch('/api/customer/addresses', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.addresses) {
          setAddresses(d.addresses);
          const def = d.addresses.find((a: any) => a.is_default) || d.addresses[0];
          if (def) setSelectedAddressId(def.id);
        }
      });

    // Load settings for courier list
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings?.couriers) {
          setCouriers(d.settings.couriers);
          setSelectedCourier(d.settings.couriers[0]);
        }
      });
  }, [token, navigate, user]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Alamat berhasil ditambahkan!');
        setAddressModalOpen(false);
        // Refresh addresses
        const refRes = await fetch('/api/customer/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refData = await refRes.json();
        if (refData.success) {
          setAddresses(refData.addresses);
          setSelectedAddressId(data.addressId || refData.addresses[0]?.id);
        }
      } else {
        toast.error(data.message || 'Gagal menambahkan alamat');
      }
    } catch {
      toast.error('Gagal menambahkan alamat');
    }
  };

  const discountAmount = appliedVoucher ? parseFloat(appliedVoucher.discount) : 0;
  const shippingCost = selectedCourier ? parseFloat(selectedCourier.cost) : 15000;
  const finalTotal = subtotal - discountAmount + shippingCost;

  const handleCreateOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.');
      return;
    }

    const activeAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!activeAddress) {
      toast.error('Alamat tidak valid.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })),
          addressSnapshot: {
            penerima: activeAddress.penerima,
            telepon: activeAddress.telepon,
            provinsi: activeAddress.provinsi,
            kota: activeAddress.kota,
            kecamatan: activeAddress.kecamatan,
            kode_pos: activeAddress.kode_pos,
            alamat_lengkap: activeAddress.alamat_lengkap,
          },
          courier: selectedCourier ? `${selectedCourier.name} (${selectedCourier.etd})` : 'J&T Express',
          shippingCost,
          voucherCode: appliedVoucher ? appliedVoucher.code : null,
          paymentMethod,
          note: orderNote || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        toast.success('Pesanan berhasil dibuat!');
        await clearCart();
        navigate(`/pesanan/${data.order.code}/pembayaran`);
      } else {
        toast.error(data.message || 'Gagal membuat pesanan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4">Keranjang Kosong</h2>
        <Button onClick={() => navigate('/produk')}>Kembali ke Katalog</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Checkout Pesanan
        </h1>
        <div className="w-12 h-1 bg-brand-gold rounded-full mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* 1. Alamat Pengiriman */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-gold" />
                Alamat Pengiriman
              </h2>
              <button
                onClick={() => setAddressModalOpen(true)}
                className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Alamat Baru
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-coral-soft shadow-[0_0_0_3px_rgba(221,105,91,0.4)]'
                          : 'bg-brand-soft hover:bg-[#fedbd7]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-brand-text uppercase">{addr.label}</span>
                        {addr.is_default ? (
                          <span className="text-[10px] font-bold bg-white text-brand-gold px-2 py-0.5 rounded-full">
                            Utama
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-bold text-brand-text-body">{addr.penerima}</p>
                      <p className="text-xs text-brand-text-body/70">{addr.telepon}</p>
                      <p className="text-xs text-brand-text-body mt-2 line-clamp-2">{addr.alamat_lengkap}</p>
                      <p className="text-xs text-brand-text-body/60 mt-0.5">
                        {addr.kota}, {addr.provinsi} {addr.kode_pos}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-brand-soft rounded-2xl">
                <p className="text-sm text-brand-text-body mb-3">Belum ada alamat pengiriman yang tersimpan.</p>
                <Button size="sm" onClick={() => setAddressModalOpen(true)}>
                  Tambah Alamat Sekarang
                </Button>
              </div>
            )}
          </Card>

          {/* 2. Pilihan Kurir Pengiriman */}
          <Card className="p-6">
            <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-brand-gold" />
              Pilihan Jasa Kurir Pengiriman
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {couriers.map((c) => {
                const isSelected = selectedCourier?.code === c.code;
                return (
                  <div
                    key={c.code}
                    onClick={() => setSelectedCourier(c)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-coral-soft shadow-[0_0_0_3px_rgba(221,105,91,0.4)]'
                        : 'bg-brand-soft hover:bg-[#fedbd7]/50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm text-brand-text">{c.name}</p>
                      <p className="text-xs text-brand-text-body/60 mt-0.5">Estimasi {c.etd}</p>
                    </div>
                    <span className="font-serif font-bold text-sm text-brand-text-body">
                      Rp {c.cost.toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 3. Metode Pembayaran Transfer Bank */}
          <Card className="p-6">
            <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-brand-gold" />
              Metode Pembayaran
            </h2>

            <div className="space-y-3">
              {['Transfer Bank BCA', 'Transfer Bank Mandiri', 'Transfer Bank BRI'].map((bank) => (
                <label
                  key={bank}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    paymentMethod === bank
                      ? 'bg-brand-coral-soft shadow-[0_0_0_3px_rgba(221,105,91,0.4)]'
                      : 'bg-brand-soft'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={bank}
                      checked={paymentMethod === bank}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="accent-brand-text"
                    />
                    <span className="text-sm font-bold text-brand-text-body">{bank}</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-gold">Verifikasi Manual</span>
                </label>
              ))}
            </div>

            <div className="mt-4 p-3 bg-brand-soft rounded-xl text-xs text-brand-text-body/70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0" />
              <span>Instruksi nomor rekening transfer akan ditampilkan setelah Anda menekan tombol Buat Pesanan.</span>
            </div>
          </Card>

          {/* 4. Catatan Pesanan */}
          <Card className="p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-body mb-2">
              Catatan Pesanan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Mohon dikemas dengan bubble wrap ekstra..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full min-h-[48px] bg-brand-soft text-brand-text-body text-sm rounded-input px-4 focus:bg-white focus:shadow-focus-coral outline-none border-none"
            />
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 sticky top-28">
            <h2 className="font-serif text-xl font-bold text-brand-text mb-4">
              Ringkasan Pembayaran
            </h2>

            {/* Items Brief */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between text-xs gap-3">
                  <span className="text-brand-text-body line-clamp-1 flex-1">
                    {item.name} <strong className="text-brand-text">x{item.qty}</strong>
                  </span>
                  <span className="font-semibold text-brand-text shrink-0">
                    Rp {item.total_price.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 text-xs text-brand-text-body pt-3">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-brand-text">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim ({selectedCourier?.name || 'Kurir'})</span>
                <span className="font-semibold">Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-success">
                  <span>Diskon Kupon ({appliedVoucher.code})</span>
                  <span className="font-bold">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-brand-text-body">Total Tagihan</span>
                <span className="font-serif text-2xl font-bold text-brand-text">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCreateOrder}
              isLoading={isSubmitting}
              size="lg"
              className="w-full mt-6"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Buat Pesanan Sekarang
            </Button>
          </Card>
        </div>
      </div>

      {/* NEW ADDRESS MODAL */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Tambah Alamat Pengiriman"
      >
        <form onSubmit={handleCreateAddress} className="space-y-4">
          <Input
            label="Label Alamat"
            placeholder="Contoh: Rumah, Kantor, Kos"
            value={newAddress.label}
            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Penerima"
              value={newAddress.penerima}
              onChange={(e) => setNewAddress({ ...newAddress, penerima: e.target.value })}
              required
            />
            <Input
              label="Nomor Telepon"
              value={newAddress.telepon}
              onChange={(e) => setNewAddress({ ...newAddress, telepon: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Provinsi"
              value={newAddress.provinsi}
              onChange={(e) => setNewAddress({ ...newAddress, provinsi: e.target.value })}
              required
            />
            <Input
              label="Kota / Kabupaten"
              value={newAddress.kota}
              onChange={(e) => setNewAddress({ ...newAddress, kota: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kecamatan"
              value={newAddress.kecamatan}
              onChange={(e) => setNewAddress({ ...newAddress, kecamatan: e.target.value })}
              required
            />
            <Input
              label="Kode Pos"
              value={newAddress.kode_pos}
              onChange={(e) => setNewAddress({ ...newAddress, kode_pos: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Alamat Lengkap &amp; Patokan
            </label>
            <textarea
              rows={3}
              value={newAddress.alamat_lengkap}
              onChange={(e) => setNewAddress({ ...newAddress, alamat_lengkap: e.target.value })}
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
              required
            />
          </div>
          <Button type="submit" size="md" className="w-full">
            Simpan Alamat
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
