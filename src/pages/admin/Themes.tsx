import { useState, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Theme, ThemeColors, ThemeTypography, ThemeComponentStyles, ThemeLayoutSettings } from '@/lib/themes';
import { 
  Check, Eye, EyeOff, Palette, Moon, Sun, RefreshCw, Plus, Copy, 
  Lock, Trash2, Settings2, Monitor, Smartphone, Type
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const FONT_OPTIONS = [
  { value: "'Inter', system-ui, sans-serif", label: "Inter" },
  { value: "'Playfair Display', Georgia, serif", label: "Playfair Display" },
  { value: "'Roboto', system-ui, sans-serif", label: "Roboto" },
  { value: "'Montserrat', system-ui, sans-serif", label: "Montserrat" },
  { value: "'Lora', Georgia, serif", label: "Lora" },
  { value: "'Nunito Sans', system-ui, sans-serif", label: "Nunito Sans" },
  { value: "'Work Sans', system-ui, sans-serif", label: "Work Sans" },
  { value: "'Bebas Neue', sans-serif", label: "Bebas Neue" },
  { value: "'Rubik', system-ui, sans-serif", label: "Rubik" },
  { value: "'Oswald', sans-serif", label: "Oswald" },
];

const RADIUS_OPTIONS = [
  { value: "0", label: "0 (Sharp)" },
  { value: "0.25rem", label: "0.25rem" },
  { value: "0.5rem", label: "0.5rem" },
  { value: "0.75rem", label: "0.75rem" },
  { value: "1rem", label: "1rem" },
  { value: "1.5rem", label: "1.5rem (Rounded)" },
];

const Themes = () => {
  const { 
    themes, 
    currentTheme, 
    isLoading, 
    setActiveTheme, 
    previewTheme, 
    resetPreview, 
    isPreviewMode,
    refreshThemes 
  } = useTheme();
  
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'light' | 'dark'>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    isDark: false,
    primaryColor: '222 47% 11%',
    secondaryColor: '210 40% 96%',
    accentColor: '142 76% 36%',
    backgroundColor: '0 0% 100%',
    foregroundColor: '222 47% 11%',
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: '0.5rem',
    shadowLevel: 'medium',
  });

  const filteredThemes = useMemo(() => {
    let result = themes.filter(theme => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'light') return !theme.isDark;
      if (selectedCategory === 'dark') return theme.isDark;
      return true;
    });

    // Sort: active theme first
    result.sort((a, b) => {
      if (a.isActive) return -1;
      if (b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [themes, selectedCategory]);

  const handlePreview = (theme: Theme) => {
    if (previewingId === theme.id) {
      resetPreview();
      setPreviewingId(null);
    } else {
      previewTheme(theme);
      setPreviewingId(theme.id || null);
    }
  };

  const handleApply = async (theme: Theme) => {
    if (!theme.id) return;
    await setActiveTheme(theme.id);
    setPreviewingId(null);
    toast.success(`"${theme.name}" mavzusi qo'llanildi!`);
  };

  const handleClone = (theme: Theme) => {
    setBuilderMode('clone');
    setEditingTheme(theme);
    setFormData({
      name: `${theme.name} (nusxa)`,
      isDark: theme.isDark,
      primaryColor: theme.colorPalette.primary,
      secondaryColor: theme.colorPalette.secondary,
      accentColor: theme.colorPalette.accent,
      backgroundColor: theme.colorPalette.background,
      foregroundColor: theme.colorPalette.foreground,
      fontFamily: theme.typography.fontSans,
      borderRadius: theme.componentStyles.borderRadius,
      shadowLevel: 'medium',
    });
    setShowBuilder(true);
  };

  const handleCreateNew = () => {
    setBuilderMode('create');
    setEditingTheme(null);
    setFormData({
      name: '',
      isDark: false,
      primaryColor: '222 47% 11%',
      secondaryColor: '210 40% 96%',
      accentColor: '142 76% 36%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '222 47% 11%',
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: '0.5rem',
      shadowLevel: 'medium',
    });
    setShowBuilder(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const getShadowValues = (level: string) => {
    switch (level) {
      case 'none':
        return { sm: 'none', md: 'none', lg: 'none' };
      case 'light':
        return {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
          md: '0 2px 4px -1px rgb(0 0 0 / 0.05)',
          lg: '0 4px 8px -2px rgb(0 0 0 / 0.08)',
        };
      case 'medium':
        return {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        };
      case 'heavy':
        return {
          sm: '0 2px 4px 0 rgb(0 0 0 / 0.1)',
          md: '0 6px 12px -2px rgb(0 0 0 / 0.15)',
          lg: '0 15px 25px -5px rgb(0 0 0 / 0.2)',
        };
      default:
        return {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        };
    }
  };

  const handleSaveTheme = async () => {
    if (!formData.name.trim()) {
      toast.error('Mavzu nomini kiriting');
      return;
    }

    const shadows = getShadowValues(formData.shadowLevel);
    const slug = generateSlug(formData.name);

    const colorPalette: ThemeColors = {
      background: formData.backgroundColor,
      foreground: formData.foregroundColor,
      card: formData.backgroundColor,
      cardForeground: formData.foregroundColor,
      popover: formData.backgroundColor,
      popoverForeground: formData.foregroundColor,
      primary: formData.primaryColor,
      primaryForeground: formData.isDark ? formData.foregroundColor : formData.backgroundColor,
      secondary: formData.secondaryColor,
      secondaryForeground: formData.foregroundColor,
      muted: formData.secondaryColor,
      mutedForeground: formData.foregroundColor.replace(/(\d+)%\)$/, (_, p) => `${Math.max(40, parseInt(p) - 20)}%)`),
      accent: formData.accentColor,
      accentForeground: formData.backgroundColor,
      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',
      border: formData.secondaryColor,
      input: formData.secondaryColor,
      ring: formData.primaryColor,
      warmCream: formData.backgroundColor,
      warmBeige: formData.secondaryColor,
      warmBrown: formData.primaryColor,
      darkWood: formData.foregroundColor,
      goldAccent: '45 93% 47%',
      sageGreen: '142 76% 36%',
    };

    const typography: ThemeTypography = {
      fontSans: formData.fontFamily,
      fontSerif: "'Playfair Display', Georgia, serif",
      fontHeading: formData.fontFamily,
    };

    const componentStyles: ThemeComponentStyles = {
      borderRadius: formData.borderRadius,
      buttonRadius: formData.borderRadius,
      cardRadius: formData.borderRadius,
      shadowSm: shadows.sm,
      shadowMd: shadows.md,
      shadowLg: shadows.lg,
    };

    const layoutSettings: ThemeLayoutSettings = {
      containerMaxWidth: '1280px',
      sectionSpacing: '4rem',
      cardPadding: '1.5rem',
    };

    try {
      const { error } = await supabase.from('themes').insert([{
        name: formData.name,
        slug,
        is_dark: formData.isDark,
        is_active: false,
        color_palette: JSON.parse(JSON.stringify(colorPalette)),
        typography: JSON.parse(JSON.stringify(typography)),
        component_styles: JSON.parse(JSON.stringify(componentStyles)),
        layout_settings: JSON.parse(JSON.stringify(layoutSettings)),
      }]);

      if (error) throw error;

      toast.success('Mavzu muvaffaqiyatli saqlandi!');
      setShowBuilder(false);
      refreshThemes();
    } catch (error: any) {
      toast.error(`Xatolik: ${error.message}`);
    }
  };

  const getColorSwatches = (theme: Theme) => {
    return [
      { color: theme.colorPalette.primary, label: 'Primary' },
      { color: theme.colorPalette.secondary, label: 'Secondary' },
      { color: theme.colorPalette.accent, label: 'Accent' },
      { color: theme.colorPalette.background, label: 'Background' },
      { color: theme.colorPalette.foreground, label: 'Text' },
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mavzular</h1>
          <p className="text-muted-foreground">Sayt dizaynini bir marta bosish bilan o'zgartiring</p>
        </div>
        <div className="flex items-center gap-2">
          {isPreviewMode && (
            <Button variant="outline" size="sm" onClick={() => { resetPreview(); setPreviewingId(null); }}>
              <EyeOff className="h-4 w-4 mr-2" />
              Bekor qilish
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refreshThemes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yangilash
          </Button>
          <Button size="sm" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi mavzu
          </Button>
        </div>
      </div>

      {/* Current Theme Card */}
      {currentTheme && (
        <Card className="bg-muted/30 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Joriy mavzu</h3>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">{currentTheme.name}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {getColorSwatches(currentTheme).map((swatch, i) => (
                      <div
                        key={i}
                        className="h-5 w-8 rounded border"
                        style={{ backgroundColor: `hsl(${swatch.color})` }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentTheme.isDark ? <Moon className="h-3 w-3 mr-1" /> : <Sun className="h-3 w-3 mr-1" />}
                  {currentTheme.isDark ? "Qorong'i" : "Yorug'"}
                </Badge>
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Faol
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Barcha ({themes.length})</TabsTrigger>
          <TabsTrigger value="light">
            <Sun className="h-3 w-3 mr-1" />
            Yorug' ({themes.filter(t => !t.isDark).length})
          </TabsTrigger>
          <TabsTrigger value="dark">
            <Moon className="h-3 w-3 mr-1" />
            Qorong'i ({themes.filter(t => t.isDark).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredThemes.map((theme) => (
              <CompactThemeCard
                key={theme.id || theme.slug}
                theme={theme}
                isActive={currentTheme?.id === theme.id}
                isPreviewing={previewingId === theme.id}
                onPreview={() => handlePreview(theme)}
                onApply={() => handleApply(theme)}
                onClone={() => handleClone(theme)}
                colorSwatches={getColorSwatches(theme)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredThemes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Bu kategoriyada mavzu topilmadi
        </div>
      )}

      {/* Theme Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {builderMode === 'create' ? 'Yangi mavzu yaratish' : 
               builderMode === 'clone' ? 'Mavzuni nusxalash' : 'Mavzuni tahrirlash'}
            </DialogTitle>
            <DialogDescription>
              O'zingizning brend ranglaringiz bilan yangi mavzu yarating
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Theme Name */}
            <div className="space-y-2">
              <Label>Mavzu nomi</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masalan: Zamonaviy Oq"
              />
            </div>

            {/* Dark/Light Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Qorong'i rejim</Label>
                <p className="text-sm text-muted-foreground">Mavzuni qorong'i sifatida belgilash</p>
              </div>
              <Switch
                checked={formData.isDark}
                onCheckedChange={(checked) => setFormData({ ...formData, isDark: checked })}
              />
            </div>

            {/* Colors Grid */}
            <div className="space-y-3">
              <Label>Ranglar</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ColorInput
                  label="Asosiy rang"
                  value={formData.primaryColor}
                  onChange={(v) => setFormData({ ...formData, primaryColor: v })}
                />
                <ColorInput
                  label="Ikkinchi darajali"
                  value={formData.secondaryColor}
                  onChange={(v) => setFormData({ ...formData, secondaryColor: v })}
                />
                <ColorInput
                  label="Urg'u rang"
                  value={formData.accentColor}
                  onChange={(v) => setFormData({ ...formData, accentColor: v })}
                />
                <ColorInput
                  label="Orqa fon"
                  value={formData.backgroundColor}
                  onChange={(v) => setFormData({ ...formData, backgroundColor: v })}
                />
                <ColorInput
                  label="Matn rangi"
                  value={formData.foregroundColor}
                  onChange={(v) => setFormData({ ...formData, foregroundColor: v })}
                />
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Shrift
              </Label>
              <Select
                value={formData.fontFamily}
                onValueChange={(v) => setFormData({ ...formData, fontFamily: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label>Burchak radiusi</Label>
              <Select
                value={formData.borderRadius}
                onValueChange={(v) => setFormData({ ...formData, borderRadius: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shadow Level */}
            <div className="space-y-2">
              <Label>Soya darajasi</Label>
              <Select
                value={formData.shadowLevel}
                onValueChange={(v) => setFormData({ ...formData, shadowLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Yo'q</SelectItem>
                  <SelectItem value="light">Engil</SelectItem>
                  <SelectItem value="medium">O'rta</SelectItem>
                  <SelectItem value="heavy">Kuchli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Ko'rinish</Label>
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: `hsl(${formData.backgroundColor})`,
                  borderRadius: formData.borderRadius,
                }}
              >
                <div 
                  className="h-8 rounded mb-2"
                  style={{ 
                    backgroundColor: `hsl(${formData.primaryColor})`,
                    borderRadius: formData.borderRadius,
                  }}
                />
                <div className="flex gap-2">
                  <div 
                    className="flex-1 h-16 rounded"
                    style={{ 
                      backgroundColor: `hsl(${formData.secondaryColor})`,
                      borderRadius: formData.borderRadius,
                    }}
                  />
                  <div 
                    className="w-1/3 h-16 rounded"
                    style={{ 
                      backgroundColor: `hsl(${formData.accentColor})`,
                      borderRadius: formData.borderRadius,
                    }}
                  />
                </div>
                <p 
                  className="mt-2 text-sm"
                  style={{ color: `hsl(${formData.foregroundColor})` }}
                >
                  Namuna matn ko'rinishi
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuilder(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSaveTheme}>
              <Check className="h-4 w-4 mr-2" />
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Color Input Component
interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorInput = ({ label, value, onChange }: ColorInputProps) => {
  const hslToHex = (hsl: string): string => {
    try {
      const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
      const sNorm = s / 100;
      const lNorm = l / 100;
      const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = lNorm - c / 2;
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; }
      else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; }
      else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; }
      else { r = c; b = x; }
      const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return '#000000';
    }
  };

  const hexToHsl = (hex: string): string => {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
          case g: h = ((b - r) / d + 2) * 60; break;
          case b: h = ((r - g) / d + 4) * 60; break;
        }
      }
      return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch {
      return '0 0% 0%';
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={hslToHex(value)}
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-8 rounded cursor-pointer border-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs h-8 flex-1"
          placeholder="0 0% 100%"
        />
      </div>
    </div>
  );
};

// Compact Theme Card Component
interface CompactThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isPreviewing: boolean;
  onPreview: () => void;
  onApply: () => void;
  onClone: () => void;
  colorSwatches: { color: string; label: string }[];
}

const CompactThemeCard = ({ 
  theme, isActive, isPreviewing, onPreview, onApply, onClone, colorSwatches 
}: CompactThemeCardProps) => {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${
      isActive ? 'ring-2 ring-primary' : ''
    } ${isPreviewing ? 'ring-2 ring-accent' : ''}`}>
      {/* Mini Preview */}
      <div 
        className="h-24 relative p-2"
        style={{ backgroundColor: `hsl(${theme.colorPalette.background})` }}
      >
        <div className="h-full flex flex-col gap-1">
          <div 
            className="h-5 rounded-sm"
            style={{ backgroundColor: `hsl(${theme.colorPalette.primary})` }}
          />
          <div className="flex-1 flex gap-1">
            <div 
              className="w-2/5 rounded-sm"
              style={{ backgroundColor: `hsl(${theme.colorPalette.card})`, border: `1px solid hsl(${theme.colorPalette.border})` }}
            />
            <div 
              className="flex-1 rounded-sm"
              style={{ backgroundColor: `hsl(${theme.colorPalette.secondary})` }}
            />
          </div>
          <div 
            className="h-3 rounded-sm"
            style={{ backgroundColor: `hsl(${theme.colorPalette.accent})` }}
          />
        </div>

        {/* Status Badges */}
        <div className="absolute top-1 right-1 flex gap-0.5">
          {isActive && (
            <Badge className="bg-green-600 text-white h-5 px-1 text-[10px]">
              <Check className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-2.5">
        {/* Theme Name */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm truncate">{theme.name}</h3>
          {theme.isDark ? (
            <Moon className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Sun className="h-3 w-3 text-muted-foreground" />
          )}
        </div>

        {/* Color Blocks */}
        <div className="flex gap-0.5 mb-2">
          {colorSwatches.map((swatch, i) => (
            <div
              key={i}
              className="h-4 flex-1 first:rounded-l last:rounded-r"
              style={{ backgroundColor: `hsl(${swatch.color})` }}
              title={swatch.label}
            />
          ))}
        </div>

        {/* Info */}
        <div className="text-[10px] text-muted-foreground mb-2 space-y-0.5">
          <p className="truncate">Font: {theme.typography.fontSans.split(',')[0].replace(/'/g, '')}</p>
          <p>Border radius: {theme.componentStyles.borderRadius}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs px-2"
            onClick={onPreview}
          >
            <Eye className="h-3 w-3 mr-1" />
            Ko'rish
          </Button>
          <Button
            size="sm"
            className="flex-1 h-7 text-xs px-2"
            onClick={onApply}
            disabled={isActive}
          >
            {isActive ? (
              <Check className="h-3 w-3" />
            ) : (
              "Qo'llash"
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClone}
            title="Nusxalash"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Themes;
