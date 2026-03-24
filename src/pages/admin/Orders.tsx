import { useEffect, useState } from 'react';
import { CreateOrderModal } from '@/components/admin/CreateOrderModal';
import {
  Eye, 
  Trash2, 
  Filter, 
  Search, 
  Phone, 
  MessageCircle, 
  Calendar,
  Package,
  RefreshCw,
  Send,
  ShoppingBag,
  User,
  Clock,
  X,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface OrderItem {
  id: string;
  product_name_snapshot: string;
  selected_options: {
    size?: string;
    color?: string;
    material?: string;
  } | null;
  quantity: number;
  price_snapshot: number | null;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_message: string | null;
  status: string;
  total_price: number | null;
  cost_price: number | null;
  address: string | null;
  created_at: string;
  deadline: string | null;
  order_items?: OrderItem[];
}

interface OrderExpense {
  id: string;
  order_id: string;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
}

interface TelegramSettings {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
}

const STATUS_CONFIG = {
  new: { 
    label: 'Yangi', 
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' 
  },
  in_progress: { 
    label: 'Jarayonda', 
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300' 
  },
  completed: { 
    label: 'Bajarildi', 
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300' 
  },
  cancelled: { 
    label: 'Bekor qilindi', 
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' 
  },
  sotildi: {
    label: 'Sotildi',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
  },
  sotilmadi: {
    label: 'Sotilmadi',
    className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300'
  },
  keyinroq_sotildi: {
    label: 'Keyinroq sotildi',
    className: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300'
  },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [orderExpenses, setOrderExpenses] = useState<OrderExpense[]>([]);
  const [expAmount, setExpAmount] = useState('');
  const [expType, setExpType] = useState('transport');
  const [expNote, setExpNote] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const { toast } = useToast();
  const { user, isSeller, isAdmin, hasPermission } = useAuth();

  useEffect(() => {
    fetchOrders();
    fetchTelegramSettings();
  }, [statusFilter, dateFrom, dateTo, user]);

  const fetchTelegramSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled']);

      if (error) throw error;

      const settings: TelegramSettings = {
        bot_token: data?.find(s => s.key === 'telegram_bot_token')?.value || '',
        chat_id: data?.find(s => s.key === 'telegram_chat_id')?.value || '',
        enabled: data?.find(s => s.key === 'telegram_enabled')?.value === 'true',
      };
      setTelegramSettings(settings);
    } catch (error) {
      console.error('Error fetching telegram settings:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Seller can only see their own orders
      if (isSeller && !isAdmin && user) {
        query = query.eq('created_by_user_id', user.id);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Xatolik',
        description: 'Buyurtmalarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;

      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder({
          ...order,
          order_items: orderItems as OrderItem[],
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: 'Muvaffaqiyat',
        description: 'Buyurtma holati yangilandi',
      });

      // Send Telegram notification on status change
      if (telegramSettings?.enabled && selectedOrder) {
        await sendTelegramNotification(selectedOrder, `Status yangilandi: ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Xatolik',
        description: 'Holatni yangilashda xatolik',
        variant: 'destructive',
      });
    }
  };

  const deleteOrder = async () => {
    if (!deleteOrderId) return;

    try {
      // First delete order items
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', deleteOrderId);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteOrderId);

      if (error) throw error;

      setOrders(prev => prev.filter(order => order.id !== deleteOrderId));
      setDeleteOrderId(null);

      toast({
        title: 'Muvaffaqiyat',
        description: 'Buyurtma o\'chirildi',
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Xatolik',
        description: 'Buyurtmani o\'chirishda xatolik',
        variant: 'destructive',
      });
    }
  };

  const sendTelegramNotification = async (order: Order, message?: string) => {
    if (!telegramSettings?.bot_token || !telegramSettings?.chat_id) {
      toast({
        title: 'Xatolik',
        description: 'Telegram sozlamalari to\'liq emas',
        variant: 'destructive',
      });
      return;
    }

    setSendingTelegram(true);
    try {
      const items = order.order_items?.map(item => 
        `• ${item.product_name_snapshot} x${item.quantity}${item.price_snapshot ? ` - ${formatPrice(item.price_snapshot)}` : ''}`
      ).join('\n') || 'Mahsulotlar yo\'q';

      const text = `
📦 *Buyurtma: ${order.order_number}*
${message ? `\n📌 ${message}\n` : ''}
👤 *Mijoz:* ${order.customer_name}
📞 *Telefon:* ${order.customer_phone}
📅 *Sana:* ${formatDate(order.created_at)}
📋 *Status:* ${STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]?.label || order.status}

🛒 *Mahsulotlar:*
${items}
${order.total_price ? `\n💰 *Jami:* ${formatPrice(order.total_price)}` : ''}
${order.customer_message ? `\n💬 *Xabar:* ${order.customer_message}` : ''}
      `.trim();

      const response = await fetch(`https://api.telegram.org/bot${telegramSettings.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramSettings.chat_id,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        toast({
          title: 'Muvaffaqiyat',
          description: 'Telegram xabari yuborildi',
        });
      } else {
        throw new Error(result.description);
      }
    } catch (error) {
      console.error('Error sending Telegram:', error);
      toast({
        title: 'Xatolik',
        description: 'Telegram xabarini yuborishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setSendingTelegram(false);
    }
  };

  const callCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const openTelegram = (phone: string) => {
    // Clean phone number and open Telegram
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://t.me/+${cleanPhone}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;
    return (
      <Badge variant="outline" className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = statusFilter !== 'all' || searchQuery || dateFrom || dateTo;

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_phone.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query)
    );
  });

  // Count orders by status
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check if deadline is overdue
  const isOverdue = (order: Order) => {
    if (!order.deadline || order.status === 'completed' || order.status === 'cancelled') return false;
    return new Date(order.deadline) < new Date();
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Count overdue orders
  const overdueCount = orders.filter(isOverdue).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Order Modal */}
      <CreateOrderModal
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        onOrderCreated={fetchOrders}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buyurtmalar</h1>
          <p className="text-muted-foreground">Barcha buyurtmalarni boshqaring</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi buyurtma
          </Button>
          <Button variant="outline" onClick={fetchOrders} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Yangilash
          </Button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('new')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Yangi</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.new || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jarayonda</p>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.in_progress || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('completed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bajarildi</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('cancelled')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bekor qilindi</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.cancelled || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buyurtma №, telefon yoki ism bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="new">Yangi</SelectItem>
                  <SelectItem value="in_progress">Jarayonda</SelectItem>
                  <SelectItem value="completed">Bajarildi</SelectItem>
                  <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[140px]"
                placeholder="Dan"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[140px]"
                placeholder="Gacha"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Buyurtmalar topilmadi</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {hasActiveFilters 
                  ? 'Tanlangan filtrlar bo\'yicha buyurtmalar mavjud emas. Filtrlarni o\'zgartirib ko\'ring.'
                  : 'Hozircha buyurtmalar yo\'q. Mijozlar saytdan buyurtma berganda, ular shu yerda ko\'rinadi.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Filtrlarni tozalash
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma №</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Jami</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Muddat</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className={`group ${isOverdue(order) ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {order.customer_name}
                        </div>
                      </TableCell>
                      <TableCell>{order.customer_phone}</TableCell>
                      <TableCell className="font-medium">
                        {order.total_price ? formatPrice(order.total_price) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.deadline ? (
                          <span className={`text-sm flex items-center gap-1 ${isOverdue(order) ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                            {isOverdue(order) && <AlertTriangle className="h-3 w-3" />}
                            {formatDeadline(order.deadline)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => callCustomer(order.customer_phone)}
                            title="Qo'ng'iroq qilish"
                          >
                            <Phone className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openTelegram(order.customer_phone)}
                            title="Telegramda yozish"
                          >
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchOrderDetails(order.id)}
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteOrderId(order.id)}
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Buyurtma tafsilotlari
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => callCustomer(selectedOrder.customer_phone)}
                  className="gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Qo'ng'iroq
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTelegram(selectedOrder.customer_phone)}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Telegram
                </Button>
                {telegramSettings?.enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTelegramNotification(selectedOrder)}
                    disabled={sendingTelegram}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendingTelegram ? 'Yuborilmoqda...' : 'Telegramga yuborish'}
                  </Button>
                )}
              </div>

              <Separator />

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Mijoz ma'lumotlari
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm text-muted-foreground">Ism</label>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Telefon</label>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Sana</label>
                    <p>{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  {selectedOrder.deadline && (
                    <div>
                      <label className="text-sm text-muted-foreground">Muddat</label>
                      <p className={`font-medium ${isOverdue(selectedOrder) ? 'text-red-600' : ''}`}>
                        {isOverdue(selectedOrder) && '⚠️ '}
                        {formatDeadline(selectedOrder.deadline)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-muted-foreground">Holat</label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Yangi</SelectItem>
                        <SelectItem value="in_progress">Jarayonda</SelectItem>
                        <SelectItem value="completed">Bajarildi</SelectItem>
                        <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {selectedOrder.customer_message && (
                <div>
                  <h3 className="font-semibold mb-2">💬 Mijoz xabari</h3>
                  <p className="p-4 bg-muted rounded-lg border-l-4 border-primary">
                    {selectedOrder.customer_message}
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Buyurtma mahsulotlari
                </h3>
                <div className="space-y-3">
                  {selectedOrder.order_items?.length ? (
                    selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name_snapshot}</p>
                            {item.selected_options && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.selected_options.size && (
                                  <Badge variant="secondary">O'lcham: {item.selected_options.size}</Badge>
                                )}
                                {item.selected_options.color && (
                                  <Badge variant="secondary">Rang: {item.selected_options.color}</Badge>
                                )}
                                {item.selected_options.material && (
                                  <Badge variant="secondary">Material: {item.selected_options.material}</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                            {item.price_snapshot && (
                              <p className="font-semibold">{formatPrice(item.price_snapshot)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Mahsulotlar topilmadi</p>
                  )}
                </div>
              </div>

              {/* Total */}
              {selectedOrder.total_price && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">Jami summa:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(selectedOrder.total_price)}
                    </span>
                  </div>
                </div>
              )}

              {/* Delete Action */}
              <Separator />
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteOrderId(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Buyurtmani o'chirish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buyurtmani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu buyurtmani o'chirmoqchimisiz? Bu amal barcha buyurtma 
              mahsulotlarini ham o'chiradi va qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={deleteOrder} className="bg-destructive text-destructive-foreground">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
