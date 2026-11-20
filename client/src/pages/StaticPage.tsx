import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SectionTitle from '../components/ui/SectionTitle';
import Card from '../components/ui/Card';

export const StaticPage: React.FC = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');

  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pages/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.page) {
          setPage(d.page);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-20 text-center">
        <p className="text-brand-text-body font-medium">Memuat informasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <SectionTitle
        title={page?.title || 'Informasi Toko'}
        subtitle="Panduan &amp; Kebijakan Resmi Toko Online ZGlowra"
      />

      <Card className="p-8 sm:p-12 leading-relaxed text-brand-text-body text-sm sm:text-base whitespace-pre-line font-normal">
        {page?.content}
      </Card>
    </div>
  );
};

export default StaticPage;

