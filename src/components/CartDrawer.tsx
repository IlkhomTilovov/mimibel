import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/hooks/useLanguage';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const { language, t } = useLanguage();
  const { settings } = useSystemSettings();

  // Lock body scroll when open, restore when closed
  useEffect(() => {
    if (isOpen) {
      // Add class and lock scroll
      document.body.classList.add('cart-drawer-open');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
    } else {
      // Remove class and restore scroll
      document.body.classList.remove('cart-drawer-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('cart-drawer-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // ESC key support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatPrice = (price: number) => price.toLocaleString('uz-UZ');

  const getProductName = (product: any) => {
    return (language === 'uz' ? product.name_uz : product.name_ru) || product.name_uz || product.name_ru || product.name || '';
  };

  // Build Telegram message for order
  const buildTelegramMessage = () => {
    const itemsList = items.map(item => {
      const name = getProductName(item.product);
      return `• ${name} x${item.quantity} = ${formatPrice((item.product.price || 0) * item.quantity)} so'm`;
    }).join('\n');
    
    const message = `🛒 Yangi buyurtma:\n\n${itemsList}\n\n💰 Jami: ${formatPrice(totalPrice)} so'm`;
    return encodeURIComponent(message);
  };

  const telegramNumber = settings?.social_telegram || 'https://t.me/';
  const telegramLink = telegramNumber.startsWith('http') 
    ? `${telegramNumber}?text=${buildTelegramMessage()}`
    : `https://t.me/${telegramNumber.replace('@', '')}?text=${buildTelegramMessage()}`;

  // Don't render if not open (for cleaner animations)
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay - click to close */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer - Fixed position, flex column layout */}
      <div
        className={cn(
          "fixed z-[101] bg-card shadow-2xl flex flex-col",
          // Mobile: bottom sheet style
          "max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-[85dvh] max-md:rounded-t-3xl max-md:animate-slide-up",
          // Desktop: right side drawer
          "md:top-0 md:right-0 md:h-[100dvh] md:w-[420px] md:max-w-[90vw] md:animate-slide-in-right"
        )}
      >
        {/* HEADER - Fixed, never scrolls */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl">
                {language === 'uz' ? 'Savatcha' : 'Корзина'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {totalItems} {language === 'uz' ? 'ta mahsulot' : 'товаров'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRODUCT LIST - Only this section scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain cart-scroll">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">
                {language === 'uz' ? 'Savatcha bo\'sh' : 'Корзина пуста'}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-[200px]">
                {language === 'uz' 
                  ? 'Mahsulotlarni katalogdan tanlang' 
                  : 'Выберите товары из каталога'}
              </p>
              <Button asChild className="rounded-full px-6" onClick={onClose}>
                <Link to="/catalog">
                  {language === 'uz' ? 'Katalogga o\'tish' : 'Перейти в каталог'}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {items.map((item) => {
                const name = getProductName(item.product);
                const price = item.product.price || 0;
                const image = item.product.images?.[0] || '/placeholder.svg';
                
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted/60 transition-colors"
                  >
                    {/* Image */}
                    <Link 
                      to={`/product/${(item.product as any).slug || item.product.id}`}
                      onClick={onClose}
                      className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-background"
                    >
                      <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <Link 
                        to={`/product/${(item.product as any).slug || item.product.id}`}
                        onClick={onClose}
                        className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors leading-snug"
                      >
                        {name}
                      </Link>
                      
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-xs text-muted-foreground">
                          {item.selectedSize && <span>{item.selectedSize}</span>}
                          {item.selectedSize && item.selectedColor && ' • '}
                          {item.selectedColor && <span>{item.selectedColor}</span>}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        {/* Price */}
                        {price > 0 ? (
                          <span className="font-serif font-bold text-sm">
                            {formatPrice(price * item.quantity)} 
                            <span className="text-xs text-muted-foreground ml-0.5">{t.products.currency}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {language === 'uz' ? 'Kelishiladi' : 'Договорная'}
                          </span>
                        )}

                        {/* Quantity controls */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER - Fixed at bottom, always visible */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-border bg-card px-5 py-4 space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">
                {language === 'uz' ? 'Jami' : 'Итого'}
              </span>
              <span className="font-serif text-xl font-bold">
                {formatPrice(totalPrice)} 
                <span className="text-sm font-normal text-muted-foreground ml-1">{t.products.currency}</span>
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full h-11 text-base font-semibold"
                onClick={onClose}
              >
                <Link to="/checkout">
                  {language === 'uz' ? 'Buyurtma berish' : 'Оформить заказ'}
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-full h-11"
                onClick={onClose}
              >
                <Link to="/cart">
                  {language === 'uz' ? 'Savatchani ko\'rish' : 'Посмотреть корзину'}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
