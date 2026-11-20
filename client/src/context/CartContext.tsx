import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface CartItem {
  cart_item_id?: number;
  product_id: number;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  final_price: number;
  total_price: number;
  qty: number;
  stock: number;
  path_thumb?: string;
  path_medium?: string;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  addToCart: (product: any, qty?: number) => Promise<boolean>;
  updateQty: (productId: number, qty: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!token) {
      // Local storage cart for guest
      try {
        const local = localStorage.getItem('zglowra_guest_cart');
        if (local) {
          const parsed = JSON.parse(local);
          setCart(parsed);
        } else {
          setCart([]);
        }
      } catch {
        setCart([]);
      }
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/customer/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product: any, qty = 1): Promise<boolean> => {
    const finalPrice = product.discount_price && product.discount_price > 0 ? parseFloat(product.discount_price) : parseFloat(product.price);

    if (token) {
      try {
        const existing = cart.find(i => i.product_id === product.id);
        const newQty = existing ? existing.qty + qty : qty;

        const res = await fetch('/api/customer/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: product.id, qty: newQty }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || 'Berhasil ditambahkan ke keranjang!');
          await refreshCart();
          return true;
        } else {
          toast.error(data.message || 'Gagal menambahkan ke keranjang');
          return false;
        }
      } catch (err) {
        toast.error('Terjadi kesalahan koneksi.');
        return false;
      }
    } else {
      // Guest cart
      const existingIdx = cart.findIndex(i => i.product_id === product.id);
      let updatedCart = [...cart];
      if (existingIdx > -1) {
        updatedCart[existingIdx].qty += qty;
        updatedCart[existingIdx].total_price = updatedCart[existingIdx].qty * updatedCart[existingIdx].final_price;
      } else {
        updatedCart.push({
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: parseFloat(product.price),
          discount_price: product.discount_price ? parseFloat(product.discount_price) : null,
          final_price: finalPrice,
          total_price: finalPrice * qty,
          qty,
          stock: product.stock,
          path_thumb: product.path_thumb || product.images?.[0]?.path_thumb,
        });
      }
      setCart(updatedCart);
      localStorage.setItem('zglowra_guest_cart', JSON.stringify(updatedCart));
      toast.success(`Produk "${product.name}" ditambahkan ke keranjang!`);
      return true;
    }
  };

  const updateQty = async (productId: number, qty: number) => {
    if (qty <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (token) {
      try {
        const res = await fetch('/api/customer/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: productId, qty }),
        });
        const data = await res.json();
        if (data.success) {
          await refreshCart();
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        toast.error('Gagal memperbarui jumlah');
      }
    } else {
      const updated = cart.map(item => {
        if (item.product_id === productId) {
          return {
            ...item,
            qty,
            total_price: item.final_price * qty,
          };
        }
        return item;
      });
      setCart(updated);
      localStorage.setItem('zglowra_guest_cart', JSON.stringify(updated));
    }
  };

  const removeFromCart = async (productId: number) => {
    if (token) {
      try {
        const res = await fetch(`/api/customer/cart/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Item dihapus dari keranjang.');
          await refreshCart();
        }
      } catch (err) {
        toast.error('Gagal menghapus item.');
      }
    } else {
      const updated = cart.filter(i => i.product_id !== productId);
      setCart(updated);
      localStorage.setItem('zglowra_guest_cart', JSON.stringify(updated));
      toast.success('Item dihapus dari keranjang.');
    }
  };

  const clearCart = async () => {
    if (token) {
      try {
        await fetch('/api/customer/cart', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    setCart([]);
    localStorage.removeItem('zglowra_guest_cart');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        loading,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

