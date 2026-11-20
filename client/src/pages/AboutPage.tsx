import React, { useState, useEffect } from 'react';
import SectionTitle from '../components/ui/SectionTitle';
import Card from '../components/ui/Card';
import { ShieldCheck, Leaf, Heart, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/api/pages/tentang')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.page) {
          setContent(d.page.content);
        }
      });
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <SectionTitle
        title="Tentang Zfree Glow"
        subtitle="Sentuhan Kemewahan Perawatan Kulit Tubuh Alami yang Didedikasikan untuk Keanggunan Anda."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-brand-soft p-8 rounded-card text-brand-text-body text-base leading-relaxed whitespace-pre-line">
            {content || `Zfree Glow adalah brand perawatan tubuh (body care) premium yang berdedikasi menghadirkan kecantikan kulit cerah, sehat, dan bercahaya alami bagi setiap wanita Indonesia.

Kami percaya bahwa merawat kulit tubuh bukan sekadar rutinitas, melainkan bentuk cinta dan penghargaan terhadap diri sendiri. Setiap formulasi produk kami dirancang secara cermat menggunakan perpaduan bahan aktif modern teruji seperti Glutathione, Niacinamide, dan Alpha Arbutin yang dipadukan dengan kebaikan alami botani seperti Shea Butter, Susu Kambing, dan Minyak Esensial.

Seluruh produk ZGlowra telah terdaftar resmi di Badan Pengawas Obat dan Makanan (BPOM) Republik Indonesia, tersertifikasi Halal, bebas merkuri, dan bebas hidrokuinon, sehingga aman digunakan untuk pemakaian jangka panjang tanpa efek samping.`}
          </div>
        </div>

        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="p-6 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-brand-text text-lg">Terdaftar BPOM RI</h3>
            <p className="text-xs text-brand-text-body leading-relaxed">
              Jaminan legalitas dan keamanan uji laboratorium klinis bebas bahan kimia berbahaya.
            </p>
          </Card>

          <Card className="p-6 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-gold-soft text-brand-gold flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-brand-text text-lg">Formula Premium</h3>
            <p className="text-xs text-brand-text-body leading-relaxed">
              Kandungan Niacinamide, Glutathione, dan Shea Butter dengan konsentrasi optimal.
            </p>
          </Card>

          <Card className="p-6 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-soft text-brand-text flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-brand-text text-lg">Bahan Alami Botani</h3>
            <p className="text-xs text-brand-text-body leading-relaxed">
              Bebas paraben berlebih, lembut dan menenangkan bahkan untuk kulit sensitif.
            </p>
          </Card>

          <Card className="p-6 flex flex-col gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-brand-text text-lg">Aroma Tahan Lama</h3>
            <p className="text-xs text-brand-text-body leading-relaxed">
              Wewangian khas bunga dan buah elegan yang memancarkan rasa percaya diri sepanjang hari.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

