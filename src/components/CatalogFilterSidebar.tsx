import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Filter, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Category } from '@/hooks/useProducts';

export interface SidebarFilters {
  categoryId: string;
  priceMin: number;
  priceMax: number;
  materials: string[];
  colors: string[];
  furLengths: string[];
  applications: string[];
  inStock: boolean;
  discounted: boolean;
}

interface CatalogFilterSidebarProps {
  categories: Category[];
  onApply: (filters: SidebarFilters) => void;
  initialFilters?: Partial<SidebarFilters>;
  dynamicOptions?: {
    materials: string[];
    colors: string[];
    furLengths: string[];
    applications: string[];
    maxPrice: number;
  };
}

export function CatalogFilterSidebar({ categories, onApply, initialFilters, dynamicOptions }: CatalogFilterSidebarProps) {
  const { language } = useLanguage();
  const isUz = language === 'uz';

  const maxPrice = dynamicOptions?.maxPrice || 0;

  const DEFAULT_FILTERS: SidebarFilters = {
    categoryId: 'all',
    priceMin: 0,
    priceMax: maxPrice,
    materials: [],
    colors: [],
    furLengths: [],
    applications: [],
    inStock: false,
    discounted: false,
  };

  const [filters, setFilters] = useState<SidebarFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters?.categoryId]);

  // Update priceMax when dynamic options load or change
  useEffect(() => {
    if (dynamicOptions?.maxPrice && dynamicOptions.maxPrice > 0) {
      setFilters(prev => {
        // Only auto-update if user hasn't manually changed the slider
        // (priceMax is 0 meaning unset, or equals the old maxPrice)
        if (prev.priceMax === 0 || prev.priceMax >= dynamicOptions.maxPrice) {
          return { ...prev, priceMax: dynamicOptions.maxPrice };
        }
        return prev;
      });
    }
  }, [dynamicOptions?.maxPrice]);

  const updateFilter = <K extends keyof SidebarFilters>(key: K, value: SidebarFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'materials' | 'colors' | 'furLengths' | 'applications', id: string) => {
    setFilters(prev => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(id) ? arr.filter(v => v !== id) : [...arr, id],
      };
    });
  };

  // Auto-apply filters whenever they change
  useEffect(() => {
    onApply(filters);
  }, [filters]);

  const handleClear = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const hasActiveFilters =
    filters.categoryId !== 'all' ||
    filters.priceMin > 0 ||
    (maxPrice > 0 && filters.priceMax > 0 && filters.priceMax < maxPrice) ||
    filters.materials.length > 0 ||
    filters.colors.length > 0 ||
    filters.furLengths.length > 0 ||
    filters.applications.length > 0 ||
    filters.inStock ||
    filters.discounted;

  const formatPrice = (val: number) => {
    return val.toLocaleString('uz-UZ') + " so'm";
  };

  const renderDynamicCheckboxGroup = (
    label: string,
    items: string[],
    filterKey: 'materials' | 'colors' | 'furLengths' | 'applications'
  ) => {
    if (!items || items.length === 0) return null;
    
    return (
      <>
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">{label}</Label>
          <div className="space-y-2.5">
            {items.map(item => (
              <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={filters[filterKey].includes(item)}
                  onCheckedChange={() => toggleArrayItem(filterKey, item)}
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
        <Separator />
      </>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-base text-foreground">
          {isUz ? 'Filtrlar' : 'Фильтры'}
        </h3>
      </div>

      <Separator />

      {/* 1. Category */}
      <div className="space-y-2.5">
        <Label className="text-sm font-medium text-foreground">
          {isUz ? 'Toifa' : 'Категория'}
        </Label>
        <Select value={filters.categoryId} onValueChange={v => updateFilter('categoryId', v)}>
          <SelectTrigger className="rounded-xl h-10 bg-background border-border">
            <SelectValue placeholder={isUz ? 'Barcha toifalar' : 'Все категории'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isUz ? 'Barcha toifalar' : 'Все категории'}</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {isUz ? cat.name_uz : cat.name_ru}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* 2. Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          {isUz ? 'Narx oralig\'i' : 'Диапазон цен'}
        </Label>
        <Slider
          min={0}
          max={maxPrice}
          step={10000}
          value={[filters.priceMin, filters.priceMax]}
          onValueChange={([min, max]) => {
            updateFilter('priceMin', min);
            updateFilter('priceMax', max);
          }}
          className="py-2"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatPrice(filters.priceMin)}</span>
          <span>{formatPrice(filters.priceMax)}</span>
        </div>
      </div>

      <Separator />

      {/* 3. Materials - dynamic from DB */}
      {renderDynamicCheckboxGroup(
        isUz ? 'Material turi' : 'Тип материала',
        dynamicOptions?.materials || [],
        'materials'
      )}

      {/* 4. Colors - dynamic from DB */}
      {renderDynamicCheckboxGroup(
        isUz ? 'Rang' : 'Цвет',
        dynamicOptions?.colors || [],
        'colors'
      )}

      {/* 5. Fur Length - dynamic from DB */}
      {renderDynamicCheckboxGroup(
        isUz ? 'Mo\'yna uzunligi' : 'Длина меха',
        dynamicOptions?.furLengths || [],
        'furLengths'
      )}

      {/* 6. Application - dynamic from DB */}
      {renderDynamicCheckboxGroup(
        isUz ? 'Qo\'llanish sohasi' : 'Область применения',
        dynamicOptions?.applications || [],
        'applications'
      )}

      {/* 7. Availability */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          {isUz ? 'Mavjudligi' : 'Наличие'}
        </Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              {isUz ? 'Sotuvda bor' : 'В наличии'}
            </span>
            <Switch
              checked={filters.inStock}
              onCheckedChange={v => updateFilter('inStock', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              {isUz ? 'Chegirmali' : 'Со скидкой'}
            </span>
            <Switch
              checked={filters.discounted}
              onCheckedChange={v => updateFilter('discounted', v)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 8. Buttons */}
      <div className="space-y-2.5 pt-1">
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full rounded-xl h-10 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {isUz ? 'Filtrlarni tozalash' : 'Сбросить фильтры'}
          </Button>
        )}
      </div>
    </div>
  );
}
