import { Link } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { LazyImage } from '@/components/LazyImage';
import type { Product } from '@/hooks/useProducts';

// Support both database and static data types
interface ProductCardProps {
  product: Product | {
    id: string;
    name_uz: string;
    name_ru: string;
    price: number;
    originalPrice?: number;
    images: string[];
    rating?: number;
    reviewCount?: number;
    slug?: string | null;
    original_price?: number | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);

  const name = language === 'uz' ? product.name_uz : product.name_ru;
  const formatPrice = (price: number) => price.toLocaleString('uz-UZ');
  
  // Handle both database and static data formats
  const price = product.price || 0;
  const originalPrice = 'originalPrice' in product ? product.originalPrice : product.original_price;
  const images = product.images || [];
  const productUrl = 'slug' in product && product.slug 
    ? `/product/${product.slug}` 
    : `/product/${product.id}`;

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300">
      <Link to={productUrl} className="block relative aspect-[4/3] overflow-hidden">
        <LazyImage
          src={images[0] || '/placeholder.svg'}
          alt={name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          wrapperClassName="w-full h-full"
        />
        {originalPrice && originalPrice > price && (
          <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-medium px-2 py-1 rounded-full">
            -{Math.round((1 - price / originalPrice) * 100)}%
          </span>
        )}
      </Link>
      <div className="p-4">
        <Link to={productUrl}>
          <h3 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors mb-2">
            {name}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          {price > 0 && (
            <div>
              <span className="font-serif font-bold text-lg text-foreground">
                {formatPrice(price)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">{t.products.currency}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-muted-foreground line-through ml-2">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          )}
          {!price && <div />}
          <Button
            size="sm"
            variant={inCart ? "secondary" : "default"}
            className="rounded-full"
            onClick={(e) => {
              e.preventDefault();
              if (!inCart) {
                // Create a cart-compatible product object
                const cartProduct = {
                  id: product.id,
                  name_uz: product.name_uz,
                  name_ru: product.name_ru,
                  price,
                  images,
                };
                addItem(cartProduct as any);
              }
            }}
          >
            {inCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}