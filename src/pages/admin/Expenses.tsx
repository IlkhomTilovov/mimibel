import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DollarSign, Plus, Search, Trash2, RefreshCw, Calendar, TrendingDown,
  Receipt, Filter, X, Download, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Expense {
  id: string;
  date: string;
  type: string;
  amount: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

const EXPENSE_TYPES = [
  { value: 'rent', label: 'Ijara' },
  { value: 'salary', label: 'Oylik maosh' },
  { value: 'transport', label: 'Transport' },
  { value: 'material', label: 'Material' },
  { value: 'utility', label: 'Kommunal' },
  { value: 'marketing', label: 'Reklama' },
  { value: 'tax', label: 'Soliq' },
  { value: 'other', label: 'Boshqa' },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAdmin, hasPermission } = useAuth();
  const canCreate = hasPermission('expenses', 'create');
  const canDelete = hasPermission('expenses', 'delete');

  // Form
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formType, setFormType] = useState('other');
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setExpenses((data as Expense[]) || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({ title: 'Xatolik', description: 'Xarajatlarni yuklashda xatolik', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formAmount || Number(formAmount) <= 0) {
      toast({ title: 'Xatolik', description: 'Summani to\'g\'ri kiriting', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        date: formDate,
        type: formType,
        amount: Number(formAmount),
        note: formNote || null,
        created_by: user?.id || null,
      });
      if (error) throw error;
      toast({ title: 'Muvaffaqiyat', description: 'Xarajat qo\'shildi' });
      setFormAmount('');
      setFormNote('');
      setFormType('other');
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', deleteId);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== deleteId));
      setDeleteId(null);
      toast({ title: 'Muvaffaqiyat', description: 'Xarajat o\'chirildi' });
    } catch (error: any) {
      toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
    }
  };

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const typeLabel = EXPENSE_TYPES.find(t => t.value === e.type)?.label || '';
        if (!typeLabel.toLowerCase().includes(q) && !(e.note || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [expenses, typeFilter, dateFrom, dateTo, searchQuery]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      total: expenses.reduce((s, e) => s + e.amount, 0),
      thisMonth: thisMonth.reduce((s, e) => s + e.amount, 0),
      count: expenses.length,
      thisMonthCount: thisMonth.length,
    };
  }, [expenses]);

  const formatPrice = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + ' so\'m';

  const getTypeLabel = (type: string) => EXPENSE_TYPES.find(t => t.value === type)?.label || type;

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      rent: 'bg-purple-100 text-purple-800',
      salary: 'bg-blue-100 text-blue-800',
      transport: 'bg-yellow-100 text-yellow-800',
      material: 'bg-green-100 text-green-800',
      utility: 'bg-cyan-100 text-cyan-800',
      marketing: 'bg-pink-100 text-pink-800',
      tax: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return <Badge variant="outline" className={cn(colors[type] || colors.other)}>{getTypeLabel(type)}</Badge>;
  };

  const hasActiveFilters = typeFilter !== 'all' || searchQuery || dateFrom || dateTo;

  const exportCSV = () => {
    const header = 'Sana,Turi,Summa,Izoh\n';
    const rows = filtered.map(e =>
      `${e.date},${getTypeLabel(e.type)},${e.amount},"${(e.note || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `xarajatlar_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Xarajatlar</h1>
          <p className="text-muted-foreground">Umumiy xarajatlarni boshqaring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={fetchExpenses} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Yangilash
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami xarajat</p>
                <p className="text-xl font-bold">{formatPrice(stats.total)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bu oy</p>
                <p className="text-xl font-bold">{formatPrice(stats.thisMonth)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jami yozuvlar</p>
                <p className="text-xl font-bold">{stats.count}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bu oy yozuvlar</p>
                <p className="text-xl font-bold">{stats.thisMonthCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              Yangi xarajat qo'shish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Sana</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label>Turi</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Summa</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label>Izoh</Label>
                <Input placeholder="Ixtiyoriy izoh" value={formNote} onChange={e => setFormNote(e.target.value)} />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Qo'shish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Izoh yoki tur bo'yicha qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Turi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {EXPENSE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px]" />
              <span className="text-muted-foreground">-</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px]" />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={() => { setTypeFilter('all'); setSearchQuery(''); setDateFrom(''); setDateTo(''); }} className="gap-2">
                <X className="h-4 w-4" />
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Xarajatlar topilmadi</h3>
              <p className="text-muted-foreground">Hozircha xarajatlar kiritilmagan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Summa</TableHead>
                    <TableHead>Izoh</TableHead>
                    {canDelete && <TableHead className="text-right">Amal</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{format(new Date(e.date), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>{getTypeBadge(e.type)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatPrice(e.amount)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{e.note || '—'}</TableCell>
                      {canDelete && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtered total */}
      {filtered.length > 0 && (
        <div className="text-right text-lg font-semibold">
          Jami: <span className="text-red-600">{formatPrice(filtered.reduce((s, e) => s + e.amount, 0))}</span>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xarajatni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>Bu xarajat yozuvini o'chirmoqchimisiz?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">O'chirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
