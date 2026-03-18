import { useEffect, useState } from 'react';
import { Plus, Shield, ShieldCheck, Trash2, ShoppingCart, Package, Pencil, UserCheck, UserX, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AccessDenied } from '@/components/admin/AccessDenied';
import { AppRole, roleDisplayInfo } from '@/lib/permissions';

interface UserWithProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: AppRole | 'editor';
  status: 'active' | 'disabled';
  created_at: string;
}

export default function Admins() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<AppRole>('seller');
  const [formStatus, setFormStatus] = useState<'active' | 'disabled'>('active');
  
  const { user, isAdmin, session } = useAuth();
  const { toast } = useToast();

  const getInvokeErrorMessage = (err: unknown, fallback = 'Xatolik yuz berdi') => {
    // supabase.functions.invoke returns a FunctionsHttpError for non-2xx responses.
    // That error's .message is generic, but the real error is usually in context.body.
    if (!err || typeof err !== 'object') return fallback;

    const anyErr = err as any;

    // Common: new Error(message)
    if (typeof anyErr?.message === 'string' && anyErr.message.trim()) {
      const msg = anyErr.message.trim();
      // If it's the generic Supabase Functions error, try to extract the JSON body.
      if (msg.toLowerCase().includes('edge function returned') || msg.toLowerCase().includes('non-2xx')) {
        const body = anyErr?.context?.body;
        if (typeof body === 'string' && body) {
          try {
            const parsed = JSON.parse(body);
            if (typeof parsed?.error === 'string' && parsed.error.trim()) return parsed.error.trim();
          } catch {
            // ignore
          }
        }
      }

      return msg;
    }

    // Sometimes err itself is { error: string }
    if (typeof (anyErr as any)?.error === 'string' && (anyErr as any).error.trim()) {
      return (anyErr as any).error.trim();
    }

    return fallback;
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithProfile[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          role: (userRole?.role as AppRole) || 'seller',
          status: profile.status as 'active' | 'disabled',
          created_at: profile.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Foydalanuvchilarni yuklashda xatolik' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Barcha maydonlarni to\'ldiring' });
      return;
    }

    if (formPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: formEmail.trim(),
          password: formPassword,
          name: formName.trim(),
          role: formRole,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: 'Muvaffaqiyat', description: 'Foydalanuvchi yaratildi' });
      setCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: getInvokeErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update',
          userId: selectedUser.user_id,
          name: formName.trim(),
          role: formRole,
          status: formStatus,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: 'Muvaffaqiyat', description: 'Foydalanuvchi yangilandi' });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: getInvokeErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          userId: selectedUser.user_id,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: 'Muvaffaqiyat', description: 'Foydalanuvchi o\'chirildi' });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: getInvokeErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (userItem: UserWithProfile) => {
    setSelectedUser(userItem);
    setFormName(userItem.name);
    setFormRole(userItem.role === 'editor' ? 'manager' : userItem.role);
    setFormStatus(userItem.status);
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('seller');
    setFormStatus('active');
    setShowPassword(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleInfo = (role: string) => {
    const mappedRole = role === 'editor' ? 'manager' : role;
    return roleDisplayInfo[mappedRole as AppRole] || roleDisplayInfo.seller;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-3 w-3 mr-1" />;
      case 'manager':
      case 'editor':
        return <Package className="h-3 w-3 mr-1" />;
      case 'seller':
        return <ShoppingCart className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const managerCount = users.filter(u => u.role === 'manager' || u.role === 'editor').length;
  const sellerCount = users.filter(u => u.role === 'seller').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
          <p className="text-muted-foreground">Tizim foydalanuvchilarini boshqaring</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi foydalanuvchi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Adminlar</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">To'liq ruxsat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menejerlar</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerCount}</div>
            <p className="text-xs text-muted-foreground">Mahsulotlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sotuvchilar</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellerCount}</div>
            <p className="text-xs text-muted-foreground">Buyurtmalar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faol</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Jami {users.length} dan</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchilar ro'yxati</CardTitle>
          <CardDescription>
            Tizimga kirish huquqiga ega barcha foydalanuvchilar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ism</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Yaratilgan</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userItem) => {
                const roleInfo = getRoleInfo(userItem.role);
                const isCurrentUser = userItem.user_id === user?.id;
                return (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">
                      {userItem.name}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ml-2">Siz</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {userItem.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleInfo.color}>
                        {getRoleIcon(userItem.role)}
                        {roleInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={userItem.status === 'active' ? 'default' : 'secondary'}>
                        {userItem.status === 'active' ? (
                          <><UserCheck className="h-3 w-3 mr-1" /> Faol</>
                        ) : (
                          <><UserX className="h-3 w-3 mr-1" /> O'chirilgan</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(userItem.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(userItem)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedUser(userItem); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Hali foydalanuvchilar yo'q
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Rollar haqida</CardTitle>
          <CardDescription>Har bir rol uchun ruxsatlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Sotuvchi</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Buyurtmalarni ko'rish va boshqarish</li>
                <li>✓ Mijozlarni ko'rish</li>
                <li>✓ Faqat o'z buyurtmalarini ko'radi</li>
                <li>✗ Mahsulotlar va toifalar</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Menejer</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Toifalar va mahsulotlarni boshqarish</li>
                <li>✓ Sayt kontentini tahrirlash</li>
                <li>✓ Telegram sozlamalari</li>
                <li>✗ Buyurtmalar va foydalanuvchilar</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-red-500" />
                <span className="font-semibold">Admin</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Barcha bo'limlarga to'liq kirish</li>
                <li>✓ Foydalanuvchilarni yaratish</li>
                <li>✓ Tizim sozlamalari</li>
                <li>✓ Barcha buyurtmalarni ko'rish</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi foydalanuvchi</DialogTitle>
            <DialogDescription>
              Yangi foydalanuvchi yarating va rolni tanlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ism *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ism Familiya"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Parol *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                      Sotuvchi
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      Menejer
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-500" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foydalanuvchini tahrirlash</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ism</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ism Familiya"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select 
                value={formRole} 
                onValueChange={(v) => setFormRole(v as AppRole)}
                disabled={selectedUser?.user_id === user?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                      Sotuvchi
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      Menejer
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-500" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Holat</Label>
              <Select 
                value={formStatus} 
                onValueChange={(v) => setFormStatus(v as 'active' | 'disabled')}
                disabled={selectedUser?.user_id === user?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      Faol
                    </div>
                  </SelectItem>
                  <SelectItem value="disabled">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-500" />
                      O'chirilgan
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleUpdateUser} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser?.name}</strong> ({selectedUser?.email}) foydalanuvchisini
              o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-destructive text-destructive-foreground"
              disabled={saving}
            >
              {saving ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
