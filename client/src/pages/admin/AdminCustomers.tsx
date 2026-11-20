import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

export const AdminCustomers: React.FC = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchCust = async () => {
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } catch {}
  };

  useEffect(() => {
    fetchCust();
  }, [token]);

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchCust();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">Data Pelanggan Terdaftar</h1>
        <p className="text-xs text-brand-text-body/70 mt-1">Daftar akun pelanggan dan total transaksi mereka.</p>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-brand-soft text-brand-text font-bold uppercase tracking-wider">
                <th className="p-3.5 rounded-l-2xl">Nama Pelanggan</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">No. Telepon</th>
                <th className="p-3.5">Pesanan Selesai</th>
                <th className="p-3.5">Total Belanja</th>
                <th className="p-3.5">Status Akun</th>
                <th className="p-3.5 rounded-r-2xl text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="">
              {customers.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-soft/40'}>
                  <td className="p-3.5 font-bold text-brand-text">{c.name}</td>
                  <td className="p-3.5 font-medium text-brand-text-body">{c.email}</td>
                  <td className="p-3.5 text-brand-text-body/70">{c.phone || '-'}</td>
                  <td className="p-3.5 font-bold">{c.order_count} pesanan</td>
                  <td className="p-3.5 font-serif font-bold text-brand-text">
                    Rp {parseFloat(c.total_spent).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      c.is_active ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-danger'
                    }`}>
                      {c.is_active ? 'Aktif' : 'Diblokir'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggle(c.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-brand-soft hover:bg-brand-coral-soft text-brand-text"
                    >
                      {c.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminCustomers;
