import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserPlus, Package, Minus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Customer {
  id: string;
  name: string | null;
  phone: string;
}

interface Product {
  id: string;
  name_uz: string;
  name_ru: string;
  price: number | null;
  images: string[] | null;
  in_stock: boolean | null;
  is_active: boolean | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

export function CreateOrderModal({ open, onOpenChange, onOrderCreated }: CreateOrderModalProps) {
  const [step, setStep] = useState<'customer' | 'products' | 'confirm'>('customer');
  
  // Customer state
  const [customerPhone, setCustomerPhone] = useState('+998');
  const [customerName, setCustomerName] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('customer');
      setCustomerPhone('+998');
      setCustomerName('');
      setCustomerMessage('');
      setDeadline(undefined);
      setFoundCustomer(null);
      setIsNewCustomer(false);
      setCart([]);
      setProductSearch('');
    }
  }, [open]);

  // Fetch products
  useEffect(() => {
    if (step === 'products') {
      fetchProducts();
    }
  }, [step]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_uz, name_ru, price, images, in_stock, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(200);

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const searchCustomer = async () => {
    if (customerPhone.length < 9) return;
    setSearchingCustomer(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('phone', customerPhone)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFoundCustomer(data);
        setCustomerName(data.name || '');
        setIsNewCustomer(false);
      } else {
        setFoundCustomer(null);
        setIsNewCustomer(true);
      }
    } catch (err) {
      console.error('Error searching customer:', err);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name_uz.toLowerCase().includes(q) || p.name_ru.toLowerCase().includes(q);
  });

  const canProceedToProducts = customerName.trim().length >= 2 && customerPhone.length >= 12;
  const canSubmit = cart.length > 0 && !!deadline;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      const response = await supabase.functions.invoke('create-order', {
        body: {
          customer_name: customerName.trim(),
          customer_phone: customerPhone,
          customer_message: customerMessage || undefined,
          deadline: deadline ? deadline.toISOString() : undefined,
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (!result.success) throw new Error(result.error || 'Xatolik');

      // If it's a new customer, link customer_id to order (already handled by edge function customer creation or we skip)
      
      toast({
        title: 'Muvaffaqiyat!',
        description: `Buyurtma ${result.order_number} yaratildi`,
      });

      onOpenChange(false);
      onOrderCreated();
    } catch (err: any) {
      console.error('Error creating order:', err);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err.message || 'Buyurtma yaratishda xatolik',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Yangi buyurtma yaratish
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-2">
          {['customer', 'products', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-primary text-primary-foreground' : 
                ['customer', 'products', 'confirm'].indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
                {s === 'customer' ? 'Mijoz' : s === 'products' ? 'Mahsulotlar' : 'Tasdiqlash'}
              </span>
              {i < 2 && <Separator className="flex-1" />}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* Step 1: Customer */}
          {step === 'customer' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Telefon raqam</Label>
                <div className="flex gap-2">
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={searchCustomer} disabled={searchingCustomer}>
                    <Search className="h-4 w-4 mr-2" />
                    Qidirish
                  </Button>
                </div>
              </div>

              {foundCustomer && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800">Mavjud mijoz</Badge>
                      <span className="font-medium">{foundCustomer.name || 'Nomsiz'}</span>
                      <span className="text-muted-foreground">{foundCustomer.phone}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isNewCustomer && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800 text-sm">Yangi mijoz yaratiladi</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Mijoz ismi *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ism kiriting"
                />
              </div>

              <div className="space-y-2">
                <Label>Xabar (ixtiyoriy)</Label>
                <Textarea
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  placeholder="Qo'shimcha izoh..."
                  rows={3}
                />
              </div>

            </div>
          )}
          {/* Step 2: Products */}
          {step === 'products' && (
            <div className="space-y-4">
              {/* Product search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mahsulot qidirish..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Product list */}
              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto">
                  {filteredProducts.map(product => {
                    const inCart = cart.find(c => c.product.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          inCart ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => !inCart && addToCart(product)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} className="h-10 w-10 rounded object-cover" alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name_uz}</p>
                            <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                          </div>
                        </div>
                        {inCart ? (
                          <Badge>Qo'shildi ×{inCart.quantity}</Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                            <Plus className="h-4 w-4 mr-1" /> Qo'shish
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cart summary - now below products */}
              {cart.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Savatcha ({cart.length})</span>
                      <span className="font-bold">{formatPrice(totalPrice)}</span>
                    </div>
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between text-sm">
                        <span className="flex-1 truncate">{item.product.name_uz}</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="w-24 text-right">{formatPrice((item.product.price || 0) * item.quantity)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Deadline picker inside cart */}
                    <Separator />
                    <div className="space-y-2">
                      <Label>Tayyor bo'lish muddati *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !deadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadline ? format(deadline, "dd.MM.yyyy") : "Sanani tanlang"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deadline}
                            onSelect={setDeadline}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Mijoz ma'lumotlari</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Ism:</span>
                    <span className="font-medium">{customerName}</span>
                    <span className="text-muted-foreground">Telefon:</span>
                    <span className="font-medium">{customerPhone}</span>
                    {customerMessage && (
                      <>
                        <span className="text-muted-foreground">Xabar:</span>
                        <span>{customerMessage}</span>
                      </>
                    )}
                    {deadline && (
                      <>
                        <span className="text-muted-foreground">Muddat:</span>
                        <span className="font-medium">{format(deadline, "dd.MM.yyyy")}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Mahsulotlar</h3>
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span>{item.product.name_uz} ×{item.quantity}</span>
                      <span className="font-medium">{formatPrice((item.product.price || 0) * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Jami:</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex gap-2 pt-4">
          {step !== 'customer' && (
            <Button variant="outline" onClick={() => setStep(step === 'confirm' ? 'products' : 'customer')}>
              Orqaga
            </Button>
          )}
          {step === 'customer' && (
            <Button onClick={() => setStep('products')} disabled={!canProceedToProducts}>
              Davom etish
            </Button>
          )}
          {step === 'products' && (
            <Button onClick={() => setStep('confirm')} disabled={!canSubmit}>
              Tasdiqlash ({cart.length})
            </Button>
          )}
          {step === 'confirm' && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Yaratilmoqda...' : 'Buyurtma yaratish'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
