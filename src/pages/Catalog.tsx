import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ProductCard } from '@/components/ProductCard';
import { useProducts, useCategories, useProductFilterOptions, ProductFilters } from '@/hooks/useProducts';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuth } from '@/hooks/useAuth';
import { CatalogFilterSidebar, SidebarFilters } from '@/components/CatalogFilterSidebar';

const PAGE_SIZE = 24;

export default function Catalog() {
  const { language, t } = useLanguage();
  const { settings } = useSystemSettings();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const initialCategory = searchParams.get('category') || 'all';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPage);

  const { options: filterOptions } = useProductFilterOptions();

  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>({
    categoryId: initialCategory,
    priceMin: 0,
    priceMax: 0, // 0 means "no limit" until filter options load
    materials: [],
    colors: [],
    furLengths: [],
    applications: [],
    inStock: false,
    discounted: false,
  });

  // Sync priceMax when filter options load
  useEffect(() => {
    if (filterOptions.maxPrice > 0 && sidebarFilters.priceMax === 0) {
      setSidebarFilters(prev => ({ ...prev, priceMax: filterOptions.maxPrice }));
    }
  }, [filterOptions.maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Map sidebar filters to DB query filters
  const filters: ProductFilters = useMemo(() => {
    const f: ProductFilters = { isActive: true };

    if (debouncedSearch) f.search = debouncedSearch;
    if (sidebarFilters.categoryId !== 'all') f.categoryId = sidebarFilters.categoryId;
    if (sidebarFilters.priceMin > 0) f.priceMin = sidebarFilters.priceMin;
    // Only apply priceMax if user actively lowered it below the max
    const effectiveMax = filterOptions.maxPrice || 0;
    if (sidebarFilters.priceMax > 0 && effectiveMax > 0 && sidebarFilters.priceMax < effectiveMax) {
      f.priceMax = sidebarFilters.priceMax;
    }
    if (sidebarFilters.materials.length > 0) f.materials = sidebarFilters.materials;
    if (sidebarFilters.colors.length > 0) f.colors = sidebarFilters.colors;
    if (sidebarFilters.furLengths.length > 0) f.furLengths = sidebarFilters.furLengths;
    if (sidebarFilters.applications.length > 0) f.applications = sidebarFilters.applications;
    if (sidebarFilters.inStock) f.inStock = true;
    if (sidebarFilters.discounted) f.discounted = true;

    return f;
  }, [debouncedSearch, sidebarFilters, filterOptions.maxPrice]);

  const { products, totalCount, totalPages, loading } = useProducts(currentPage, filters, PAGE_SIZE);
  const { categories } = useCategories();

  const selectedCategory = categories?.find(c => c.slug === sidebarFilters.categoryId || c.id === sidebarFilters.categoryId);
  const categoryName = selectedCategory
    ? (language === 'uz' ? selectedCategory.name_uz : selectedCategory.name_ru)
    : null;

  useSEO({
    title: categoryName || t.catalog.title,
    description: selectedCategory
      ? (language === 'uz' ? selectedCategory.meta_description_uz : selectedCategory.meta_description_ru) || categoryName || undefined
      : undefined,
    keywords: selectedCategory?.meta_keywords || undefined,
    canonical: currentPage > 1 ? '/catalog' : undefined,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (sidebarFilters.categoryId !== 'all') params.set('category', sidebarFilters.categoryId);
    if (sidebarFilters.priceMin > 0) params.set('min_price', sidebarFilters.priceMin.toString());
    if (filterOptions.maxPrice > 0 && sidebarFilters.priceMax < filterOptions.maxPrice) params.set('max_price', sidebarFilters.priceMax.toString());
    if (sidebarFilters.materials.length > 0) params.set('material', sidebarFilters.materials.join(','));
    if (sidebarFilters.colors.length > 0) params.set('color', sidebarFilters.colors.join(','));
    if (sidebarFilters.furLengths.length > 0) params.set('fur_length', sidebarFilters.furLengths.join(','));
    if (sidebarFilters.applications.length > 0) params.set('application', sidebarFilters.applications.join(','));
    if (sidebarFilters.inStock) params.set('in_stock', '1');
    if (sidebarFilters.discounted) params.set('discount', '1');
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [sidebarFilters, currentPage, setSearchParams, filterOptions.maxPrice]);

  const handleApplyFilters = useCallback((newFilters: SidebarFilters) => {
    setSidebarFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div id="hero" className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t.catalog.title}</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t.catalog.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden gap-2 rounded-xl">
                  <SlidersHorizontal className="w-4 h-4" /> {t.catalog.filters}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t.catalog.filters}</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <CatalogFilterSidebar
                    categories={categories}
                    onApply={handleApplyFilters}
                    initialFilters={{ categoryId: sidebarFilters.categoryId }}
                    dynamicOptions={filterOptions}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-card p-6 rounded-2xl shadow-warm border border-border/50 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <CatalogFilterSidebar
                categories={categories}
                onApply={handleApplyFilters}
                initialFilters={{ categoryId: sidebarFilters.categoryId }}
                dynamicOptions={filterOptions}
              />
            </div>
          </aside>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...'}
                </span>
              ) : (
                <>
                  {t.catalog.showing} {products.length} {t.catalog.of} {totalCount} {t.catalog.products}
                </>
              )}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-warm animate-pulse">
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPaginationNumbers().map((page, idx) =>
                      page === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{t.catalog.noProducts}</p>
                <Button
                  variant="link"
                  onClick={() => handleApplyFilters({
                    categoryId: 'all', priceMin: 0, priceMax: filterOptions.maxPrice,
                    materials: [], colors: [], furLengths: [],
                    applications: [], inStock: false, discounted: false,
                  })}
                >
                  {t.catalog.clearFilters}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
