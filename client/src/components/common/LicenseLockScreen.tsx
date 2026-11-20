import React, { useState } from 'react';
import { Lock, MessageCircle, RefreshCw, ShieldAlert, CheckCircle } from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';
import Button from '../ui/Button';
import Card from '../ui/Card';

export const LicenseLockScreen: React.FC = () => {
  const { isLocked, lockInfo, checkStatus } = useLicense();
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isLocked) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    setFeedback(null);
    try {
      const result = await checkStatus(true);
      if (!result?.isLocked) {
        setFeedback('Aplikasi berhasil diaktifkan kembali!');
      } else {
        setFeedback('Status di Google Sheet masih dalam status KUNCI / NONAKTIF.');
      }
    } catch (err) {
      setFeedback('Gagal menghubungi server. Pastikan komputer terhubung ke internet.');
    } finally {
      setRefreshing(false);
    }
  };

  // Bersihkan format nomor WA (contoh: 0812 -> 62812)
  let cleanPhone = (lockInfo.contact || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        'Halo Developer ZGlowra, saya ingin mengonfirmasi aktivasi lisensi sistem e-commerce pada perangkat ini.'
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FFF8F7]/95 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <Card className="max-w-md w-full p-8 text-center shadow-card-hover bg-white flex flex-col items-center">
        {/* Lock Icon Halo */}
        <div className="w-20 h-20 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center mb-6 shadow-[0_0_0_8px_rgba(221,105,91,0.15)] animate-pulse">
          <Lock className="w-10 h-10" />
        </div>

        {/* Title */}
        <h1 className="font-serif text-2xl font-bold text-brand-text mb-3">
          {lockInfo.title || 'Akses Aplikasi Dinonaktifkan'}
        </h1>

        {/* Message */}
        <p className="text-sm text-brand-text-body/80 leading-relaxed mb-6">
          {lockInfo.message ||
            'Aplikasi ini telah dinonaktifkan sementara oleh pengembang sistem. Silakan hubungi pihak developer untuk pembukaan akses lisensi.'}
        </p>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`w-full p-3 mb-5 rounded-2xl text-xs font-semibold ${
              feedback.includes('berhasil')
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-brand-coral-soft text-brand-text'
            }`}
          >
            {feedback}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-6 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-button transition-all duration-150 active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Hubungi Pengembang via WhatsApp</span>
            </a>
          )}

          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memeriksa Status...' : 'Cek Status Aktivasi Ulang'}
          </Button>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 flex items-center justify-center gap-2 text-[11px] text-brand-text-body/50">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-gold" />
          <span>Sistem Lisensi Cloud Real-Time ZGlowra</span>
        </div>
      </Card>
    </div>
  );
};

export default LicenseLockScreen;
