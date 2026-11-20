import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Heart, Truck, ShieldCheck, ArrowLeft, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ProductCard from '../components/product/ProductCard';
import { toast } from 'sonner';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { token } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [selectedImg, setSelectedImg] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'howTo'>('desc');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
          setSelectedImg(data.product.images?.[0]?.path_original || data.product.images?.[0]?.path_medium || '/logo.png');
        } else {
          toast.error('Produk tidak ditemukan');
          navigate('/produk');
        }
      } catch (err) {
        console.error('Fetch product detail error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, navigate]);

  if (loading || !product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full shadow-[0_0_0_4px_rgba(221,105,91,0.25)] animate-pulse mx-auto mb-4 bg-brand-coral-soft flex items-center justify-center text-brand-text font-serif font-bold text-xl">
          Z
        </div>
        <p className="text-brand-text-body font-medium">Memuat detail produk eksklusif...</p>
      </div>
    );
  }

  const regularPrice = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const hasDiscount = discountPrice !== null && discountPrice < regularPrice;
  const finalPrice = hasDiscount ? discountPrice! : regularPrice;
  const rating = product.rating_avg ? parseFloat(product.rating_avg) : 5.0;

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
  };

  const handleBuyNow = async () => {
    const added = await addToCart(product, quantity);
    if (added) {
      navigate('/checkout');
    }
  };

  const handleToggleWishlist = async () => {
    if (!token) {
      toast.info('Silakan masuk untuk menyimpan ke wishlist.');
      return;
    }
    try {
      const res = await fetch(`/api/customer/wishlist/${product.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsWishlisted(data.is_wishlisted);
        toast.success(data.message);
      }
    } catch {
      toast.error('Gagal memperbarui wishlist.');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      {/* Back button */}
      <Link
        to="/produk"
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-text-body hover:text-brand-text mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </Link>

      {/* TOP ROW: GALLERY + BUY BOX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">
        {/* Left: Gallery */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="w-full aspect-square rounded-[36px] bg-brand-soft shadow-card overflow-hidden p-6 sm:p-8 flex items-center justify-center">
            <img
              src={selectedImg}
              alt={product.name}
              className="w-full h-full object-contain rounded-[28px] transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img: any) => {
                const isSelected = selectedImg === img.path_original || selectedImg === img.path_medium;
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImg(img.path_original || img.path_medium)}
                    className={`w-20 h-20 rounded-card-sm overflow-hidden bg-brand-soft p-1 transition-all ${
                      isSelected ? 'shadow-[0_0_0_3px_rgba(221,105,91,0.5)] scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.path_thumb || img.path_medium}
                      alt="Thumbnail"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                {product.category_name}
              </span>
              <span className="text-brand-text-body/30">&bull;</span>
              <span className="text-xs text-brand-text-body/60 font-medium">SKU: {product.sku}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-text tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Rating & Sold count */}
            <div className="flex items-center gap-4 text-xs font-semibold text-brand-text-body">
              <div className="flex items-center gap-1.5 bg-brand-gold-soft text-[#8C6D1F] px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{rating.toFixed(1)}</span>
                <span className="text-[11px] opacity-80">({product.review_count || 1} ulasan)</span>
              </div>
              <span className="text-brand-text-body/70">Terjual {product.sold_count || 0}+ pcs</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-6 bg-brand-soft rounded-card flex items-baseline gap-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-brand-text">
              Rp {finalPrice.toLocaleString('id-ID')}
            </span>
            {hasDiscount && (
              <span className="text-base text-brand-text-body/50 line-through">
                Rp {regularPrice.toLocaleString('id-ID')}
              </span>
            )}
            {hasDiscount && (
              <span className="px-3 py-1 bg-brand-text text-white text-xs font-bold rounded-full shadow-button">
                Hemat Rp {(regularPrice - finalPrice).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Stock & Weight */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-white rounded-2xl shadow-sm flex items-center justify-between">
              <span className="text-brand-text-body/70">Status Stok:</span>
              <span className={`font-bold ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                {product.stock > 0 ? `Tersedia (${product.stock} pcs)` : 'Habis'}
              </span>
            </div>
            <div className="p-3.5 bg-white rounded-2xl shadow-sm flex items-center justify-between">
              <span className="text-brand-text-body/70">Berat Bersih:</span>
              <span className="font-bold text-brand-text-body">{product.weight_gram} gram</span>
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-body">
                Jumlah:
              </span>
              <div className="flex items-center bg-brand-soft rounded-full p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-9 h-9 rounded-full bg-white text-brand-text-body flex items-center justify-center hover:bg-brand-coral-soft disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-brand-text-body">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-9 h-9 rounded-full bg-white text-brand-text-body flex items-center justify-center hover:bg-brand-coral-soft disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                variant="secondary"
                size="lg"
                className="w-full sm:w-1/2"
                icon={<ShoppingBag className="w-5 h-5" />}
              >
                Tambah ke Keranjang
              </Button>

              <Button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                variant="primary"
                size="lg"
                className="w-full sm:w-1/2"
              >
                Beli Sekarang
              </Button>

              <button
                onClick={handleToggleWishlist}
                className="w-14 h-14 rounded-full bg-brand-soft hover:bg-brand-coral-soft flex items-center justify-center text-brand-text-body hover:text-brand-text shrink-0 transition-colors"
                title="Wishlist"
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-brand-text text-brand-text' : ''}`} />
              </button>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-text-body bg-brand-soft/60 p-3 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-brand-gold shrink-0" />
              <span>Jaminan 100% Produk Asli Zfree Glow</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-text-body bg-brand-soft/60 p-3 rounded-2xl">
              <Truck className="w-5 h-5 text-brand-text shrink-0" />
              <span>Garansi Kirim Aman &amp; Cepat</span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: INFORMATION TABS */}
      <Card className="mb-16">
        <div className="flex items-center gap-3 pb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('desc')}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all select-none ${
              activeTab === 'desc'
                ? 'bg-brand-text text-white shadow-button'
                : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
            }`}
          >
            Deskripsi Produk
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all select-none ${
              activeTab === 'ingredients'
                ? 'bg-brand-text text-white shadow-button'
                : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
            }`}
          >
            Kandungan &amp; Komposisi
          </button>
          <button
            onClick={() => setActiveTab('howTo')}
            className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all select-none ${
              activeTab === 'howTo'
                ? 'bg-brand-text text-white shadow-button'
                : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
            }`}
          >
            Cara Pemakaian
          </button>
        </div>

        <div className="pt-2 text-sm sm:text-base text-brand-text-body leading-relaxed whitespace-pre-line font-normal">
          {activeTab === 'desc' && product.description}
          {activeTab === 'ingredients' && (
            <div>
              <p className="font-semibold text-brand-text mb-2">Bahan-Bahan Aktif Terpilih:</p>
              <p>{product.ingredients}</p>
            </div>
          )}
          {activeTab === 'howTo' && (
            <div>
              <p className="font-semibold text-brand-text mb-2">Petunjuk Penggunaan Optimal:</p>
              <p>{product.how_to_use}</p>
            </div>
          )}
        </div>
      </Card>

      {/* CUSTOMER REVIEWS */}
      <div className="mb-16">
        <h3 className="font-serif text-2xl font-bold text-brand-text mb-6">
          Ulasan Pembeli Terverifikasi
        </h3>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.reviews.map((rev: any) => (
              <Card key={rev.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center font-bold text-xs">
                      {rev.user_name?.charAt(0)}
                    </div>
                    <span className="font-bold text-brand-text text-sm">{rev.user_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-brand-gold">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-brand-text-body leading-relaxed">{rev.comment}</p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-brand-soft p-8 rounded-card text-center text-sm text-brand-text-body">
            Belum ada ulasan untuk produk ini. Jadilah yang pertama memberikan ulasan setelah pesanan Anda selesai!
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS */}
      {product.related && product.related.length > 0 && (
        <div>
          <h3 className="font-serif text-2xl font-bold text-brand-text mb-6">
            Produk Terkait dari Kategori Ini
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.related.map((rp: any) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
