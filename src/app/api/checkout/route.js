import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
  deliveryType: z.enum(['same_day_pickup', 'same_day_delivery', 'scheduled_pickup', 'scheduled_delivery']),
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

    const itemIds = cart.map(item => item.id);
    
    // We now securely fetch the exact name and price directly from the database
    const { data: dbItems, error } = await supabase
      .from('treats')
      .select('id, name, price, cost_to_make, is_available')
      .in('id', itemIds);

    if (error) throw error;

    let secureTotal = 0;
    let secureTotalCost = 0;
    const deliveryFee = deliveryType.includes('delivery') ? 15.00 : 0;
    const rushFee = deliveryType.includes('same_day') ? 10.00 : 0;

    // Reconstruct the cart items using ONLY verified database data
    const secureItems = cart.map(cartItem => {
      const realItem = dbItems.find(db => db.id === cartItem.id);
      if (realItem && realItem.is_available) {
        secureTotal += (realItem.price * cartItem.quantity);
        secureTotalCost += ((realItem.cost_to_make || 0) * cartItem.quantity);
        return {
          id: cartItem.id,
          name: realItem.name,
          price: realItem.price,
          quantity: cartItem.quantity
        };
      }
      return null;
    }).filter(item => item !== null);

    secureTotal += deliveryFee + rushFee;

    // Generate the unique Order Number
    const generatedOrderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const orderData = {
      order_number: generatedOrderNumber,
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
      items: secureItems, // Attach the securely rebuilt array
    };

    const { error: insertError } = await supabaseAdmin.from('orders').insert([orderData]);

    if (insertError) throw insertError;

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}