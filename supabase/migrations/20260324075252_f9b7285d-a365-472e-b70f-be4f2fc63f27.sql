
-- Create stock movement type enum
CREATE TYPE public.stock_movement_type AS ENUM ('in', 'out');

-- Add initial_stock column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS initial_stock integer NOT NULL DEFAULT 0;

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type stock_movement_type NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  reason text NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS: Staff can view stock movements
CREATE POLICY "Staff can view stock_movements" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'seller'::app_role)
  );

-- RLS: Admin and manager can insert stock movements
CREATE POLICY "Admin and manager can insert stock_movements" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- RLS: Admin can delete stock movements
CREATE POLICY "Admin can delete stock_movements" ON public.stock_movements
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Service role can insert (for auto stock reduction from edge functions)
CREATE POLICY "Service can insert stock_movements" ON public.stock_movements
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create a DB function to calculate current stock
CREATE OR REPLACE FUNCTION public.get_product_stock(p_product_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT initial_stock FROM products WHERE id = p_product_id), 0
  ) + COALESCE(
    (SELECT SUM(quantity) FROM stock_movements WHERE product_id = p_product_id AND type = 'in'), 0
  )::integer - COALESCE(
    (SELECT SUM(quantity) FROM stock_movements WHERE product_id = p_product_id AND type = 'out'), 0
  )::integer;
$$;

-- Create a function to validate stock before out movement
CREATE OR REPLACE FUNCTION public.validate_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_stock integer;
BEGIN
  IF NEW.type = 'out' THEN
    current_stock := get_product_stock(NEW.product_id);
    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Yetarli zaxira yo''q. Mavjud: %, So''ralgan: %', current_stock, NEW.quantity;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_stock_before_movement
  BEFORE INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_stock_movement();
