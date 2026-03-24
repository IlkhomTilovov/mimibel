import { useEffect, useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Receipt, Package, Phone, User, MapPin, Clock, Calendar as CalendarIcon,
  AlertTriangle, AlertOctagon, ArrowUpRight, ArrowDownRight,
  Layers, Truck, Hammer, DollarSign, Plus, Trash2, Loader2,
  CheckCircle2, Edit, MessageSquare
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────
interface OrderFull {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_message: string | null;
  address: string | null;
  status: string;
  total_price: number | null;
  cost_price: number | null;
  deadline: string | null;
  created_at: string;
  customer_id: string | null;
}

interface OrderItemRow {
  id: string;
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

interface CustomerRow {
  referral: string | null;
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

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

const formatPrice = (n: number) =>
  new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm";

const formatDateTime = (d: string) =>
  format(new Date(d), 'dd.MM.yyyy HH:mm');

// ─── Props ───────────────────────────────────────────────
interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export function OrderDetailModal({ orderId, onClose, onOrderUpdated }: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [referral, setReferral] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add expense form
  const [expAmount, setExpAmount] = useState('');
  const [expType, setExpType] = useState('material');
  const [expNote, setExpNote] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);

  // Delete expense
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);

  const { user, isAdmin, isManager, isSeller } = useAuth();
  const { toast } = useToast();
  const canSeeProfits = isAdmin || isManager;
  const canManageExpenses = isAdmin || isManager || isSeller;
  const canDeleteExpenses = isAdmin;

  // ─── Fetch data ────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [orderRes, itemsRes, expRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).single(),
        supabase.from('order_items').select('id, product_name_snapshot, quantity, price_snapshot').eq('order_id', orderId),
        supabase.from('order_expenses').select('*').eq('order_id', orderId).order('created_at', { ascending: false }),
      ]);

      if (orderRes.data) {
        setOrder(orderRes.data as OrderFull);
        // Fetch referral from customer
        if (orderRes.data.customer_id) {
          const { data: cust } = await supabase.from('customers').select('referral').eq('id', orderRes.data.customer_id).single();
          setReferral((cust as CustomerRow)?.referral || null);
        }
      }
      setItems((itemsRes.data as OrderItemRow[]) || []);
      setExpenses((expRes.data as ExpenseRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Realtime
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-detail-${orderId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_expenses', filter: `order_id=eq.${orderId}` }, () => fetchOrder())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, () => fetchOrder())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, fetchOrder]);

  // ─── Computed values ───────────────────────────────────
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.type] = (map[e.type] || 0) + e.amount; });
    return map;
  }, [expenses]);
  const pieData = useMemo(() =>
    Object.entries(byType).map(([type, amount]) => ({
      name: EXPENSE_TYPES.find(t => t.value === type)?.label || type,
      value: amount,
    })), [byType]);

  const profit = order ? (order.total_price || 0) - (order.cost_price || 0) - totalExpenses : 0;
  const expPercent = order?.total_price && order.total_price > 0
    ? Math.min(100, Math.round(((order.cost_price || 0) + totalExpenses) / order.total_price * 100))
    : 0;

  // Deadline
  const deadlineInfo = useMemo(() => {
    if (!order?.deadline) return null;
    const now = new Date();
    const dl = new Date(order.deadline);
    const diff = dl.getTime() - now.getTime();
    const isOverdue = diff < 0;
    const hoursLeft = Math.abs(Math.ceil(diff / 3600000));
    const daysLeft = Math.abs(Math.ceil(diff / 86400000));
    return { isOverdue, hoursLeft, daysLeft, deadline: dl };
  }, [order]);

  // ─── Actions ───────────────────────────────────────────
  const handleAddExpense = async () => {
    if (!orderId || !expAmount || Number(expAmount) <= 0) {
      toast({ title: 'Xatolik', description: 'Summani to\'g\'ri kiriting', variant: 'destructive' });
      return;
    }
    setAddingExpense(true);
    try {
      const { error } = await supabase.from('order_expenses').insert({
        order_id: orderId,
        amount: Number(expAmount),
        type: expType,
        note: expNote || null,
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: 'Muvaffaqiyat', description: 'Xarajat qo\'shildi' });
      setExpAmount('');
      setExpNote('');
      onOrderUpdated?.();
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpId) return;
    try {
      const { error } = await supabase.from('order_expenses').delete().eq('id', deleteExpId);
      if (error) throw error;
      toast({ title: 'O\'chirildi' });
      setDeleteExpId(null);
      onOrderUpdated?.();
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId) return;
    setChangingStatus(true);
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Status yangilandi' });
      onOrderUpdated?.();
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <>
      <Dialog open={!!orderId} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : order ? (
            <>
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5 text-primary" />
                    Buyurtma tafsilotlari
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium">{order.order_number}</span>
                    <span>•</span>
                    <span>{order.customer_name}</span>
                    <Badge variant="outline" className={cn('text-xs', STATUS_CONFIG[order.status]?.className)}>
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">

                {/* ── DEADLINE ALERT ─────────────────────── */}
                {deadlineInfo && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    deadlineInfo.isOverdue
                      ? "bg-destructive/5 border-destructive/30"
                      : deadlineInfo.hoursLeft <= 24
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300"
                        : "bg-muted/30 border-border"
                  )}>
                    {deadlineInfo.isOverdue ? (
                      <AlertOctagon className="h-5 w-5 text-destructive shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={cn("font-semibold text-sm", deadlineInfo.isOverdue ? "text-destructive" : "text-amber-700 dark:text-amber-400")}>
                        {deadlineInfo.isOverdue
                          ? `${deadlineInfo.daysLeft} kun kechikdi!`
                          : deadlineInfo.hoursLeft <= 24
                            ? `${deadlineInfo.hoursLeft} soat qoldi`
                            : `${deadlineInfo.daysLeft} kun qoldi`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Muddat: {format(deadlineInfo.deadline, 'dd.MM.yyyy HH:mm')}
                      </p>
                    </div>
                    {!deadlineInfo.isOverdue && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Vaqtida
                      </Badge>
                    )}
                  </div>
                )}

                {/* ── BASIC INFO ─────────────────────────── */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Mijoz</p>
                          <p className="font-medium">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Telefon</p>
                          <p className="font-medium">{order.customer_phone}</p>
                        </div>
                      </div>
                      {order.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Manzil</p>
                            <p className="font-medium">{order.address}</p>
                          </div>
                        </div>
                      )}
                      {referral && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Referal</p>
                            <p className="font-medium">{referral}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Yaratilgan</p>
                          <p className="font-medium">{formatDateTime(order.created_at)}</p>
                        </div>
                      </div>
                      {order.deadline && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Muddat</p>
                            <p className="font-medium">{formatDateTime(order.deadline)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {order.customer_message && (
                      <div className="mt-3 p-2 rounded bg-muted/30 text-sm">
                        <span className="text-muted-foreground">Izoh: </span>{order.customer_message}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── STATUS CHANGE ──────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium mr-1">Status:</span>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={order.status === key ? "default" : "outline"}
                      className={cn("h-7 text-xs", order.status === key && val.className)}
                      disabled={changingStatus || order.status === key}
                      onClick={() => handleStatusChange(key)}
                    >
                      {val.label}
                    </Button>
                  ))}
                </div>

                {/* ── PROFIT PANEL ───────────────────────── */}
                <div className="rounded-xl border bg-muted/30 overflow-hidden">
                  <div className={cn("grid divide-x divide-y lg:divide-y-0", canSeeProfits ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2")}>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Sotuv narxi</p>
                      <p className="text-lg font-bold text-primary">{order.total_price ? formatPrice(order.total_price) : '—'}</p>
                    </div>
                    {canSeeProfits && (
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">Tannarx</p>
                        <p className="text-lg font-bold text-orange-600">{formatPrice(order.cost_price || 0)}</p>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Xarajatlar</p>
                      <p className="text-lg font-bold text-rose-600">{formatPrice(totalExpenses)}</p>
                    </div>
                    {canSeeProfits && (
                      <div className={cn("p-4", profit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-rose-50 dark:bg-rose-950/20")}>
                        <p className="text-xs text-muted-foreground mb-1">Sof foyda</p>
                        <p className={cn("text-lg font-bold flex items-center gap-1", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {profit >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {formatPrice(Math.abs(profit))}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {order.total_price && order.total_price > 0 && (
                    <div className="px-4 pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Xarajat nisbati</span>
                        <span className={cn("text-xs font-semibold",
                          expPercent > 80 ? "text-rose-600" : expPercent > 50 ? "text-amber-600" : "text-emerald-600"
                        )}>{expPercent}%</span>
                      </div>
                      <Progress value={expPercent} className={cn("h-2 rounded-full",
                        expPercent > 80 ? "[&>div]:bg-rose-500" : expPercent > 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                      )} />
                    </div>
                  )}
                </div>

                {/* ── LOSS ALERT ─────────────────────────── */}
                {canSeeProfits && profit < 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/30">
                    <AlertOctagon className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <p className="font-semibold text-destructive text-sm">ZARAR ANIQLANDI!</p>
                      <p className="text-xs text-destructive/80">Zarar: {formatPrice(Math.abs(profit))}</p>
                    </div>
                  </div>
                )}

                {/* ── PRODUCTS ───────────────────────────── */}
                {items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Package className="h-4 w-4" /> Mahsulotlar ({items.length})
                    </h4>
                    <div className="space-y-1.5">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-2.5 bg-muted/30 rounded-lg border">
                          <span className="font-medium">
                            {item.product_name_snapshot}
                            <span className="text-muted-foreground font-normal ml-1">×{item.quantity}</span>
                          </span>
                          <span className="font-semibold">{item.price_snapshot ? formatPrice(item.price_snapshot * item.quantity) : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* ── EXPENSE BREAKDOWN ──────────────────── */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4" /> Xarajatlar ({expenses.length})
                  </h4>

                  {expenses.length === 0 ? (
                    <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Xarajat yo'q</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Pie */}
                      {pieData.length > 0 && (
                        <div className="bg-muted/20 rounded-lg border p-3">
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <RechartsTooltip formatter={(v: number) => formatPrice(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap gap-2 justify-center mt-1">
                            {pieData.map((e, i) => (
                              <div key={e.name} className="flex items-center gap-1 text-xs">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-muted-foreground">{e.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Type list */}
                      <div className="space-y-2">
                        {EXPENSE_TYPES.map(t => {
                          const amount = byType[t.value] || 0;
                          if (!amount) return null;
                          const pct = totalExpenses > 0 ? Math.round(amount / totalExpenses * 100) : 0;
                          return (
                            <div key={t.value} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + '20' }}>
                                <t.icon className="h-4 w-4" style={{ color: t.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{t.label}</span>
                                  <span className="text-sm font-bold">{formatPrice(amount)}</span>
                                </div>
                                <Progress value={pct} className="h-1.5 mt-1" />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between items-center p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800 font-semibold text-sm">
                          <span>Jami:</span>
                          <span className="text-rose-600">{formatPrice(totalExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── EXPENSE TIMELINE ───────────────────── */}
                {expenses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Xarajatlar tarixi
                    </h4>
                    <div className="space-y-1">
                      {expenses.map(exp => {
                        const typeInfo = EXPENSE_TYPES.find(t => t.value === exp.type);
                        return (
                          <div key={exp.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Badge variant="outline" className="text-[10px] h-5 shrink-0" style={{ borderColor: typeInfo?.color }}>
                                {typeInfo?.label || exp.type}
                              </Badge>
                              {exp.note && <span className="text-xs text-muted-foreground truncate">{exp.note}</span>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-muted-foreground">{formatDateTime(exp.created_at)}</span>
                              <span className="font-semibold text-sm text-rose-600">{formatPrice(exp.amount)}</span>
                              {canDeleteExpenses && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setDeleteExpId(exp.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── ADD EXPENSE ────────────────────────── */}
                {canManageExpenses && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        <Plus className="h-4 w-4" /> Xarajat qo'shish
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {EXPENSE_TYPES.map(t => (
                          <Button key={t.value} variant={expType === t.value ? "default" : "outline"} size="sm" className="gap-1.5"
                            onClick={() => { setExpType(t.value); document.getElementById('modal-exp-amount')?.focus(); }}>
                            <t.icon className="h-3.5 w-3.5" />+{t.label}
                          </Button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Summa *</span>
                          <Input id="modal-exp-amount" type="number" placeholder="0" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="w-32" min="1" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Turi</span>
                          <Select value={expType} onValueChange={setExpType}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {EXPENSE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 flex-1 min-w-[120px]">
                          <span className="text-xs text-muted-foreground">Izoh</span>
                          <Input placeholder="Izoh..." value={expNote} onChange={e => setExpNote(e.target.value)} />
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
          ) : (
            <div className="p-6 text-center text-muted-foreground">Buyurtma topilmadi</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete expense confirmation */}
      <AlertDialog open={!!deleteExpId} onOpenChange={() => setDeleteExpId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xarajatni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>Bu xarajat qaytarib bo'lmas tarzda o'chiriladi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground">O'chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
