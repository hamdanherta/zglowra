import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { toast } from 'sonner';

export const AdminReports: React.FC<{ type?: 'sales' | 'purchases' }> = ({ type = 'sales' }) => {
  const { token } = useAuth();
  const [reportType, setReportType] = useState<'sales' | 'purchases'>(type);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Semua');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const endpoint = reportType === 'sales' ? '/api/admin/reports/sales' : '/api/admin/reports/purchases';
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (status !== 'Semua') params.set('status', status);

      const res = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token, reportType, status]);

  const handleExport = (format: 'excel' | 'pdf') => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (status !== 'Semua') params.set('status', status);

    const base = reportType === 'sales' ? '/api/admin/reports/sales' : '/api/admin/reports/purchases';
    const exportUrl = `${base}/${format}?${params.toString()}`;

    // Download with bearer token via fetch blob or direct open with auth header
    fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal mengunduh');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan-${reportType === 'sales' ? 'Penjualan' : 'Pembelian'}-ZGlowra.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh!`);
      })
      .catch(() => {
        toast.error(`Gagal mengekspor ${format.toUpperCase()}`);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-text">
            {reportType === 'sales' ? 'Laporan Penjualan Produk' : 'Laporan Pembelian Stok (PO)'}
          </h1>
          <p className="text-xs text-brand-text-body/70 mt-1">
            Ekspor rekapitulasi data keuangan dan transaksi ke format Excel (.xlsx) atau PDF resmi.
          </p>
        </div>

        {/* Toggle Type */}
        <div className="flex bg-brand-soft rounded-full p-1">
          <button
            onClick={() => setReportType('sales')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              reportType === 'sales' ? 'bg-brand-text text-white shadow-button' : 'text-brand-text-body'
            }`}
          >
            Penjualan
          </button>
          <button
            onClick={() => setReportType('purchases')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              reportType === 'purchases' ? 'bg-brand-text text-white shadow-button' : 'text-brand-text-body'
            }`}
          >
            Pembelian Stok
          </button>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Date range inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-brand-text-body/70 mb-1">Mulai Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-brand-soft text-brand-text-body rounded-xl px-3 py-2 text-xs focus:shadow-focus-coral outline-none border-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-brand-text-body/70 mb-1">Sampai Dengan</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-brand-soft text-brand-text-body rounded-xl px-3 py-2 text-xs focus:shadow-focus-coral outline-none border-none"
              />
            </div>
            <div className="self-end">
              <Button size="sm" variant="secondary" onClick={fetchReport}>
                Terapkan Filter
              </Button>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-3 self-end lg:self-center">
            <Button
              size="sm"
              variant="gold"
              onClick={() => handleExport('excel')}
              icon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Ekspor Excel (.xlsx)
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleExport('pdf')}
              icon={<FileText className="w-4 h-4" />}
            >
              Ekspor PDF (.pdf)
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stat Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {reportType === 'sales' ? (
            <>
              <Card className="p-5">
                <span className="text-xs font-semibold text-brand-text-body/70">Total Pendapatan Bersih</span>
                <h3 className="font-serif text-2xl font-bold text-brand-text mt-1">
                  Rp {Math.round(data.summary?.totalRevenue || 0).toLocaleString('id-ID')}
                </h3>
              </Card>
              <Card className="p-5">
                <span className="text-xs font-semibold text-brand-text-body/70">Total Transaksi</span>
                <h3 className="font-serif text-2xl font-bold text-brand-text mt-1">
                  {data.summary?.totalOrders || 0} Transaksi
                </h3>
              </Card>
              <Card className="p-5">
                <span className="text-xs font-semibold text-brand-text-body/70">Transaksi Berhasil (Sukses)</span>
                <h3 className="font-serif text-2xl font-bold text-success mt-1">
                  {data.summary?.successfulOrders || 0} Transaksi
                </h3>
              </Card>
            </>
          ) : (
            <>
              <Card className="p-5">
                <span className="text-xs font-semibold text-brand-text-body/70">Total Pengeluaran Stok</span>
                <h3 className="font-serif text-2xl font-bold text-brand-text mt-1">
                  Rp {Math.round(data.summary?.totalExpense || 0).toLocaleString('id-ID')}
                </h3>
              </Card>
              <Card className="p-5">
                <span className="text-xs font-semibold text-brand-text-body/70">Total PO Dibuat</span>
                <h3 className="font-serif text-2xl font-bold text-brand-text mt-1">
                  {data.summary?.totalPurchases || 0} Pembelian
                </h3>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Data Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-brand-soft text-brand-text font-bold uppercase tracking-wider">
                <th className="p-3.5 rounded-l-2xl">No</th>
                <th className="p-3.5">Kode</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">{reportType === 'sales' ? 'Pelanggan' : 'Supplier'}</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 rounded-r-2xl text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="">
              {reportType === 'sales'
                ? data?.orders?.map((ord: any, idx: number) => (
                    <tr key={ord.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-brand-soft/40'}>
                      <td className="p-3.5 text-brand-text-body/60">{idx + 1}</td>
                      <td className="p-3.5 font-mono font-bold text-brand-text">{ord.code}</td>
                      <td className="p-3.5 text-brand-text-body/70">
                        {new Date(ord.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-3.5 font-semibold text-brand-text-body">{ord.customer_name}</td>
                      <td className="p-3.5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="p-3.5 font-serif font-bold text-brand-text text-right">
                        Rp {parseFloat(ord.total).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                : data?.purchases?.map((po: any, idx: number) => (
                    <tr key={po.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-brand-soft/40'}>
                      <td className="p-3.5 text-brand-text-body/60">{idx + 1}</td>
                      <td className="p-3.5 font-mono font-bold text-brand-text">{po.code}</td>
                      <td className="p-3.5 text-brand-text-body/70">
                        {new Date(po.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-3.5 font-semibold text-brand-text-body">{po.supplier_name}</td>
                      <td className="p-3.5">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="p-3.5 font-serif font-bold text-brand-text text-right">
                        Rp {parseFloat(po.total).toLocaleString('id-ID')}
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

export default AdminReports;
