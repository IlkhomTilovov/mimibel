-- Create checkout_fields table for dynamic form builder
CREATE TABLE public.checkout_fields (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    label_uz TEXT NOT NULL,
    label_ru TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'radio',
    icon TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checkout_field_options table for radio/select options
CREATE TABLE public.checkout_field_options (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    field_id UUID NOT NULL REFERENCES public.checkout_fields(id) ON DELETE CASCADE,
    label_uz TEXT NOT NULL,
    label_ru TEXT NOT NULL,
    value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.checkout_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_field_options ENABLE ROW LEVEL SECURITY;

-- Create policies for checkout_fields
CREATE POLICY "Checkout fields are publicly readable"
ON public.checkout_fields
FOR SELECT
USING (true);

CREATE POLICY "Admin can manage checkout fields"
ON public.checkout_fields
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- Create policies for checkout_field_options
CREATE POLICY "Checkout field options are publicly readable"
ON public.checkout_field_options
FOR SELECT
USING (true);

CREATE POLICY "Admin can manage checkout field options"
ON public.checkout_field_options
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- Create indexes for better performance
CREATE INDEX idx_checkout_fields_sort_order ON public.checkout_fields(sort_order);
CREATE INDEX idx_checkout_field_options_field_id ON public.checkout_field_options(field_id);
CREATE INDEX idx_checkout_field_options_sort_order ON public.checkout_field_options(sort_order);

-- Insert default renovation status field
INSERT INTO public.checkout_fields (label_uz, label_ru, field_type, icon, is_required, is_active, sort_order)
VALUES ('Uyingiz holati', 'Состояние дома', 'radio', 'Home', true, true, 0);

-- Get the inserted field ID and insert options
INSERT INTO public.checkout_field_options (field_id, label_uz, label_ru, value, is_active, sort_order)
SELECT id, 'Uy to''liq tayyor', 'Дом полностью готов', 'finished', true, 0
FROM public.checkout_fields WHERE label_uz = 'Uyingiz holati';

INSERT INTO public.checkout_field_options (field_id, label_uz, label_ru, value, is_active, sort_order)
SELECT id, 'Remont jarayonida', 'Ремонт в процессе', 'in_progress', true, 1
FROM public.checkout_fields WHERE label_uz = 'Uyingiz holati';

INSERT INTO public.checkout_field_options (field_id, label_uz, label_ru, value, is_active, sort_order)
SELECT id, 'Remontni boshlashni rejalashtirmoqdaman', 'Планирую начать ремонт', 'planning', true, 2
FROM public.checkout_fields WHERE label_uz = 'Uyingiz holati';