import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Truck, Heart, ArrowRight, Star, ShoppingBag } from 'lucide-react';
import ProductCard, { Product } from '../components/product/ProductCard';
import SectionTitle from '../components/ui/SectionTitle';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ProductCardSkeleton } from '../components/ui/Skeleton';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, testRes] = await Promise.all([
          fetch('/api/products/featured'),
          fetch('/api/categories'),
          fetch('/api/testimonials'),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();
        const testData = await testRes.json();

        if (prodData.success) {
          setFeaturedProducts(prodData.featured || []);
          setBestSellers(prodData.bestSellers || []);
        }
        if (catData.success) {
          setCategories(catData.categories || []);
        }
        if (testData.success) {
          setTestimonials(testData.testimonials || []);
        }
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-brand-soft py-12 sm:py-20 lg:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-coral-soft text-brand-text text-xs font-bold tracking-wider uppercase select-none">
                <span>Formula Alami Mewah &amp; Teruji BPOM</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-text tracking-tight leading-[1.15]">
                Rahasia Kulit Tubuh <br />
                <span className="text-[#e88d85]">Cerah &amp; Halus Alami</span>
              </h1>

              {/* Decorative Gold Touch */}
              <div className="w-16 h-1 bg-brand-gold rounded-full" />

              <p className="text-base sm:text-lg text-brand-text-body max-w-xl font-normal leading-relaxed">
                Temukan rangkaian perawatan tubuh eksklusif dari <strong>Zfree Glow</strong>. Diformulasikan dengan Niacinamide, Glutathione, dan Shea Butter murni untuk nutrisi mendalam, kelembapan tahan lama, dan aroma wewangian yang memikat.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/produk">
                  <Button size="lg" icon={<ShoppingBag className="w-5 h-5" />}>
                    Belanja Sekarang
                  </Button>
                </Link>
                <Link to="/tentang">
                  <Button variant="secondary" size="lg">
                    Tentang Zfree Glow
                  </Button>
                </Link>
              </div>

              {/* Trust Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-6 mt-4">
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-text">100%</p>
                  <p className="text-xs text-brand-text-body font-medium">Bahan Aman BPOM</p>
                </div>
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-text">24+</p>
                  <p className="text-xs text-brand-text-body font-medium">Varian Body Care</p>
                </div>
                <div>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-text">4.9 / 5</p>
                  <p className="text-xs text-brand-text-body font-medium">Kepuasan Pelanggan</p>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Art */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/5] rounded-[36px] bg-gradient-to-tr from-brand-coral-soft to-white shadow-card-hover overflow-hidden flex items-center justify-center p-8">
                <img
                  src="/uploads/banners/banner1.webp"
                  alt="Zfree Glow Body Care"
                  className="w-full h-full object-cover rounded-[28px]"
                  onError={(e) => {
                    // Fallback to logo if banner not yet generated
                    e.currentTarget.src = '/logo.png';
                  }}
                />
                {/* Floating pill badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-card shadow-card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-brand-text text-sm">Zfree Glow Gluta-Kojic</p>
                    <p className="text-xs text-brand-text-body/70">Terlaris Bulan Ini &bull; Rating 5.0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KEUNGGULAN TOKO (VALUE PROPOSITIONS) */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <Card className="flex flex-col items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-text">Bahan Alami Teruji</h3>
            <p className="text-sm text-brand-text-body leading-relaxed">
              Diperkaya ekstrak murni tumbuh-tumbuhan botani, vitamin esensial, dan bahan aktif pencerah yang aman untuk kulit sensitif.
            </p>
          </Card>

          <Card className="flex flex-col items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-gold-soft text-brand-gold flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-text">BPOM &amp; Halal Resmi</h3>
            <p className="text-sm text-brand-text-body leading-relaxed">
              Seluruh produk terdaftar resmi di BPOM RI dan bersertifikasi Halal, bebas zat berbahaya merkuri dan hidrokuinon.
            </p>
          </Card>

          <Card className="flex flex-col items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-text">Pengiriman Cepat &amp; Aman</h3>
            <p className="text-sm text-brand-text-body leading-relaxed">
              Bekerja sama dengan kurir terpercaya JNE, J&amp;T, SiCepat, dan Pos Indonesia dengan packing bubble wrap tebal gratis.
            </p>
          </Card>

          <Card className="flex flex-col items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-soft text-brand-text flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-brand-text">Pelayanan Ramah</h3>
            <p className="text-sm text-brand-text-body leading-relaxed">
              Tim customer care siap membantu konsultasi jenis kulit dan panduan pemakaian produk melalui WhatsApp setiap hari.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. KATEGORI PILIHAN */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Koleksi Perawatan Tubuh"
          subtitle="Pilih kategori perawatan yang sesuai dengan kebutuhan kulit Anda untuk hasil yang optimal dan menawan."
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/produk?kategori=${cat.slug}`}
              className="group bg-white rounded-card shadow-card hover:shadow-card-hover p-5 text-center flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1.5"
            >
              <div className="w-16 h-16 rounded-full bg-brand-soft group-hover:bg-brand-coral-soft flex items-center justify-center text-brand-text transition-colors">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-serif text-sm sm:text-base font-bold text-brand-text leading-tight group-hover:text-[#e88d85]">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-brand-text-body/60 mt-1 block">
                  {cat.product_count || 4} Produk
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PRODUK TERLARIS (BEST SELLERS) */}
      <section className="bg-brand-soft py-16 sm:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
                Paling Diminati Pelanggan
              </h2>
              <div className="w-12 h-1 bg-brand-gold rounded-full mt-2" />
            </div>
            <Link to="/produk?sort=terlaris">
              <Button variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Lihat Semua Produk
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : (
              bestSellers.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. PRODUK UNGGULAN & DISKON */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Rekomendasi Spesial"
          subtitle="Pilihan produk body care terbaik dengan penawaran harga istimewa untuk memanjakan diri Anda."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : (
            featuredProducts.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>
      </section>

      {/* 6. TESTIMONI PELANGGAN */}
      <section className="bg-brand-soft py-16 sm:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Cerita Sahabat ZGlowra"
            subtitle="Kepuasan pelanggan setia adalah bukti nyata dari kualitas formula perawatan tubuh kami."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testi) => (
              <Card key={testi.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-3 text-brand-gold">
                    {Array.from({ length: testi.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-brand-text-body italic leading-relaxed mb-4">
                    "{testi.content}"
                  </p>
                </div>
                <div className="pt-3  flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center font-bold text-sm">
                    {testi.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-brand-text text-sm">{testi.name}</h5>
                    <p className="text-xs text-brand-text-body/60">{testi.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA SECTION */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-brand-coral-soft to-brand-soft rounded-[36px] shadow-card p-8 sm:p-14 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white text-brand-text flex items-center justify-center shadow-sm">
            <Heart className="w-8 h-8 fill-brand-coral-soft" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-text tracking-tight max-w-2xl">
            Saatnya Memanjakan Kulit Tubuh Anda dengan Perawatan Terbaik
          </h2>
          <p className="text-base sm:text-lg text-brand-text-body max-w-xl">
            Dapatkan kulit cerah merona, wangi tahan lama, dan kelembapan prima setiap hari bersama produk resmi Zfree Glow.
          </p>
          <Link to="/produk">
            <Button size="lg" icon={<ShoppingBag className="w-5 h-5" />}>
              Mulai Belanja Sekarang
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
