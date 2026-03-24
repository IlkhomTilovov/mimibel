import { useState, useMemo } from 'react';
import { useInventory, CreateMovementData, InventoryProduct, StockMovement } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Package, TrendingUp, AlertTriangle, Plus, Search, Minus,
  ArrowDownCircle, ArrowUpCircle, RefreshCw, Download, Loader2, Warehouse,
  XCircle, BarChart3, PackageX, History
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const REASONS = [
  { value: 'manual', label: "Qo'lda kiritish" },
  { value: 'sale', label: 'Sotuv' },
  { value: 'return', label: 'Qaytarish' },
  { value: 'damage', label: 'Shikastlanish' },
  { value: 'other', label: 'Boshqa' },
];

const getReasonLabel = (reason: string) => REASONS.find(r => r.value === reason)?.label || reason;

function StockStatusBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Tugagan</Badge>;
  if (stock < 5) return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1 border-amber-200"><AlertTriangle className="h-3 w-3" /> Kam ({stock})</Badge>;
  return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1 border-green-200">Yetarli ({stock})</Badge>;
}

export default function Inventory() {
  const { inventory, movements, stats, loading, movementsLoading, createMovement, refetch } = useInventory();
  const { hasPermission, isAdmin } = useAuth();
  const canCreate = hasPermission('inventory', 'create');

  const [searchQuery, setSearchQuery] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [movementProductFilter, setMovementProductFilter] = useState('all');

  // Quick action modal
  const [quickModal, setQuickModal] = useState<{ product: InventoryProduct; type: 'in' | 'out' } | null>(null);
  const [quickQty, setQuickQty] = useState('');
  const [quickReason, setQuickReason] = useState('manual');
  const [quickNote, setQuickNote] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Full form state
  const [formProduct, setFormProduct] = useState('');
  const [formType, setFormType] = useState<'in' | 'out'>('in');
  const [formQuantity, setFormQuantity] = useState('');
  const [formReason, setFormReason] = useState('manual');
  const [formNote, setFormNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const outOfStockCount = useMemo(() => inventory.filter(p => p.current_stock === 0).length, [inventory]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(p => p.name_uz.toLowerCase().includes(q) || p.name_ru.toLowerCase().includes(q));
  }, [inventory, searchQuery]);

  const filteredMovements = useMemo(() => {
    let result = movements;
    if (movementTypeFilter !== 'all') result = result.filter(m => m.type === movementTypeFilter);
    if (movementProductFilter !== 'all') result = result.filter(m => m.product_id === movementProductFilter);
    if (movementSearch) {
      const q = movementSearch.toLowerCase();
      result = result.filter(m =>
        (m.product_name || '').toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        (m.note || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [movements, movementSearch, movementTypeFilter, movementProductFilter]);

  // Analytics data
  const movementChartData = useMemo(() => {
    const dayMap = new Map<string, { date: string; in: number; out: number }>();
    movements.forEach(m => {
      const day = format(new Date(m.created_at), 'dd.MM');
      const existing = dayMap.get(day) || { date: day, in: 0, out: 0 };
      if (m.type === 'in') existing.in += m.quantity;
      else existing.out += m.quantity;
      dayMap.set(day, existing);
    });
    return Array.from(dayMap.values()).reverse().slice(-14);
  }, [movements]);

  const topProductsData = useMemo(() => {
    const map = new Map<string, { name: string; out: number }>();
    movements.filter(m => m.type === 'out').forEach(m => {
      const existing = map.get(m.product_id) || { name: m.product_name || '', out: 0 };
      existing.out += m.quantity;
      map.set(m.product_id, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.out - a.out).slice(0, 5);
  }, [movements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct || !formQuantity || parseInt(formQuantity) <= 0) return;
    setSubmitting(true);
    const data: CreateMovementData = {
      product_id: formProduct,
      type: formType,
      quantity: parseInt(formQuantity),
      reason: formReason,
      note: formNote || undefined,
    };
    const success = await createMovement(data);
    if (success) {
      setFormProduct('');
      setFormQuantity('');
      setFormNote('');
      setFormReason('manual');
    }
    setSubmitting(false);
  };

  const handleQuickSubmit = async () => {
    if (!quickModal || !quickQty || parseInt(quickQty) <= 0) return;
    setQuickSubmitting(true);
    const success = await createMovement({
      product_id: quickModal.product.id,
      type: quickModal.type,
      quantity: parseInt(quickQty),
      reason: quickReason,
      note: quickNote || undefined,
    });
    if (success) {
      setQuickModal(null);
      setQuickQty('');
      setQuickNote('');
      setQuickReason('manual');
    }
    setQuickSubmitting(false);
  };

  const exportCSV = () => {
    const headers = ["Mahsulot", "Boshlang'ich", "Kirim", "Chiqim", "Joriy zaxira", "Holat"];
    const rows = filteredInventory.map(p => [
      p.name_uz, p.initial_stock, p.total_in, p.total_out, p.current_stock,
      p.current_stock === 0 ? 'Tugagan' : p.current_stock < 5 ? 'Kam' : 'Yetarli'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ombor-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportMovementsCSV = () => {
    const headers = ['Turi', 'Mahsulot', 'Miqdor', 'Sabab', 'Izoh', 'Sana'];
    const rows = filteredMovements.map(m => [
      m.type === 'in' ? 'Kirim' : 'Chiqim', m.product_name, m.quantity,
      getReasonLabel(m.reason), m.note || '', format(new Date(m.created_at), 'dd.MM.yyyy HH:mm')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `harakatlar-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse className="h-6 w-6" /> Ombor boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">Mahsulotlar zaxirasini boshqarish va nazorat qilish</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-1" /> Yangilash
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {outOfStockCount > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-center gap-3">
          <PackageX className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="font-semibold text-destructive">{outOfStockCount} ta mahsulot tugagan!</p>
            <p className="text-sm text-muted-foreground">Ushbu mahsulotlarga zaxira qo'shish kerak.</p>
          </div>
        </div>
      )}
      {stats.lowStockCount > 0 && outOfStockCount < stats.lowStockCount && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">{stats.lowStockCount - outOfStockCount} ta mahsulot kam qolgan (&lt;5)</p>
            <p className="text-sm text-amber-700/70">Tez orada zaxira tugashi mumkin.</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami mahsulotlar</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami zaxira</p>
                <p className="text-2xl font-bold">{stats.totalStock}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kam qolgan (&lt;5)</p>
                <p className={cn("text-2xl font-bold", stats.lowStockCount > 0 && "text-amber-600")}>{stats.lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tugagan</p>
                <p className={cn("text-2xl font-bold", outOfStockCount > 0 && "text-destructive")}>{outOfStockCount}</p>
              </div>
              <PackageX className="h-8 w-8 text-destructive opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="inventory">Zaxira jadvali</TabsTrigger>
          <TabsTrigger value="movements"><History className="h-3.5 w-3.5 mr-1" />Harakatlar</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-3.5 w-3.5 mr-1" />Analitika</TabsTrigger>
          {canCreate && <TabsTrigger value="add"><Plus className="h-3.5 w-3.5 mr-1" />Qo'shish</TabsTrigger>}
        </TabsList>

        {/* ====== INVENTORY TABLE ====== */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Mahsulot qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-sm" />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead className="text-center">Boshlang'ich</TableHead>
                      <TableHead className="text-center">Kirim</TableHead>
                      <TableHead className="text-center">Chiqim</TableHead>
                      <TableHead className="text-center">Joriy</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      {canCreate && <TableHead className="text-center">Amallar</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canCreate ? 7 : 6} className="text-center text-muted-foreground py-8">Mahsulotlar topilmadi</TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map(product => (
                        <TableRow key={product.id} className={cn(product.current_stock === 0 && "bg-destructive/5")}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images?.[0] && (
                                <img src={product.images[0]} alt="" className="h-10 w-10 rounded-md object-cover border" />
                              )}
                              <div>
                                <p className="font-medium">{product.name_uz}</p>
                                <p className="text-xs text-muted-foreground">{product.name_ru}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{product.initial_stock}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">+{product.total_in}</TableCell>
                          <TableCell className="text-center text-destructive font-medium">-{product.total_out}</TableCell>
                          <TableCell className="text-center font-bold text-lg">{product.current_stock}</TableCell>
                          <TableCell className="text-center"><StockStatusBadge stock={product.current_stock} /></TableCell>
                          {canCreate && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50" onClick={() => { setQuickModal({ product, type: 'in' }); setQuickReason('manual'); }}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => { setQuickModal({ product, type: 'out' }); setQuickReason('manual'); }} disabled={product.current_stock === 0}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== MOVEMENTS ====== */}
        <TabsContent value="movements" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Qidirish..." value={movementSearch} onChange={e => setMovementSearch(e.target.value)} className="max-w-sm" />
            </div>
            <div className="flex gap-2">
              <Select value={movementTypeFilter} onValueChange={(v: any) => setMovementTypeFilter(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="in">Kirim</SelectItem>
                  <SelectItem value="out">Chiqim</SelectItem>
                </SelectContent>
              </Select>
              <Select value={movementProductFilter} onValueChange={setMovementProductFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mahsulot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha mahsulotlar</SelectItem>
                  {inventory.map(p => <SelectItem key={p.id} value={p.id}>{p.name_uz}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportMovementsCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turi</TableHead>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead className="text-center">Miqdor</TableHead>
                      <TableHead>Sabab</TableHead>
                      <TableHead>Izoh</TableHead>
                      <TableHead>Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredMovements.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Harakatlar topilmadi</TableCell></TableRow>
                    ) : (
                      filteredMovements.map(m => (
                        <TableRow key={m.id}>
                          <TableCell>
                            {m.type === 'in' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1"><ArrowDownCircle className="h-3 w-3" /> Kirim</Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1"><ArrowUpCircle className="h-3 w-3" /> Chiqim</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{m.product_name}</TableCell>
                          <TableCell className={cn("text-center font-medium", m.type === 'in' ? 'text-green-600' : 'text-destructive')}>
                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                          </TableCell>
                          <TableCell>{getReasonLabel(m.reason)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{m.note || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(m.created_at), 'dd.MM.yyyy HH:mm')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== ANALYTICS ====== */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Movement Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Kunlik harakatlar (oxirgi 14 kun)</CardTitle>
              </CardHeader>
              <CardContent>
                {movementChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={movementChartData}>
                      <defs>
                        <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="in" name="Kirim" stroke="hsl(var(--primary))" fill="url(#gradIn)" strokeWidth={2} />
                      <Area type="monotone" dataKey="out" name="Chiqim" stroke="hsl(var(--destructive))" fill="url(#gradOut)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Ma'lumot yetarli emas</p>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Eng ko'p chiqim qilingan</CardTitle>
              </CardHeader>
              <CardContent>
                {topProductsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topProductsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="out" name="Chiqim" radius={[0, 4, 4, 0]}>
                        {topProductsData.map((_, i) => (
                          <Cell key={i} fill={`hsl(var(--primary) / ${1 - i * 0.15})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Ma'lumot yetarli emas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====== ADD FORM ====== */}
        {canCreate && (
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Yangi harakat qo'shish</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label>Mahsulot *</Label>
                    <Select value={formProduct} onValueChange={setFormProduct}>
                      <SelectTrigger><SelectValue placeholder="Mahsulotni tanlang" /></SelectTrigger>
                      <SelectContent>
                        {inventory.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name_uz} (zaxira: {p.current_stock})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Turi *</Label>
                    <Select value={formType} onValueChange={(v: 'in' | 'out') => setFormType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">📥 Kirim</SelectItem>
                        <SelectItem value="out">📤 Chiqim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Miqdor *</Label>
                    <Input type="number" min="1" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} placeholder="Miqdorni kiriting" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sabab *</Label>
                    <Select value={formReason} onValueChange={setFormReason}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Izoh (ixtiyoriy)</Label>
                    <Textarea value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="Qo'shimcha izoh..." rows={2} />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={submitting || !formProduct || !formQuantity}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Saqlash
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ====== QUICK ACTION MODAL ====== */}
      <Dialog open={!!quickModal} onOpenChange={open => { if (!open) setQuickModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {quickModal?.type === 'in' ? (
                <><ArrowDownCircle className="h-5 w-5 text-green-600" /> Kirim qo'shish</>
              ) : (
                <><ArrowUpCircle className="h-5 w-5 text-destructive" /> Chiqim qo'shish</>
              )}
            </DialogTitle>
          </DialogHeader>
          {quickModal && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {quickModal.product.images?.[0] && <img src={quickModal.product.images[0]} alt="" className="h-12 w-12 rounded-md object-cover" />}
                <div>
                  <p className="font-medium">{quickModal.product.name_uz}</p>
                  <p className="text-sm text-muted-foreground">Joriy zaxira: <span className="font-bold">{quickModal.product.current_stock}</span></p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Miqdor *</Label>
                <Input type="number" min="1" max={quickModal.type === 'out' ? quickModal.product.current_stock : undefined} value={quickQty} onChange={e => setQuickQty(e.target.value)} placeholder="Miqdorni kiriting" autoFocus />
                {quickModal.type === 'out' && parseInt(quickQty) > quickModal.product.current_stock && (
                  <p className="text-xs text-destructive">Zaxira yetarli emas! Mavjud: {quickModal.product.current_stock}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Sabab</Label>
                <Select value={quickReason} onValueChange={setQuickReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Izoh</Label>
                <Textarea value={quickNote} onChange={e => setQuickNote(e.target.value)} placeholder="Izoh..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickModal(null)}>Bekor qilish</Button>
            <Button onClick={handleQuickSubmit} disabled={quickSubmitting || !quickQty || parseInt(quickQty) <= 0 || (quickModal?.type === 'out' && parseInt(quickQty) > (quickModal?.product.current_stock || 0))}
              className={quickModal?.type === 'in' ? 'bg-green-600 hover:bg-green-700' : ''}>
              {quickSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {quickModal?.type === 'in' ? 'Kirim qilish' : 'Chiqim qilish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
