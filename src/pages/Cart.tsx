import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/hooks/useLanguage';
import { OrderForm } from '@/components/OrderForm';

export default function Cart() {
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { language, t } = useLanguage();

  const formatPrice = (price: number) => price.toLocaleString('uz-UZ');

  const generateWhatsAppMessage = () => {
    let message = language === 'uz' 
      ? "Assalomu alaykum! Men quyidagi mahsulotlarni buyurtma qilmoqchiman:\n\n"
      : "Здравствуйте! Хочу заказать следующие товары:\n\n";

    items.forEach((item, i) => {
      const name = language === 'uz' ? item.product.name_uz : item.product.name_ru;
      message += `${i + 1}. ${name}\n`;
      message += `   ${t.cart.quantity}: ${item.quantity}\n`;
      if (item.selectedSize) message += `   ${t.products.sizes}: ${item.selectedSize}\n`;
      if (item.selectedColor) message += `   ${t.products.colors}: ${item.selectedColor}\n`;
      message += `   ${language === 'uz' ? 'Narxi' : 'Цена'}: ${formatPrice(item.product.price * item.quantity)} ${t.products.currency}\n\n`;
    });

    message += `${t.cart.total}: ${formatPrice(totalPrice)} ${t.products.currency}`;
    return encodeURIComponent(message);
  };

  if (items.length === 0) {
    return (
      <div id="hero" className="min-h-screen flex items-center justify-center py-16">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">{t.cart.empty}</h1>
          <p className="text-muted-foreground mb-6">{t.cart.emptyDesc}</p>
          <Button asChild>
            <Link to="/catalog">{t.cart.continueShopping}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="hero" className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-6 md:mb-8">{t.cart.title}</h1>

        {/* Mobile: Stack layout, Desktop: Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {items.map((item) => {
              const name = language === 'uz' ? item.product.name_uz : item.product.name_ru;
              return (
                <div key={item.product.id} className="flex gap-3 md:gap-4 p-3 md:p-4 bg-card rounded-xl md:rounded-2xl shadow-warm">
                  <Link to={`/product/${item.product.id}`} className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <img src={item.product.images[0]} alt={name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.id}`} className="font-medium text-sm md:text-base hover:text-primary transition-colors line-clamp-2">
                      {name}
                    </Link>
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {item.selectedSize && <span>{item.selectedSize}</span>}
                        {item.selectedSize && item.selectedColor && ' / '}
                        {item.selectedColor && <span>{item.selectedColor}</span>}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 md:mt-3">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7 md:w-8 md:h-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <span className="w-6 md:w-8 text-center text-sm md:text-base font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-7 h-7 md:w-8 md:h-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        {item.product.price > 0 ? (
                          <div className="font-serif text-sm md:text-base font-bold">
                            {formatPrice(item.product.price * item.quantity)} <span className="text-xs md:text-sm font-normal text-muted-foreground">{t.products.currency}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {language === 'uz' ? 'Kelishiladi' : 'Договорная'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => removeItem(item.product.id)}
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Summary - Not sticky on mobile */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-card p-4 md:p-6 rounded-xl md:rounded-2xl shadow-warm">
              <h3 className="font-serif text-lg md:text-xl font-bold mb-3 md:mb-4">{t.cart.total}</h3>
              
              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{items.length} {t.catalog.products}</span>
                  <span>{formatPrice(totalPrice)} {t.products.currency}</span>
                </div>
                <div className="border-t pt-2 md:pt-3 flex justify-between font-medium text-base md:text-lg">
                  <span>{t.cart.total}</span>
                  <span className="font-serif font-bold">{formatPrice(totalPrice)} {t.products.currency}</span>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Button
                  size="lg"
                  className="w-full gap-2 rounded-lg md:rounded-full h-11 md:h-12"
                  onClick={() => setOrderFormOpen(true)}
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" /> {language === 'uz' ? 'Buyurtma berish' : 'Оформить заказ'}
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 rounded-lg md:rounded-full bg-green-500 hover:bg-green-600 text-white border-0 h-11 md:h-12"
                >
                  <a href={`https://wa.me/998901234567?text=${generateWhatsAppMessage()}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5" /> {t.cart.sendWhatsApp}
                  </a>
                </Button>

                <Button asChild variant="outline" className="w-full rounded-lg md:rounded-full h-10 md:h-11">
                  <Link to="/catalog">{t.cart.continueShopping}</Link>
                </Button>
              </div>
            </div>
            
            <OrderForm open={orderFormOpen} onOpenChange={setOrderFormOpen} />
          </div>
        </div>
      </div>
    </div>
  );
}
