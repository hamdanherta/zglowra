import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Check, X, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';

export const AdminProducts: React.FC = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    price: '',
    discount_price: '',
    stock: '',
    weight_gram: '250',
    description: '',
    ingredients: '',
    how_to_use: '',
    is_active: 1,
    is_featured: 0,
  });
  const [images, setImages] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetch('/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.categories || []);
      });
  }, [token]);

  const handleOpenModal = (p: any = null) => {
    if (p) {
      setEditProduct(p);
      setFormData({
        name: p.name,
        category_id: String(p.category_id),
        sku: p.sku,
        price: String(p.price),
        discount_price: p.discount_price ? String(p.discount_price) : '',
        stock: String(p.stock),
        weight_gram: String(p.weight_gram || 250),
        description: p.description,
        ingredients: p.ingredients,
        how_to_use: p.how_to_use,
        is_active: p.is_active,
        is_featured: p.is_featured,
      });
    } else {
      setEditProduct(null);
      setFormData({
        name: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        sku: `ZG-PRD-${Math.floor(100 + Math.random() * 900)}`,
        price: '',
        discount_price: '',
        stock: '50',
        weight_gram: '250',
        description: '',
        ingredients: '',
        how_to_use: '',
        is_active: 1,
        is_featured: 0,
      });
    }
    setImages(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || !formData.price || !formData.sku) {
      toast.error('Lengkapi semua kolom wajib');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        data.append(k, String(v));
      });

      if (images) {
        for (let i = 0; i < images.length; i++) {
          data.append('images', images[i]);
        }
      }

      const url = editProduct ? `/api/admin/products/${editProduct.id}` : '/api/admin/products';
      const method = editProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message);
        setModalOpen(false);
        fetchProducts();
      } else {
        toast.error(resData.message);
      }
    } catch {
      toast.error('Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus/menonaktifkan produk ini?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchProducts();
      }
    } catch {
      toast.error('Gagal menghapus produk');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-text">Kelola Data Produk</h1>
          <p className="text-xs text-brand-text-body/70 mt-1">
            Tambah, perbarui, atur harga diskon, dan kelola stok produk body care.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>
          Tambah Produk Baru
        </Button>
      </div>

      {/* Search box */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="w-full bg-brand-soft text-brand-text-body text-xs rounded-full py-3 pl-10 pr-4 focus:bg-white focus:shadow-focus-coral outline-none border-none"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-body/50" />
        </div>
      </Card>

      {/* Products Table (Desktop) */}
      <Card className="p-6">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-brand-soft text-brand-text font-bold uppercase tracking-wider">
                <th className="p-3.5 rounded-l-2xl">Foto</th>
                <th className="p-3.5">Nama Produk</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Harga Normal</th>
                <th className="p-3.5">Harga Diskon</th>
                <th className="p-3.5">Stok</th>
                <th className="p-3.5">Terjual</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 rounded-r-2xl text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="">
              {products.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-soft/40'}>
                  <td className="p-3.5">
                    <img
                      src={p.path_thumb || '/logo.png'}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-brand-soft"
                    />
                  </td>
                  <td className="p-3.5 font-bold text-brand-text max-w-xs truncate">{p.name}</td>
                  <td className="p-3.5 text-brand-text-body/70">{p.category_name}</td>
                  <td className="p-3.5 font-serif font-bold text-brand-text">
                    Rp {parseFloat(p.price).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5 font-serif font-bold text-success">
                    {p.discount_price ? `Rp ${parseFloat(p.discount_price).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.stock <= 10 ? 'bg-[#FCE8E6] text-danger' : 'bg-brand-soft text-brand-text-body'
                    }`}>
                      {p.stock} pcs
                    </span>
                  </td>
                  <td className="p-3.5 text-brand-text-body/80">{p.sold_count} pcs</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.is_active ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-brand-soft text-brand-text-body/40'
                    }`}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="p-2 bg-brand-soft text-brand-text rounded-xl hover:bg-brand-coral-soft"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 bg-brand-soft text-danger rounded-xl hover:bg-[#FCE8E6]"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards */}
        <div className="lg:hidden space-y-4">
          {products.map((p) => (
            <div key={p.id} className="p-4 bg-brand-soft rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img src={p.path_thumb || '/logo.png'} alt="" className="w-14 h-14 rounded-xl object-cover bg-white" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-brand-text truncate">{p.name}</h4>
                  <p className="text-xs text-brand-text-body/60">{p.category_name} &bull; Stok: {p.stock} pcs</p>
                  <p className="font-serif font-bold text-sm text-brand-text mt-0.5">
                    Rp {parseFloat(p.price).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 ">
                <Button size="sm" variant="secondary" onClick={() => handleOpenModal(p)}>
                  Edit
                </Button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 text-xs text-danger font-semibold bg-white rounded-full"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Produk"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
                Kategori Produk
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full min-h-[52px] bg-brand-soft text-brand-text-body rounded-input px-4 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="SKU Kode"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
            <Input
              type="number"
              label="Harga Normal (Rp)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <Input
              type="number"
              label="Harga Diskon (Rp)"
              placeholder="Opsional"
              value={formData.discount_price}
              onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
            />
            <Input
              type="number"
              label="Stok Barang"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Deskripsi Lengkap Produk
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
                Kandungan / Komposisi
              </label>
              <textarea
                rows={2}
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
                Cara Pemakaian
              </label>
              <textarea
                rows={2}
                value={formData.how_to_use}
                onChange={(e) => setFormData({ ...formData, how_to_use: e.target.value })}
                className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
              />
            </div>
          </div>

          {/* Upload Images */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Unggah Foto Produk (Otomatis Konversi ke WebP Kualitas Tinggi)
            </label>
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={(e) => setImages(e.target.files)}
              className="w-full bg-brand-soft text-brand-text-body p-3 rounded-2xl text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-coral-soft file:text-brand-text"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-brand-text-body cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="accent-brand-text"
              />
              Produk Aktif Ditampilkan
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-brand-text-body cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured === 1}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked ? 1 : 0 })}
                className="accent-brand-text"
              />
              Tampilkan di Beranda (Featured)
            </label>
          </div>

          <Button type="submit" size="md" isLoading={isSubmitting} className="w-full mt-4">
            Simpan Data Produk
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
