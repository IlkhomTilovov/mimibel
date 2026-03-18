import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Plus,
  Settings,
  Palette,
  AlertTriangle,
  Bell,
  Bot,
  Globe,
  Activity,
  TrendingUp,
  Phone,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/useTheme';

interface OrderStats {
  total: number;
  new: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  todayNew: number;
  todayTotal: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  created_at: string;
  total_price: number | null;
}

interface SystemStatus {
  telegramEnabled: boolean;
  activeTheme: string | null;
  enabledLanguages: string[];
  totalProducts: number;
  totalCategories: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    new: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    todayNew: 0,
    todayTotal: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    telegramEnabled: false,
    activeTheme: null,
    enabledLanguages: ['uz', 'ru'],
    totalProducts: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentTheme } = useTheme();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchSystemStatus(),
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orderStats: OrderStats = {
        total: orders?.length || 0,
        new: orders?.filter(o => o.status === 'new').length || 0,
        inProgress: orders?.filter(o => o.status === 'in_progress').length || 0,
        completed: orders?.filter(o => o.status === 'completed').length || 0,
        cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
        todayNew: orders?.filter(o => {
          const orderDate = new Date(o.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime() && o.status === 'new';
        }).length || 0,
        todayTotal: orders?.filter(o => {
          const orderDate = new Date(o.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        }).length || 0,
      };

      setStats(orderStats);
      setRecentOrders((orders || []).slice(0, 10));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      // Fetch telegram enabled setting
      const { data: telegramData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'telegram_enabled')
        .maybeSingle();

      const telegramEnabled = telegramData?.value === 'true';

      // Fetch system settings
      const { data: systemData } = await supabase
        .from('system_settings')
        .select('languages_enabled')
        .limit(1)
        .maybeSingle();

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch categories count
      const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      setSystemStatus({
        telegramEnabled,
        activeTheme: currentTheme?.name || null,
        enabledLanguages: systemData?.languages_enabled || ['uz', 'ru'],
        totalProducts: productsCount || 0,
        totalCategories: categoriesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      new: { variant: 'default', label: 'Yangi', className: 'bg-blue-500' },
      in_progress: { variant: 'secondary', label: 'Jarayonda', className: 'bg-yellow-500 text-white' },
      completed: { variant: 'outline', label: 'Bajarildi', className: 'border-green-500 text-green-600' },
      cancelled: { variant: 'destructive', label: 'Bekor qilindi' },
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    if (days < 7) return `${days} kun oldin`;
    
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Umumiy ko'rinish va statistika</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAllData}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yangilash
        </Button>
      </div>

      {/* Alerts - New Orders */}
      {stats.todayNew > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">
                Bugun {stats.todayNew} ta yangi buyurtma bor!
              </p>
              <p className="text-sm text-blue-700">Buyurtmalarni ko'rib chiqing</p>
            </div>
            <Button asChild size="sm">
              <Link to="/admin/orders">Ko'rish</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* System Warning */}
      {!systemStatus.telegramEnabled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-yellow-900">
                Telegram bot ulanmagan
              </p>
              <p className="text-sm text-yellow-700">Buyurtma xabarnomalarini olish uchun sozlang</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/settings">Sozlash</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jami buyurtmalar</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Bugun: +{stats.todayTotal}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yangi buyurtmalar</CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
            <p className="text-sm text-muted-foreground">Kutilmoqda</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bajarilgan</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Muvaffaqiyatli</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mahsulotlar</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{systemStatus.totalProducts}</div>
            <p className="text-sm text-muted-foreground">{systemStatus.totalCategories} ta toifada</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tezkor harakatlar</CardTitle>
            <CardDescription>Tez-tez ishlatiladigan amallar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/admin/orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buyurtmalarni ko'rish
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/products">
                <Plus className="mr-2 h-4 w-4" />
                Mahsulot qo'shish
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Telegram sozlamalari
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/themes">
                <Palette className="mr-2 h-4 w-4" />
                Mavzular
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status bo'yicha</CardTitle>
            <CardDescription>Buyurtmalar holati</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Yangi</span>
                </div>
                <Badge variant="secondary">{stats.new}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Jarayonda</span>
                </div>
                <Badge variant="secondary">{stats.inProgress}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Bajarildi</span>
                </div>
                <Badge variant="outline" className="border-green-500 text-green-600">{stats.completed}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm">Bekor qilindi</span>
                </div>
                <Badge variant="destructive">{stats.cancelled}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tizim holati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Bot className={`h-6 w-6 mx-auto mb-2 ${systemStatus.telegramEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Telegram Bot</p>
              <Badge variant={systemStatus.telegramEnabled ? 'default' : 'secondary'} className="mt-1">
                {systemStatus.telegramEnabled ? 'Ulangan' : 'Ulanmagan'}
              </Badge>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Palette className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Faol mavzu</p>
              <p className="text-xs text-muted-foreground mt-1">
                {systemStatus.activeTheme || 'Tanlanmagan'}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Globe className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Tillar</p>
              <div className="flex gap-1 justify-center mt-1">
                {systemStatus.enabledLanguages.map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Package className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-sm font-medium">Katalog</p>
              <p className="text-xs text-muted-foreground mt-1">
                {systemStatus.totalProducts} mahsulot
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">So'nggi buyurtmalar</CardTitle>
            <CardDescription>Oxirgi 10 ta buyurtma</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/orders" className="flex items-center gap-1">
              Barchasini ko'rish
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Hali buyurtmalar yo'q</p>
              <p className="text-sm text-muted-foreground">
                Yangi buyurtmalar bu yerda ko'rinadi
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{order.customer_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.customer_phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.created_at)}
                    </p>
                    {order.total_price && (
                      <p className="text-sm font-medium text-primary mt-1">
                        {formatPrice(order.total_price)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
