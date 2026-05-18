import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a secure backend-only client that bypasses RLS safely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // The secret key
);

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

const checkoutSchema = z.object({
  cart: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().min(1),
  })).min(1, "Cart cannot be empty"),
  deliveryType: z.enum(['pickup', 'delivery', 'pickup_scheduled', 'delivery_scheduled']),
  address: z.string(),
  phone: z.string().min(7, "Valid phone number required"),
  scheduledDate: z.string(),
  userId: z.string(),
  customerName: z.string().min(1, "Name is required"),
});

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return Response.json(
        { error: "Too many orders placed. Please wait a minute before trying again." }, 
        { status: 429 }
      );
    }

    const body = await request.json();

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return Response.json({ error: "Invalid request data format." }, { status: 400 });
    }

    const { cart, deliveryType, address, phone, scheduledDate, userId, customerName } = validation.data;

    if (deliveryType.includes('delivery') && (!address || address.trim() === '')) {
      return Response.json({ error: "Delivery address is required for delivery orders." }, { status: 400 });
    }

    // We can still use the regular client for reading data
    const itemIds = cart.map(item => item.id);
    const { data: dbItems, error } = await supabase
      .from('treats')
      .select('id, price, cost_to_make, is_available')
      .in('id', itemIds);

    if (error) throw error;

    let secureTotal = 0;
    let secureTotalCost = 0;
    const deliveryFee = deliveryType.includes('delivery') ? 15.00 : 0;
    const rushFee = deliveryType.includes('same_day') ? 10.00 : 0;

    cart.forEach(cartItem => {
      const realItem = dbItems.find(db => db.id === cartItem.id);
      if (realItem && realItem.is_available) {
        secureTotal += (realItem.price * cartItem.quantity);
        secureTotalCost += ((realItem.cost_to_make || 0) * cartItem.quantity);
      }
    });

    secureTotal += deliveryFee + rushFee;

    const orderData = {
      user_id: userId,
      customer_name: customerName,
      delivery_address: address,
      phone_number: phone,
      total_amount: secureTotal,
      total_cost: secureTotalCost,
      delivery_fee: deliveryFee,
      rush_fee: rushFee,
      delivery_type: deliveryType,
      scheduled_date: scheduledDate,
      status: 'Received',
      items: cart,
    };

    // SECURE FIX: We use the Admin Client to securely insert the order
    const { error: insertError } = await supabaseAdmin.from('orders').insert([orderData]);

    if (insertError) throw insertError;

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}