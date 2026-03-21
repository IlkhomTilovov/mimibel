import { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Image as ImageIcon, 
  X, 
  Upload, 
  Globe,
  Search,
  Star,
  Package,
  GripVertical,
  RefreshCw,
  Video
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { AddMediaModal, MediaItem } from '@/components/admin/AddMediaModal';
import { MediaGrid } from '@/components/admin/MediaGrid';

interface Category {
  id: string;
  name_uz: string;
  name_ru: string;
}

interface Product {
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
  images: string[];
  materials: string[];
  sizes: string[];
  colors: string[];
  is_negotiable: boolean;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  meta_title_uz: string | null;
  meta_title_ru: string | null;
  meta_description_uz: string | null;
  meta_description_ru: string | null;
  meta_keywords: string | null;
  is_indexed: boolean;
  is_followed: boolean;
  target_keyword: string | null;
  keyword_variations: string[] | null;
}

interface FormData {
  name_uz: string;
  name_ru: string;
  slug: string;
  description_uz: string;
  description_ru: string;
  full_description_uz: string;
  full_description_ru: string;
  category_id: string;
  price: string;
  original_price: string;
  images: string[];
  materials: string;
  sizes: string;
  colors: string;
  is_negotiable: boolean;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  meta_title_uz: string;
  meta_title_ru: string;
  meta_description_uz: string;
  meta_description_ru: string;
  meta_keywords: string;
  is_indexed: boolean;
  is_followed: boolean;
  target_keyword: string;
  keyword_variations: string[];
}

const emptyForm: FormData = {
  name_uz: '',
  name_ru: '',
  slug: '',
  description_uz: '',
  description_ru: '',
  full_description_uz: '',
  full_description_ru: '',
  category_id: '',
  price: '',
  original_price: '',
  images: [],
  materials: '',
  sizes: '',
  colors: '',
  is_negotiable: false,
  in_stock: true,
  is_featured: false,
  is_active: true,
  meta_title_uz: '',
  meta_title_ru: '',
  meta_description_uz: '',
  meta_description_ru: '',
  meta_keywords: '',
  is_indexed: true,
  is_followed: true,
  target_keyword: '',
  keyword_variations: [],
};

const ADMIN_PAGE_SIZE = 20;

export default function ProductsNew() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [slugError, setSlugError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearch, categoryFilter, statusFilter]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_uz, name_ru')
        .order('sort_order');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply filters
      if (debouncedSearch) {
        query = query.or(`name_uz.ilike.%${debouncedSearch}%,name_ru.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      } else if (statusFilter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (statusFilter === 'out_of_stock') {
        query = query.eq('in_stock', false);
      }

      // Pagination
      const from = (currentPage - 1) * ADMIN_PAGE_SIZE;
      const to = from + ADMIN_PAGE_SIZE - 1;

      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: "Ma'lumotlarni yuklashda xatolik" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h'
    };
    
    return name
      .toLowerCase()
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const checkSlugUnique = async (slug: string, excludeId?: string): Promise<boolean> => {
    const query = supabase.from('products').select('id').eq('slug', slug);
    if (excludeId) query.neq('id', excludeId);
    const { data } = await query;
    return !data || data.length === 0;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '—';
    const category = categories.find(c => c.id === categoryId);
    return category ? (language === 'uz' ? category.name_uz : category.name_ru) : '—';
  };

  // Convert images array to MediaItem array
  const parseImagesForEdit = (images: string[]): MediaItem[] => {
    return images.map(url => {
      // Check if it's a video URL (JSON format stored as string)
      try {
        const parsed = JSON.parse(url);
        if (parsed.type && parsed.url) {
          return parsed as MediaItem;
        }
      } catch {
        // Not JSON, treat as regular image URL
      }
      
      // Check for YouTube embed URL
      if (url.includes('youtube.com/embed')) {
        const videoId = url.split('/embed/')[1]?.split('?')[0];
        return {
          type: 'video' as const,
          url,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          platform: 'youtube' as const
        };
      }
      
      // Check for Instagram embed URL
      if (url.includes('instagram.com')) {
        return {
          type: 'video' as const,
          url,
          platform: 'instagram' as const
        };
      }
      
      return { type: 'image' as const, url };
    });
  };

  // Convert MediaItem array to images array for storage
  const serializeMediaItems = (items: MediaItem[]): string[] => {
    return items.map(item => {
      if (item.type === 'video') {
        return JSON.stringify(item);
      }
      return item.url;
    });
  };

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setFormData(emptyForm);
    setMediaItems([]);
    setSlugError('');
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    const parsedMedia = parseImagesForEdit(product.images || []);
    setMediaItems(parsedMedia);
    setFormData({
      name_uz: product.name_uz,
      name_ru: product.name_ru,
      slug: product.slug || '',
      description_uz: product.description_uz || '',
      description_ru: product.description_ru || '',
      full_description_uz: product.full_description_uz || '',
      full_description_ru: product.full_description_ru || '',
      category_id: product.category_id || '',
      price: product.price?.toString() || '',
      original_price: product.original_price?.toString() || '',
      images: product.images || [],
      materials: (product.materials || []).join(', '),
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
      is_negotiable: product.is_negotiable,
      in_stock: product.in_stock,
      is_featured: product.is_featured,
      is_active: product.is_active,
      meta_title_uz: product.meta_title_uz || '',
      meta_title_ru: product.meta_title_ru || '',
      meta_description_uz: product.meta_description_uz || '',
      meta_description_ru: product.meta_description_ru || '',
      meta_keywords: product.meta_keywords || '',
      is_indexed: product.is_indexed ?? true,
      is_followed: product.is_followed ?? true,
      target_keyword: product.target_keyword || '',
      keyword_variations: product.keyword_variations || [],
    });
    setSlugError('');
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const handleNameChange = (value: string, field: 'name_uz' | 'name_ru') => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'name_uz' && (!formData.slug || formData.slug === generateSlug(formData.name_uz))) {
      newFormData.slug = generateSlug(value);
    }
    
    setFormData(newFormData);
  };

  const handleSlugChange = async (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    setFormData({ ...formData, slug: cleanSlug });
    
    if (cleanSlug) {
      const isUnique = await checkSlugUnique(cleanSlug, selectedProduct?.id);
      setSlugError(isUnique ? '' : 'Bu slug allaqachon mavjud');
    } else {
      setSlugError('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedMedia: MediaItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const publicUrl = await uploadOptimizedImage(file, 'products', {
          fileNamePrefix: 'product',
        });
        uploadedMedia.push({ type: 'image', url: publicUrl });
      }

      const newMediaItems = [...mediaItems, ...uploadedMedia];
      setMediaItems(newMediaItems);
      setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
      toast({ title: 'Muvaffaqiyat', description: `${uploadedMedia.length} ta rasm yuklandi (WebP optimizatsiya bilan)` });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Rasmni yuklashda xatolik: ' + error.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddMedia = (media: MediaItem) => {
    const newMediaItems = [...mediaItems, media];
    setMediaItems(newMediaItems);
    setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
  };

  const removeMedia = (index: number) => {
    const newMediaItems = mediaItems.filter((_, i) => i !== index);
    setMediaItems(newMediaItems);
    setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    const newMediaItems = [...mediaItems];
    const [movedItem] = newMediaItems.splice(fromIndex, 1);
    newMediaItems.splice(toIndex, 0, movedItem);
    setMediaItems(newMediaItems);
    setFormData({ ...formData, images: serializeMediaItems(newMediaItems) });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name_uz || !formData.name_ru) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Mahsulot nomini kiriting' });
      setActiveTab('basic');
      return;
    }

    // Validate category is required
    if (!formData.category_id) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Kategoriyani tanlash majburiy!' });
      setActiveTab('basic');
      return;
    }

    const slug = formData.slug || generateSlug(formData.name_uz);

    const isUnique = await checkSlugUnique(slug, selectedProduct?.id);
    if (!isUnique) {
      setSlugError('Bu slug allaqachon mavjud');
      return;
    }

    const productData = {
      name_uz: formData.name_uz.trim(),
      name_ru: formData.name_ru.trim(),
      slug,
      description_uz: formData.description_uz || null,
      description_ru: formData.description_ru || null,
      full_description_uz: formData.full_description_uz || null,
      full_description_ru: formData.full_description_ru || null,
      category_id: formData.category_id || null,
      price: formData.price ? parseFloat(formData.price) : null,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      images: formData.images,
      materials: formData.materials.split(',').map(s => s.trim()).filter(Boolean),
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: formData.colors.split(',').map(s => s.trim()).filter(Boolean),
      is_negotiable: formData.is_negotiable,
      in_stock: formData.in_stock,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      meta_title_uz: formData.meta_title_uz || null,
      meta_title_ru: formData.meta_title_ru || null,
      meta_description_uz: formData.meta_description_uz || null,
      meta_description_ru: formData.meta_description_ru || null,
      meta_keywords: formData.meta_keywords || null,
      is_indexed: formData.is_indexed,
      is_followed: formData.is_followed,
      target_keyword: formData.target_keyword || null,
      keyword_variations: formData.keyword_variations.length > 0 ? formData.keyword_variations : [],
    };

    try {
      if (selectedProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', selectedProduct.id);
        if (error) throw error;
        toast({ title: 'Muvaffaqiyat', description: 'Mahsulot yangilandi' });
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        toast({ title: 'Muvaffaqiyat', description: 'Mahsulot yaratildi' });
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setSlugError('Bu slug allaqachon mavjud');
      } else {
        toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', selectedProduct.id);
      if (error) throw error;
      toast({ title: 'Muvaffaqiyat', description: "Mahsulot o'chirildi" });
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !product.is_featured })
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
    }
  };

  const getSeoStatus = (product: Product) => {
    const hasTitle = product.meta_title_uz || product.meta_title_ru;
    const hasDescription = product.meta_description_uz || product.meta_description_ru;
    
    if (hasTitle && hasDescription) return { status: 'complete', label: 'SEO tayyor' };
    if (hasTitle || hasDescription) return { status: 'partial', label: 'SEO qisman' };
    return { status: 'missing', label: 'SEO yoq' };
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / ADMIN_PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mahsulotlar</h1>
          <p className="text-muted-foreground">Barcha mahsulotlarni boshqaring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yangilash
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi mahsulot
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mahsulot nomi yoki slug bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toifa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha toifalar</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'uz' ? cat.name_uz : cat.name_ru}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Nofaol</SelectItem>
                <SelectItem value="featured">Tanlangan</SelectItem>
                <SelectItem value="out_of_stock">Tugagan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Barcha mahsulotlar ({totalCount})</span>
            <div className="flex gap-2">
              <Badge variant="outline">{products.filter(p => p.is_active).length} faol</Badge>
              <Badge variant="secondary">{products.filter(p => p.is_featured).length} tanlangan</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rasm</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Toifa</TableHead>
                <TableHead>Narxi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SEO</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const seoStatus = getSeoStatus(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name_uz} className="h-12 w-12 object-cover rounded-lg border" />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{language === 'uz' ? product.name_uz : product.name_ru}</p>
                        {product.slug && (
                          <code className="text-xs text-muted-foreground">/{product.slug}</code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(product.category_id)}</TableCell>
                    <TableCell>
                      {product.is_negotiable ? (
                        <Badge variant="outline">Kelishiladi</Badge>
                      ) : (
                        <div>
                          <p className="font-medium">{formatPrice(product.price)}</p>
                          {product.original_price && product.original_price > (product.price || 0) && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Faol' : 'Nofaol'}
                        </Badge>
                        {product.in_stock ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">Mavjud</Badge>
                        ) : (
                          <Badge variant="destructive">Tugagan</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={seoStatus.status === 'complete' ? 'default' : seoStatus.status === 'partial' ? 'secondary' : 'outline'}
                        className={seoStatus.status === 'missing' ? 'text-muted-foreground' : ''}
                      >
                        {seoStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleFeatured(product)}
                          title={product.is_featured ? "Tanlanganlardan olib tashlash" : "Tanlanganlarga qo'shish"}
                        >
                          <Star className={`h-4 w-4 ${product.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedProduct(product); setPreviewDialogOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Mahsulotlar topilmadi</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Oldingi
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Keyingi
            </Button>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Asosiy</TabsTrigger>
              <TabsTrigger value="description">Tavsif</TabsTrigger>
              <TabsTrigger value="images">Rasmlar</TabsTrigger>
              <TabsTrigger value="attributes">Xususiyatlar</TabsTrigger>
              <TabsTrigger value="seo" className="gap-1">
                <Globe className="h-3 w-3" />
                SEO
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomi (UZ) *</Label>
                  <Input
                    value={formData.name_uz}
                    onChange={(e) => handleNameChange(e.target.value, 'name_uz')}
                    placeholder="O'zbek tilida"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomi (RU) *</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => handleNameChange(e.target.value, 'name_ru')}
                    placeholder="На русском"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="avtomatik yaratiladi"
                  className={slugError ? 'border-destructive' : ''}
                />
                {slugError ? (
                  <p className="text-sm text-destructive">{slugError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    URL: /product/{formData.slug || 'slug'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Toifa</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toifani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {language === 'uz' ? cat.name_uz : cat.name_ru}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Narxi</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eski narxi</Label>
                  <Input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_negotiable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_negotiable: checked })}
                  />
                  <Label>Kelishiladi</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.in_stock}
                    onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                  />
                  <Label>Mavjud</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Tanlangan</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Faol</Label>
                </div>
              </div>
            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qisqa tavsif (UZ)</Label>
                  <Textarea
                    value={formData.description_uz}
                    onChange={(e) => setFormData({ ...formData, description_uz: e.target.value })}
                    rows={3}
                    placeholder="Mahsulot haqida qisqacha..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qisqa tavsif (RU)</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    rows={3}
                    placeholder="Краткое описание..."
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>To'liq tavsif (UZ)</Label>
                  <Textarea
                    value={formData.full_description_uz}
                    onChange={(e) => setFormData({ ...formData, full_description_uz: e.target.value })}
                    rows={6}
                    placeholder="Batafsil tavsif..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>To'liq tavsif (RU)</Label>
                  <Textarea
                    value={formData.full_description_ru}
                    onChange={(e) => setFormData({ ...formData, full_description_ru: e.target.value })}
                    rows={6}
                    placeholder="Подробное описание..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="images" className="space-y-4 mt-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Add Media Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Media fayllari
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Rasmlar va videolarni qo'shing
                  </p>
                </div>
                <Button onClick={() => setMediaModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Media qo'shish
                </Button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Rasmlar yuklanmoqda...</span>
                  </div>
                </div>
              )}

              {/* Media Grid */}
              <MediaGrid 
                items={mediaItems}
                onRemove={removeMedia}
                onMove={moveMedia}
              />

              {/* Media count */}
              {mediaItems.length > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Jami: {mediaItems.length} ta media 
                    ({mediaItems.filter(m => m.type === 'image').length} rasm, {mediaItems.filter(m => m.type === 'video').length} video)
                  </span>
                  <span>Birinchi media asosiy rasm sifatida ko'rsatiladi</span>
                </div>
              )}
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>O'lchamlar</Label>
                <Input
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="Masalan: 200x100x80, 180x90x75 (vergul bilan ajrating)"
                />
                <p className="text-xs text-muted-foreground">Bir nechta o'lchamlarni vergul bilan ajrating</p>
              </div>

              <div className="space-y-2">
                <Label>Ranglar</Label>
                <Input
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="Masalan: Oq, Qora, Jigarrang (vergul bilan ajrating)"
                />
              </div>

              <div className="space-y-2">
                <Label>Materiallar</Label>
                <Input
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                  placeholder="Masalan: Yog'och, Temir, Mato (vergul bilan ajrating)"
                />
              </div>

              {/* Preview */}
              {(formData.sizes || formData.colors || formData.materials) && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Ko'rinishi:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.sizes && formData.sizes.split(',').filter(Boolean).map((size, i) => (
                      <Badge key={`size-${i}`} variant="outline">{size.trim()}</Badge>
                    ))}
                    {formData.colors && formData.colors.split(',').filter(Boolean).map((color, i) => (
                      <Badge key={`color-${i}`} variant="secondary">{color.trim()}</Badge>
                    ))}
                    {formData.materials && formData.materials.split(',').filter(Boolean).map((material, i) => (
                      <Badge key={`material-${i}`}>{material.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 Target Keyword asosida SEO Title, H1 va Slug avtomatik yaratiladi. 
                  Keyword variantlari tavsif va rasm alt teglarida tabiiy ishlatiladi.
                </p>
              </div>

              <Separator />

              {/* Target Keyword */}
              <div className="space-y-4">
                <h3 className="font-medium">🎯 Target Keyword</h3>
                <div className="space-y-2">
                  <Label>Asosiy kalit so'z</Label>
                  <Input
                    value={formData.target_keyword}
                    onChange={(e) => {
                      const keyword = e.target.value;
                      const newFormData = { ...formData, target_keyword: keyword };
                      if (keyword && (!formData.slug || formData.slug === generateSlug(formData.target_keyword))) {
                        newFormData.slug = generateSlug(keyword);
                      }
                      if (keyword && !formData.meta_title_uz) {
                        const autoTitle = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                        if (autoTitle.length <= 60) {
                          newFormData.meta_title_uz = autoTitle + (formData.name_uz ? ` | ${formData.name_uz}` : '');
                          if (newFormData.meta_title_uz.length > 60) {
                            newFormData.meta_title_uz = autoTitle;
                          }
                        }
                      }
                      setFormData(newFormData);
                    }}
                    placeholder="Masalan: avto salon koja"
                  />
                  <p className="text-xs text-muted-foreground">
                    Bu so'z SEO Title, H1 sarlavha va URL slug uchun ishlatiladi
                  </p>
                </div>
              </div>

              <Separator />

              {/* Keyword Variations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">🔄 Keyword variantlari</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        keyword_variations: [...formData.keyword_variations, ''] 
                      });
                    }}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Variant qo'shish
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Variantlar tavsif va rasm alt teglarida tabiiy ravishda ishlatiladi (meta keywords emas!)
                </p>
                {formData.keyword_variations.map((variation, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={variation}
                      onChange={(e) => {
                        const newVariations = [...formData.keyword_variations];
                        newVariations[index] = e.target.value;
                        setFormData({ ...formData, keyword_variations: newVariations });
                      }}
                      placeholder={`Variant ${index + 1}: masalan, avtomobil o'rindiq terisi`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newVariations = formData.keyword_variations.filter((_, i) => i !== index);
                        setFormData({ ...formData, keyword_variations: newVariations });
                      }}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Meta Title</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Title (UZ)</Label>
                    <Input
                      value={formData.meta_title_uz}
                      onChange={(e) => setFormData({ ...formData, meta_title_uz: e.target.value })}
                      placeholder={formData.target_keyword || formData.name_uz || 'Mahsulot nomi'}
                      maxLength={60}
                    />
                    <p className={`text-xs ${formData.meta_title_uz.length > 55 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formData.meta_title_uz.length}/60
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Title (RU)</Label>
                    <Input
                      value={formData.meta_title_ru}
                      onChange={(e) => setFormData({ ...formData, meta_title_ru: e.target.value })}
                      placeholder={formData.name_ru || 'Название товара'}
                      maxLength={60}
                    />
                    <p className={`text-xs ${formData.meta_title_ru.length > 55 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formData.meta_title_ru.length}/60
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Meta Description</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Description (UZ)</Label>
                    <Textarea
                      value={formData.meta_description_uz}
                      onChange={(e) => setFormData({ ...formData, meta_description_uz: e.target.value })}
                      placeholder="Mahsulot tavsifi..."
                      maxLength={160}
                      rows={3}
                    />
                    <p className={`text-xs ${formData.meta_description_uz.length > 150 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formData.meta_description_uz.length}/160
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description (RU)</Label>
                    <Textarea
                      value={formData.meta_description_ru}
                      onChange={(e) => setFormData({ ...formData, meta_description_ru: e.target.value })}
                      placeholder="Описание товара..."
                      maxLength={160}
                      rows={3}
                    />
                    <p className={`text-xs ${formData.meta_description_ru.length > 150 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formData.meta_description_ru.length}/160
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* SEO Preview */}
              {(formData.target_keyword || formData.meta_title_uz) && (
                <div className="space-y-2">
                  <h3 className="font-medium">📋 Google qidiruv ko'rinishi</h3>
                  <div className="bg-card border rounded-lg p-4 space-y-1">
                    <p className="text-primary text-lg truncate">
                      {formData.meta_title_uz || formData.target_keyword || formData.name_uz}
                    </p>
                    <p className="text-green-700 text-sm">
                      mirmexa.com.uz/product/{formData.slug || 'slug'}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.meta_description_uz || formData.description_uz || 'Meta tavsif...'}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_indexed}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_indexed: checked })}
                  />
                  <div>
                    <Label>Indexlash</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_indexed ? 'Google indeksida' : 'Noindex'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_followed}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_followed: checked })}
                  />
                  <div>
                    <Label>Follow</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_followed ? 'Havolalar kuzatiladi' : 'Nofollow'}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSubmit} disabled={!!slugError}>
              {selectedProduct ? 'Saqlash' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mahsulot ko'rinishi</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.images?.[0] && (
                <img 
                  src={selectedProduct.images[0]} 
                  alt={selectedProduct.name_uz} 
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div>
                <h2 className="text-xl font-bold">{selectedProduct.name_uz}</h2>
                <p className="text-muted-foreground">{selectedProduct.name_ru}</p>
              </div>
              {selectedProduct.description_uz && (
                <p>{selectedProduct.description_uz}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                {selectedProduct.sizes?.map((size, i) => (
                  <Badge key={i} variant="outline">{size}</Badge>
                ))}
                {selectedProduct.colors?.map((color, i) => (
                  <Badge key={i} variant="secondary">{color}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{formatPrice(selectedProduct.price)}</span>
                {selectedProduct.is_negotiable && (
                  <Badge>Kelishiladi</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mahsulotni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham "{selectedProduct?.name_uz}" mahsulotini o'chirmoqchimisiz?
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Media Modal */}
      <AddMediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onAddMedia={handleAddMedia}
        onUploadImages={() => fileInputRef.current?.click()}
        uploading={uploading}
      />
    </div>
  );
}
