import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Menu,
  X,
  LogOut,
  Bell,
  Palette,
  FolderTree,
  Users,
  Shield,
  FileText,
  ClipboardList,
  Settings2,
  Warehouse,
  Receipt,
  BarChart3,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { RolePermissions, roleDisplayInfo } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  module: keyof RolePermissions;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, module: 'dashboard' },
  { title: 'CRM Hisobot', url: '/admin/crm', icon: BarChart3, module: 'dashboard' },
  { title: 'Buyurtmalar', url: '/admin/orders', icon: ShoppingCart, module: 'orders' },
  { title: 'Toifalar', url: '/admin/categories', icon: FolderTree, module: 'categories' },
  { title: 'Mahsulotlar', url: '/admin/products', icon: Package, module: 'products' },
  { title: 'Mijozlar', url: '/admin/customers', icon: Users, module: 'customers' },
  { title: 'Xarajatlar', url: '/admin/expenses', icon: Receipt, module: 'expenses' },
  { title: 'Sayt kontenti', url: '/admin/content', icon: FileText, module: 'siteContent' },
  { title: 'Checkout formasi', url: '/admin/checkout-form', icon: ClipboardList, module: 'siteContent' },
  { title: 'Mavzular', url: '/admin/themes', icon: Palette, module: 'themes' },
  { title: 'Adminlar', url: '/admin/admins', icon: Shield, module: 'admins' },
  { title: 'Telegram', url: '/admin/settings', icon: Settings, module: 'telegram' },
  { title: 'Tizim sozlamalari', url: '/admin/system', icon: Settings2, module: 'systemSettings' },
  { title: 'Ombor', url: '/admin/inventory', icon: Warehouse, module: 'inventory' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewModule, userRole, user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  // Filter nav items based on user permissions
  const filteredNavItems = navItems.filter(item => canViewModule(item.module));

  const roleInfo = userRole ? roleDisplayInfo[userRole] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile header - fixed */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-4 lg:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/admin" className="font-serif text-lg font-bold text-primary">
          Admin Panel
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:hidden flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <Link to="/admin" className="font-serif text-xl font-bold text-primary">
            Admin Panel
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User info */}
        {roleInfo && (
          <div className="p-4 border-b flex-shrink-0">
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <Badge className={cn("mt-1", roleInfo.color)}>{roleInfo.label}</Badge>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {filteredNavItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive(item.url)
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2 flex-shrink-0">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3"
            onClick={() => navigate('/')}
          >
            <LogOut className="h-4 w-4" />
            Saytga qaytish
          </Button>
          <Button 
            variant="destructive" 
            className="w-full justify-start gap-3"
            onClick={async () => { await signOut(); navigate('/admin/auth'); }}
          >
            <LogOut className="h-4 w-4" />
            Admindan chiqish
          </Button>
        </div>
      </aside>

      {/* Desktop layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Desktop sidebar - fixed to viewport */}
        <aside className="w-64 bg-white border-r fixed inset-y-0 left-0 flex flex-col">
          <div className="flex items-center h-16 px-6 border-b">
            <Link to="/admin" className="font-serif text-xl font-bold text-primary">
              Admin Panel
            </Link>
          </div>

          {/* User info */}
          {roleInfo && (
            <div className="p-4 border-b">
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <Badge className={cn("mt-1", roleInfo.color)}>{roleInfo.label}</Badge>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
            {filteredNavItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.url)
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t mt-auto space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => navigate('/')}
            >
              <LogOut className="h-4 w-4" />
              Saytga qaytish
            </Button>
            <Button 
              variant="destructive" 
              className="w-full justify-start gap-3"
              onClick={async () => { await signOut(); navigate('/admin/auth'); }}
            >
              <LogOut className="h-4 w-4" />
              Admindan chiqish
            </Button>
          </div>
        </aside>

        {/* Spacer for fixed sidebar */}
        <div className="w-64 flex-shrink-0" />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Desktop top header */}
          <header className="sticky top-0 z-20 h-16 bg-white border-b flex items-center justify-end px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile content */}
      <main className="p-4 lg:hidden">
        <Outlet />
      </main>
    </div>
  );
}
