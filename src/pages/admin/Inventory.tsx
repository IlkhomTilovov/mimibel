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
import {
  Package, TrendingUp, TrendingDown, AlertTriangle, Plus, Search,
  ArrowDownCircle, ArrowUpCircle, RefreshCw, Download, Loader2, Warehouse
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const REASONS = [
  { value: 'manual', label: 'Qo\'lda kiritish' },
  { value: 'sale', label: 'Sotuv' },
  { value: 'return', label: 'Qaytarish' },
  { value: 'damage', label: 'Shikastlanish' },
  { value: 'other', label: 'Boshqa' },
];

export default function Inventory() {
  const { inventory, movements, stats, loading, movementsLoading, createMovement, refetch } = useInventory();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('inventory', 'create');

  // Form state
  const [formProduct, setFormProduct] = useState('');
  const [formType, setFormType] = useState<'in' | 'out'>('in');
  const [formQuantity, setFormQuantity] = useState('');
  const [formReason, setFormReason] = useState('manual');
  const [formNote, setFormNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [movementSearch, setMovementSearch] = useState('');

  const filteredInventory = useMemo(() => {
    if (!searchQuery) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(p => p.name_uz.toLowerCase().includes(q) || p.name_ru.toLowerCase().includes(q));
  }, [inventory, searchQuery]);

  const filteredMovements = useMemo(() => {
    if (!movementSearch) return movements;
    const q = movementSearch.toLowerCase();
    return movements.filter(m =>
      (m.product_name || '').toLowerCase().includes(q) ||
      m.reason.toLowerCase().includes(q) ||
      (m.note || '').toLowerCase().includes(q)
    );
  }, [movements, movementSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct || !formQuantity || parseInt(formQuantity) <= 0) {
      return;
    }
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

  const exportCSV = () => {
    const headers = ['Mahsulot', 'Boshlang\'ich', 'Kirim', 'Chiqim', 'Joriy zaxira'];
    const rows = filteredInventory.map(p => [p.name_uz, p.initial_stock, p.total_in, p.total_out, p.current_stock]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ombor-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
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
            <Warehouse className="h-6 w-6" />
            Ombor boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">Mahsulotlar zaxirasini boshqarish</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold text-destructive">{stats.lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Zaxira jadvali</TabsTrigger>
          <TabsTrigger value="movements">Harakatlar tarixi</TabsTrigger>
          {canCreate && <TabsTrigger value="add">Harakat qo'shish</TabsTrigger>}
        </TabsList>

        {/* Inventory Table */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mahsulot qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
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
                      <TableHead className="text-center">Joriy zaxira</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Mahsulotlar topilmadi
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name_uz}</TableCell>
                          <TableCell className="text-center">{product.initial_stock}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">+{product.total_in}</TableCell>
                          <TableCell className="text-center text-destructive font-medium">-{product.total_out}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={product.current_stock < 5 ? 'destructive' : product.current_stock < 10 ? 'secondary' : 'default'}
                              className={cn(
                                product.current_stock >= 10 && 'bg-green-100 text-green-800 hover:bg-green-100'
                              )}
                            >
                              {product.current_stock}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements History */}
        <TabsContent value="movements" className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Harakatlarni qidirish..."
              value={movementSearch}
              onChange={e => setMovementSearch(e.target.value)}
              className="max-w-sm"
            />
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
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Harakatlar topilmadi
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map(m => (
                        <TableRow key={m.id}>
                          <TableCell>
                            {m.type === 'in' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                                <ArrowDownCircle className="h-3 w-3" /> Kirim
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <ArrowUpCircle className="h-3 w-3" /> Chiqim
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{m.product_name}</TableCell>
                          <TableCell className="text-center font-medium">
                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                          </TableCell>
                          <TableCell>{REASONS.find(r => r.value === m.reason)?.label || m.reason}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{m.note || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(m.created_at), 'dd.MM.yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Movement Form */}
        {canCreate && (
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Yangi harakat qo'shish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label>Mahsulot *</Label>
                    <Select value={formProduct} onValueChange={setFormProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mahsulotni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name_uz} (zaxira: {p.current_stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Turi *</Label>
                    <Select value={formType} onValueChange={(v: 'in' | 'out') => setFormType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">📥 Kirim</SelectItem>
                        <SelectItem value="out">📤 Chiqim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Miqdor *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formQuantity}
                      onChange={e => setFormQuantity(e.target.value)}
                      placeholder="Miqdorni kiriting"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sabab *</Label>
                    <Select value={formReason} onValueChange={setFormReason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REASONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Izoh (ixtiyoriy)</Label>
                    <Textarea
                      value={formNote}
                      onChange={e => setFormNote(e.target.value)}
                      placeholder="Qo'shimcha izoh..."
                      rows={2}
                    />
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
    </div>
  );
}
