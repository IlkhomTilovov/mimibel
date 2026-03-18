import { useMemo, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Moon,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Sun,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeComponentStyles,
  ThemeLayoutSettings,
} from '@/lib/themes';

const FONT_OPTIONS = [
  { value: "'Inter', system-ui, sans-serif", label: 'Inter' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display' },
  { value: "'Roboto', system-ui, sans-serif", label: 'Roboto' },
  { value: "'Montserrat', system-ui, sans-serif", label: 'Montserrat' },
  { value: "'Lora', Georgia, serif", label: 'Lora' },
  { value: "'Nunito Sans', system-ui, sans-serif", label: 'Nunito Sans' },
  { value: "'Work Sans', system-ui, sans-serif", label: 'Work Sans' },
  { value: "'Bebas Neue', sans-serif", label: 'Bebas Neue' },
  { value: "'Rubik', system-ui, sans-serif", label: 'Rubik' },
  { value: "'Oswald', sans-serif", label: 'Oswald' },
];

const RADIUS_OPTIONS = [
  { value: '0', label: '0 (Sharp)' },
  { value: '0.25rem', label: '0.25rem' },
  { value: '0.5rem', label: '0.5rem' },
  { value: '0.75rem', label: '0.75rem' },
  { value: '1rem', label: '1rem' },
  { value: '1.5rem', label: '1.5rem (Rounded)' },
];

type BuilderMode = 'create' | 'edit' | 'clone';

type ThemeFormData = {
  name: string;
  isDark: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  fontFamily: string;
  borderRadius: string;
  shadowLevel: 'none' | 'light' | 'medium' | 'heavy';
};

const DEFAULT_FORM_DATA: ThemeFormData = {
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
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const adjustLightness = (hsl: string, delta: number) => {
  const [h = '0', s = '0%', l = '0%'] = hsl.trim().split(/\s+/);
  const hue = Number.parseFloat(h);
  const saturation = Number.parseFloat(s.replace('%', ''));
  const lightness = clamp(Number.parseFloat(l.replace('%', '')) + delta, 0, 100);

  if ([hue, saturation, lightness].some(Number.isNaN)) {
    return hsl;
  }

  return `${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(lightness)}%`;
};

const inferShadowLevel = (theme: Theme): ThemeFormData['shadowLevel'] => {
  const shadow = theme.componentStyles.shadowMd?.toLowerCase() || '';

  if (shadow === 'none') return 'none';
  if (shadow.includes('12px') || shadow.includes('0.15')) return 'heavy';
  if (shadow.includes('2px 4px') || shadow.includes('0.05')) return 'light';
  return 'medium';
};

const createFormDataFromTheme = (theme: Theme, nameOverride?: string): ThemeFormData => ({
  name: nameOverride ?? theme.name,
  isDark: theme.isDark,
  primaryColor: theme.colorPalette.primary,
  secondaryColor: theme.colorPalette.secondary,
  accentColor: theme.colorPalette.accent,
  backgroundColor: theme.colorPalette.background,
  foregroundColor: theme.colorPalette.foreground,
  fontFamily: theme.typography.fontSans,
  borderRadius: theme.componentStyles.borderRadius,
  shadowLevel: inferShadowLevel(theme),
});

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const getShadowValues = (level: ThemeFormData['shadowLevel']) => {
  switch (level) {
    case 'none':
      return { sm: 'none', md: 'none', lg: 'none' };
    case 'light':
      return {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        md: '0 2px 4px -1px rgb(0 0 0 / 0.05)',
        lg: '0 4px 8px -2px rgb(0 0 0 / 0.08)',
      };
    case 'heavy':
      return {
        sm: '0 2px 4px 0 rgb(0 0 0 / 0.1)',
        md: '0 6px 12px -2px rgb(0 0 0 / 0.15)',
        lg: '0 15px 25px -5px rgb(0 0 0 / 0.2)',
      };
    case 'medium':
    default:
      return {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      };
  }
};

const Themes = () => {
  const {
    themes,
    currentTheme,
    isLoading,
    setActiveTheme,
    previewTheme,
    resetPreview,
    isPreviewMode,
    refreshThemes,
  } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'light' | 'dark'>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('create');
  const [formData, setFormData] = useState<ThemeFormData>(DEFAULT_FORM_DATA);

  const filteredThemes = useMemo(() => {
    const result = themes.filter((theme) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'light') return !theme.isDark;
      if (selectedCategory === 'dark') return theme.isDark;
      return true;
    });

    result.sort((a, b) => {
      if (a.isActive) return -1;
      if (b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [themes, selectedCategory]);

  const openBuilder = (mode: BuilderMode, theme?: Theme) => {
    setBuilderMode(mode);
    setEditingTheme(theme ?? null);

    if (mode === 'create' || !theme) {
      setFormData(DEFAULT_FORM_DATA);
    } else if (mode === 'clone') {
      setFormData(createFormDataFromTheme(theme, `${theme.name} (nusxa)`));
    } else {
      setFormData(createFormDataFromTheme(theme));
    }

    setShowBuilder(true);
  };

  const handlePreview = (theme: Theme) => {
    if (previewingId === theme.id) {
      resetPreview();
      setPreviewingId(null);
      return;
    }

    previewTheme(theme);
    setPreviewingId(theme.id || null);
  };

  const handleApply = async (theme: Theme) => {
    if (!theme.id) return;

    await setActiveTheme(theme.id);
    setPreviewingId(null);
    toast.success(`"${theme.name}" mavzusi qo'llanildi!`);
  };

  const handleSaveTheme = async () => {
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      toast.error('Mavzu nomini kiriting');
      return;
    }

    const shadows = getShadowValues(formData.shadowLevel);
    const slug = generateSlug(trimmedName);

    const colorPalette: ThemeColors = {
      background: formData.backgroundColor,
      foreground: formData.foregroundColor,
      card: formData.backgroundColor,
      cardForeground: formData.foregroundColor,
      popover: formData.backgroundColor,
      popoverForeground: formData.foregroundColor,
      primary: formData.primaryColor,
      primaryForeground: formData.isDark ? formData.backgroundColor : '0 0% 100%',
      secondary: formData.secondaryColor,
      secondaryForeground: formData.foregroundColor,
      muted: formData.secondaryColor,
      mutedForeground: adjustLightness(formData.foregroundColor, 24),
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

    const payload = {
      name: trimmedName,
      slug,
      is_dark: formData.isDark,
      color_palette: JSON.parse(JSON.stringify(colorPalette)),
      typography: JSON.parse(JSON.stringify(typography)),
      component_styles: JSON.parse(JSON.stringify(componentStyles)),
      layout_settings: JSON.parse(JSON.stringify(layoutSettings)),
    };

    try {
      const query = builderMode === 'edit' && editingTheme?.id
        ? supabase.from('themes').update(payload).eq('id', editingTheme.id)
        : supabase.from('themes').insert([{ ...payload, is_active: false }]);

      const { error } = await query;
      if (error) throw error;

      toast.success(builderMode === 'edit' ? 'Mavzu yangilandi!' : 'Mavzu muvaffaqiyatli saqlandi!');
      setShowBuilder(false);
      setEditingTheme(null);
      await refreshThemes();
    } catch (error: any) {
      toast.error(`Xatolik: ${error.message}`);
    }
  };

  const getColorSwatches = (theme: Theme) => [
    { color: theme.colorPalette.primary, label: 'Primary' },
    { color: theme.colorPalette.secondary, label: 'Secondary' },
    { color: theme.colorPalette.accent, label: 'Accent' },
    { color: theme.colorPalette.background, label: 'Background' },
    { color: theme.colorPalette.foreground, label: 'Text' },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mavzular</h1>
          <p className="text-muted-foreground">Sayt dizaynini bir marta bosish bilan o'zgartiring</p>
        </div>
        <div className="flex items-center gap-2">
          {isPreviewMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetPreview();
                setPreviewingId(null);
              }}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Bekor qilish
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refreshThemes}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yangilash
          </Button>
          <Button size="sm" onClick={() => openBuilder('create')}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi mavzu
          </Button>
        </div>
      </div>

      {currentTheme && (
        <Card className="border-primary/20 bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Joriy mavzu</h3>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">{currentTheme.name}</span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    {getColorSwatches(currentTheme).map((swatch, index) => (
                      <div
                        key={index}
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
                  {currentTheme.isDark ? <Moon className="mr-1 h-3 w-3" /> : <Sun className="mr-1 h-3 w-3" />}
                  {currentTheme.isDark ? "Qorong'i" : "Yorug'"}
                </Badge>
                <Badge>
                  <Check className="mr-1 h-3 w-3" />
                  Faol
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as 'all' | 'light' | 'dark')}>
        <TabsList>
          <TabsTrigger value="all">Barcha ({themes.length})</TabsTrigger>
          <TabsTrigger value="light">
            <Sun className="mr-1 h-3 w-3" />
            Yorug' ({themes.filter((theme) => !theme.isDark).length})
          </TabsTrigger>
          <TabsTrigger value="dark">
            <Moon className="mr-1 h-3 w-3" />
            Qorong'i ({themes.filter((theme) => theme.isDark).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredThemes.map((theme) => (
              <CompactThemeCard
                key={theme.id || theme.slug}
                theme={theme}
                isActive={currentTheme?.id === theme.id}
                isPreviewing={previewingId === theme.id}
                onPreview={() => handlePreview(theme)}
                onApply={() => handleApply(theme)}
                onClone={() => openBuilder('clone', theme)}
                onEdit={() => openBuilder('edit', theme)}
                colorSwatches={getColorSwatches(theme)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredThemes.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">Bu kategoriyada mavzu topilmadi</div>
      )}

      <Dialog
        open={showBuilder}
        onOpenChange={(open) => {
          setShowBuilder(open);
          if (!open) {
            setEditingTheme(null);
            setBuilderMode('create');
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {builderMode === 'create'
                ? 'Yangi mavzu yaratish'
                : builderMode === 'clone'
                  ? 'Mavzuni nusxalash'
                  : 'Mavzuni tahrirlash'}
            </DialogTitle>
            <DialogDescription>
              {builderMode === 'edit'
                ? 'Mavjud mavzu sozlamalarini yangilang.'
                : "O'zingizning brend ranglaringiz bilan yangi mavzu yarating."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Mavzu nomi</Label>
              <Input
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Masalan: Zamonaviy Oq"
              />
            </div>

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

            <div className="space-y-3">
              <Label>Ranglar</Label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <ColorInput label="Asosiy rang" value={formData.primaryColor} onChange={(value) => setFormData({ ...formData, primaryColor: value })} />
                <ColorInput label="Ikkinchi darajali" value={formData.secondaryColor} onChange={(value) => setFormData({ ...formData, secondaryColor: value })} />
                <ColorInput label="Urg'u rang" value={formData.accentColor} onChange={(value) => setFormData({ ...formData, accentColor: value })} />
                <ColorInput label="Orqa fon" value={formData.backgroundColor} onChange={(value) => setFormData({ ...formData, backgroundColor: value })} />
                <ColorInput label="Matn rangi" value={formData.foregroundColor} onChange={(value) => setFormData({ ...formData, foregroundColor: value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Shrift
              </Label>
              <Select value={formData.fontFamily} onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}>
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

            <div className="space-y-2">
              <Label>Burchak radiusi</Label>
              <Select value={formData.borderRadius} onValueChange={(value) => setFormData({ ...formData, borderRadius: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Soya darajasi</Label>
              <Select value={formData.shadowLevel} onValueChange={(value) => setFormData({ ...formData, shadowLevel: value as ThemeFormData['shadowLevel'] })}>
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

            <div className="space-y-2">
              <Label>Ko'rinish</Label>
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: `hsl(${formData.backgroundColor})`,
                  borderRadius: formData.borderRadius,
                }}
              >
                <div
                  className="mb-2 h-8 rounded"
                  style={{
                    backgroundColor: `hsl(${formData.primaryColor})`,
                    borderRadius: formData.borderRadius,
                  }}
                />
                <div className="flex gap-2">
                  <div
                    className="h-16 flex-1 rounded"
                    style={{
                      backgroundColor: `hsl(${formData.secondaryColor})`,
                      borderRadius: formData.borderRadius,
                    }}
                  />
                  <div
                    className="h-16 w-1/3 rounded"
                    style={{
                      backgroundColor: `hsl(${formData.accentColor})`,
                      borderRadius: formData.borderRadius,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm" style={{ color: `hsl(${formData.foregroundColor})` }}>
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
              <Check className="mr-2 h-4 w-4" />
              {builderMode === 'edit' ? 'Yangilash' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorInput = ({ label, value, onChange }: ColorInputProps) => {
  const hslToHex = (hsl: string): string => {
    try {
      const [h, s, l] = hsl.split(' ').map((part) => Number.parseFloat(part));
      const sNorm = s / 100;
      const lNorm = l / 100;
      const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = lNorm - c / 2;
      let r = 0;
      let g = 0;
      let b = 0;

      if (h < 60) {
        r = c;
        g = x;
      } else if (h < 120) {
        r = x;
        g = c;
      } else if (h < 180) {
        g = c;
        b = x;
      } else if (h < 240) {
        g = x;
        b = c;
      } else if (h < 300) {
        r = x;
        b = c;
      } else {
        r = c;
        b = x;
      }

      const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return '#000000';
    }
  };

  const hexToHsl = (hex: string): string => {
    try {
      const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
      const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
      const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0;
      let s = 0;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
            break;
          case g:
            h = ((b - r) / d + 2) * 60;
            break;
          case b:
            h = ((r - g) / d + 4) * 60;
            break;
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
          onChange={(event) => onChange(hexToHsl(event.target.value))}
          className="h-8 w-10 cursor-pointer rounded border-0"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 flex-1 text-xs"
          placeholder="0 0% 100%"
        />
      </div>
    </div>
  );
};

interface CompactThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isPreviewing: boolean;
  onPreview: () => void;
  onApply: () => void;
  onClone: () => void;
  onEdit: () => void;
  colorSwatches: { color: string; label: string }[];
}

const CompactThemeCard = ({
  theme,
  isActive,
  isPreviewing,
  onPreview,
  onApply,
  onClone,
  onEdit,
  colorSwatches,
}: CompactThemeCardProps) => {
  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary' : ''
      } ${isPreviewing ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="relative h-24 p-2" style={{ backgroundColor: `hsl(${theme.colorPalette.background})` }}>
        <div className="flex h-full flex-col gap-1">
          <div className="h-5 rounded-sm" style={{ backgroundColor: `hsl(${theme.colorPalette.primary})` }} />
          <div className="flex flex-1 gap-1">
            <div
              className="w-2/5 rounded-sm"
              style={{
                backgroundColor: `hsl(${theme.colorPalette.card})`,
                border: `1px solid hsl(${theme.colorPalette.border})`,
              }}
            />
            <div className="flex-1 rounded-sm" style={{ backgroundColor: `hsl(${theme.colorPalette.secondary})` }} />
          </div>
          <div className="h-3 rounded-sm" style={{ backgroundColor: `hsl(${theme.colorPalette.accent})` }} />
        </div>

        <div className="absolute right-1 top-1 flex gap-0.5">
          {isActive && (
            <Badge className="h-5 px-1 text-[10px]">
              <Check className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="truncate text-sm font-medium">{theme.name}</h3>
          {theme.isDark ? (
            <Moon className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Sun className="h-3 w-3 text-muted-foreground" />
          )}
        </div>

        <div className="mb-2 flex gap-0.5">
          {colorSwatches.map((swatch, index) => (
            <div
              key={index}
              className="h-4 flex-1 first:rounded-l last:rounded-r"
              style={{ backgroundColor: `hsl(${swatch.color})` }}
              title={swatch.label}
            />
          ))}
        </div>

        <div className="mb-2 space-y-0.5 text-[10px] text-muted-foreground">
          <p className="truncate">Font: {theme.typography.fontSans.split(',')[0].replace(/'/g, '')}</p>
          <p>Border radius: {theme.componentStyles.borderRadius}</p>
        </div>

        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs" onClick={onPreview}>
            <Eye className="mr-1 h-3 w-3" />
            Ko'rish
          </Button>
          <Button size="sm" className="h-7 flex-1 px-2 text-xs" onClick={onApply} disabled={isActive}>
            {isActive ? <Check className="h-3 w-3" /> : "Qo'llash"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Tahrirlash">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClone} title="Nusxalash">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Themes;
