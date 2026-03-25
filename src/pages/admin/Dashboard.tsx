import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, TrendingUp, TrendingDown, DollarSign, Package,
  AlertTriangle, Bell, RefreshCw, ArrowRight, Plus, Users,
  Warehouse, Receipt, BarChart3, Loader2, Calendar as CalendarIcon,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight,
  Layers, Truck, Hammer, Clock, Phone, Send, Eye, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OrderDetailModal } from '@/components/admin/OrderDetailModal';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, isAfter, isBefore, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ─── Types ───────────────────────────────────────────────
interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_price: number | null;
  cost_price: number | null;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  deadline: string | null;
}

interface OrderExpenseRow {
  id: string;
  order_id: string;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
}

interface ExpenseRow {
  id: string;
  date: string;
  type: string;
  amount: number;
}

interface OrderItemRow {
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  price_snapshot: number | null;
  order_id: string;
}

interface LowStockProduct {
  id: string;
  name_uz: string;
  current_stock: number;
}

// ─── Constants ───────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Yangi', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'Jarayonda', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  sotildi: { label: 'Sotildi', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  sotilmadi: { label: 'Sotilmadi', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  keyinroq_sotildi: { label: 'Keyinroq sotildi', className: 'bg-violet-100 text-violet-800 border-violet-200' },
};

const EXPENSE_TYPE_CONFIG = [
  { value: 'material', label: 'Material', icon: Layers, color: '#3b82f6' },
  { value: 'transport', label: 'Transport', icon: Truck, color: '#f59e0b' },
  { value: 'labor', label: 'Ishchi', icon: Hammer, color: '#8b5cf6' },
  { value: 'other', label: 'Boshqa', icon: DollarSign, color: '#64748b' },
];

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

const QUICK_DATE_FILTERS = [
  { value: 'today', label: 'Bugun' },
  { value: 'yesterday', label: 'Kecha' },
  { value: '7days', label: '7 kun' },
  { value: '30days', label: '30 kun' },
  { value: 'this_month', label: 'Bu oy' },
];

// ─── Helpers ─────────────────────────────────────────────
const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm";

const getQuickDateRange = (filter: string): { start: Date; end: Date } => {
  const now = new Date();
  const end = endOfDay(now);
  switch (filter) {
    case 'today': return { start: startOfDay(now), end };
    case 'yesterday': return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    case '7days': return { start: startOfDay(subDays(now, 6)), end };
    case '30days': return { start: startOfDay(subDays(now, 29)), end };
    case 'this_month': return { start: startOfMonth(now), end };
    default: return { start: startOfMonth(now), end };
  }
};

const getStatusBadge = (status: string) => {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>{config.label}</Badge>;
};

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days < 7) return `${days} kun oldin`;
  return format(date, 'dd.MM.yyyy');
};

const formatDateLabel = (start: Date, end: Date) => {
  const sameDay = format(start, 'dd.MM.yyyy') === format(end, 'dd.MM.yyyy');
  if (sameDay) return format(start, 'dd.MM.yyyy');
  return `${format(start, 'dd MMM')} – ${format(end, 'dd MMM')}`;
};

