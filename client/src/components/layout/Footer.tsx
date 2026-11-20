import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-soft pt-16 pb-12 mt-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Col 1: Brand Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo ZGlowra"
                className="h-12 w-12 object-contain rounded-2xl"
              />
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-brand-text">
                  <span className="text-brand-gold">Z</span>Glowra
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-brand-gold uppercase -mt-1">
                  Zfree Glow Official
                </span>
              </div>
            </Link>

            <p className="text-sm text-brand-text-body/80 leading-relaxed mt-2">
              Sistem informasi e-commerce resmi toko online Zfree Glow. Menghadirkan rangkaian produk body care premium dengan bahan alami pilihan untuk kulit tampak cerah, lembut, dan sehat bercahaya.
            </p>

            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-brand-text bg-white px-4 py-2.5 rounded-full shadow-sm w-fit">
              <ShieldCheck className="w-4 h-4 text-brand-gold flex-shrink-0" />
              <span>100% Asli, Aman &amp; Terdaftar BPOM</span>
            </div>
          </div>

          {/* Col 2: Kategori Populer */}
          <div>
            <h4 className="font-serif text-lg font-bold text-brand-text mb-4">
              Kategori Produk
            </h4>
            <div className="w-8 h-0.5 bg-brand-gold rounded-full mb-4" />
            <ul className="flex flex-col gap-2.5 text-sm text-brand-text-body">
              <li>
                <Link to="/produk?kategori=body-lotion" className="hover:text-brand-text transition-colors">
                  Body Lotion Pencerah
                </Link>
              </li>
              <li>
                <Link to="/produk?kategori=body-scrub" className="hover:text-brand-text transition-colors">
                  Body Scrub &amp; Lulur
                </Link>
              </li>
              <li>
                <Link to="/produk?kategori=body-wash" className="hover:text-brand-text transition-colors">
                  Body Wash &amp; Shower Gel
                </Link>
              </li>
              <li>
                <Link to="/produk?kategori=body-butter" className="hover:text-brand-text transition-colors">
                  Body Butter Nutrisi Intensif
                </Link>
              </li>
              <li>
                <Link to="/produk?kategori=body-mist" className="hover:text-brand-text transition-colors">
                  Body Mist Wewangian Mewah
                </Link>
              </li>
              <li>
                <Link to="/produk?kategori=perawatan-tangan-kaki" className="hover:text-brand-text transition-colors">
                  Perawatan Tangan &amp; Kaki
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Informasi Toko */}
          <div>
            <h4 className="font-serif text-lg font-bold text-brand-text mb-4">
              Informasi &amp; Bantuan
            </h4>
            <div className="w-8 h-0.5 bg-brand-gold rounded-full mb-4" />
            <ul className="flex flex-col gap-2.5 text-sm text-brand-text-body">
              <li>
                <Link to="/tentang" className="hover:text-brand-text transition-colors">
                  Tentang Zfree Glow
                </Link>
              </li>
              <li>
                <Link to="/kontak" className="hover:text-brand-text transition-colors">
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-brand-text transition-colors">
                  Pertanyaan Umum (FAQ)
                </Link>
              </li>
              <li>
                <Link to="/syarat-ketentuan" className="hover:text-brand-text transition-colors">
                  Syarat &amp; Ketentuan
                </Link>
              </li>
              <li>
                <Link to="/kebijakan-privasi" className="hover:text-brand-text transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-brand-gold transition-colors text-xs opacity-75">
                  Portal Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Kontak Toko & Pembayaran */}
          <div>
            <h4 className="font-serif text-lg font-bold text-brand-text mb-4">
              Hubungi Kami
            </h4>
            <div className="w-8 h-0.5 bg-brand-gold rounded-full mb-4" />
            <div className="flex flex-col gap-3 text-xs sm:text-sm text-brand-text-body">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-text mt-0.5 flex-shrink-0" />
                <span>Jl. Kemang Raya No. 88, Mampang Prapatan, Jakarta Selatan</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-text flex-shrink-0" />
                <span>0812-3456-7890</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-text flex-shrink-0" />
                <span>support@zglowra.com</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-body/70 mb-2">
                Metode Pembayaran Transfer
              </p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-[#003B70] shadow-sm">BCA</span>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-[#002D62] shadow-sm">Mandiri</span>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-[#00529C] shadow-sm">BRI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-text-body/70">
          <p>
            &copy; 2026 ZGlowra - Toko Online Zfree Glow. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan cinta untuk kulit sehat bercahaya</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

