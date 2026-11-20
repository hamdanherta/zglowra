import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, PackageOpen } from 'lucide-react';
import ProductCard, { Product } from '../components/product/ProductCard';
import SectionTitle from '../components/ui/SectionTitle';
import EmptyState from '../components/ui/EmptyState';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Query parameters from URL
  const querySearch = searchParams.get('cari') || '';
  const queryCategory = searchParams.get('kategori') || '';
  const querySort = searchParams.get('sort') || 'terbaru';
  const queryPage = parseInt(searchParams.get('page') || '1', 10);
  const queryMinPrice = searchParams.get('min') || '';
  const queryMaxPrice = searchParams.get('max') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Search input state with debounce
  const [searchInput, setSearchInput] = useState(querySearch);

  // Fetch categories once
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.categories || []);
      })
      .catch(() => {});
  }, []);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== querySearch) {
        updateFilter('cari', searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 on filter changes
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: querySearch,
        kategori: queryCategory,
        sort: querySort,
        page: queryPage.toString(),
        limit: '12',
      });
      if (queryMinPrice) params.set('min_price', queryMinPrice);
      if (queryMaxPrice) params.set('max_price', queryMaxPrice);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [querySearch, queryCategory, querySort, queryPage, queryMinPrice, queryMaxPrice]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <SectionTitle
        title="Katalog Produk ZGlowra"
        subtitle="Jelajahi seluruh rangkaian body care resmi Zfree Glow untuk kulit halus, terawat, dan bercahaya setiap hari."
      />

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-card shadow-card p-6 mb-8 flex flex-col gap-6">
        {/* Search Bar & Sort Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Cari nama produk, khasiat, atau SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-brand-soft text-brand-text-body placeholder:text-brand-text-body/40 rounded-full py-3.5 pl-12 pr-4 text-sm focus:bg-white focus:shadow-focus-coral outline-none border-none transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-body/50 pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <div className="w-full md:w-64">
            <Select
              value={querySort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              options={[
                { value: 'terbaru', label: 'Urutkan: Terbaru' },
                { value: 'terlaris', label: 'Urutkan: Paling Laris' },
                { value: 'termurah', label: 'Urutkan: Harga Termurah' },
                { value: 'termahal', label: 'Urutkan: Harga Termahal' },
                { value: 'a-z', label: 'Urutkan: Nama A - Z' },
              ]}
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Kategori:
          </span>

          <button
            onClick={() => updateFilter('kategori', '')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all select-none ${
              !queryCategory
                ? 'bg-brand-text text-white shadow-button'
                : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
            }`}
          >
            Semua ({categories.reduce((a, b) => a + (b.product_count || 0), 0)})
          </button>

          {categories.map((c) => {
            const isSelected = queryCategory === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => updateFilter('kategori', isSelected ? '' : c.slug)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all select-none ${
                  isSelected
                    ? 'bg-brand-text text-white shadow-button'
                    : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
                }`}
              >
                {c.name} ({c.product_count || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCT LISTING */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="soft"
                size="sm"
                disabled={queryPage <= 1}
                onClick={() => updateFilter('page', String(queryPage - 1))}
              >
                Sebelumnya
              </Button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === queryPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateFilter('page', String(pageNum))}
                    className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-brand-text text-white shadow-button'
                        : 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <Button
                variant="soft"
                size="sm"
                disabled={queryPage >= totalPages}
                onClick={() => updateFilter('page', String(queryPage + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<PackageOpen className="w-10 h-10" />}
          title="Tidak Ada Produk Ditemukan"
          description={`Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih. Silakan atur ulang kata kunci atau kategori.`}
          actionText="Reset Semua Filter"
          onAction={() => {
            setSearchInput('');
            setSearchParams(new URLSearchParams());
          }}
        />
      )}
    </div>
  );
};

export default CatalogPage;

