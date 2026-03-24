import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Receipt, Search, RefreshCw, Plus, Trash2, Eye, X,
  TrendingUp, TrendingDown, AlertTriangle, Loader2,
  Package, DollarSign, Clock, User, Hammer, Truck,
  Layers, AlertOctagon, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────
interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total_price: number | null;
  cost_price: number | null;
  created_at: string;
}

interface OrderItemRow {
  product_name_snapshot: string;
  quantity: number;
  price_snapshot: number | null;
}

interface ExpenseRow {
  id: string;
  order_id: string;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
  created_by: string | null;
}

// ─── Constants ───────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Yangi', className: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Jarayonda', className: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Bajarildi', className: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Bekor', className: 'bg-rose-100 text-rose-800' },
  sotildi: { label: 'Sotildi', className: 'bg-emerald-100 text-emerald-800' },
  sotilmadi: { label: 'Sotilmadi', className: 'bg-rose-100 text-rose-800' },
  keyinroq_sotildi: { label: 'Keyinroq sotildi', className: 'bg-violet-100 text-violet-800' },
};

const EXPENSE_TYPES = [
  { value: 'material', label: 'Material', icon: Layers, color: '#3b82f6' },
  { value: 'transport', label: 'Transport', icon: Truck, color: '#f59e0b' },
  { value: 'labor', label: 'Ishchi', icon: Hammer, color: '#8b5cf6' },
  { value: 'other', label: 'Boshqa', icon: DollarSign, color: '#64748b' },
];

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#64748b', '#ef4444', '#06b6d4'];

const formatPrice = (n: number) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatDateTime = (d: string) =>
  new Date(d).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Component ───────────────────────────────────────────
