import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CheckoutFieldOption {
  id: string;
  field_id: string;
  label_uz: string;
  label_ru: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

export interface CheckoutField {
  id: string;
  label_uz: string;
  label_ru: string;
  field_type: string;
  icon: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  options: CheckoutFieldOption[];
}

export function useCheckoutFields() {
  const [fields, setFields] = useState<CheckoutField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active fields only
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('checkout_fields')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // Fetch active options only
      const { data: optionsData, error: optionsError } = await supabase
        .from('checkout_field_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (optionsError) throw optionsError;

      // Group options by field_id
      const fieldsWithOptions: CheckoutField[] = (fieldsData || []).map(field => ({
        ...field,
        options: (optionsData || []).filter(opt => opt.field_id === field.id),
      }));

      setFields(fieldsWithOptions);
    } catch (err: any) {
      console.error('Error fetching checkout fields:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { fields, loading, error, refetch: fetchFields };
}
