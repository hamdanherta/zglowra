import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, Clock, AlertTriangle, Users, DollarSign,
  ArrowRight, CheckCircle, Package
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-brand-text-body font-medium">Memuat ringkasan dashboard...</p>
      </div>
    );
  }

  const { stats, lowStock, chartData, topProducts, recentOrders } = data;

  const statCards = [
    {
      title: 'Penjualan Hari Ini',
      value: `Rp ${Math.round(stats.todayRevenue).toLocaleString('id-ID')}`,
      desc: `${stats.todayOrders} transaksi hari ini`,
      icon: <DollarSign className="w-5 h-5 text-brand-text" />,
      bg: 'bg-brand-coral-soft',
    },
    {
      title: 'Penjualan Bulan Ini',
      value: `Rp ${Math.round(stats.monthRevenue).toLocaleString('id-ID')}`,
      desc: `${stats.monthOrders} transaksi bulan ini`,
      icon: <TrendingUp className="w-5 h-5 text-brand-gold" />,
      bg: 'bg-brand-gold-soft',
    },
    {
      title: 'Pesanan Baru',
      value: `${stats.newOrdersCount} Pesanan`,
      desc: 'Menunggu pembayaran',
      icon: <ShoppingBag className="w-5 h-5 text-brand-text" />,
      bg: 'bg-brand-soft',
    },
    {
      title: 'Verifikasi Pembayaran',
      value: `${stats.pendingPaymentsCount} Bukti`,
      desc: 'Perlu konfirmasi segera',
      icon: <Clock className="w-5 h-5 text-[#B06000]" />,
      bg: 'bg-[#FEF7E0]',
    },
    {
      title: 'Stok Menipis (<10)',
      value: `${lowStock?.length || 0} Produk`,
      desc: 'Perlu restock supplier',
      icon: <AlertTriangle className="w-5 h-5 text-danger" />,
      bg: 'bg-[#FCE8E6]',
    },
    {
      title: 'Total Pelanggan',
      value: `${stats.totalCustomers} Akun`,
      desc: 'Pelanggan terdaftar',
      icon: <Users className="w-5 h-5 text-[#137333]" />,
      bg: 'bg-[#E6F4EA]',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-text">
          Dashboard Ikhtisar Toko
        </h1>
        <p className="text-xs text-brand-text-body/70 mt-1">
          Pantau performa penjualan, pesanan pelanggan, dan persediaan stok produk Zfree Glow secara realtime.
        </p>
      </div>

      {/* STAT METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((c, i) => (
          <Card key={i} className="p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-brand-text-body/70">{c.title}</span>
              <h3 className="font-serif text-2xl font-bold text-brand-text mt-1">{c.value}</h3>
              <span className="text-[11px] text-brand-text-body/60 mt-0.5 block">{c.desc}</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center shrink-0`}>
              {c.icon}
            </div>
          </Card>
        ))}
      </div>

      {/* 30-DAY SALES RECHARTS CHART */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-brand-text">
              Tren Penjualan 30 Hari Terakhir
            </h2>
            <p className="text-xs text-brand-text-body/60 mt-0.5">
              Grafik pendapatan harian dari pesanan berstatus sukses
            </p>
          </div>
          <Link to="/admin/laporan-penjualan">
            <Button size="sm" variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
              Laporan Lengkap
            </Button>
          </Link>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="5%" stopColor="#DD695B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#DD695B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFF8F7" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#6B4A47' }}
                tickFormatter={(val) => val ? val.slice(5) : ''}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#6B4A47' }}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />
              <Tooltip
                formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Pendapatan']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(221,105,91,0.2)',
                  border: 'none',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#DD695B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* TWO COLUMNS: LOW STOCK ALERT + TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-brand-text flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger" />
              Peringatan Stok Menipis
            </h3>
            <Link to="/admin/pembelian" className="text-xs font-bold text-brand-text hover:underline">
              Pesan ke Supplier &rarr;
            </Link>
          </div>

          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((p: any) => (
                <div key={p.id} className="p-3 bg-brand-soft rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-brand-text line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-brand-text-body/60">SKU: {p.sku}</p>
                  </div>
                  <span className="px-3 py-1 bg-[#FCE8E6] text-danger rounded-full text-xs font-bold shrink-0">
                    Sisa {p.stock} pcs
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-brand-soft rounded-2xl text-center text-xs text-brand-text-body">
              Seluruh stok produk berada pada batas aman.
            </div>
          )}
        </Card>

        {/* Top 5 Products */}
        <Card className="p-6">
          <h3 className="font-serif text-lg font-bold text-brand-text mb-4">
            Produk Terlaris
          </h3>
          <div className="space-y-3">
            {topProducts?.map((p: any, idx: number) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-3 bg-brand-soft rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-coral-soft text-brand-text text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <img src={p.path_thumb || '/logo.png'} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-xs text-brand-text line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-brand-text-body/60">
                      Rp {parseFloat(p.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-gold shrink-0">
                  {p.sold_count} terjual
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RECENT ORDERS TABLE (MOBILE STACKED CARDS) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-brand-text">
            Pesanan Terbaru Masuk
          </h3>
          <Link to="/admin/pesanan">
            <Button size="sm" variant="secondary">
              Lihat Semua Pesanan
            </Button>
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-brand-soft text-brand-text font-bold uppercase tracking-wider">
                <th className="p-4 rounded-l-2xl">Kode Pesanan</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-r-2xl text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="">
              {recentOrders?.map((ord: any, i: number) => (
                <tr key={ord.id} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-soft/40'}>
                  <td className="p-4 font-mono font-bold text-brand-text">{ord.code}</td>
                  <td className="p-4 font-semibold text-brand-text-body">{ord.customer_name}</td>
                  <td className="p-4 text-brand-text-body/70">
                    {new Date(ord.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4 font-serif font-bold text-brand-text">
                    Rp {parseFloat(ord.total).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/admin/pesanan?id=${ord.id}`}
                      className="px-3 py-1.5 bg-brand-coral-soft text-brand-text font-bold rounded-full hover:bg-brand-text hover:text-white transition-colors"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards */}
        <div className="md:hidden space-y-3">
          {recentOrders?.map((ord: any) => (
            <div key={ord.id} className="p-4 bg-brand-soft rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-brand-text">{ord.code}</span>
                <StatusBadge status={ord.status} />
              </div>
              <p className="text-xs font-semibold text-brand-text-body">{ord.customer_name}</p>
              <div className="flex items-center justify-between pt-2 ">
                <span className="font-serif font-bold text-sm text-brand-text">
                  Rp {parseFloat(ord.total).toLocaleString('id-ID')}
                </span>
                <Link
                  to={`/admin/pesanan?id=${ord.id}`}
                  className="px-3 py-1 bg-brand-coral-soft text-brand-text text-xs font-bold rounded-full"
                >
                  Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
