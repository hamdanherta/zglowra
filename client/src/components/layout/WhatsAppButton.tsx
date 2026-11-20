import React from 'react';
import { Phone } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const whatsappNumber = '6281234567890';
  const message = encodeURIComponent('Halo ZGlowra, saya ingin bertanya tentang produk perawatan body care Zfree Glow.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <aside
      aria-label="Kontak WhatsApp"
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-3"
    >
      <span className="hidden sm:inline-block bg-white text-brand-text-body text-xs font-bold px-4 py-2 rounded-full shadow-card opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Tanya Kami via WhatsApp
      </span>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none"
        aria-label="Hubungi WhatsApp Toko ZGlowra"
      >
        <Phone className="w-6 h-6 fill-current" />
      </a>
    </aside>
  );
};

export default WhatsAppButton;

