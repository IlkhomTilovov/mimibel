import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface InventoryProduct {
  id: string;
  name_uz: string;
  name_ru: string;
  initial_stock: number;
  total_in: number;
  total_out: number;
  current_stock: number;
  images: string[] | null;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
  product_name?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
}

export interface CreateMovementData {
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  note?: string;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats>({ totalProducts: 0, totalStock: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const { user } = useAuth();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all active products with initial_stock
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name_uz, name_ru, initial_stock, images')
        .order('name_uz');

      if (prodErr) throw prodErr;

      // Fetch all stock movements aggregated
      const { data: movementsData, error: movErr } = await supabase
        .from('stock_movements')
        .select('product_id, type, quantity');

      if (movErr) throw movErr;

      // Aggregate movements per product
      const aggMap = new Map<string, { total_in: number; total_out: number }>();
      (movementsData || []).forEach((m: any) => {
        const existing = aggMap.get(m.product_id) || { total_in: 0, total_out: 0 };
        if (m.type === 'in') existing.total_in += m.quantity;
        else existing.total_out += m.quantity;
        aggMap.set(m.product_id, existing);
      });

      const inventoryList: InventoryProduct[] = (products || []).map((p: any) => {
        const agg = aggMap.get(p.id) || { total_in: 0, total_out: 0 };
        const current_stock = (p.initial_stock || 0) + agg.total_in - agg.total_out;
        return {
          id: p.id,
          name_uz: p.name_uz,
          name_ru: p.name_ru,
          initial_stock: p.initial_stock || 0,
          total_in: agg.total_in,
          total_out: agg.total_out,
          current_stock,
          images: p.images,
        };
      });

      setInventory(inventoryList);
      setStats({
        totalProducts: inventoryList.length,
        totalStock: inventoryList.reduce((s, p) => s + p.current_stock, 0),
        lowStockCount: inventoryList.filter(p => p.current_stock < 5).length,
      });
    } catch (err: any) {
      console.error('Inventory fetch error:', err);
      toast.error('Ombor ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch product names
      const productIds = [...new Set((data || []).map((m: any) => m.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name_uz')
        .in('id', productIds);

      const nameMap = new Map((products || []).map((p: any) => [p.id, p.name_uz]));

      setMovements((data || []).map((m: any) => ({
        ...m,
        product_name: nameMap.get(m.product_id) || 'Noma\'lum',
      })));
    } catch (err: any) {
      console.error('Movements fetch error:', err);
      toast.error('Harakatlar tarixini yuklashda xatolik');
    } finally {
      setMovementsLoading(false);
    }
  }, []);

  const createMovement = useCallback(async (data: CreateMovementData): Promise<boolean> => {
    if (data.quantity <= 0) {
      toast.error('Miqdor 0 dan katta bo\'lishi kerak');
      return false;
    }

    // Check stock for 'out' type
    if (data.type === 'out') {
      const product = inventory.find(p => p.id === data.product_id);
      if (product && product.current_stock < data.quantity) {
        toast.error(`Yetarli zaxira yo'q. Mavjud: ${product.current_stock}`);
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: data.product_id,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          note: data.note || null,
          created_by: user?.id || null,
        });

      if (error) {
        if (error.message.includes('Yetarli zaxira')) {
          toast.error(error.message);
        } else {
          toast.error('Harakatni saqlashda xatolik: ' + error.message);
        }
        return false;
      }

      toast.success(data.type === 'in' ? 'Kirim muvaffaqiyatli qo\'shildi' : 'Chiqim muvaffaqiyatli qo\'shildi');
      await Promise.all([fetchInventory(), fetchMovements()]);
      return true;
    } catch (err: any) {
      toast.error('Kutilmagan xatolik');
      return false;
    }
  }, [user, inventory, fetchInventory, fetchMovements]);

  useEffect(() => {
    fetchInventory();
    fetchMovements();
  }, [fetchInventory, fetchMovements]);

  return {
    inventory,
    movements,
    stats,
    loading,
    movementsLoading,
    createMovement,
    refetch: () => { fetchInventory(); fetchMovements(); },
  };
}
