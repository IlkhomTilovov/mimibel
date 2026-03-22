import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingBag, MessageCircle, Phone, Check, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/ProductCard';
import { ImageLightbox } from '@/components/ImageLightbox';
import { LazyImage } from '@/components/LazyImage';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { useCart } from '@/hooks/useCart';
import { useProductById, useProducts, useCategories, Product } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  platform?: 'youtube' | 'instagram';
}

export default function ProductDetails() {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const { addItem, isInCart } = useCart();
  const { isAdmin } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  // Fetch product from database by ID or slug
  const { product, loading, error } = useProductById(id || '');
  const { categories } = useCategories();

  const productName = product ? (language === 'uz' ? product.name_uz : product.name_ru) : '';
  const productDesc = product ? (language === 'uz' ? product.description_uz : product.description_ru) : '';
  const metaTitle = product ? (language === 'uz' ? product.meta_title_uz : product.meta_title_ru) : null;
  const metaDesc = product ? (language === 'uz' ? product.meta_description_uz : product.meta_description_ru) : null;
  const targetKeyword = (product as any)?.target_keyword || '';
  const keywordVariations: string[] = (product as any)?.keyword_variations || [];

  // Use target keyword for SEO title if available
  const seoTitle = metaTitle || targetKeyword || productName || undefined;

  useSEO({
    title: seoTitle,
    description: metaDesc || productDesc || undefined,
    ogImage: product?.images?.[0] || undefined,
    noindex: product ? !product.is_indexed : false,
    nofollow: product ? !product.is_followed : false,
  });

  // JSON-LD Product structured data
  useEffect(() => {
    if (!product) return;
    
    const imageUrls = (product.images || []).filter(img => {
      try { const p = JSON.parse(img); return p.type === 'image'; } catch { return !img.includes('youtube.com') && !img.includes('instagram.com'); }
    });

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: targetKeyword || productName,
      description: productDesc || undefined,
      image: imageUrls.length > 0 ? imageUrls : undefined,
      sku: product.id,
      url: window.location.href,
      brand: { '@type': 'Brand', name: 'MIR MEXA' },
      offers: {
        '@type': 'Offer',
        price: product.price || 0,
        priceCurrency: 'UZS',
        availability: product.in_stock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: window.location.href,
      },
    };

    let script = document.querySelector('script[data-product-jsonld]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-product-jsonld', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      script?.remove();
    };
  }, [product, productName, productDesc, language]);
  
  // Fetch related products by category
  const { products: relatedProducts } = useProducts(1, {
    categoryId: product?.category_id || undefined,
    isActive: true,
  }, 5);

  // Filter out current product from related
  const filteredRelated = relatedProducts.filter(p => p.id !== product?.id).slice(0, 4);

  // Parse media items from images array
  const mediaItems = useMemo((): MediaItem[] => {
    if (!product?.images) return [];
    return product.images.map(item => {
      try {
        const parsed = JSON.parse(item);
        if (parsed.type && parsed.url) return parsed as MediaItem;
      } catch {}
      if (item.includes('youtube.com/embed')) {
        const videoId = item.split('/embed/')[1]?.split('?')[0];
        return { type: 'video', url: item, thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, platform: 'youtube' };
      }
      if (item.includes('instagram.com')) {
        return { type: 'video', url: item, platform: 'instagram' };
      }
      return { type: 'image', url: item };
    });
  }, [product?.images]);

  const imageItems = mediaItems.filter(m => m.type === 'image');
  const videoItems = mediaItems.filter(m => m.type === 'video');
  const galleryImages = imageItems.map(m => m.url);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize('');
    setSelectedColor('');
  }, [product?.id]);

  if (loading) {
    return (
      <div id="hero" className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div id="hero" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'uz' ? 'Mahsulot topilmadi' : 'Товар не найден'}
          </h1>
          {isAdmin && (
            <p className="text-muted-foreground mb-4 text-sm">
              Debug: ID = {id}
            </p>
          )}
          <Button asChild>
            <Link to="/catalog">
              {language === 'uz' ? 'Katalogga qaytish' : 'Вернуться в каталог'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get localized content with fallback
  const name = (language === 'uz' ? product.name_uz : product.name_ru) || product.name_uz || product.name_ru;
  const description = (language === 'uz' ? product.description_uz : product.description_ru) || product.description_uz || product.description_ru;
  const fullDescription = (language === 'uz' ? product.full_description_uz : product.full_description_ru) || product.full_description_uz || product.full_description_ru;
  
  // H1 uses target keyword if available, otherwise product name
  const h1Text = targetKeyword || name;
  
  // Generate alt text using keyword variations
  const getImageAlt = (index: number) => {
    if (keywordVariations.length > 0) {
      const variation = keywordVariations[index % keywordVariations.length];
      return variation || name;
    }
    return targetKeyword || name;
  };

  const formatPrice = (price: number) => price.toLocaleString('uz-UZ');
  const inCart = isInCart(product.id);
  const images = galleryImages;
  const materials = product.materials || [];
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const price = product.price || 0;

  // Get category name
  const category = categories.find(c => c.id === product.category_id);
  const categoryName = category 
    ? (language === 'uz' ? category.name_uz : category.name_ru)
    : (product.category_id || '—');

  const whatsappMessage = encodeURIComponent(
    `Assalomu alaykum! Men "${name}" mahsulotiga qiziqyapman.\n\nNarxi: ${formatPrice(price)} so'm\n\nBatafsil ma'lumot berishingizni so'rayman.`
  );

  return (
    <div id="hero" className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <Button asChild variant="ghost" className="mb-6 gap-2">
          <Link to="/catalog"><ArrowLeft className="w-4 h-4" /> {t.common.back}</Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div 
              className="aspect-square rounded-2xl overflow-hidden bg-muted mb-4 cursor-zoom-in"
              onClick={() => images.length > 0 && setLightboxOpen(true)}
            >
              {images.length > 0 ? (
                <LazyImage
                  src={images[selectedImage] || images[0]}
                  alt={getImageAlt(selectedImage)}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                  wrapperClassName="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  {language === 'uz' ? 'Rasm mavjud emas' : 'Нет изображения'}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <LazyImage 
                      src={img} 
                      alt="" 
                      sizes="80px"
                      className="w-full h-full object-cover" 
                      wrapperClassName="w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Lightbox */}
            <ImageLightbox
              images={images}
              initialIndex={selectedImage}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />

            {/* Video Button */}
            {videoItems.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4 gap-2"
                onClick={() => {
                  setSelectedVideo(videoItems[0]);
                  setVideoModalOpen(true);
                }}
              >
                <Play className="w-4 h-4" />
                {language === 'uz' ? 'Videoni ko\'rish' : 'Смотреть видео'}
                {videoItems.length > 1 && ` (${videoItems.length})`}
              </Button>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.in_stock ? (
                <span className="text-sm text-green-600 font-medium">{t.products.inStock}</span>
              ) : (
                <span className="text-sm text-destructive font-medium">{t.products.outOfStock}</span>
              )}
            </div>

            <h1 className="font-serif text-3xl font-bold mb-4">{h1Text}</h1>
            {targetKeyword && targetKeyword !== name && <p className="text-lg text-muted-foreground mb-2">{name}</p>}
            {description && <p className="text-muted-foreground mb-6">{description}</p>}

            {price > 0 && (
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-serif text-3xl font-bold">{formatPrice(price)}</span>
                <span className="text-muted-foreground">{t.products.currency}</span>
                {product.original_price && product.original_price > price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">{t.products.sizes}</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                        selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">{t.products.colors}</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                        selectedColor === color ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 mb-4">
              <Button
                size="lg"
                className="w-full gap-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                onClick={() => addItem(product as any, 1, selectedSize, selectedColor)}
                disabled={inCart || !product.in_stock}
              >
                {inCart ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                {inCart ? (language === 'uz' ? 'Savatda' : 'В корзине') : t.products.addToCart}
              </Button>
            </div>

            <Button asChild variant="ghost" className="w-full gap-2 mb-4">
              <a href="tel:+998901234567">
                <Phone className="w-4 h-4" /> {t.products.requestConsultation}
              </a>
            </Button>

            {/* Materials */}
            {materials.length > 0 && (
              <div className="mt-8 p-4 bg-muted rounded-xl">
                <h4 className="font-medium mb-2">{t.products.materials}</h4>
                <div className="flex flex-wrap gap-2">
                  {materials.map(mat => (
                    <span key={mat} className="px-3 py-1 bg-background rounded-full text-sm">{mat}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Description Tabs */}
        {(fullDescription || materials.length > 0) && (
          <div className="mt-12">
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">{t.products.description}</TabsTrigger>
                <TabsTrigger value="details">{t.products.details}</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4 p-6 bg-card rounded-xl">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {fullDescription || description || (language === 'uz' ? "Ma'lumot mavjud emas" : 'Нет информации')}
                </div>
              </TabsContent>
              <TabsContent value="details" className="mt-4 p-6 bg-card rounded-xl">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">{language === 'uz' ? 'Toifa' : 'Категория'}:</span>{' '}
                    <span className="text-muted-foreground">{categoryName}</span>
                  </div>
                  {materials.length > 0 && (
                    <div>
                      <span className="font-medium">Material:</span>{' '}
                      <span className="text-muted-foreground">{materials.join(', ')}</span>
                    </div>
                  )}
                  {sizes.length > 0 && (
                    <div>
                      <span className="font-medium">{language === 'uz' ? "O'lchamlar" : 'Размеры'}:</span>{' '}
                      <span className="text-muted-foreground">{sizes.join(', ')}</span>
                    </div>
                  )}
                  {colors.length > 0 && (
                    <div>
                      <span className="font-medium">{language === 'uz' ? 'Ranglar' : 'Цвета'}:</span>{' '}
                      <span className="text-muted-foreground">{colors.join(', ')}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-bold mb-6">{t.products.relatedProducts}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRelated.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={selectedVideo?.url || ''}
        platform={selectedVideo?.platform}
      />
    </div>
  );
}
