import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramRequest {
  type: 'test' | 'order';
  order_data?: {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_message?: string;
    total_price: number;
    items: Array<{
      product_name: string;
      quantity: number;
      price: number;
      selected_options?: {
        size?: string;
        color?: string;
      };
    }>;
  };
}

async function getTelegramSettings(supabase: any) {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'telegram_chat_id', 'telegram_enabled']);

  if (error) {
    console.error('Error fetching telegram settings:', error);
    throw new Error('Telegram sozlamalarini yuklashda xatolik');
  }

  const settings: Record<string, string> = {};
  data?.forEach((item: any) => {
    settings[item.key] = item.value || '';
  });

  return {
    bot_token: settings['telegram_bot_token'] || '',
    chat_id: settings['telegram_chat_id'] || '',
    enabled: settings['telegram_enabled'] === 'true',
  };
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  const result = await response.json();
  
  if (!result.ok) {
    console.error('Telegram API error:', result);
    throw new Error(result.description || 'Telegram xabar yuborishda xatolik');
  }

  return result;
}

function formatOrderMessage(orderData: TelegramRequest['order_data']) {
  if (!orderData) return '';

  const itemsList = orderData.items.map(item => {
    let line = `• ${item.product_name} x${item.quantity}`;
    if (item.selected_options?.size || item.selected_options?.color) {
      const options = [];
      if (item.selected_options.size) options.push(`O'lcham: ${item.selected_options.size}`);
      if (item.selected_options.color) options.push(`Rang: ${item.selected_options.color}`);
      line += ` (${options.join(', ')})`;
    }
    line += ` - ${new Intl.NumberFormat('uz-UZ').format(item.price * item.quantity)} so'm`;
    return line;
  }).join('\n');

  const message = `
🛒 *Yangi buyurtma!*

📋 *Buyurtma:* ${orderData.order_number}
👤 *Mijoz:* ${orderData.customer_name}
📞 *Telefon:* ${orderData.customer_phone}

*Mahsulotlar:*
${itemsList}

💰 *Jami:* ${new Intl.NumberFormat('uz-UZ').format(orderData.total_price)} so'm
${orderData.customer_message ? `\n💬 *Xabar:* ${orderData.customer_message}` : ''}
  `.trim();

  return message;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: TelegramRequest = await req.json();
    console.log('Telegram request type:', body.type);

    // Get Telegram settings from database
    const settings = await getTelegramSettings(supabase);
    console.log('Telegram enabled:', settings.enabled);

    // Validate settings
    if (!settings.bot_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bot token sozlanmagan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate bot token format (basic check)
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(settings.bot_token)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bot token formati noto\'g\'ri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.chat_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Chat ID sozlanmagan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For order notifications, check if enabled
    if (body.type === 'order' && !settings.enabled) {
      console.log('Telegram notifications disabled, skipping order notification');
      return new Response(
        JSON.stringify({ success: true, skipped: true, message: 'Telegram xabarlari o\'chirilgan' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let message: string;

    if (body.type === 'test') {
      // Check if enabled for test messages too
      if (!settings.enabled) {
        return new Response(
          JSON.stringify({ success: false, error: 'Telegram xabarlari yoqilmagan. Avval "Telegram xabarlarini yoqish" tugmasini yoqing.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      message = '✅ *Test xabar*\n\nMebel do\'koni admin paneli bilan aloqa muvaffaqiyatli o\'rnatildi!\n\nBuyurtmalar haqida xabarlar shu chatga keladi.';
    } else if (body.type === 'order') {
      if (!body.order_data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Buyurtma ma\'lumotlari yo\'q' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      message = formatOrderMessage(body.order_data);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Noto\'g\'ri so\'rov turi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send the message
    await sendTelegramMessage(settings.bot_token, settings.chat_id, message);
    console.log('Telegram message sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Xabar yuborildi' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Telegram error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Xatolik yuz berdi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
