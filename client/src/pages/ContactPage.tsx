import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle } from 'lucide-react';
import SectionTitle from '../components/ui/SectionTitle';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Mohon lengkapi formulir pesan');
      return;
    }
    toast.success('Pesan Anda berhasil terkirim. Tim ZGlowra akan segera menghubungi Anda.');
    setSent(true);
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <SectionTitle
        title="Hubungi ZGlowra"
        subtitle="Kami selalu siap mendengarkan pertanyaan, masukan, dan konsultasi produk kecantikan dari Anda."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-8">
            <h3 className="font-serif text-2xl font-bold text-brand-text mb-6">
              Kantor &amp; Layanan Pelanggan
            </h3>

            <div className="space-y-6 text-sm text-brand-text-body">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-coral-soft text-brand-text flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text mb-1">Alamat Toko Resmi</h4>
                  <p className="leading-relaxed">
                    Jl. Kemang Raya No. 88, Mampang Prapatan, Jakarta Selatan 12730
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-soft text-brand-text flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text mb-1">WhatsApp &amp; Telepon</h4>
                  <p>0812-3456-7890 (Layanan Konsultasi Cepat)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-gold-soft text-[#8C6D1F] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-text mb-1">Surat Elektronik</h4>
                  <p>support@zglowra.com / order@zglowra.com</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <Card className="p-8">
            <h3 className="font-serif text-2xl font-bold text-brand-text mb-6">
              Kirim Pesan Langsung
            </h3>

            {sent ? (
              <div className="p-8 bg-brand-soft rounded-2xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <h4 className="font-serif text-xl font-bold text-brand-text">Terima Kasih!</h4>
                <p className="text-xs text-brand-text-body">
                  Pesan Anda telah kami terima. Tim Customer Care kami akan segera merespons ke email Anda.
                </p>
                <Button size="sm" onClick={() => setSent(false)}>Kirim Pesan Lain</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nama Lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="email"
                    label="Alamat Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <Input
                    type="tel"
                    label="Nomor WhatsApp"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
                    Isi Pesan
                  </label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-brand-soft text-brand-text-body rounded-input p-4 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none"
                    placeholder="Tuliskan pertanyaan atau kebutuhan Anda di sini..."
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" icon={<Send className="w-4 h-4" />}>
                  Kirim Pesan
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

