import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string | null;
  description_uz: string | null;
  description_ru: string | null;
  full_description_uz: string | null;
  full_description_ru: string | null;
  category_id: string | null;
  price: number | null;
  original_price: number | null;
  images: string[] | null;
  materials: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  fur_length: string[] | null;
  application: string[] | null;
  is_negotiable: boolean | null;
  in_stock: boolean | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  is_indexed: boolean | null;
  is_followed: boolean | null;
  meta_title_uz: string | null;
  meta_title_ru: string | null;
  meta_description_uz: string | null;
  meta_description_ru: string | null;
  meta_keywords: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name_uz: string;
  name_ru: string;
  slug: string;
  icon: string | null;
  image: string | null;
  is_active: boolean | null;
  meta_title_uz: string | null;
  meta_title_ru: string | null;
  meta_description_uz: string | null;
  meta_description_ru: string | null;
  meta_keywords: string | null;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  materials?: string[];
  colors?: string[];
  furLengths?: string[];
  applications?: string[];
  inStock?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  discounted?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

const PAGE_SIZE = 24;

export function useProducts(
  page: number = 1,
  filters: ProductFilters = {},
  pageSize: number = PAGE_SIZE
) {
  const [data, setData] = useState<ProductsResponse>({
    products: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Active filter
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      } else {
        query = query.eq('is_active', true);
      }

      if (filters.categoryId && filters.categoryId !== 'all') {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      if (filters.inStock !== undefined) {
        query = query.eq('in_stock', filters.inStock);
      }

      if (filters.priceMin !== undefined) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters.priceMax !== undefined) {
        query = query.lte('price', filters.priceMax);
      }

      if (filters.search) {
        query = query.or(`name_uz.ilike.%${filters.search}%,name_ru.ilike.%${filters.search}%`);
      }

      // Array overlap filters - product must have ANY of the selected values (OR logic)
      if (filters.materials && filters.materials.length > 0) {
        query = query.overlaps('materials', filters.materials);
      }

      if (filters.colors && filters.colors.length > 0) {
        query = query.overlaps('colors', filters.colors);
      }

      if (filters.furLengths && filters.furLengths.length > 0) {
        query = query.overlaps('fur_length', filters.furLengths);
      }

      if (filters.applications && filters.applications.length > 0) {
        query = query.overlaps('application', filters.applications);
      }

      // Discounted: original_price must be greater than price
      if (filters.discounted) {
        query = query.not('original_price', 'is', null).gt('original_price', 0);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data: products, count, error: queryError } = await query;

      if (queryError) throw queryError;

      // Client-side filter for discounted (original_price > price)
      let filteredProducts = (products || []) as Product[];
      if (filters.discounted) {
        filteredProducts = filteredProducts.filter(
          p => p.original_price && p.price && p.original_price > p.price
        );
      }

      const totalCount = filters.discounted ? filteredProducts.length : (count || 0);
      const totalPages = Math.ceil(totalCount / pageSize);

      setData({
        products: filteredProducts,
        totalCount,
        totalPages,
        currentPage: page,
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, JSON.stringify(filters)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { ...data, loading, error, refetch: fetchProducts };
}

export function useFeaturedProducts(limit: number = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('sort_order', { ascending: true })
          .limit(limit);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  return { products, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name_uz, name_ru, slug, icon, image, is_active, meta_title_uz, meta_title_ru, meta_description_uz, meta_description_ru, meta_keywords')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
}

export function useProductBySlug(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (queryError) throw queryError;
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  return { product, loading, error };
}

export function useProductById(idOrSlug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!idOrSlug) {
        setLoading(false);
        return;
      }

      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        
        let data = null;
        
        if (isUUID) {
          const { data: idData, error: idError } = await supabase
            .from('products')
            .select('*')
            .eq('id', idOrSlug)
            .maybeSingle();
          
          if (idError) throw idError;
          data = idData;
        }
        
        if (!data) {
          const { data: slugData, error: slugError } = await supabase
            .from('products')
            .select('*')
            .eq('slug', idOrSlug)
            .maybeSingle();
          
          if (slugError) throw slugError;
          data = slugData;
        }

        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [idOrSlug]);

  return { product, loading, error };
}

// Hook to get unique filter values from all active products
export function useProductFilterOptions() {
  const [options, setOptions] = useState<{
    materials: string[];
    colors: string[];
    furLengths: string[];
    applications: string[];
    maxPrice: number;
  }>({
    materials: [],
    colors: [],
    furLengths: [],
    applications: [],
    maxPrice: 700000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('materials, colors, fur_length, application, price')
          .eq('is_active', true);

        if (error) throw error;

        const materialsSet = new Set<string>();
        const colorsSet = new Set<string>();
        const furLengthsSet = new Set<string>();
        const applicationsSet = new Set<string>();
        let maxPrice = 0;

        (data || []).forEach((p: any) => {
          (p.materials || []).forEach((m: string) => m && materialsSet.add(m));
          (p.colors || []).forEach((c: string) => c && colorsSet.add(c));
          (p.fur_length || []).forEach((f: string) => f && furLengthsSet.add(f));
          (p.application || []).forEach((a: string) => a && applicationsSet.add(a));
          if (p.price && p.price > maxPrice) maxPrice = p.price;
        });

        // Round max price up to nearest 100k
        maxPrice = Math.ceil(maxPrice / 100000) * 100000 || 700000;

        setOptions({
          materials: Array.from(materialsSet).sort(),
          colors: Array.from(colorsSet).sort(),
          furLengths: Array.from(furLengthsSet).sort(),
          applications: Array.from(applicationsSet).sort(),
          maxPrice,
        });
      } catch (err) {
        console.error('Error fetching filter options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return { options, loading };
}

// Materials list for filtering (legacy)
export const MATERIALS = [
  { id: 'yog\'och', name_uz: "Yog'och", name_ru: "Дерево" },
  { id: 'mdf', name_uz: "MDF", name_ru: "МДФ" },
  { id: 'metall', name_uz: "Metall", name_ru: "Металл" },
  { id: 'mato', name_uz: "Mato", name_ru: "Ткань" },
  { id: 'teri', name_uz: "Teri", name_ru: "Кожа" },
  { id: 'oyna', name_uz: "Oyna", name_ru: "Стекло" },
];
