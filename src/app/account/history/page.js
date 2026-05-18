"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import {
  Loader2,
  History,
  ChevronRight,
  Calendar,
  X,
  ReceiptText,
  MapPin,
  Package,
  ArrowLeft,
  XCircle // ADDED
} from "lucide-react";

export default function OrderHistory() {
  const [pastOrders, setPastOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { addItemsToCart } = useCart();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_archived", true)
          .order("created_at", { ascending: false });

        setPastOrders(data || []);
      } catch (error) {
        console.error("History Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const handleReorder = () => {
    if (!selectedOrder?.items) return;
    addItemsToCart(selectedOrder.items);
    setSelectedOrder(null);
    router.push("/cart");
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
      <p className="text-gray-400 font-medium">Loading your archives...</p>
    </div>
  );

  return (
    <main className="max-w-4xl mx-auto space-y-10 pb-20 px-4 pt-8">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/account" className="p-3 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 hover:shadow-md transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-amber-600" />
            Order History
          </h1>
          <p className="text-gray-500 font-medium mt-1">All your past cravings in one place.</p>
        </div>
      </div>

      {/* List of Orders */}
      {pastOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {pastOrders.map((pastOrder) => {
            const isCancelled = pastOrder.status === 'Cancelled';
            
            return (
              <button
                key={pastOrder.id}
                onClick={() => setSelectedOrder(pastOrder)}
                className={`bg-white border p-6 rounded-[2rem] flex justify-between items-center group transition-all text-left ${
                  isCancelled ? 'border-red-100 hover:border-red-300 opacity-75' : 'border-gray-100 hover:border-amber-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl transition ${isCancelled ? 'bg-red-50 text-red-400' : 'bg-gray-50 text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-500'}`}>
                    {isCancelled ? <XCircle className="w-6 h-6" /> : <ReceiptText className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-black ${isCancelled ? 'text-gray-500' : 'text-gray-800'}`}>
                        Order #{pastOrder.id.slice(0, 8)}
                      </p>
                      {isCancelled && (
                        <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">Cancelled</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">{new Date(pastOrder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className={`text-xl font-black ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    ${Number(pastOrder.total_amount).toFixed(2)}
                  </p>
                  <ChevronRight className={`w-5 h-5 transition ${isCancelled ? 'text-gray-200' : 'text-gray-300 group-hover:text-amber-500'}`} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/40 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center text-gray-500 font-medium">
          No past orders found in your history yet!
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-8 md:p-10 relative animate-in zoom-in duration-200 max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition">
              <X className="w-6 h-6" />
            </button>

            <div className="overflow-y-auto hide-scrollbar">
              <div className="mb-8">
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedOrder.status === 'Cancelled' ? 'text-red-500' : 'text-amber-600'}`}>
                  {selectedOrder.status === 'Cancelled' ? 'Cancelled Order' : 'Order Receipt'}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mt-1">Details</h3>
                <p className="text-xs font-mono text-gray-400 mt-1">ID: {selectedOrder.id}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-3xl">
                    <Calendar className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-3xl">
                    <MapPin className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {selectedOrder.delivery_address?.includes('http') ? 'Pinned Map' : selectedOrder.delivery_address || 'Pickup'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Summary</h4>
                  <div className="space-y-3 opacity-75">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <p className={`text-sm font-bold ${selectedOrder.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.quantity}x {item.name}</p>
                        <p className={`text-sm font-black ${selectedOrder.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-xl font-black text-gray-900">Paid Total</p>
                  <p className={`text-3xl font-black ${selectedOrder.status === 'Cancelled' ? 'text-red-500 line-through' : 'text-amber-600'}`}>
                    ${Number(selectedOrder.total_amount).toFixed(2)}
                  </p>
                </div>
                {selectedOrder.status === 'Cancelled' && (
                  <p className="text-xs font-bold text-red-500 text-right mt-1">This order was cancelled and refunded.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                <button onClick={() => setSelectedOrder(null)} className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition">Close</button>
                <button 
                  onClick={handleReorder} 
                  className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" /> Reorder Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}