export default function OrderExpenses() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail dialog
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Add expense form
  const [expAmount, setExpAmount] = useState('');
  const [expType, setExpType] = useState('material');
  const [expNote, setExpNote] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  // Delete
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);

  const { user, isAdmin, isManager, isSeller } = useAuth();
  const { toast } = useToast();
  const canSeeProfits = isAdmin || isManager;
  const canManageExpenses = isAdmin || isManager || isSeller;
  const canDeleteExpenses = isAdmin;

  // ─── Data Fetching ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [ordersRes, expRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, customer_name, customer_phone, status, total_price, cost_price, created_at').order('created_at', { ascending: false }),
        supabase.from('order_expenses').select('*').order('created_at', { ascending: false }),
      ]);
      setOrders((ordersRes.data as OrderRow[]) || []);
      setAllExpenses((expRes.data as ExpenseRow[]) || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Real-time ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('order-expenses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_expenses' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // ─── Expense map ────────────────────────────────────────
  const expenseMap = useMemo(() => {
    const map: Record<string, { total: number; count: number; items: ExpenseRow[]; byType: Record<string, number> }> = {};
    allExpenses.forEach(e => {
      if (!map[e.order_id]) map[e.order_id] = { total: 0, count: 0, items: [], byType: {} };
      map[e.order_id].total += e.amount;
      map[e.order_id].count += 1;
      map[e.order_id].items.push(e);
      map[e.order_id].byType[e.type] = (map[e.order_id].byType[e.type] || 0) + e.amount;
    });
    return map;
  }, [allExpenses]);

  // ─── Filtered orders ───────────────────────────────────
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, searchQuery]);

  // ─── Summary stats ─────────────────────────────────────
  const stats = useMemo(() => {
    let totalRevenue = 0, totalCost = 0, totalExpenses = 0, profitableCount = 0, lossCount = 0;
    filteredOrders.forEach(o => {
      const exp = expenseMap[o.id]?.total || 0;
      totalExpenses += exp;
      totalRevenue += o.total_price || 0;
      totalCost += o.cost_price || 0;
      const profit = (o.total_price || 0) - (o.cost_price || 0) - exp;
      if (profit > 0) profitableCount++;
      else if (profit < 0) lossCount++;
    });
    return { totalRevenue, totalCost, totalExpenses, netProfit: totalRevenue - totalCost - totalExpenses, profitableCount, lossCount, ordersCount: filteredOrders.length };
  }, [filteredOrders, expenseMap]);

  // ─── Open detail dialog ────────────────────────────────
  const openDetails = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setLoadingDetails(true);
    setExpAmount('');
    setExpNote('');
    setExpType('material');
    try {
      const { data } = await supabase.from('order_items').select('product_name_snapshot, quantity, price_snapshot').eq('order_id', orderId);
      setOrderItems((data as OrderItemRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedExpenses = selectedOrderId ? (expenseMap[selectedOrderId]?.items || []) : [];
  const selectedTotalExp = selectedOrderId ? (expenseMap[selectedOrderId]?.total || 0) : 0;
  const selectedByType = selectedOrderId ? (expenseMap[selectedOrderId]?.byType || {}) : {};

  // Pie chart data for selected order expenses
  const expPieData = useMemo(() => {
    return Object.entries(selectedByType).map(([type, amount]) => ({
      name: EXPENSE_TYPES.find(t => t.value === type)?.label || type,
      value: amount,
    }));
  }, [selectedByType]);

  // ─── Quick add expense ─────────────────────────────────
  const quickAddExpense = (type: string) => {
    setExpType(type);
    // Focus on amount input
    setTimeout(() => {
      const input = document.getElementById('expense-amount-input');
      if (input) (input as HTMLInputElement).focus();
    }, 50);
  };

  // ─── Add expense ───────────────────────────────────────
  const handleAddExpense = async () => {
    if (!selectedOrderId || !expAmount || Number(expAmount) <= 0) {
      toast({ title: 'Xatolik', description: 'Summani to\'g\'ri kiriting (> 0)', variant: 'destructive' });
      return;
    }
    setAddingExpense(true);
    try {
      const { error } = await supabase.from('order_expenses').insert({
        order_id: selectedOrderId,
        amount: Number(expAmount),
        type: expType,
        note: expNote || null,
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: 'Muvaffaqiyat', description: 'Xarajat qo\'shildi' });
      setExpAmount('');
      setExpNote('');
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    } finally {
      setAddingExpense(false);
    }
  };

  // ─── Delete expense ────────────────────────────────────
  const handleDeleteExpense = async () => {
    if (!deleteExpId) return;
    try {
      const { error } = await supabase.from('order_expenses').delete().eq('id', deleteExpId);
      if (error) throw error;
      toast({ title: 'Muvaffaqiyat', description: 'Xarajat o\'chirildi' });
      setDeleteExpId(null);
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  // ─── Helpers ───────────────────────────────────────────
  const getProfit = (o: OrderRow) => (o.total_price || 0) - (o.cost_price || 0) - (expenseMap[o.id]?.total || 0);
  const getExpensePercent = (o: OrderRow) => {
    if (!o.total_price || o.total_price === 0) return 0;
    return Math.min(100, Math.round(((o.cost_price || 0) + (expenseMap[o.id]?.total || 0)) / o.total_price * 100));
  };

  // ─── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Buyurtma xarajatlari
          </h1>
          <p className="text-sm text-muted-foreground">Har bir buyurtma uchun ishlab chiqarish xarajatlarini kuzating</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")} />
          Yangilash
        </Button>
      </div>

      {/* KPI Cards */}
      <div className={cn("grid gap-4", canSeeProfits ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 lg:grid-cols-2")}>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Buyurtmalar</p>
              <p className="text-xl font-bold">{stats.ordersCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jami xarajatlar</p>
              <p className="text-xl font-bold text-red-600">{formatPrice(stats.totalExpenses + stats.totalCost)}</p>
            </div>
          </CardContent>
        </Card>
        {canSeeProfits && (
          <>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", stats.netProfit >= 0 ? "bg-emerald-100" : "bg-red-100")}>
                  {stats.netProfit >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sof foyda</p>
                  <p className={cn("text-xl font-bold", stats.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>{formatPrice(stats.netProfit)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zarar / Foyda</p>
                  <p className="text-sm">
                    <span className="text-emerald-600 font-semibold">{stats.profitableCount} foyda</span>
                    {' / '}
                    <span className="text-red-600 font-semibold">{stats.lossCount} zarar</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buyurtma №, mijoz ismi yoki telefon..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Barcha status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
              <X className="h-4 w-4 mr-1" /> Tozalash
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Buyurtmalar topilmadi</h3>
              <p className="text-muted-foreground text-sm">Filtrlarni o'zgartirib ko'ring</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Sotuv narxi</TableHead>
                    <TableHead className="text-right">Xarajatlar</TableHead>
                    {canSeeProfits && <TableHead className="text-right">Foyda</TableHead>}
                    <TableHead>Xarajat %</TableHead>
                    <TableHead className="text-center">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => {
                    const totalExp = (order.cost_price || 0) + (expenseMap[order.id]?.total || 0);
                    const profit = getProfit(order);
                    const expPercent = getExpensePercent(order);
                    const expCount = expenseMap[order.id]?.count || 0;

                    return (
                      <TableRow key={order.id} className={cn("group cursor-pointer hover:bg-muted/50", profit < 0 && canSeeProfits && "bg-red-50/50 dark:bg-red-950/10")} onClick={() => openDetails(order.id)}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{order.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs', STATUS_CONFIG[order.status]?.className)}>
                            {STATUS_CONFIG[order.status]?.label || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {order.total_price ? formatPrice(order.total_price) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-sm font-medium text-red-600">{formatPrice(totalExp)}</span>
                            {expCount > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1">{expCount}</Badge>}
                          </div>
                        </TableCell>
                        {canSeeProfits && (
                          <TableCell className="text-right">
                            <span className={cn("font-bold text-sm flex items-center justify-end gap-0.5", profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                              {profit >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                              {formatPrice(Math.abs(profit))}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="w-24">
                            <Progress
                              value={expPercent}
                              className={cn("h-2", expPercent > 80 ? "[&>div]:bg-red-500" : expPercent > 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500")}
                            />
                            <p className="text-[10px] text-muted-foreground mt-0.5 text-center">{expPercent}%</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetails(order.id); }}>
                            <Eye className="h-4 w-4 mr-1" /> Batafsil
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════
          PROFESSIONAL DETAIL MODAL
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          {selectedOrder && (
            <>
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5 text-primary" />
                    Ishlab chiqarish xarajatlari
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-3">
                    <span className="font-medium">{selectedOrder.order_number}</span>
                    <span>•</span>
                    <span>{selectedOrder.customer_name}</span>
                    <Badge variant="outline" className={cn('text-xs ml-1', STATUS_CONFIG[selectedOrder.status]?.className)}>
                      {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-6">

                {/* ── LOSS ALERT ──────────────────────────── */}
                {canSeeProfits && getProfit(selectedOrder) < 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400 text-sm">ZARAR ANIQLANDI!</p>
                      <p className="text-xs text-red-600 dark:text-red-300">Xarajatlar sotuv narxidan oshib ketdi. Zarar: {formatPrice(Math.abs(getProfit(selectedOrder)))}</p>
                    </div>
                  </div>
                )}

                {/* ── PROFIT CALCULATION PANEL ────────────── */}
                <div className="rounded-xl border bg-muted/30 overflow-hidden">
                  <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0">
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Sotuv narxi</p>
                      <p className="text-lg font-bold text-primary">
                        {selectedOrder.total_price ? formatPrice(selectedOrder.total_price) : '—'}
                      </p>
                    </div>
                    {canSeeProfits && (
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">Tannarx</p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatPrice(selectedOrder.cost_price || 0)}
                        </p>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Xarajatlar</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatPrice(selectedTotalExp)}
                      </p>
                    </div>
                    {canSeeProfits && (
                      <div className={cn("p-4", getProfit(selectedOrder) >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20")}>
                        <p className="text-xs text-muted-foreground mb-1">Sof foyda</p>
                        <p className={cn("text-lg font-bold flex items-center gap-1", getProfit(selectedOrder) >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {getProfit(selectedOrder) >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {formatPrice(Math.abs(getProfit(selectedOrder)))}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Smart Progress Bar */}
                  {selectedOrder.total_price && selectedOrder.total_price > 0 && (
                    <div className="px-4 pb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-muted-foreground">Xarajat nisbati</span>
                        <span className={cn("text-xs font-semibold",
                          getExpensePercent(selectedOrder) > 80 ? "text-red-600" :
                          getExpensePercent(selectedOrder) > 50 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {getExpensePercent(selectedOrder)}%
                        </span>
                      </div>
                      <Progress
                        value={getExpensePercent(selectedOrder)}
                        className={cn("h-2.5 rounded-full",
                          getExpensePercent(selectedOrder) > 80 ? "[&>div]:bg-red-500" :
                          getExpensePercent(selectedOrder) > 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                        )}
                      />
                      {getExpensePercent(selectedOrder) > 80 && (
                        <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Diqqat: Xarajatlar sotuv narxining 80% dan oshdi!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── PRODUCTS ────────────────────────────── */}
                {loadingDetails ? (
                  <Skeleton className="h-20 w-full" />
                ) : orderItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Package className="h-4 w-4" /> Mahsulotlar ({orderItems.length})
                    </h4>
                    <div className="space-y-1.5">
                      {orderItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2.5 bg-muted/30 rounded-lg border">
                          <span className="font-medium">{item.product_name_snapshot} <span className="text-muted-foreground font-normal">×{item.quantity}</span></span>
                          <span className="font-semibold">{item.price_snapshot ? formatPrice(item.price_snapshot * item.quantity) : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* ── EXPENSE BREAKDOWN (PIE + LIST) ───────── */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4" /> Xarajatlar taqsimoti
                  </h4>

                  {selectedExpenses.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                      <DollarSign className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Hali xarajat qo'shilmagan</p>
                      <p className="text-xs text-muted-foreground mt-1">Quyidagi tugmalardan foydalanib xarajat qo'shing</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Pie Chart */}
                      {expPieData.length > 0 && (
                        <div className="bg-muted/20 rounded-lg border p-3">
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie data={expPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                {expPieData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip formatter={(value: number) => formatPrice(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap gap-2 justify-center mt-1">
                            {expPieData.map((entry, i) => (
                              <div key={entry.name} className="flex items-center gap-1 text-xs">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-muted-foreground">{entry.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Type breakdown list */}
                      <div className="space-y-2">
                        {EXPENSE_TYPES.map(type => {
                          const amount = selectedByType[type.value] || 0;
                          if (amount === 0) return null;
                          const percent = selectedTotalExp > 0 ? Math.round(amount / selectedTotalExp * 100) : 0;
                          return (
                            <div key={type.value} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: type.color + '20' }}>
                                <type.icon className="h-4 w-4" style={{ color: type.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{type.label}</span>
                                  <span className="text-sm font-bold">{formatPrice(amount)}</span>
                                </div>
                                <Progress value={percent} className="h-1.5 mt-1" />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">{percent}%</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between items-center p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 font-semibold text-sm">
                          <span>Jami:</span>
                          <span className="text-red-600">{formatPrice(selectedTotalExp)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── EXPENSE TIMELINE ─────────────────────── */}
                {selectedExpenses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Xarajatlar tarixi
                    </h4>
                    <div className="relative pl-6 space-y-0">
                      {selectedExpenses.map((exp, i) => {
                        const typeInfo = EXPENSE_TYPES.find(t => t.value === exp.type);
                        const TypeIcon = typeInfo?.icon || DollarSign;
                        return (
                          <div key={exp.id} className="relative pb-4 last:pb-0">
                            {/* Timeline line */}
                            {i < selectedExpenses.length - 1 && (
                              <div className="absolute left-[-16px] top-6 bottom-0 w-px bg-border" />
                            )}
                            {/* Timeline dot */}
                            <div className="absolute left-[-20px] top-1 h-3 w-3 rounded-full border-2 border-background" style={{ backgroundColor: typeInfo?.color || '#64748b' }} />

                            <div className="flex justify-between items-start gap-2 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group/item">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <div className="h-7 w-7 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: (typeInfo?.color || '#64748b') + '15' }}>
                                  <TypeIcon className="h-3.5 w-3.5" style={{ color: typeInfo?.color || '#64748b' }} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[10px] h-5">{typeInfo?.label || exp.type}</Badge>
                                    {exp.note && <span className="text-xs text-muted-foreground truncate">{exp.note}</span>}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDateTime(exp.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-sm text-red-600">{formatPrice(exp.amount)}</span>
                                {canDeleteExpenses && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity" onClick={() => setDeleteExpId(exp.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── ADD EXPENSE SECTION ──────────────────── */}
                {canManageExpenses && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        <Plus className="h-4 w-4" /> Xarajat qo'shish
                      </h4>

                      {/* Quick add buttons */}
                      <div className="flex flex-wrap gap-2">
                        {EXPENSE_TYPES.map(type => {
                          const TypeIcon = type.icon;
                          return (
                            <Button
                              key={type.value}
                              variant={expType === type.value ? "default" : "outline"}
                              size="sm"
                              className="gap-1.5"
                              onClick={() => quickAddExpense(type.value)}
                            >
                              <TypeIcon className="h-3.5 w-3.5" />
                              +{type.label}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Form */}
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Summa *</label>
                          <Input
                            id="expense-amount-input"
                            type="number"
                            placeholder="0"
                            value={expAmount}
                            onChange={e => setExpAmount(e.target.value)}
                            className="w-36"
                            min="1"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Turi</label>
                          <Select value={expType} onValueChange={setExpType}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {EXPENSE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 flex-1 min-w-[140px]">
                          <label className="text-xs text-muted-foreground">Izoh</label>
                          <Input placeholder="Izoh yozing..." value={expNote} onChange={e => setExpNote(e.target.value)} />
                        </div>
                        <Button onClick={handleAddExpense} disabled={addingExpense} className="gap-1.5">
                          {addingExpense ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          Qo'shish
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteExpId} onOpenChange={() => setDeleteExpId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xarajatni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>Bu xarajat qaytarib bo'lmas tarzda o'chiriladi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground">O'chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
