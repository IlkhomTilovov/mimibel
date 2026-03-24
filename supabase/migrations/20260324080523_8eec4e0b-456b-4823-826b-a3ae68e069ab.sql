
-- Add cost_price and address to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address text;

-- Add referral to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS referral text;

-- Create order_expenses table
CREATE TABLE public.order_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'other',
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create global expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'other',
  amount numeric NOT NULL DEFAULT 0,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS for order_expenses
CREATE POLICY "Staff can view order_expenses" ON public.order_expenses
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'seller'));

CREATE POLICY "Staff can insert order_expenses" ON public.order_expenses
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'seller'));

CREATE POLICY "Admin can delete order_expenses" ON public.order_expenses
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS for expenses (only admin and manager)
CREATE POLICY "Admin and manager can view expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin and manager can insert expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin can delete expenses" ON public.expenses
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
