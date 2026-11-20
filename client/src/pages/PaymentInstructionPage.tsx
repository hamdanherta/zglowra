import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Copy, Upload, Clock, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { toast } from 'sonner';

export const PaymentInstructionPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/masuk');
      return;
    }

    // Load order
    fetch(`/api/customer/orders/${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.order) {
          setOrder(d.order);
        } else {
          toast.error('Pesanan tidak ditemukan');
          navigate('/akun/pesanan');
        }
      })
      .finally(() => setLoading(false));

    // Load store bank accounts
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings?.bank_accounts) {
          setBankAccounts(d.settings.bank_accounts);
        }
      });
  }, [code, token, navigate]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Nomor rekening berhasil disalin!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB.');
        return;
      }
      setProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error('Silakan pilih foto bukti transfer Anda.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('proof', proofFile);
      formData.append('bank', selectedBank);
      formData.append('amount', order.total);

      const res = await fetch(`/api/customer/orders/${order.code}/payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Bukti transfer berhasil diunggah!');
        navigate(`/akun/pesanan/${order.code}`);
      } else {
        toast.error(data.message || 'Gagal mengunggah bukti');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center">
        <p className="text-brand-text-body font-medium">Memuat instruksi pembayaran...</p>
      </div>
    );
  }

  const defaultBanks = bankAccounts.length > 0 ? bankAccounts : [
    { bank: 'BCA', number: '8210987654', holder: 'PT ZFREE GLOW NUSANTARA' },
    { bank: 'Mandiri', number: '1370098765432', holder: 'PT ZFREE GLOW NUSANTARA' },
    { bank: 'BRI', number: '034101009876530', holder: 'PT ZFREE GLOW NUSANTARA' },
  ];

  const currentBank = defaultBanks.find((b) => b.bank === selectedBank) || defaultBanks[0];

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Instruksi Pembayaran Transfer
        </h1>
        <p className="text-sm text-brand-text-body mt-2">
          Pesanan <strong>{order.code}</strong> berhasil dibuat. Selesaikan pembayaran dalam 24 jam.
        </p>
      </div>

      <div className="space-y-6">
        {/* Total Box */}
        <Card className="p-6 text-center bg-brand-soft">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-text-body/70">
            Total yang Harus Ditransfer
          </span>
          <div className="font-serif text-3xl sm:text-4xl font-bold text-brand-text mt-1">
            Rp {parseFloat(order.total).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-brand-gold font-bold mt-2">
            Mohon transfer sesuai nominal persis hingga digit terakhir
          </p>
        </Card>

        {/* Bank Selection & Account Info */}
        <Card className="p-6">
          <h2 className="font-serif text-xl font-bold text-brand-text mb-4">
            Pilih Rekening Tujuan Transfer
          </h2>

          <div className="flex gap-2 mb-6">
            {defaultBanks.map((b) => (
              <button
                key={b.bank}
                onClick={() => setSelectedBank(b.bank)}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                  selectedBank === b.bank
                    ? 'bg-brand-text text-white shadow-button'
                    : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
                }`}
              >
                {b.bank}
              </button>
            ))}
          </div>

          <div className="p-5 bg-brand-soft rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-brand-text-body/60 font-semibold uppercase">Nomor Rekening {currentBank.bank}</p>
              <p className="font-mono text-2xl font-bold text-brand-text tracking-wider mt-0.5">
                {currentBank.number}
              </p>
              <p className="text-xs text-brand-text-body font-medium mt-1">
                Atas Nama: <strong>{currentBank.holder}</strong>
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopy(currentBank.number)}
              icon={<Copy className="w-4 h-4" />}
            >
              Salin Nomor
            </Button>
          </div>
        </Card>

        {/* Upload Proof Form */}
        <Card className="p-6">
          <h2 className="font-serif text-xl font-bold text-brand-text mb-2">
            Unggah Bukti Transfer
          </h2>
          <p className="text-xs text-brand-text-body/70 mb-6">
            Format file: JPG, PNG, atau WebP (Maksimal 10 MB). Gambar akan otomatis dioptimasi ke format WebP berkualitas tinggi.
          </p>

          <form onSubmit={handleUploadPayment} className="space-y-6">
            {/* Dropzone */}
            <div className="relative bg-brand-soft hover:bg-brand-coral-soft/50 shadow-inner rounded-[28px] p-6 text-center transition-colors flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Preview Bukti Transfer"
                    className="max-h-56 rounded-2xl object-contain shadow-sm"
                  />
                  <span className="text-xs font-bold text-brand-text">
                    Klik untuk mengganti foto bukti
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-brand-soft text-brand-text flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-brand-text mt-1">
                    Pilih atau Seret Foto Bukti Transfer ke Sini
                  </p>
                  <p className="text-xs text-brand-text-body/60">
                    Mendukung kamera HP langsung atau galeri foto
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isUploading}
              disabled={!proofFile}
              className="w-full"
              icon={<CheckCircle className="w-5 h-5" />}
            >
              Kirim Bukti Pembayaran
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to={`/akun/pesanan/${order.code}`}
              className="text-xs font-semibold text-brand-text hover:underline"
            >
              Nanti Saja / Lihat Status Pesanan Saya &rarr;
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentInstructionPage;
