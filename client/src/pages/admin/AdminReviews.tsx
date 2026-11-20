import React, { useState, useEffect } from 'react';
import { Star, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { toast } from 'sonner';

export const AdminReviews: React.FC = () => {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReviews(data.reviews || []);
    } catch {}
  };

  useEffect(() => {
    fetchReviews();
  }, [token]);

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchReviews();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">Moderasi Ulasan Pembeli</h1>
        <p className="text-xs text-brand-text-body/70 mt-1">
          Pantau feedback dari pelanggan dan tentukan ulasan yang tampil pada detail produk.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 bg-brand-soft rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-brand-text text-sm">{r.customer_name}</span>
                  <span className="text-xs text-brand-text-body/60">&bull; Produk: <strong>{r.product_name}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-brand-gold mb-2">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-brand-text-body leading-relaxed">{r.comment}</p>
                <span className="text-[10px] text-brand-text-body/50 mt-1 block">
                  {new Date(r.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>

              <button
                onClick={() => handleToggle(r.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-colors ${
                  r.is_visible
                    ? 'bg-[#E6F4EA] text-[#137333] hover:bg-brand-coral-soft hover:text-brand-text'
                    : 'bg-brand-coral-soft text-brand-text hover:bg-[#E6F4EA] hover:text-[#137333]'
                }`}
              >
                {r.is_visible ? 'Tampil di Web' : 'Disembunyikan'}
              </button>
            </div>
          ))}

          {reviews.length === 0 && (
            <p className="text-center py-8 text-xs text-brand-text-body/60">
              Belum ada ulasan yang masuk dari pelanggan.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminReviews;

