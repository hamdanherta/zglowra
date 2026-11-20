import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';

export const AdminCategories: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCats = async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCategories(data.categories || []);
    } catch {}
  };

  useEffect(() => {
    fetchCats();
  }, [token]);

  const handleOpenModal = (c: any = null) => {
    if (c) {
      setEditCat(c);
      setName(c.name);
      setDescription(c.description || '');
    } else {
      setEditCat(null);
      setName('');
      setDescription('');
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const url = editCat ? `/api/admin/categories/${editCat.id}` : '/api/admin/categories';
      const method = editCat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setModalOpen(false);
        fetchCats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchCats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-text">Kelola Kategori Produk</h1>
          <p className="text-xs text-brand-text-body/70 mt-1">Daftar kategori body care pada toko ZGlowra.</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>
          Tambah Kategori
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.id} className="p-4 bg-brand-soft rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-serif font-bold text-brand-text text-base">{c.name}</h4>
                <p className="text-xs text-brand-text-body/70 mt-0.5">{c.description || 'Tanpa deskripsi'}</p>
                <span className="text-[11px] font-mono text-brand-gold mt-1 block">slug: {c.slug}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="p-2 rounded-xl bg-white text-brand-text hover:bg-brand-coral-soft"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 rounded-xl bg-white text-danger hover:bg-[#FCE8E6]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCat ? 'Edit Kategori' : 'Tambah Kategori'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Kategori"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-brand-soft text-brand-text-body rounded-input p-3 text-xs focus:bg-white focus:shadow-focus-coral outline-none border-none"
            />
          </div>
          <Button type="submit" size="md" isLoading={isSubmitting} className="w-full">
            Simpan Kategori
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCategories;

