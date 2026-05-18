"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Package, MapPin, Phone, 
  Loader2, RefreshCw, BellRing, Archive, ExternalLink, ArrowLeft, XCircle 
} from 'lucide-react';
import Link from 'next/link';

export default function LiveQueue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin-live-queue')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          if (payload.eventType === 'INSERT' && !payload.new.is_archived) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
            setOrders((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_archived) {
              setOrders((prev) => prev.filter(order => order.id !== payload.new.id));
            } else {
              setOrders((prev) => prev.map(order => 
                order.id === payload.new.id ? payload.new : order
              ));
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setUpdatingId(null);
  };

  const archiveOrder = async (orderId) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ is_archived: true })
      .eq('id', orderId);

    if (error) alert("Could not archive order");
    setUpdatingId(null);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? It will be marked as Cancelled and archived immediately.")) return;

    setUpdatingId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'Cancelled', 
        is_archived: true 
      })
      .eq('id', orderId);

    if (error) {
      alert("Could not cancel order.");
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium font-sans">Syncing with the bakery...</p>
    </div>
  );

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto px-4 py-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-3 bg-white rounded-full hover:bg-amber-100 transition shadow-sm text-amber-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              Live Queue <BellRing className="w-6 h-6 text-amber-600 animate-pulse" />
            </h1>
            <p className="text-amber-800 text-sm font-medium mt-1">
              {orders.length} active order(s) currently.
            </p>
          </div>
        </div>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-bold text-gray-700 border border-amber-200 hover:bg-amber-100 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">Your queue is clear!</p>
            <p className="text-gray-400 text-sm">New orders will appear here automatically.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${
                order.status === 'Received' ? 'border-blue-300 ring-4 ring-blue-50' : 'border-gray-100'
              }`}
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Order ID</p>
                    {/* Render the clean order number instead of the sliced UUID */}
                    <p className="font-mono text-sm font-bold text-gray-700">{order.order_number}</p>
                  </div>
                  <div className="h-8 w-[1px] bg-gray-200"></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Placed At</p>
                    <p className="text-sm font-bold text-gray-700">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    className={`text-xs font-black px-4 py-2 rounded-full uppercase outline-none shadow-sm cursor-pointer transition ${
                      order.status === 'Received' ? 'bg-blue-600 text-white' :
                      order.status === 'Prepping' ? 'bg-amber-500 text-white' :
                      order.status === 'Ready' ? 'bg-purple-600 text-white' :
                      'bg-green-600 text-white'
                    }`}
                  >
                    <option value="Received">Received</option>
                    <option value="Prepping">Prepping</option>
                    <option value="Ready">Ready</option>
                    <option value="Delivered">Delivered</option>
                  </select>

                  <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                    {order.status === 'Delivered' && (
                      <button 
                        onClick={() => archiveOrder(order.id)}
                        disabled={updatingId === order.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 text-xs font-bold rounded-xl transition"
                        title="Archive Completed Order"
                      >
                        <Archive className="w-4 h-4" /> Archive
                      </button>
                    )}

                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={updatingId === order.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold rounded-xl transition border border-red-100 disabled:opacity-50"
                      title="Cancel and Archive Order"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 border-r border-gray-50 pr-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-800">{item.quantity}x {item.name}</span>
                        <span className="text-gray-400 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</h4>
                    <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {order.phone_number}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Method</h4>
                    <p className="text-sm font-bold text-gray-900 capitalize">{order.delivery_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs font-bold text-amber-600">{new Date(order.scheduled_date).toDateString()}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end">
                  <div className="w-full">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destination</h4>
                    {order.delivery_address.includes('http') ? (
                      <a 
                        href={order.delivery_address} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition border border-blue-100"
                      >
                        <MapPin className="w-4 h-4" /> Open Map <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-gray-800 italic">Pickup Order</p>
                    )}
                  </div>
                  <div className="text-right pt-4 border-t border-gray-50 w-full mt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
                    <p className="text-2xl font-black text-amber-600 leading-none">${Number(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}