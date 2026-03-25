import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  RefreshCw, BarChart3, Loader2, Users, AlertTriangle
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_price: number | null;
  cost_price: number | null;
  created_at: string;
  customer_name: string;
}

interface OrderExpenseRow {
  order_id: string;
  amount: number;
}

interface ExpenseRow {
  id: string;
  date: string;
  type: string;
  amount: number;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Yangi',
  in_progress: 'Jarayonda',
  sotildi: 'Sotildi',
  sotilmadi: 'Sotilmadi',
  keyinroq_sotildi: 'Keyinroq sotildi',
};

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function CrmDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderExpenses, setOrderExpenses] = useState<OrderExpenseRow[]>([]);
  const [globalExpenses, setGlobalExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthsBack, setMonthsBack] = useState('1');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchAll();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('crm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_expenses' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, orderExpRes, expRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, status, total_price, cost_price, created_at, customer_name'),
        supabase.from('order_expenses').select('order_id, amount'),
        supabase.from('expenses').select('*'),
      ]);
      setOrders((ordersRes.data as OrderRow[]) || []);
      setOrderExpenses((orderExpRes.data as OrderExpenseRow[]) || []);
      setGlobalExpenses((expRes.data as ExpenseRow[]) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const now = new Date();
    const months = parseInt(monthsBack);
    const startDate = startOfMonth(subMonths(now, months - 1));

    const periodOrders = orders.filter(o => new Date(o.created_at) >= startDate);
    const periodExpenses = globalExpenses.filter(e => new Date(e.date) >= startDate);

    // Order expense map
    const orderExpMap: Record<string, number> = {};
    orderExpenses.forEach(oe => {
      orderExpMap[oe.order_id] = (orderExpMap[oe.order_id] || 0) + oe.amount;
    });

    // Per-order profit
    let totalRevenue = 0;
    let totalCost = 0;
    let totalOrderExp = 0;
    let soldCount = 0;
    let unsoldCount = 0;
    let laterSoldCount = 0;

    periodOrders.forEach(o => {
      const orderExp = orderExpMap[o.id] || 0;
      totalOrderExp += orderExp;

      if (o.status === 'sotildi') {
        totalRevenue += o.total_price || 0;
        totalCost += o.cost_price || 0;
        soldCount++;
      } else if (o.status === 'sotilmadi') {
        totalCost += o.cost_price || 0;
        unsoldCount++;
      } else if (o.status === 'keyinroq_sotildi') {
        totalRevenue += o.total_price || 0;
        laterSoldCount++;
      }
    });

    const totalGlobalExp = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const grossProfit = totalRevenue - totalCost - totalOrderExp;
    const netProfit = grossProfit - totalGlobalExp;

    // Monthly chart data
    const monthlyData: { month: string; revenue: number; expenses: number; profit: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const label = format(m, 'MMM yyyy');

      const mOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= mStart && d <= mEnd;
      });
      const mRev = mOrders.filter(o => ['completed', 'sotildi', 'keyinroq_sotildi'].includes(o.status))
        .reduce((s, o) => s + (o.total_price || 0), 0);
      const mCost = mOrders.reduce((s, o) => s + (o.cost_price || 0), 0);
      const mOrdExp = mOrders.reduce((s, o) => s + (orderExpMap[o.id] || 0), 0);
      const mGlobalExp = globalExpenses.filter(e => {
        const d = new Date(e.date);
        return d >= mStart && d <= mEnd;
      }).reduce((s, e) => s + e.amount, 0);

      monthlyData.push({
        month: label,
        revenue: mRev,
        expenses: mCost + mOrdExp + mGlobalExp,
        profit: mRev - mCost - mOrdExp - mGlobalExp,
      });
    }

    // Status distribution
    const statusDist = periodOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(statusDist).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
    }));

    // Expense type breakdown
    const expByType = periodExpenses.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const expTypeData = Object.entries(expByType).map(([type, amount]) => ({
      name: type,
      value: amount,
    }));

    return {
      totalRevenue, totalCost, totalOrderExp, totalGlobalExp,
      grossProfit, netProfit,
      totalOrders: periodOrders.length,
      soldCount, unsoldCount, laterSoldCount,
      monthlyData, statusChartData, expTypeData,
    };
  }, [orders, orderExpenses, globalExpenses, monthsBack]);

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + ' so\'m';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground">Biznes analitikasi va moliyaviy hisobot</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={monthsBack} onValueChange={setMonthsBack}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 oy</SelectItem>
              <SelectItem value="3">3 oy</SelectItem>
              <SelectItem value="6">6 oy</SelectItem>
              <SelectItem value="12">12 oy</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAll} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Yangilash
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Buyurtmalar</p>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tushum</p>
                <p className="text-xl font-bold text-green-600">{formatPrice(analytics.totalRevenue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Xarajatlar</p>
                    <p className="text-xl font-bold text-red-600">{formatPrice(analytics.totalCost + analytics.totalOrderExp + analytics.totalGlobalExp)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cn(analytics.netProfit >= 0 ? 'border-green-200' : 'border-red-200')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sof foyda</p>
                    <p className={cn("text-xl font-bold", analytics.netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                      {formatPrice(analytics.netProfit)}
                    </p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", analytics.netProfit >= 0 ? "bg-green-100" : "bg-red-100")}>
                    <DollarSign className={cn("h-5 w-5", analytics.netProfit >= 0 ? "text-green-600" : "text-red-600")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Sotildi</p>
            <p className="text-2xl font-bold text-green-600">{analytics.soldCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Sotilmadi</p>
            <p className="text-2xl font-bold text-red-600">{analytics.unsoldCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Keyinroq sotildi</p>
            <p className="text-2xl font-bold text-amber-600">{analytics.laterSoldCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Tushum va Xarajatlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatPrice(value)} />
                  <Bar dataKey="revenue" name="Tushum" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Xarajatlar" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Foyda" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buyurtmalar holati</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={analytics.statusChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {analytics.statusChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profit breakdown table (admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moliyaviy taqsimot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span>Umumiy tushum (sotuv)</span>
                <span className="font-semibold text-green-600">+{formatPrice(analytics.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tannarx (cost price)</span>
                <span className="font-semibold text-red-600">-{formatPrice(analytics.totalCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Buyurtma xarajatlari</span>
                <span className="font-semibold text-red-600">-{formatPrice(analytics.totalOrderExp)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Yalpi foyda</span>
                <span className={cn("font-bold", analytics.grossProfit >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatPrice(analytics.grossProfit)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Umumiy xarajatlar</span>
                <span className="font-semibold text-red-600">-{formatPrice(analytics.totalGlobalExp)}</span>
              </div>
              <div className="flex justify-between py-3 bg-muted/50 rounded-lg px-4">
                <span className="font-bold text-lg">SOF FOYDA</span>
                <span className={cn("font-bold text-lg", analytics.netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatPrice(analytics.netProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
