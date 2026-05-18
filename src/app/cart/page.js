"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trash2, MapPin, Phone, Calendar, CreditCard, ArrowRight, Loader2, ShoppingBag, Truck, Map as MapIcon } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function Cart() {
  const { cart, removeFromCart, cartTotal, clearCart, isMounted } = useCart();
  const router = useRouter();

  // Basic State
  const [user, setUser] = useState(null);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Map Modal State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?next=cart');
      } else {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('phone, default_address')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          if (profileData.phone) setPhone(profileData.phone);
          if (profileData.default_address) {
            if (profileData.default_address.includes('http')) {
              setMapUrl(profileData.default_address);
            } else {
              setAddress(profileData.default_address);
            }
          }
        }
      }
      setLoadingUser(false);
    };
    checkAuthAndProfile();
  }, [router]);

  const handlePlaceOrder = async () => {
    const isDelivery = deliveryType.includes('delivery');
    const isScheduled = deliveryType.includes('scheduled');

    if (!phone) return alert("Please provide a phone number.");
    if (isDelivery && !address && !mapUrl) return alert("Please provide a delivery location.");
    if (isScheduled && !scheduledDate) return alert("Please select a date.");

    setProcessing(true);
    const finalAddress = mapUrl || address; 
    
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          deliveryType,
          address: isDelivery ? finalAddress : 'Pickup',
          phone,
          scheduledDate: isScheduled ? scheduledDate : localDate,
          userId: user.id,
          customerName: user.user_metadata?.full_name || 'Guest',
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      alert("Order successfully placed! Redirecting...");
      clearCart();
      router.push('/account');
    } catch (error) {
      alert("Error placing order: " + error.message);
      setProcessing(false);
    }
  };

  const deliveryFee = deliveryType.includes('delivery') ? 15.00 : 0;
  const rushFee = deliveryType.includes('same_day') ? 10.00 : 0;
  const finalTotal = cartTotal + deliveryFee + rushFee;

  if (!isMounted || loadingUser) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-gray-50 rounded-[3rem] p-16 max-w-2xl mx-auto border border-gray-100 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-gray-900 mb-4">Your cart is empty</h2>
          <button onClick={() => router.push('/')} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-4 px-10 rounded-full transition shadow-lg mt-4">Browse Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-24 relative">
      <h1 className="text-4xl font-black text-gray-900 mb-10 tracking-tight">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-2/3 space-y-8">
          
          <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" /> Order Items
            </h2>
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0 relative">
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="80px" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900">{item.name}</h3>
                      <p className="text-sm font-bold text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-black text-lg text-amber-600">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition p-2 bg-gray-50 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" /> Fulfillment Options
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                { id: 'pickup', label: 'Pickup', desc: 'Free' },
                { id: 'delivery', label: 'Delivery', desc: '+$15.00' },
                { id: 'pickup_scheduled', label: 'Scheduled Pickup', desc: 'Plan ahead' },
                { id: 'delivery_scheduled', label: 'Scheduled Delivery', desc: '+$15.00' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDeliveryType(opt.id)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all ${
                    deliveryType === opt.id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <p className={`font-black text-sm ${deliveryType === opt.id ? 'text-amber-900' : 'text-gray-700'}`}>{opt.label}</p>
                  <p className={`text-xs font-bold mt-1 ${deliveryType === opt.id ? 'text-amber-600' : 'text-gray-400'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" placeholder="123-456-7890" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 transition font-bold text-gray-700"/>
                </div>
              </div>

              {deliveryType.includes('delivery') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Address</label>
                    <button type="button" onClick={() => setIsMapOpen(true)} className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition bg-amber-50 px-3 py-1.5 rounded-full">
                      <MapIcon className="w-3 h-3" /> Drop Pin on Map
                    </button>
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Type address or use map pin above" 
                      value={address} 
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setMapUrl(''); // Clear URL if they manually type
                      }} 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 transition font-bold text-gray-700"
                    />
                  </div>
                </div>
              )}

              {deliveryType.includes('scheduled') && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Scheduled Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 transition font-bold text-gray-700"/>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm sticky top-28">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" /> Order Summary
            </h2>
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex justify-between text-gray-600 font-bold"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600 font-bold"><span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span></div>
            </div>
            <div className="flex justify-between items-end mb-8">
              <span className="text-gray-400 font-black uppercase tracking-widest text-xs">Total</span>
              <span className="text-4xl font-black text-gray-900">${finalTotal.toFixed(2)}</span>
            </div>
            <button onClick={handlePlaceOrder} disabled={processing} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-2 transition shadow-xl disabled:opacity-70 disabled:hover:bg-gray-900">
              {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing</> : <><ArrowRight className="w-5 h-5" /> Place Order</>}
            </button>
            <p className="text-center text-xs font-bold text-gray-400 mt-4">Payment is collected upon fulfillment.</p>
          </div>
        </div>
      </div>

      {/* Render the Custom MapPicker Component */}
      {isMapOpen && (
        <MapPicker 
          onConfirm={(confirmedAddress) => {
            setAddress(confirmedAddress);
            setMapUrl(''); // Clear previous URL logic since MapPicker gives a clean address
            setIsMapOpen(false);
          }} 
          onCancel={() => setIsMapOpen(false)} 
        />
      )}
    </div>
  );
}