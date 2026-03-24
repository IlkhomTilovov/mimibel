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
  ChevronDown,
  Store,
  Globe,
  Wrench,
  TrendingUp,
  DollarSign,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { RolePermissions, roleDisplayInfo } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  module: keyof RolePermissions;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Asosiy',
    icon: LayoutDashboard,
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, module: 'dashboard' },
      { title: 'CRM Hisobot', url: '/admin/crm', icon: BarChart3, module: 'dashboard' },
    ],
  },
  {
    label: 'Savdo',
    icon: TrendingUp,
    items: [
      { title: 'Buyurtmalar', url: '/admin/orders', icon: ShoppingCart, module: 'orders' },
      { title: 'Mijozlar', url: '/admin/customers', icon: Users, module: 'customers' },
      { title: 'Ombor', url: '/admin/inventory', icon: Warehouse, module: 'inventory' },
    ],
  },
  {
    label: 'Katalog',
    icon: Store,
    items: [
      { title: 'Toifalar', url: '/admin/categories', icon: FolderTree, module: 'categories' },
      { title: 'Mahsulotlar', url: '/admin/products', icon: Package, module: 'products' },
    ],
  },
  {
    label: 'Moliya',
    icon: Receipt,
    items: [
      { title: 'Buyurtma xarajatlari', url: '/admin/order-expenses', icon: DollarSign, module: 'expenses' },
      { title: 'Umumiy xarajatlar', url: '/admin/expenses', icon: Receipt, module: 'expenses' },
    ],
  },
  {
    label: 'Sayt',
    icon: Globe,
    items: [
      { title: 'Sayt kontenti', url: '/admin/content', icon: FileText, module: 'siteContent' },
      { title: 'Checkout formasi', url: '/admin/checkout-form', icon: ClipboardList, module: 'siteContent' },
      { title: 'Mavzular', url: '/admin/themes', icon: Palette, module: 'themes' },
    ],
  },
  {
    label: 'Tizim',
    icon: Wrench,
    items: [
      { title: 'Adminlar', url: '/admin/admins', icon: Shield, module: 'admins' },
      { title: 'Telegram', url: '/admin/settings', icon: Settings, module: 'telegram' },
      { title: 'Tizim sozlamalari', url: '/admin/system', icon: Settings2, module: 'systemSettings' },
    ],
  },
];

function SidebarNavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={item.url}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ml-3",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.title}
    </Link>
  );
}

function SidebarGroupNav({
  group,
  isActive,
  canViewModule,
  onItemClick,
}: {
  group: NavGroup;
  isActive: (path: string) => boolean;
  canViewModule: (module: keyof RolePermissions) => boolean;
  onItemClick?: () => void;
}) {
  const visibleItems = group.items.filter(item => canViewModule(item.module));
  if (visibleItems.length === 0) return null;

  const hasActiveChild = visibleItems.some(item => isActive(item.url));

  return (
    <Collapsible defaultOpen={hasActiveChild} className="group/collapsible">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-md text-sm font-semibold text-foreground/80 hover:bg-muted transition-colors">
        <span className="flex items-center gap-3">
          <group.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {group.label}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="py-1 space-y-0.5">
          {visibleItems.map((item) => (
            <SidebarNavLink
              key={item.url}
              item={item}
              isActive={isActive(item.url)}
              onClick={onItemClick}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewModule, userRole, user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const roleInfo = userRole ? roleDisplayInfo[userRole] : null;

  const sidebarContent = (onItemClick?: () => void) => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        {navGroups.map((group) => (
          <SidebarGroupNav
            key={group.label}
            group={group}
            isActive={isActive}
            canViewModule={canViewModule}
            onItemClick={onItemClick}
          />
        ))}
      </nav>

      <div className="p-3 border-t space-y-1.5 flex-shrink-0">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/')}
        >
          <LogOut className="h-4 w-4" />
          Saytga qaytish
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={async () => { await signOut(); navigate('/admin/auth'); }}
        >
          <LogOut className="h-4 w-4" />
          Admindan chiqish
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile header */}
      <header className="sticky top-0 z-30 h-14 bg-background border-b flex items-center justify-between px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/admin" className="font-serif text-lg font-bold text-primary">
          Admin Panel
        </Link>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-14 px-4 border-b flex-shrink-0">
          <Link to="/admin" className="font-serif text-lg font-bold text-primary">
            Admin Panel
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {roleInfo && (
          <div className="px-4 py-3 border-b flex-shrink-0">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <Badge className={cn("mt-1.5 text-xs", roleInfo.color)}>{roleInfo.label}</Badge>
          </div>
        )}

        {sidebarContent(() => setSidebarOpen(false))}
      </aside>

      {/* Desktop layout */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-64 bg-background border-r fixed inset-y-0 left-0 flex flex-col">
          <div className="flex items-center h-14 px-5 border-b">
            <Link to="/admin" className="font-serif text-lg font-bold text-primary">
              Admin Panel
            </Link>
          </div>

          {roleInfo && (
            <div className="px-4 py-3 border-b">
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge className={cn("mt-1.5 text-xs", roleInfo.color)}>{roleInfo.label}</Badge>
            </div>
          )}

          {sidebarContent()}
        </aside>

        <div className="w-64 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 h-14 bg-background border-b flex items-center justify-end px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </header>

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
