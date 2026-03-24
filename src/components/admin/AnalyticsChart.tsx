import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertTriangle, ShoppingCart
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth,
  subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  endOfWeek, endOfMonth
} from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_price: number | null;
  cost_price: number | null;
  created_at: string;
  customer_name: string;
  customer_phone: string;
}

interface OrderExpenseRow {
  order_id: string;
  amount: number;
}

interface ExpenseRow {
  date: string;
  amount: number;
}

interface Props {
  orders: OrderRow[];
  orderExpenses: OrderExpenseRow[];
  globalExpenses: ExpenseRow[];
  onOrderClick?: (orderId: string) => void;
}

const TIME_FILTERS = [
  { value: 'today', label: 'Bugun' },
  { value: '7days', label: '7 kun' },
  { value: '30days', label: '30 kun' },
  { value: 'monthly', label: 'Oylik' },
];

const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm";
const formatShort = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : `${v}`;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Yangi', className: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Jarayonda', className: 'bg-amber-100 text-amber-800' },
  completed: { label: 'Bajarildi', className: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Bekor', className: 'bg-rose-100 text-rose-800' },
  sotildi: { label: 'Sotildi', className: 'bg-emerald-100 text-emerald-800' },
  sotilmadi: { label: 'Sotilmadi', className: 'bg-rose-100 text-rose-800' },
  keyinroq_sotildi: { label: 'Keyinroq sotildi', className: 'bg-violet-100 text-violet-800' },
};