// ─── Component ───────────────────────────────────────────
export default function Dashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderExpenses, setOrderExpenses] = useState<OrderExpenseRow[]>([]);
  const [globalExpenses, setGlobalExpenses] = useState<ExpenseRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>(startOfDay(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [quickFilter, setQuickFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [toPopoverOpen, setToPopoverOpen] = useState(false);
  const [statusModalKey, setStatusModalKey] = useState<string | null>(null);

  const { isAdmin, isManager, user } = useAuth();
  const navigate = useNavigate();
  const canSeeProfits = isAdmin || isManager;

  // Quick filter handler
  const handleQuickFilter = (value: string) => {
    setQuickFilter(value);
    const range = getQuickDateRange(value);
    setDateFrom(range.start);
    setDateTo(range.end);
  };

  const handleDateFromChange = (d: Date | undefined) => {
    if (!d) return;
    const newFrom = startOfDay(d);
    if (isAfter(newFrom, dateTo)) {
      setDateTo(endOfDay(d));
    }
    setDateFrom(newFrom);
    setQuickFilter('custom');
    setFromPopoverOpen(false);
  };

  const handleDateToChange = (d: Date | undefined) => {
    if (!d) return;
    const newTo = endOfDay(d);
    if (isBefore(newTo, dateFrom)) {
      setDateFrom(startOfDay(d));
    }
    setDateTo(newTo);
    setQuickFilter('custom');
    setToPopoverOpen(false);
  };

  // ─── Data Fetching ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [ordersRes, orderExpRes, expRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, status, total_price, cost_price, created_at, customer_name, customer_phone, deadline').order('created_at', { ascending: false }),
        supabase.from('order_expenses').select('id, order_id, amount, type, note, created_at'),
        supabase.from('expenses').select('*'),
        supabase.from('order_items').select('product_id, product_name_snapshot, quantity, price_snapshot, order_id'),
      ]);

      setOrders((ordersRes.data as OrderRow[]) || []);
      setOrderExpenses((orderExpRes.data as OrderExpenseRow[]) || []);
      setGlobalExpenses((expRes.data as ExpenseRow[]) || []);
      setOrderItems((itemsRes.data as OrderItemRow[]) || []);

      // Fetch low stock products
      const { data: products } = await supabase.from('products').select('id, name_uz, initial_stock');
      const { data: movements } = await supabase.from('stock_movements').select('product_id, type, quantity');

      if (products && movements) {
        const aggMap = new Map<string, { total_in: number; total_out: number }>();
        movements.forEach((m: any) => {
          const existing = aggMap.get(m.product_id) || { total_in: 0, total_out: 0 };
          if (m.type === 'in') existing.total_in += m.quantity;
          else existing.total_out += m.quantity;
          aggMap.set(m.product_id, existing);
        });

        const lowStock = products
          .map((p: any) => {
            const agg = aggMap.get(p.id) || { total_in: 0, total_out: 0 };
            return { id: p.id, name_uz: p.name_uz, current_stock: (p.initial_stock || 0) + agg.total_in - agg.total_out };
          })
          .filter(p => p.current_stock < 5)
          .sort((a, b) => a.current_stock - b.current_stock);

        setLowStockProducts(lowStock);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Realtime Subscriptions ─────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_expenses' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // ─── Analytics Computation ──────────────────────────────
  const analytics = useMemo(() => {
    const start = dateFrom;
    const end = dateTo;

    let filteredOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });

    if (statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
    }

    const filteredOrderIds = new Set(filteredOrders.map(o => o.id));

    // Order expense map
    const orderExpMap: Record<string, number> = {};
    const orderExpTypeMap: Record<string, number> = {};
    const orderExpDetailMap: Record<string, { total: number; byType: Record<string, number>; items: OrderExpenseRow[] }> = {};
    orderExpenses.forEach(oe => {
      if (filteredOrderIds.has(oe.order_id)) {
        orderExpMap[oe.order_id] = (orderExpMap[oe.order_id] || 0) + oe.amount;
        orderExpTypeMap[oe.type] = (orderExpTypeMap[oe.type] || 0) + oe.amount;
        if (!orderExpDetailMap[oe.order_id]) orderExpDetailMap[oe.order_id] = { total: 0, byType: {}, items: [] };
        orderExpDetailMap[oe.order_id].total += oe.amount;
        orderExpDetailMap[oe.order_id].byType[oe.type] = (orderExpDetailMap[oe.order_id].byType[oe.type] || 0) + oe.amount;
        orderExpDetailMap[oe.order_id].items.push(oe);
      }
    });

    // Revenue & Profit
    let totalRevenue = 0, totalCost = 0, totalOrderExp = 0;
    filteredOrders.forEach(o => {
      const orderExp = orderExpMap[o.id] || 0;
      totalOrderExp += orderExp;

      if (o.status === 'sotildi') {
        totalRevenue += o.total_price || 0;
        totalCost += o.cost_price || 0;
      } else if (o.status === 'sotilmadi') {
        totalCost += o.cost_price || 0;
      } else if (o.status === 'keyinroq_sotildi') {
        totalRevenue += o.total_price || 0;
      }
    });

    const filteredGlobalExpenses = globalExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
    const totalGlobalExp = filteredGlobalExpenses.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = totalCost + totalOrderExp + totalGlobalExp;
    const netProfit = totalRevenue - totalExpenses;

    // Daily chart data
    const rangeDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const dailyData: { date: string; revenue: number; profit: number }[] = [];
    for (let i = 0; i < rangeDays; i++) {
      const day = addDays(start, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const label = format(day, 'dd.MM');

      const dayOrders = filteredOrders.filter(o => {
        const d = new Date(o.created_at);
        return d >= dayStart && d <= dayEnd;
      });
      const dayRev = dayOrders
        .filter(o => ['sotildi', 'keyinroq_sotildi'].includes(o.status))
        .reduce((s, o) => s + (o.total_price || 0), 0);
      const dayCost = dayOrders.reduce((s, o) => s + (o.cost_price || 0) + (orderExpMap[o.id] || 0), 0);

      dailyData.push({ date: label, revenue: dayRev, profit: dayRev - dayCost });
    }

    // Status distribution
    const statusDist = filteredOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const statusChartData = Object.entries(statusDist).map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status,
      value: count,
    }));

    // Expense breakdown (global + order expenses)
    const expByType: Record<string, number> = { ...orderExpTypeMap };
    filteredGlobalExpenses.forEach(e => {
      expByType[e.type] = (expByType[e.type] || 0) + e.amount;
    });
    const expTypeData = Object.entries(expByType)
      .map(([type, amount]) => ({ name: type, value: amount }))
      .sort((a, b) => b.value - a.value);

    // Top products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    orderItems.forEach(item => {
      if (filteredOrderIds.has(item.order_id)) {
        const existing = productSales.get(item.product_id) || { name: item.product_name_snapshot, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += (item.price_snapshot || 0) * item.quantity;
        productSales.set(item.product_id, existing);
      }
    });
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Today's new orders
    const todayStart = startOfDay(new Date());
    const todayNew = orders.filter(o => new Date(o.created_at) >= todayStart && o.status === 'new').length;

    // Global expense by type
    const globalExpByType: Record<string, number> = {};
    filteredGlobalExpenses.forEach(e => {
      globalExpByType[e.type] = (globalExpByType[e.type] || 0) + e.amount;
    });

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      totalExpenses,
      netProfit,
      totalGlobalExp,
      totalOrderExp,
      todayNew,
      dailyData,
      statusChartData,
      expTypeData,
      topProducts,
      recentOrders: filteredOrders.slice(0, 8),
      orderExpMap,
      orderExpTypeMap,
      orderExpDetailMap,
      globalExpByType,
      filteredOrders,
    };
  }, [orders, orderExpenses, globalExpenses, orderItems, dateFrom, dateTo, statusFilter]);

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header & Filters ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Biznes analitikasi — {formatDateLabel(dateFrom, dateTo)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={refreshing} className="h-9">
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")} />
            Yangilash
          </Button>
        </div>
      </div>

      {/* ─── Date Range Filter Bar ────────────────────── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Quick filters */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_DATE_FILTERS.map(f => (
                <Button
                  key={f.value}
                  variant={quickFilter === f.value ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleQuickFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Date range pickers */}
            <div className="flex items-center gap-2">
              <Popover open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 gap-1.5 text-xs font-normal">
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    {format(dateFrom, 'dd.MM.yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={handleDateFromChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">→</span>
              <Popover open={toPopoverOpen} onOpenChange={setToPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 gap-1.5 text-xs font-normal">
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    {format(dateTo, 'dd.MM.yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={handleDateToChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Barcha status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── Alert: Today's New Orders ────────────────── */}
      {analytics.todayNew > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="flex items-center gap-4 py-3 px-4">
            <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-900 text-sm">Bugun {analytics.todayNew} ta yangi buyurtma!</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              <Link to="/admin/orders">Ko'rish</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Deadline Alerts ──────────────────────────── */}
      {(() => {
        const now = new Date();
        const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const activeStatuses = ['new', 'in_progress'];
        
        const overdueOrders = orders.filter(o => 
          o.deadline && activeStatuses.includes(o.status) && new Date(o.deadline) < now
        );
        const urgentOrders = orders.filter(o => 
          o.deadline && activeStatuses.includes(o.status) && 
          new Date(o.deadline) >= now && new Date(o.deadline) <= oneDayLater
        );
        
        if (overdueOrders.length === 0 && urgentOrders.length === 0) return null;
        
        return (
          <div className="space-y-2">
            {overdueOrders.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="py-3 px-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="font-semibold text-destructive text-sm">
                      {overdueOrders.length} ta buyurtma muddati o'tgan!
                    </span>
                  </div>
                  {overdueOrders.slice(0, 5).map(o => {
                    const daysLate = Math.ceil((now.getTime() - new Date(o.deadline!).getTime()) / 86400000);
                    return (
                      <div key={o.id} className="flex items-center justify-between text-sm pl-6 cursor-pointer hover:bg-destructive/5 rounded px-2 py-1 transition-colors" onClick={() => setDetailOrderId(o.id)}>
                        <span>
                          <span className="font-medium">{o.order_number}</span>
                          <span className="text-muted-foreground"> — {o.customer_name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">{daysLate} kun kechikdi</Badge>
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={(e) => { e.stopPropagation(); setDetailOrderId(o.id); }}>
                            Ko'rish
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            {urgentOrders.length > 0 && (
              <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-3 px-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                      {urgentOrders.length} ta buyurtma 1 kun ichida tayyor bo'lishi kerak!
                    </span>
                  </div>
                  {urgentOrders.slice(0, 5).map(o => {
                    const hoursLeft = Math.max(0, Math.ceil((new Date(o.deadline!).getTime() - now.getTime()) / 3600000));
                    return (
                      <div key={o.id} className="flex items-center justify-between text-sm pl-6 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-950/30 rounded px-2 py-1 transition-colors" onClick={() => setDetailOrderId(o.id)}>
                        <span>
                          <span className="font-medium">{o.order_number}</span>
                          <span className="text-muted-foreground"> — {o.customer_name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">{hoursLeft} soat qoldi</Badge>
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={(e) => { e.stopPropagation(); setDetailOrderId(o.id); }}>
                            Ko'rish
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {/* ─── KPI Cards ────────────────────────────────── */}
      <div className={cn("grid gap-4", canSeeProfits ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-3")}>
        <KPICard
          title="Buyurtmalar"
          value={analytics.totalOrders.toString()}
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={`Bugun: +${analytics.todayNew}`}
        />
        <KPICard
          title="Tushum"
          value={formatPrice(analytics.totalRevenue)}
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          valueColor="text-emerald-600"
        />
        {canSeeProfits && (
          <>
            <KPICard
              title="Sof foyda"
              value={formatPrice(analytics.netProfit)}
              icon={DollarSign}
              iconBg={analytics.netProfit >= 0 ? "bg-emerald-100" : "bg-rose-100"}
              iconColor={analytics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
              valueColor={analytics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
              highlight={true}
              highlightPositive={analytics.netProfit >= 0}
            />
            <KPICard
              title="Xarajatlar"
              value={formatPrice(analytics.totalExpenses)}
              icon={TrendingDown}
              iconBg="bg-rose-100"
              iconColor="text-rose-600"
              valueColor="text-rose-600"
            />
          </>
        )}
        <KPICard
          title="Kam zaxira"
          value={lowStockProducts.length.toString()}
          icon={AlertTriangle}
          iconBg={lowStockProducts.length > 0 ? "bg-amber-100" : "bg-muted"}
          iconColor={lowStockProducts.length > 0 ? "text-amber-600" : "text-muted-foreground"}
          valueColor={lowStockProducts.length > 0 ? "text-amber-600" : undefined}
          subtitle="< 5 dona"
        />
      </div>

      {/* ─── Status Count Cards (Clickable with Preview) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[
          { key: 'new', label: 'YANGI', borderColor: 'border-t-blue-500', valueColor: 'text-blue-600' },
          { key: 'in_progress', label: 'JARAYONDA', borderColor: 'border-t-amber-500', valueColor: 'text-amber-600' },
          { key: 'sotildi', label: 'SOTILDI', borderColor: 'border-t-emerald-500', valueColor: 'text-emerald-600' },
          { key: 'sotilmadi', label: 'SOTILMADI', borderColor: 'border-t-rose-500', valueColor: 'text-rose-600' },
          { key: 'keyinroq_sotildi', label: 'KEYINROQ SOTILDI', borderColor: 'border-t-violet-500', valueColor: 'text-violet-600' },
        ].map(({ key, label, borderColor, valueColor }) => {
          const statusOrders = analytics.filteredOrders.filter(o => o.status === key);
          const count = statusOrders.length;
          const amount = statusOrders.reduce((s, o) => s + (o.total_price || 0), 0);
          const previewOrders = statusOrders.slice(0, 2);

          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer hover:shadow-lg transition-all border-t-4",
                borderColor
              )}
              onClick={() => setStatusModalKey(key)}
            >
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className={cn("text-2xl font-bold mt-0.5", valueColor)}>{count}</p>
                {amount > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatPrice(amount)}</p>
                )}
                {/* Preview of top 2 orders */}
                {previewOrders.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                    {previewOrders.map(o => {
                      const items = orderItems.filter(i => i.order_id === o.id);
                      return (
                        <div key={o.id} className="text-[10px] text-muted-foreground truncate">
                          <span className="font-medium text-foreground">{o.order_number}</span>
                          {items.length > 0 && (
                            <span> — {items[0].product_name_snapshot} x{items[0].quantity}</span>
                          )}
                        </div>
                      );
                    })}
                    {count > 2 && (
                      <p className="text-[10px] text-muted-foreground/60">+{count - 2} ta yana...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Status Orders Modal (Professional) ─────── */}
      <Dialog open={!!statusModalKey} onOpenChange={(open) => !open && setStatusModalKey(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          {/* Modal Header */}
          {statusModalKey && (() => {
            const cfg = STATUS_CONFIG[statusModalKey];
            const modalOrders = analytics.filteredOrders.filter(o => o.status === statusModalKey);
            const totalAmount = modalOrders.reduce((s, o) => s + (o.total_price || 0), 0);
            return (
              <>
                <div className={cn("px-5 py-4 border-b", {
                  'bg-blue-50/80 dark:bg-blue-950/30': statusModalKey === 'new',
                  'bg-amber-50/80 dark:bg-amber-950/30': statusModalKey === 'in_progress',
                  'bg-emerald-50/80 dark:bg-emerald-950/30': statusModalKey === 'sotildi',
                  'bg-rose-50/80 dark:bg-rose-950/30': statusModalKey === 'sotilmadi',
                  'bg-violet-50/80 dark:bg-violet-950/30': statusModalKey === 'keyinroq_sotildi',
                })}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(statusModalKey)}
                      <div>
                        <h3 className="font-bold text-base">{cfg?.label} buyurtmalar</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {modalOrders.length} ta buyurtma · {formatPrice(totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <ScrollArea className="max-h-[75vh]">
                  {modalOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mb-3 opacity-15" />
                      <p className="font-medium">Bu statusda buyurtmalar yo'q</p>
                      <p className="text-xs mt-1">Boshqa sana oralig'ini tanlang</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {modalOrders.map(order => {
                        const items = orderItems.filter(i => i.order_id === order.id);
                        const orderExp = analytics.orderExpMap[order.id] || 0;
                        const profit = (order.total_price || 0) - (order.cost_price || 0) - orderExp;
                        const now = new Date();
                        const deadline = order.deadline ? new Date(order.deadline) : null;
                        const isOverdue = deadline && deadline < now && ['new', 'in_progress'].includes(order.status);
                        const hoursLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 3600000) : null;

                        // Expense breakdown for this order
                        const expDetail = analytics.orderExpDetailMap[order.id];

                        return (
                          <Card key={order.id} className={cn("overflow-hidden transition-shadow hover:shadow-md", isOverdue && "border-destructive/50")}>
                            {/* Order Header */}
                            <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="font-bold text-sm">{order.order_number}</span>
                                {getStatusBadge(order.status)}
                                <span className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm')}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => { setStatusModalKey(null); setDetailOrderId(order.id); }}>
                                  <Eye className="h-3 w-3" /> Ko'rish
                                </Button>
                              </div>
                            </div>

                            <div className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Customer Card */}
                                <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Mijoz
                                  </p>
                                  <p className="text-sm font-semibold">{order.customer_name}</p>
                                  <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                                  <div className="flex gap-1.5 pt-1">
                                    <a href={`tel:${order.customer_phone}`} onClick={e => e.stopPropagation()}>
                                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2">
                                        <Phone className="h-2.5 w-2.5" /> Qo'ng'iroq
                                      </Button>
                                    </a>
                                    <a href={`https://t.me/${order.customer_phone.replace('+', '')}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2">
                                        <Send className="h-2.5 w-2.5" /> Telegram
                                      </Button>
                                    </a>
                                  </div>
                                </div>

                                {/* Products Card */}
                                <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Package className="h-3 w-3" /> Mahsulotlar
                                  </p>
                                  {items.length > 0 ? items.map((item, idx) => (
                                    <div key={idx} className="text-xs">
                                      <p className="font-medium">{item.product_name_snapshot}</p>
                                      <p className="text-muted-foreground">
                                        x{item.quantity}
                                        {item.price_snapshot ? ` · ${formatPrice(item.price_snapshot)}` : ''}
                                      </p>
                                    </div>
                                  )) : (
                                    <p className="text-xs text-muted-foreground">Ma'lumot yo'q</p>
                                  )}
                                </div>

                                {/* Deadline + Financial Card */}
                                <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                                  {/* Deadline */}
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Muddat
                                  </p>
                                  {deadline ? (
                                    <div>
                                      <p className="text-xs font-medium">{format(deadline, 'dd.MM.yyyy HH:mm')}</p>
                                      {isOverdue ? (
                                        <Badge variant="destructive" className="text-[10px] mt-1">
                                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                          MUDDAT O'TIB KETGAN
                                        </Badge>
                                      ) : hoursLeft !== null && hoursLeft > 0 && hoursLeft <= 48 && ['new', 'in_progress'].includes(order.status) ? (
                                        <Badge variant="outline" className="text-[10px] mt-1 border-amber-300 text-amber-700">
                                          {hoursLeft < 24 ? `${hoursLeft} soat qoldi` : `${Math.ceil(hoursLeft / 24)} kun qoldi`}
                                        </Badge>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">Belgilanmagan</p>
                                  )}

                                  {/* Financial summary */}
                                  {canSeeProfits && (
                                    <div className="pt-2 mt-1 border-t border-border/50 space-y-1">
                                      <div className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground">Narx</span>
                                        <span className="font-medium">{formatPrice(order.total_price || 0)}</span>
                                      </div>
                                      <div className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground">Tannarx</span>
                                        <span className="font-medium">{formatPrice(order.cost_price || 0)}</span>
                                      </div>
                                      {orderExp > 0 && (
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-muted-foreground">Xarajat</span>
                                          <span className="font-medium text-rose-600">-{formatPrice(orderExp)}</span>
                                        </div>
                                      )}
                                      <div className={cn("flex justify-between text-[10px] font-bold pt-1 border-t border-border/30", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                        <span>Foyda</span>
                                        <span>{profit >= 0 ? '+' : ''}{formatPrice(profit)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Expense Quick Summary */}
                              {canSeeProfits && expDetail && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {EXPENSE_TYPE_CONFIG.map(t => {
                                    const amt = expDetail.byType[t.value] || 0;
                                    if (amt === 0) return null;
                                    return (
                                      <Badge key={t.value} variant="outline" className="text-[10px] gap-1 font-normal">
                                        <t.icon className="h-2.5 w-2.5" style={{ color: t.color }} />
                                        {t.label}: {formatPrice(amt)}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                              {canSeeProfits && !expDetail && (
                                <p className="mt-2 text-[10px] text-muted-foreground italic">Xarajat qo'shilmagan</p>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Charts ───────────────────────────────────── */}
      {canSeeProfits && (
        <AnalyticsChart
          orders={orders}
          orderExpenses={orderExpenses}
          globalExpenses={globalExpenses}
          onOrderClick={(id) => setDetailOrderId(id)}
        />
      )}

      {/* Status Bar Chart (for all roles) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Buyurtmalar holati</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.statusChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} width={110} />
                  <Tooltip />
                  <Bar dataKey="value" name="Soni" radius={[0, 4, 4, 0]}>
                    {analytics.statusChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Top mahsulotlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topProducts.length > 0 ? (
              <div className="space-y-3">
                {analytics.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-sm font-semibold">{p.quantity} dona</span>
                      {canSeeProfits && (
                        <p className="text-xs text-muted-foreground">{formatPrice(p.revenue)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Package className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Bu oraliqda ma'lumot topilmadi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Low Stock Alert ──────────────────────────── */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Kam zaxira — {lowStockProducts.length} ta mahsulot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockProducts.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name_uz}</p>
                    <p className={cn("text-xs font-semibold", p.current_stock <= 0 ? "text-rose-600" : "text-amber-600")}>
                      {p.current_stock} dona qoldi
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 ml-2 h-7 text-xs border-amber-300 hover:bg-amber-100"
                    onClick={() => navigate('/admin/inventory')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Kirim
                  </Button>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 6 && (
              <Button variant="link" size="sm" asChild className="mt-2 px-0 text-amber-700">
                <Link to="/admin/inventory">Barchasini ko'rish ({lowStockProducts.length}) →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Quick Actions + Recent Orders ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tezkor harakatlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction icon={ShoppingCart} label="Buyurtma yaratish" to="/admin/orders" />
            {canSeeProfits && <QuickAction icon={Receipt} label="Xarajat qo'shish" to="/admin/expenses" />}
            <QuickAction icon={Warehouse} label="Zaxira qo'shish" to="/admin/inventory" />
            <QuickAction icon={Users} label="Mijoz qo'shish" to="/admin/customers" />
            <QuickAction icon={Package} label="Mahsulot qo'shish" to="/admin/products" />
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">So'nggi buyurtmalar</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders" className="flex items-center gap-1 text-xs">
                Barchasi <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {analytics.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Bu oraliqda buyurtmalar topilmadi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.recentOrders.map(order => {
                  const orderExp = analytics.orderExpMap[order.id] || 0;
                  const profit = (order.total_price || 0) - (order.cost_price || 0) - orderExp;

                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setDetailOrderId(order.id)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2 space-y-1">
                        {getStatusBadge(order.status)}
                        {order.total_price && (
                          <p className="text-xs font-medium">{formatPrice(order.total_price)}</p>
                        )}
                        {canSeeProfits && ['sotildi', 'keyinroq_sotildi'].includes(order.status) && (
                          <p className={cn("text-xs font-medium flex items-center justify-end gap-0.5", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {profit >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {formatPrice(Math.abs(profit))}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">{formatRelativeDate(order.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Financial Breakdown (Admin) ──────────────── */}
      {canSeeProfits && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Moliyaviy taqsimot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Revenue */}
            <FinRow label="Umumiy tushum" value={analytics.totalRevenue} positive />

            {/* Order Expenses by type - collapsible */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center py-2 border-b border-border/50 hover:bg-muted/30 transition-colors rounded px-1 cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                    Buyurtma xarajatlari
                  </span>
                  <span className="text-sm font-semibold text-rose-600">-{formatPrice(analytics.totalOrderExp)}</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-5 space-y-0.5 py-1">
                  {EXPENSE_TYPE_CONFIG.map(t => {
                    const amount = analytics.orderExpTypeMap[t.value] || 0;
                    if (amount === 0) return null;
                    return (
                      <div key={t.value} className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-muted/20">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <t.icon className="h-3 w-3" style={{ color: t.color }} />
                          {t.label}
                        </span>
                        <span className="text-xs font-medium text-rose-500">-{formatPrice(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Global expenses by type - collapsible */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex justify-between items-center py-2 border-b border-border/50 hover:bg-muted/30 transition-colors rounded px-1 cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    Umumiy xarajatlar
                  </span>
                  <span className="text-sm font-semibold text-rose-600">-{formatPrice(analytics.totalGlobalExp)}</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-5 space-y-0.5 py-1">
                  {Object.entries(analytics.globalExpByType).map(([type, amount]) => (
                    <div key={type} className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-muted/20">
                      <span className="text-xs text-muted-foreground">{type}</span>
                      <span className="text-xs font-medium text-rose-500">-{formatPrice(amount)}</span>
                    </div>
                  ))}
                  {Object.keys(analytics.globalExpByType).length === 0 && (
                    <p className="text-xs text-muted-foreground py-1 px-2">Xarajat yo'q</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Net Profit */}
            <div className={cn("flex justify-between py-3 px-4 rounded-lg mt-2", analytics.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-rose-50 dark:bg-rose-950/20")}>
              <span className="font-bold">SOF FOYDA</span>
              <span className={cn("font-bold", analytics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {formatPrice(analytics.netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Expense by Order (Admin) ─────────────────── */}
      {canSeeProfits && Object.keys(analytics.orderExpDetailMap).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Xarajatlar buyurtmalar bo'yicha
            </CardTitle>
            <CardDescription className="text-xs">Har bir buyurtma uchun xarajat tafsiloti</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {analytics.filteredOrders
              .filter(o => analytics.orderExpDetailMap[o.id])
              .map(order => {
                const detail = analytics.orderExpDetailMap[order.id];
                const profit = (order.total_price || 0) - (order.cost_price || 0) - detail.total;
                return (
                  <Collapsible key={order.id}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform [[data-state=open]>&]:rotate-90" />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-medium">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground truncate">{order.customer_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Xarajat</p>
                            <p className="text-sm font-semibold text-rose-600">{formatPrice(detail.total)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Foyda</p>
                            <p className={cn("text-sm font-semibold", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {formatPrice(Math.abs(profit))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-7 mr-2 mt-1 mb-2 space-y-1">
                        {/* Type summary */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {EXPENSE_TYPE_CONFIG.map(t => {
                            const amt = detail.byType[t.value] || 0;
                            if (amt === 0) return null;
                            return (
                              <Badge key={t.value} variant="outline" className="text-xs gap-1 font-normal">
                                <t.icon className="h-3 w-3" style={{ color: t.color }} />
                                {t.label}: {formatPrice(amt)}
                              </Badge>
                            );
                          })}
                        </div>
                        {/* Individual entries */}
                        <div className="space-y-0.5">
                          {detail.items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(exp => {
                            const typeInfo = EXPENSE_TYPE_CONFIG.find(t => t.value === exp.type);
                            return (
                              <div key={exp.id} className="flex items-center justify-between py-1.5 px-3 rounded text-xs bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Badge variant="outline" className="text-[10px] h-5 shrink-0" style={{ borderColor: typeInfo?.color }}>
                                    {typeInfo?.label || exp.type}
                                  </Badge>
                                  {exp.note && <span className="text-muted-foreground truncate">{exp.note}</span>}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(exp.created_at), 'dd.MM HH:mm')}
                                  </span>
                                  <span className="font-semibold text-rose-600">{formatPrice(exp.amount)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Total */}
                        <div className="flex justify-between pt-1.5 mt-1 border-t border-border/50 px-3">
                          <span className="text-xs font-semibold">Jami:</span>
                          <span className="text-xs font-bold text-rose-600">{formatPrice(detail.total)}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </CardContent>
        </Card>
      )}
      {/* ─── Order Detail Modal ─────────────────────── */}
      <OrderDetailModal
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
        onOrderUpdated={fetchAll}
      />
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────

function KPICard({ title, value, icon: Icon, iconBg, iconColor, valueColor, subtitle, highlight, highlightPositive }: {
  title: string; value: string; icon: any; iconBg: string; iconColor: string;
  valueColor?: string; subtitle?: string; highlight?: boolean; highlightPositive?: boolean;
}) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", highlight && (highlightPositive ? "border-emerald-200" : "border-rose-200"))}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className={cn("text-xl font-bold mt-1 truncate", valueColor)}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, to }: { icon: any; label: string; to: string }) {
  return (
    <Button variant="ghost" className="w-full justify-start gap-3 h-10" asChild>
      <Link to={to}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </Link>
    </Button>
  );
}

function FinRow({ label, value, positive, sub }: { label: string; value: number; positive?: boolean; sub?: boolean }) {
  return (
    <div className={cn("flex justify-between py-2 border-b border-border/50", sub && "pl-4")}>
      <span className={cn("text-sm", sub ? "text-muted-foreground" : "font-medium")}>{label}</span>
      <span className={cn("text-sm font-semibold", positive ? "text-emerald-600" : "text-rose-600")}>
        {positive ? '+' : '-'}{formatPrice(value)}
      </span>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
      <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
      <p className="text-sm">Bu oraliqda ma'lumot topilmadi</p>
    </div>
  );
}
