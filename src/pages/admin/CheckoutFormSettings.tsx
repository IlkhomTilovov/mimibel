import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFieldOption {
  id: string;
  field_id: string;
  label_uz: string;
  label_ru: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

interface CheckoutField {
  id: string;
  label_uz: string;
  label_ru: string;
  field_type: string;
  icon: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  options?: CheckoutFieldOption[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Matn (Text)' },
  { value: 'phone', label: 'Telefon raqam' },
  { value: 'textarea', label: 'Ko\'p qatorli matn' },
  { value: 'radio', label: 'Tanlov (Radio)' },
];

const ICONS = [
  { value: 'User', label: 'Foydalanuvchi' },
  { value: 'Phone', label: 'Telefon' },
  { value: 'Home', label: 'Uy' },
  { value: 'Clock', label: 'Soat' },
  { value: 'MessageSquare', label: 'Izoh' },
  { value: 'HelpCircle', label: 'Savol' },
];

export default function CheckoutFormSettings() {
  const [fields, setFields] = useState<CheckoutField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Field dialog state
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CheckoutField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    label_uz: '',
    label_ru: '',
    field_type: 'text',
    icon: '',
    is_required: false,
    is_active: true,
  });

  // Option dialog state
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<CheckoutFieldOption | null>(null);
  const [optionFieldId, setOptionFieldId] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState({
    label_uz: '',
    label_ru: '',
    value: '',
    is_active: true,
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('checkout_fields')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      const { data: optionsData, error: optionsError } = await supabase
        .from('checkout_field_options')
        .select('*')
        .order('sort_order', { ascending: true });

      if (optionsError) throw optionsError;

      // Group options by field_id
      const fieldsWithOptions = (fieldsData || []).map(field => ({
        ...field,
        options: (optionsData || []).filter(opt => opt.field_id === field.id),
      }));

      setFields(fieldsWithOptions);
      // Expand radio fields by default
      setExpandedFields(new Set(fieldsWithOptions.filter(f => f.field_type === 'radio').map(f => f.id)));
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast({
        title: 'Xatolik',
        description: 'Ma\'lumotlarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFieldExpanded = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const getFieldTypeBadge = (type: string) => {
    const typeInfo = FIELD_TYPES.find(t => t.value === type);
    return typeInfo?.label || type;
  };

  // Field CRUD
  const openFieldDialog = (field?: CheckoutField) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        label_uz: field.label_uz,
        label_ru: field.label_ru,
        field_type: field.field_type,
        icon: field.icon || '',
        is_required: field.is_required,
        is_active: field.is_active,
      });
    } else {
      setEditingField(null);
      setFieldForm({
        label_uz: '',
        label_ru: '',
        field_type: 'text',
        icon: '',
        is_required: false,
        is_active: true,
      });
    }
    setFieldDialogOpen(true);
  };

  const saveField = async () => {
    if (!fieldForm.label_uz.trim()) {
      toast({
        title: 'Xatolik',
        description: 'O\'zbekcha nomini kiriting',
        variant: 'destructive',
      });
      return;
    }
    if (!fieldForm.label_ru.trim()) {
      toast({
        title: 'Xatolik',
        description: 'Ruscha nomini kiriting',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingField) {
        const { error } = await supabase
          .from('checkout_fields')
          .update({
            label_uz: fieldForm.label_uz,
            label_ru: fieldForm.label_ru,
            field_type: fieldForm.field_type,
            icon: fieldForm.icon || null,
            is_required: fieldForm.is_required,
            is_active: fieldForm.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingField.id);

        if (error) throw error;
      } else {
        const maxOrder = Math.max(...fields.map(f => f.sort_order), -1);
        const { error } = await supabase
          .from('checkout_fields')
          .insert({
            label_uz: fieldForm.label_uz,
            label_ru: fieldForm.label_ru,
            field_type: fieldForm.field_type,
            icon: fieldForm.icon || null,
            is_required: fieldForm.is_required,
            is_active: fieldForm.is_active,
            sort_order: maxOrder + 1,
          });

        if (error) throw error;
      }

      toast({ title: 'Saqlandi' });
      setFieldDialogOpen(false);
      fetchFields();
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: 'Xatolik',
        description: 'Saqlashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (fieldId: string) => {
    if (!confirm('Bu maydonni o\'chirishni xohlaysizmi?')) return;

    try {
      const { error } = await supabase
        .from('checkout_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
      toast({ title: 'O\'chirildi' });
      fetchFields();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Xatolik',
        description: 'O\'chirishda xatolik',
        variant: 'destructive',
      });
    }
  };

  const moveField = async (fieldId: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === fieldId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const field1 = fields[index];
    const field2 = fields[swapIndex];

    try {
      await supabase
        .from('checkout_fields')
        .update({ sort_order: field2.sort_order })
        .eq('id', field1.id);

      await supabase
        .from('checkout_fields')
        .update({ sort_order: field1.sort_order })
        .eq('id', field2.id);

      fetchFields();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  // Option CRUD
  const openOptionDialog = (fieldId: string, option?: CheckoutFieldOption) => {
    setOptionFieldId(fieldId);
    if (option) {
      setEditingOption(option);
      setOptionForm({
        label_uz: option.label_uz,
        label_ru: option.label_ru,
        value: option.value,
        is_active: option.is_active,
      });
    } else {
      setEditingOption(null);
      setOptionForm({
        label_uz: '',
        label_ru: '',
        value: '',
        is_active: true,
      });
    }
    setOptionDialogOpen(true);
  };

  const saveOption = async () => {
    if (!optionForm.label_uz.trim() || !optionForm.label_ru.trim() || !optionForm.value.trim()) {
      toast({
        title: 'Xatolik',
        description: 'Barcha maydonlarni to\'ldiring',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingOption) {
        const { error } = await supabase
          .from('checkout_field_options')
          .update({
            label_uz: optionForm.label_uz,
            label_ru: optionForm.label_ru,
            value: optionForm.value,
            is_active: optionForm.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingOption.id);

        if (error) throw error;
      } else {
        const field = fields.find(f => f.id === optionFieldId);
        const maxOrder = Math.max(...(field?.options?.map(o => o.sort_order) || []), -1);

        const { error } = await supabase
          .from('checkout_field_options')
          .insert({
            field_id: optionFieldId,
            label_uz: optionForm.label_uz,
            label_ru: optionForm.label_ru,
            value: optionForm.value,
            is_active: optionForm.is_active,
            sort_order: maxOrder + 1,
          });

        if (error) throw error;
      }

      toast({ title: 'Saqlandi' });
      setOptionDialogOpen(false);
      fetchFields();
    } catch (error) {
      console.error('Error saving option:', error);
      toast({
        title: 'Xatolik',
        description: 'Saqlashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteOption = async (optionId: string) => {
    if (!confirm('Bu variantni o\'chirishni xohlaysizmi?')) return;

    try {
      const { error } = await supabase
        .from('checkout_field_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;
      toast({ title: 'O\'chirildi' });
      fetchFields();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast({
        title: 'Xatolik',
        description: 'O\'chirishda xatolik',
        variant: 'destructive',
      });
    }
  };

  const moveOption = async (fieldId: string, optionId: string, direction: 'up' | 'down') => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.options) return;

    const index = field.options.findIndex(o => o.id === optionId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === field.options.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const opt1 = field.options[index];
    const opt2 = field.options[swapIndex];

    try {
      await supabase
        .from('checkout_field_options')
        .update({ sort_order: opt2.sort_order })
        .eq('id', opt1.id);

      await supabase
        .from('checkout_field_options')
        .update({ sort_order: opt1.sort_order })
        .eq('id', opt2.id);

      fetchFields();
    } catch (error) {
      console.error('Error reordering:', error);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checkout formasini sozlash</h1>
          <p className="text-muted-foreground">Buyurtma formasidagi barcha maydonlarni boshqaring</p>
        </div>
        <Button onClick={() => openFieldDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi maydon
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Hozircha hech qanday maydon yo'q</p>
            <Button className="mt-4" onClick={() => openFieldDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Birinchi maydonni qo'shing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} className={!field.is_active ? 'opacity-60' : ''}>
              <Collapsible
                open={expandedFields.has(field.id)}
                onOpenChange={() => toggleFieldExpanded(field.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                          {field.label_uz}
                          <Badge variant="secondary">{getFieldTypeBadge(field.field_type)}</Badge>
                          {field.is_required && (
                            <Badge variant="destructive" className="text-xs">
                              Majburiy
                            </Badge>
                          )}
                          {!field.is_active && (
                            <Badge variant="outline" className="text-xs">
                              O'chirilgan
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{field.label_ru}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveField(field.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveField(field.id, 'down')}
                        disabled={index === fields.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openFieldDialog(field)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {field.field_type === 'radio' && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon">
                            {expandedFields.has(field.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {field.field_type === 'radio' && (
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Variantlar</h4>
                          <Button size="sm" variant="outline" onClick={() => openOptionDialog(field.id)}>
                            <Plus className="mr-1 h-3 w-3" />
                            Variant qo'shish
                          </Button>
                        </div>

                        {field.options && field.options.length > 0 ? (
                          <div className="space-y-2">
                            {field.options.map((option, optIndex) => (
                              <div
                                key={option.id}
                                className={`flex items-center justify-between p-3 bg-background rounded-lg border ${
                                  !option.is_active ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                  <div>
                                    <p className="font-medium">{option.label_uz}</p>
                                    <p className="text-sm text-muted-foreground">{option.label_ru}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => moveOption(field.id, option.id, 'up')}
                                    disabled={optIndex === 0}
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => moveOption(field.id, option.id, 'down')}
                                    disabled={optIndex === field.options!.length - 1}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openOptionDialog(field.id, option)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => deleteOption(option.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Hozircha variantlar yo'q
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Maydonni tahrirlash' : 'Yangi maydon'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomi (O'zbekcha)</Label>
              <Input
                value={fieldForm.label_uz}
                onChange={(e) => setFieldForm({ ...fieldForm, label_uz: e.target.value })}
                placeholder="Masalan: To'liq ism"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomi (Ruscha)</Label>
              <Input
                value={fieldForm.label_ru}
                onChange={(e) => setFieldForm({ ...fieldForm, label_ru: e.target.value })}
                placeholder="Masalan: Полное имя"
              />
            </div>
            <div className="space-y-2">
              <Label>Maydon turi</Label>
              <Select
                value={fieldForm.field_type}
                onValueChange={(value) => setFieldForm({ ...fieldForm, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ikonka</Label>
              <Select
                value={fieldForm.icon || undefined}
                onValueChange={(value) => setFieldForm({ ...fieldForm, icon: value === '_none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ikonka tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Ikonkasiz</SelectItem>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Majburiy maydon</Label>
              <Switch
                checked={fieldForm.is_required}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, is_required: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Faol</Label>
              <Switch
                checked={fieldForm.is_active}
                onCheckedChange={(checked) => setFieldForm({ ...fieldForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={saveField} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? 'Variantni tahrirlash' : 'Yangi variant'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomi (O'zbekcha)</Label>
              <Input
                value={optionForm.label_uz}
                onChange={(e) => setOptionForm({ ...optionForm, label_uz: e.target.value })}
                placeholder="Masalan: Uy tayyor"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomi (Ruscha)</Label>
              <Input
                value={optionForm.label_ru}
                onChange={(e) => setOptionForm({ ...optionForm, label_ru: e.target.value })}
                placeholder="Masalan: Дом готов"
              />
            </div>
            <div className="space-y-2">
              <Label>Qiymat (value)</Label>
              <Input
                value={optionForm.value}
                onChange={(e) => setOptionForm({ ...optionForm, value: e.target.value })}
                placeholder="Masalan: ready"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Faol</Label>
              <Switch
                checked={optionForm.is_active}
                onCheckedChange={(checked) => setOptionForm({ ...optionForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptionDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={saveOption} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
