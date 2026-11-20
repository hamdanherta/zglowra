import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export interface Product {
  id: number;
  category_id?: number;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number | string;
  discount_price?: number | string | null;
  stock: number;
  sold_count?: number;
  category_name?: string;
  category_slug?: string;
  path_medium?: string;
  path_thumb?: string;
  rating_avg?: number | string | null;
  review_count?: number;
}

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { token } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const regularPrice = parseFloat(String(product.price));
  const discountPrice = product.discount_price ? parseFloat(String(product.discount_price)) : null;
  const hasDiscount = discountPrice !== null && discountPrice < regularPrice;
  const discountPercent = hasDiscount ? Math.round(((regularPrice - discountPrice!) / regularPrice) * 100) : 0;
  const finalPrice = hasDiscount ? discountPrice! : regularPrice;
  const rating = product.rating_avg ? parseFloat(String(product.rating_avg)) : 5.0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    await addToCart(product, 1);
    setIsAdding(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toast.info('Silakan masuk untuk menyimpan produk ke wishlist.');
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

  const imageSrc = product.path_medium || product.path_thumb || '/logo.png';

  return (
    <div className="group relative bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Image Container with Badges */}
        <div className="relative w-full aspect-square rounded-card-img overflow-hidden bg-brand-soft mb-4">
          <Link to={`/produk/${product.slug}`}>
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-brand-text text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-button select-none">
              Hemat {discountPercent}%
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-brand-text-body hover:text-brand-text hover:bg-white shadow-sm transition-all"
            title="Tambah ke Wishlist"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'fill-brand-text text-brand-text' : ''
              }`}
            />
          </button>
        </div>

        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold truncate">
            {product.category_name || 'Body Care'}
          </span>
          <div className="flex items-center gap-1 text-xs font-semibold text-brand-text-body shrink-0">
            <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Product Title */}
        <Link to={`/produk/${product.slug}`}>
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-text line-clamp-2 leading-snug group-hover:text-[#e88d85] transition-colors mb-3">
            {product.name}
          </h3>
        </Link>
      </div>

      {/* Pricing & Add to Cart button */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-serif text-lg sm:text-xl font-bold text-brand-text leading-tight">
            Rp {finalPrice.toLocaleString('id-ID')}
          </span>
          {hasDiscount && (
            <span className="text-xs text-brand-text-body/50 line-through">
              Rp {regularPrice.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0 || isAdding}
          className="w-11 h-11 rounded-full bg-brand-coral-soft hover:bg-brand-text text-brand-text hover:text-white flex items-center justify-center shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          title={product.stock > 0 ? 'Beli / Tambah ke Keranjang' : 'Stok Habis'}
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