export function AnalyticsChart({ orders, orderExpenses, globalExpenses, onOrderClick }: Props) {
  const [timeFilter, setTimeFilter] = useState('30days');
  const [selectedDateOrders, setSelectedDateOrders] = useState<OrderRow[] | null>(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState('');

  // Build order expense map
  const orderExpMap = useMemo(() => {
    const map: Record<string, number> = {};
    orderExpenses.forEach(oe => {
      map[oe.order_id] = (map[oe.order_id] || 0) + oe.amount;
    });
    return map;
  }, [orderExpenses]);

  const analytics = useMemo(() => {
    const now = new Date();
    let rangeStart: Date;
    let groupBy: 'day' | 'week' | 'month' = 'day';

    switch (timeFilter) {
      case 'today':
        rangeStart = startOfDay(now);
        groupBy = 'day';
        break;
      case '7days':
        rangeStart = startOfDay(subDays(now, 6));
        groupBy = 'day';
        break;
      case '30days':
        rangeStart = startOfDay(subDays(now, 29));
        groupBy = 'day';
        break;
      case 'monthly':
        rangeStart = startOfMonth(subMonths(now, 11));
        groupBy = 'month';
        break;
      default:
        rangeStart = startOfDay(subDays(now, 29));
    }

    const rangeEnd = endOfDay(now);

    // Filter data in range
    const rangeOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= rangeStart && d <= rangeEnd;
    });

    const rangeGlobalExp = globalExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= rangeStart && d <= rangeEnd;
    });

    // Generate intervals
    let intervals: { start: Date; end: Date; label: string }[] = [];

    if (groupBy === 'day') {
      const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      intervals = days.map(d => ({
        start: startOfDay(d),
        end: endOfDay(d),
        label: format(d, 'dd.MM'),
      }));
    } else if (groupBy === 'week') {
      const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 });
      intervals = weeks.map(w => ({
        start: startOfWeek(w, { weekStartsOn: 1 }),
        end: endOfWeek(w, { weekStartsOn: 1 }),
        label: format(w, 'dd.MM'),
      }));
    } else {
      const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
      intervals = months.map(m => ({
        start: startOfMonth(m),
        end: endOfMonth(m),
        label: format(m, 'MMM yy'),
      }));
    }

    // Compute chart data
    const chartData = intervals.map(interval => {
      const periodOrders = rangeOrders.filter(o => {
        const d = new Date(o.created_at);
        return d >= interval.start && d <= interval.end;
      });

      const revenue = periodOrders
        .filter(o => ['completed', 'sotildi', 'keyinroq_sotildi'].includes(o.status))
        .reduce((s, o) => s + (o.total_price || 0), 0);

      const costPrice = periodOrders.reduce((s, o) => s + (o.cost_price || 0), 0);
      const orderExp = periodOrders.reduce((s, o) => s + (orderExpMap[o.id] || 0), 0);

      const periodGlobalExp = rangeGlobalExp.filter(e => {
        const d = new Date(e.date);
        return d >= interval.start && d <= interval.end;
      }).reduce((s, e) => s + e.amount, 0);

      const expenses = costPrice + orderExp + periodGlobalExp;
      const profit = revenue - expenses;

      return {
        date: interval.label,
        revenue,
        expenses,
        profit,
        orderIds: periodOrders.map(o => o.id),
        _orders: periodOrders,
      };
    });

    // Current period totals
    const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
    const totalExpenses = chartData.reduce((s, d) => s + d.expenses, 0);
    const totalProfit = totalRevenue - totalExpenses;

    // Previous period for comparison
    const periodLength = rangeEnd.getTime() - rangeStart.getTime();
    const prevStart = new Date(rangeStart.getTime() - periodLength);
    const prevEnd = new Date(rangeStart.getTime() - 1);

    const prevOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevStart && d <= prevEnd;
    });

    const prevRevenue = prevOrders
      .filter(o => ['completed', 'sotildi', 'keyinroq_sotildi'].includes(o.status))
      .reduce((s, o) => s + (o.total_price || 0), 0);

    const prevCost = prevOrders.reduce((s, o) => s + (o.cost_price || 0) + (orderExpMap[o.id] || 0), 0);
    const prevGlobalExp = globalExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= prevStart && d <= prevEnd;
    }).reduce((s, e) => s + e.amount, 0);

    const prevTotalExpenses = prevCost + prevGlobalExp;
    const prevProfit = prevRevenue - prevTotalExpenses;

    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : totalRevenue > 0 ? 100 : 0;
    const expenseChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : totalExpenses > 0 ? 100 : 0;
    const profitChange = prevProfit !== 0 ? ((totalProfit - prevProfit) / Math.abs(prevProfit)) * 100 : totalProfit > 0 ? 100 : totalProfit < 0 ? -100 : 0;

    return {
      chartData,
      totalRevenue,
      totalExpenses,
      totalProfit,
      revenueChange,
      expenseChange,
      profitChange,
      hasLoss: totalProfit < 0,
    };
  }, [orders, orderExpenses, globalExpenses, orderExpMap, timeFilter]);

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      const point = data.activePayload[0].payload;
      if (point._orders?.length > 0) {
        setSelectedDateOrders(point._orders);
        setSelectedDateLabel(point.date);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold mb-2 text-foreground">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Tushum
            </span>
            <span className="text-xs font-semibold text-emerald-600">{formatPrice(data?.revenue || 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Xarajat
            </span>
            <span className="text-xs font-semibold text-rose-600">{formatPrice(data?.expenses || 0)}</span>
          </div>
          <div className="border-t border-border/50 pt-1.5">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("h-2.5 w-2.5 rounded-full", (data?.profit || 0) >= 0 ? "bg-blue-500" : "bg-rose-500")} />
                Foyda
              </span>
              <span className={cn("text-xs font-bold", (data?.profit || 0) >= 0 ? "text-blue-600" : "text-rose-600")}>
                {formatPrice(data?.profit || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ChangeIndicator = ({ value, label }: { value: number; label: string }) => {
    const isPositive = value >= 0;
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
        )}
        <span className={cn("text-xs font-semibold", isPositive ? "text-emerald-600" : "text-rose-600")}>
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
        <span className="text-[10px] text-muted-foreground ml-0.5">{label}</span>
      </div>
    );
  };

  return (
    <>
      <Card className={cn(analytics.hasLoss && "border-rose-300")}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Biznes analitikasi</CardTitle>
              {analytics.hasLoss && (
                <Badge variant="destructive" className="text-[10px] gap-1 h-5">
                  <AlertTriangle className="h-3 w-3" />
                  Zarar
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {TIME_FILTERS.map(f => (
                <Button
                  key={f.value}
                  variant={timeFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setTimeFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className={cn("rounded-lg p-3 border", "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/30")}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-medium text-muted-foreground">Tushum</span>
              </div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatShort(analytics.totalRevenue)}</p>
              <ChangeIndicator value={analytics.revenueChange} label="vs oldingi" />
            </div>

            <div className={cn("rounded-lg p-3 border", "bg-rose-50/50 border-rose-200/50 dark:bg-rose-950/20 dark:border-rose-800/30")}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                <span className="text-[11px] font-medium text-muted-foreground">Xarajat</span>
              </div>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-400 truncate">{formatShort(analytics.totalExpenses)}</p>
              <ChangeIndicator value={-analytics.expenseChange} label="vs oldingi" />
            </div>

            <div className={cn("rounded-lg p-3 border",
              analytics.totalProfit >= 0
                ? "bg-blue-50/50 border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-800/30"
                : "bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-700/50"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                {analytics.totalProfit >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                )}
                <span className="text-[11px] font-medium text-muted-foreground">Foyda</span>
              </div>
              <p className={cn("text-lg font-bold truncate", analytics.totalProfit >= 0 ? "text-blue-700 dark:text-blue-400" : "text-rose-700 dark:text-rose-400")}>
                {formatShort(analytics.totalProfit)}
              </p>
              <ChangeIndicator value={analytics.profitChange} label="vs oldingi" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {analytics.chartData.some(d => d.revenue > 0 || d.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={analytics.chartData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatShort}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Tushum"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  fill="url(#gradRevenue)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Xarajat"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#gradExpenses)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  strokeDasharray="6 3"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Foyda"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#gradProfit)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">Bu davr uchun ma'lumot yo'q</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Grafik nuqtasini bosing — o'sha kundagi buyurtmalarni ko'rish
          </p>
        </CardContent>
      </Card>

      {/* Orders for selected date dialog */}
      <Dialog open={!!selectedDateOrders} onOpenChange={() => setSelectedDateOrders(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Buyurtmalar — {selectedDateLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {selectedDateOrders?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Buyurtma topilmadi</p>
            )}
            {selectedDateOrders?.map(order => {
              const exp = orderExpMap[order.id] || 0;
              const profit = (order.total_price || 0) - (order.cost_price || 0) - exp;
              const cfg = STATUS_CONFIG[order.status];
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDateOrders(null);
                    onOrderClick?.(order.id);
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customer_name} • {order.customer_phone}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3 space-y-1">
                    {cfg && (
                      <Badge variant="outline" className={cn("text-[10px]", cfg.className)}>{cfg.label}</Badge>
                    )}
                    {order.total_price != null && (
                      <p className="text-xs font-medium">{formatPrice(order.total_price)}</p>
                    )}
                    <p className={cn("text-[10px] font-semibold", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      Foyda: {formatPrice(profit)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
