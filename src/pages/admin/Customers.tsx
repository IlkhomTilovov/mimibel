import { useEffect, useState, useMemo } from 'react';
import { Phone, User, FileText, ShoppingBag, Search, MessageCircle, Users, RefreshCw, ArrowUpDown, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_count?: number;
  total_spent?: number;
  last_order_date?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number | null;
  created_at: string;
}

type SortField = 'name' | 'order_count' | 'created_at' | 'last_activity';
type SortOrder = 'asc' | 'desc';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderCountFilter, setOrderCountFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('last_activity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Get customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Get all orders with customer info
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, total_price, created_at');

      if (ordersError) throw ordersError;

      // Calculate stats per customer
      const customerStats: Record<string, { count: number; total: number; lastDate: string | null }> = {};
      ordersData?.forEach((order) => {
        if (order.customer_id) {
          if (!customerStats[order.customer_id]) {
            customerStats[order.customer_id] = { count: 0, total: 0, lastDate: null };
          }
          customerStats[order.customer_id].count += 1;
          customerStats[order.customer_id].total += order.total_price || 0;
          
          if (!customerStats[order.customer_id].lastDate || 
              new Date(order.created_at) > new Date(customerStats[order.customer_id].lastDate!)) {
            customerStats[order.customer_id].lastDate = order.created_at;
          }
        }
      });

      const customersWithStats = (customersData || []).map((customer) => ({
        ...customer,
        order_count: customerStats[customer.id]?.count || 0,
        total_spent: customerStats[customer.id]?.total || 0,
        last_order_date: customerStats[customer.id]?.lastDate || null,
      }));

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Mijozlarni yuklashda xatolik' });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.phone.toLowerCase().includes(query) ||
          (c.name && c.name.toLowerCase().includes(query))
      );
    }

    // Order count filter
    if (orderCountFilter !== 'all') {
      if (orderCountFilter === '0') {
        result = result.filter((c) => (c.order_count || 0) === 0);
      } else if (orderCountFilter === '1') {
        result = result.filter((c) => (c.order_count || 0) === 1);
      } else if (orderCountFilter === '2-5') {
        result = result.filter((c) => (c.order_count || 0) >= 2 && (c.order_count || 0) <= 5);
      } else if (orderCountFilter === '5+') {
        result = result.filter((c) => (c.order_count || 0) > 5);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'order_count':
          comparison = (a.order_count || 0) - (b.order_count || 0);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'last_activity':
          const aDate = a.last_order_date || a.created_at;
          const bDate = b.last_order_date || b.created_at;
          comparison = new Date(aDate).getTime() - new Date(bDate).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [customers, searchQuery, orderCountFilter, sortField, sortOrder]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => (c.order_count || 0) > 0).length;
    const totalOrders = customers.reduce((acc, c) => acc + (c.order_count || 0), 0);
    const totalRevenue = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0);
    return { totalCustomers, activeCustomers, totalOrders, totalRevenue };
  }, [customers]);

  const openCustomerDialog = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setNotes(customer.notes || '');
    setDialogOpen(true);

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total_price, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setCustomerOrders(data || []);
    }
  };

  const saveNotes = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ notes })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast({ title: 'Muvaffaqiyat', description: 'Izoh saqlandi' });
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, notes } : c))
      );
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      new: { variant: 'default', label: 'Yangi' },
      in_progress: { variant: 'secondary', label: 'Jarayonda' },
      completed: { variant: 'outline', label: 'Bajarildi' },
      cancelled: { variant: 'destructive', label: 'Bekor qilindi' },
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleTelegram = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://t.me/${cleanPhone}`, '_blank');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mijozlar</h1>
          <p className="text-muted-foreground">Barcha mijozlar va ularning buyurtmalari</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCustomers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami mijozlar</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faol mijozlar</p>
                <p className="text-2xl font-bold">{stats.activeCustomers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami buyurtmalar</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami daromad</p>
                <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <span className="text-xl text-yellow-500">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Telefon yoki ism bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={orderCountFilter} onValueChange={setOrderCountFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Buyurtmalar soni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha mijozlar</SelectItem>
                <SelectItem value="0">0 buyurtma</SelectItem>
                <SelectItem value="1">1 buyurtma</SelectItem>
                <SelectItem value="2-5">2-5 buyurtma</SelectItem>
                <SelectItem value="5+">5+ buyurtma</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_activity">Oxirgi faoliyat</SelectItem>
                <SelectItem value="created_at">Ro'yxatdan o'tgan</SelectItem>
                <SelectItem value="order_count">Buyurtmalar soni</SelectItem>
                <SelectItem value="name">Ism bo'yicha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Barcha mijozlar ({filteredCustomers.length})</span>
            <Button variant="ghost" size="sm" onClick={() => toggleSort(sortField)}>
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {sortOrder === 'desc' ? 'Kamayish' : 'O\'sish'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mijozlar topilmadi</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchQuery || orderCountFilter !== 'all'
                  ? "Qidiruv natijasi bo'yicha mijozlar topilmadi. Filtrlarni o'zgartirib ko'ring."
                  : "Hali mijozlar mavjud emas. Mijozlar saytdan buyurtma berganda avtomatik ro'yxatga olinadi."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-center">Buyurtmalar</TableHead>
                  <TableHead>Jami xarid</TableHead>
                  <TableHead>Izohlar</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name || 'Noma\'lum'}</p>
                          {customer.last_order_date && (
                            <p className="text-xs text-muted-foreground">
                              Oxirgi: {formatDate(customer.last_order_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{customer.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.order_count ? 'default' : 'outline'}>
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        {customer.order_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatPrice(customer.total_spent || 0)}</span>
                    </TableCell>
                    <TableCell>
                      {customer.notes ? (
                        <div className="flex items-center gap-1 text-muted-foreground max-w-[150px]">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{customer.notes}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(customer.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCall(customer.phone)}
                          title="Qo'ng'iroq qilish"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTelegram(customer.phone)}
                          title="Telegram orqali bog'lanish"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openCustomerDialog(customer)}>
                          Batafsil
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mijoz ma'lumotlari
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Ism</Label>
                  <p className="font-medium">{selectedCustomer.name || 'Noma\'lum'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefon</Label>
                  <p className="font-medium font-mono">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Jami buyurtmalar</Label>
                  <p className="font-medium">{selectedCustomer.order_count || 0}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Jami xarid</Label>
                  <p className="font-medium">{formatPrice(selectedCustomer.total_spent || 0)}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleCall(selectedCustomer.phone)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Qo'ng'iroq
                </Button>
                <Button variant="outline" onClick={() => handleTelegram(selectedCustomer.phone)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Telegram
                </Button>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Admin izohlari</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mijoz haqida izoh qo'shing (faqat admin ko'radi)..."
                  rows={3}
                />
                <Button size="sm" onClick={saveNotes}>
                  <FileText className="h-4 w-4 mr-2" />
                  Izohni saqlash
                </Button>
              </div>

              {/* Orders History */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Buyurtmalar tarixi ({customerOrders.length})
                </Label>
                {customerOrders.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium font-mono">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-sm font-medium mt-1">{formatPrice(order.total_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Hali buyurtmalar mavjud emas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
