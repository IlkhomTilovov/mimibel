// Role-based Access Control (RBAC) permissions configuration

export type AppRole = 'admin' | 'manager' | 'seller';

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  dashboard: Permission;
  orders: Permission;
  categories: Permission;
  products: Permission;
  customers: Permission;
  siteContent: Permission;
  themes: Permission;
  admins: Permission;
  telegram: Permission;
  systemSettings: Permission;
}

// Define permissions for each role
export const rolePermissions: Record<AppRole, RolePermissions> = {
  // SELLER: Orders and customers only
  seller: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: true, edit: true, delete: false },
    categories: { view: false, create: false, edit: false, delete: false },
    products: { view: false, create: false, edit: false, delete: false },
    customers: { view: true, create: false, edit: false, delete: false },
    siteContent: { view: false, create: false, edit: false, delete: false },
    themes: { view: false, create: false, edit: false, delete: false },
    admins: { view: false, create: false, edit: false, delete: false },
    telegram: { view: false, create: false, edit: false, delete: false },
    systemSettings: { view: false, create: false, edit: false, delete: false },
  },
  
  // MANAGER: Categories, products, content, telegram
  manager: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    orders: { view: false, create: false, edit: false, delete: false },
    categories: { view: true, create: true, edit: true, delete: true },
    products: { view: true, create: true, edit: true, delete: true },
    customers: { view: false, create: false, edit: false, delete: false },
    siteContent: { view: true, create: true, edit: true, delete: true },
    themes: { view: true, create: true, edit: true, delete: true },
    admins: { view: false, create: false, edit: false, delete: false },
    telegram: { view: true, create: true, edit: true, delete: true },
    systemSettings: { view: false, create: false, edit: false, delete: false },
  },
  
  // ADMIN: Full access
  admin: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    categories: { view: true, create: true, edit: true, delete: true },
    products: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    siteContent: { view: true, create: true, edit: true, delete: true },
    themes: { view: true, create: true, edit: true, delete: true },
    admins: { view: true, create: true, edit: true, delete: true },
    telegram: { view: true, create: true, edit: true, delete: true },
    systemSettings: { view: true, create: true, edit: true, delete: true },
  },
};

// Helper functions
export function hasPermission(
  role: AppRole | null,
  module: keyof RolePermissions,
  action: keyof Permission
): boolean {
  if (!role) return false;
  return rolePermissions[role]?.[module]?.[action] ?? false;
}

export function canViewModule(role: AppRole | null, module: keyof RolePermissions): boolean {
  return hasPermission(role, module, 'view');
}

// Get role display info
export const roleDisplayInfo: Record<AppRole, { label: string; description: string; color: string }> = {
  seller: {
    label: 'Sotuvchi',
    description: 'Buyurtmalar va mijozlarni boshqarish',
    color: 'bg-blue-100 text-blue-800',
  },
  manager: {
    label: 'Menejer',
    description: 'Mahsulotlar va kontentni boshqarish',
    color: 'bg-green-100 text-green-800',
  },
  admin: {
    label: 'Admin',
    description: "To'liq ruxsat - barcha bo'limlar",
    color: 'bg-red-100 text-red-800',
  },
};

// Navigation items with required permissions
export interface NavItemConfig {
  title: string;
  url: string;
  icon: string;
  module: keyof RolePermissions;
}

export const navItemConfigs: NavItemConfig[] = [
  { title: 'Dashboard', url: '/admin', icon: 'LayoutDashboard', module: 'dashboard' },
  { title: 'Buyurtmalar', url: '/admin/orders', icon: 'ShoppingCart', module: 'orders' },
  { title: 'Toifalar', url: '/admin/categories', icon: 'FolderTree', module: 'categories' },
  { title: 'Mahsulotlar', url: '/admin/products', icon: 'Package', module: 'products' },
  { title: 'Mijozlar', url: '/admin/customers', icon: 'Users', module: 'customers' },
  { title: 'Sayt kontenti', url: '/admin/content', icon: 'FileText', module: 'siteContent' },
  { title: 'Mavzular', url: '/admin/themes', icon: 'Palette', module: 'themes' },
  { title: 'Adminlar', url: '/admin/admins', icon: 'Shield', module: 'admins' },
  { title: 'Telegram', url: '/admin/settings', icon: 'Settings', module: 'telegram' },
  { title: 'Tizim sozlamalari', url: '/admin/system', icon: 'Settings2', module: 'systemSettings' },
];
