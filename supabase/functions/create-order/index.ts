import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_id: string;
  quantity: number;
  selected_options?: {
    size?: string;
    color?: string;
  };
}

interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_message?: string;
  deadline?: string;
  items: OrderItem[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key to bypass RLS for price validation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreateOrderRequest = await req.json();
    console.log('Received order request:', JSON.stringify(body));

    // Validate required fields
    if (!body.customer_name || body.customer_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Ism kamida 2 belgidan iborat bo\'lishi kerak' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.customer_phone || !body.customer_phone.startsWith('+998') || body.customer_phone.length < 12) {
      return new Response(
        JSON.stringify({ error: 'Telefon raqam noto\'g\'ri formatda' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Buyurtmada mahsulotlar bo\'lishi kerak' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate quantities
    for (const item of body.items) {
      if (!item.quantity || item.quantity < 1 || item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: 'Mahsulot miqdori 1 dan 100 gacha bo\'lishi kerak' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch actual product prices from database (SERVER-SIDE VALIDATION)
    const productIds = body.items.map(item => item.product_id);
    console.log('Fetching products:', productIds);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name_uz, name_ru, price, is_active, in_stock')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Mahsulotlarni yuklashda xatolik' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Mahsulotlar topilmadi' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a map of products for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate all products exist and are available
    const orderItems = [];
    let totalPrice = 0;

    for (const item of body.items) {
      const product = productMap.get(item.product_id);
      
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Mahsulot topilmadi: ${item.product_id}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!product.is_active) {
        return new Response(
          JSON.stringify({ error: `Mahsulot faol emas: ${product.name_uz || product.name_ru}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use SERVER-SIDE price from database, not client-provided price
      const serverPrice = product.price || 0;
      const itemTotal = serverPrice * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        product_name_snapshot: product.name_uz || product.name_ru || 'Unknown',
        quantity: item.quantity,
        price_snapshot: serverPrice, // Price from database, not client
        selected_options: item.selected_options || null,
      });
    }

    console.log('Calculated server-side total:', totalPrice);
    console.log('Order items with server prices:', JSON.stringify(orderItems));

    // Generate order number
    const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Find or create customer
    let customerId: string | null = null;
    const cleanPhone = body.customer_phone.replace(/\s/g, '');
    
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update name if provided
      await supabase.from('customers').update({ name: body.customer_name.trim() }).eq('id', customerId);
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({ phone: cleanPhone, name: body.customer_name.trim() })
        .select('id')
        .single();
      if (newCustomer) customerId = newCustomer.id;
    }

    // Create order with server-calculated total
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_name: body.customer_name.trim(),
        customer_phone: cleanPhone,
        customer_message: body.customer_message || null,
        total_price: totalPrice,
        status: 'new',
        customer_id: customerId,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Buyurtma yaratishda xatolik: ' + orderError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created:', orderData.id);

    // Create order items with server-validated prices
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: orderData.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback: delete the order if items failed
      await supabase.from('orders').delete().eq('id', orderData.id);
      return new Response(
        JSON.stringify({ error: 'Buyurtma mahsulotlarini saqlashda xatolik' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order completed successfully:', orderData.order_number);

    // Send Telegram notification (async, don't wait for it)
    try {
      const telegramPayload = {
        type: 'order',
        order_data: {
          order_number: orderData.order_number,
          customer_name: body.customer_name.trim(),
          customer_phone: body.customer_phone.replace(/\s/g, ''),
          customer_message: body.customer_message || undefined,
          total_price: totalPrice,
          items: orderItems.map(item => ({
            product_name: item.product_name_snapshot,
            quantity: item.quantity,
            price: item.price_snapshot,
            selected_options: item.selected_options,
          })),
        },
      };

      // Call the send-telegram function internally
      const telegramResponse = await fetch(`${supabaseUrl}/functions/v1/send-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify(telegramPayload),
      });

      const telegramResult = await telegramResponse.json();
      console.log('Telegram notification result:', telegramResult);
    } catch (telegramError) {
      // Don't fail the order if Telegram fails
      console.error('Telegram notification error (non-blocking):', telegramError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_number: orderData.order_number,
        total_price: totalPrice,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Kutilmagan xatolik yuz berdi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
