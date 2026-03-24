import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Receipt, Search, RefreshCw, Plus, Trash2, Eye, X,
  TrendingUp, TrendingDown, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Package, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  { value: 'material', label: 'Material' },
  { value: 'transport', label: 'Transport' },
  { value: 'labor', label: 'Ishchi' },
  { value: 'other', label: 'Boshqa' },
];

const formatPrice = (n: number) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

// ─── Component ───────────────────────────────────────────
export default function OrderExpenses() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail dialog state
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

  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const canSeeProfits = isAdmin || isManager;
  const canManageExpenses = isAdmin || isManager;

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
    const map: Record<string, { total: number; count: number; items: ExpenseRow[] }> = {};
    allExpenses.forEach(e => {
      if (!map[e.order_id]) map[e.order_id] = { total: 0, count: 0, items: [] };
      map[e.order_id].total += e.amount;
      map[e.order_id].count += 1;
      map[e.order_id].items.push(e);
    });
    return map;
  }, [allExpenses]);

  // ─── Filtered orders ───────────────────────────────────
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
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
      const revenue = o.total_price || 0;
      const cost = o.cost_price || 0;
      totalRevenue += revenue;
      totalCost += cost;
      const profit = revenue - cost - exp;
      if (profit > 0) profitableCount++;
      else if (profit < 0) lossCount++;
    });
    return { totalRevenue, totalCost, totalExpenses, netProfit: totalRevenue - totalCost - totalExpenses, profitableCount, lossCount, ordersCount: filteredOrders.length };
  }, [filteredOrders, expenseMap]);

  // ─── Open detail dialog ────────────────────────────────
  const openDetails = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setLoadingDetails(true);
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
                      <TableRow key={order.id} className={cn("group cursor-pointer hover:bg-muted/50", profit < 0 && canSeeProfits && "bg-red-50/50 dark:bg-red-950/10")}>
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
                            {expCount > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1">{expCount}</Badge>
                            )}
                          </div>
                        </TableCell>
                        {canSeeProfits && (
                          <TableCell className="text-right">
                            <span className={cn("font-bold text-sm", profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                              {formatPrice(profit)}
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
                          <Button variant="ghost" size="sm" onClick={() => openDetails(order.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Batafsil
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Buyurtma xarajatlari
            </DialogTitle>
            <DialogDescription>{selectedOrder?.order_number} — {selectedOrder?.customer_name}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5">
              {/* Order summary */}
              <div className="grid grid-cols-2 gap-3 bg-muted/50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Holat</p>
                  <Badge variant="outline" className={cn('mt-1', STATUS_CONFIG[selectedOrder.status]?.className)}>
                    {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sotuv narxi</p>
                  <p className="font-bold text-primary">{selectedOrder.total_price ? formatPrice(selectedOrder.total_price) : '—'}</p>
                </div>
                {canSeeProfits && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Tannarx</p>
                      <p className="font-medium text-red-600">{formatPrice(selectedOrder.cost_price || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Buyurtma xarajatlari</p>
                      <p className="font-medium text-red-600">{formatPrice(selectedTotalExp)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Profit bar */}
              {canSeeProfits && selectedOrder.total_price && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">Xarajat / Sotuv nisbati</span>
                    <span className={cn("text-sm font-bold", getProfit(selectedOrder) >= 0 ? "text-emerald-600" : "text-red-600")}>
                      Foyda: {formatPrice(getProfit(selectedOrder))}
                    </span>
                  </div>
                  <Progress
                    value={getExpensePercent(selectedOrder)}
                    className={cn("h-3", getExpensePercent(selectedOrder) > 80 ? "[&>div]:bg-red-500" : getExpensePercent(selectedOrder) > 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500")}
                  />
                  {getExpensePercent(selectedOrder) > 80 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Xarajatlar juda yuqori!
                    </p>
                  )}
                </div>
              )}

              {/* Products */}
              {loadingDetails ? (
                <Skeleton className="h-20 w-full" />
              ) : orderItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Package className="h-4 w-4" /> Mahsulotlar
                  </h4>
                  <div className="space-y-1.5">
                    {orderItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                        <span>{item.product_name_snapshot} <span className="text-muted-foreground">x{item.quantity}</span></span>
                        <span className="font-medium">{item.price_snapshot ? formatPrice(item.price_snapshot * item.quantity) : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Expenses list */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4" /> Xarajatlar ({selectedExpenses.length})
                </h4>
                {selectedExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Hali xarajat qo'shilmagan</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedExpenses.map(exp => (
                      <div key={exp.id} className="flex justify-between items-center p-2.5 bg-muted/30 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {EXPENSE_TYPES.find(t => t.value === exp.type)?.label || exp.type}
                          </Badge>
                          {exp.note && <span className="text-sm text-muted-foreground">{exp.note}</span>}
                          <span className="text-xs text-muted-foreground">{formatDate(exp.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-red-600">{formatPrice(exp.amount)}</span>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteExpId(exp.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-2.5 bg-red-50 dark:bg-red-950/20 rounded font-semibold text-sm">
                      <span>Jami xarajatlar:</span>
                      <span className="text-red-600">{formatPrice(selectedTotalExp)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Add expense form */}
              {canManageExpenses && (
                <div className="border rounded-lg p-3 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Xarajat qo'shish
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="number"
                      placeholder="Summa *"
                      value={expAmount}
                      onChange={e => setExpAmount(e.target.value)}
                      className="w-32"
                      min="1"
                    />
                    <Select value={expType} onValueChange={setExpType}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Izoh" value={expNote} onChange={e => setExpNote(e.target.value)} className="flex-1 min-w-[120px]" />
                    <Button size="sm" onClick={handleAddExpense} disabled={addingExpense}>
                      {addingExpense ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                      Qo'shish
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
