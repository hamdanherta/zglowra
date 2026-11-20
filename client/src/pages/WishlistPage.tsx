import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';

export const WishlistPage: React.FC = () => {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customer/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWishlist(data.wishlist || []);
      }
    } catch {
      toast.error('Gagal memuat wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/masuk');
      return;
    }
    fetchWishlist();
  }, [token, navigate]);

  const handleRemove = async (productId: number) => {
    try {
      await fetch(`/api/customer/wishlist/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Dihapus dari wishlist');
      fetchWishlist();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center">
        <p className="text-brand-text-body font-medium">Memuat wishlist Anda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text tracking-tight">
          Wishlist Produk Pilihan ({wishlist.length})
        </h1>
        <div className="w-12 h-1 bg-brand-gold rounded-full mt-2" />
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            const price = parseFloat(item.price);
            const discountPrice = item.discount_price ? parseFloat(item.discount_price) : null;
            const finalPrice = discountPrice !== null && discountPrice < price ? discountPrice : price;

            return (
              <Card key={item.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-soft mb-3">
                    <img
                      src={item.path_medium || item.path_thumb || '/logo.png'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-brand-text-body hover:text-danger flex items-center justify-center transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Link to={`/produk/${item.slug}`}>
                    <h3 className="font-serif font-bold text-brand-text text-base line-clamp-2 hover:text-[#e88d85] mb-2">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="font-serif text-lg font-bold text-brand-text">
                    Rp {finalPrice.toLocaleString('id-ID')}
                  </p>
                </div>

                <Button
                  onClick={() => addToCart(item, 1)}
                  disabled={item.stock <= 0}
                  size="sm"
                  className="w-full mt-4"
                  icon={<ShoppingBag className="w-4 h-4" />}
                >
                  {item.stock > 0 ? 'Pindahkan ke Keranjang' : 'Stok Habis'}
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="w-12 h-12" />}
          title="Wishlist Masih Kosong"
          description="Anda belum menandai produk body care favorit. Simpan produk yang Anda sukai agar mudah ditemukan saat siap berbelanja."
          actionText="Jelajahi Produk Sekarang"
          onAction={() => navigate('/produk')}
        />
      )}
    </div>
  );
};

export default WishlistPage;
