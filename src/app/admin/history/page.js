"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ArrowLeft, Calendar, MapPin, Phone, X, ExternalLink, XCircle, DollarSign, ShoppingBag, Loader2, Filter } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';

export default function AdminHistory() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 400);
  const { hasMore, resetPage, nextPage, evaluateHasMore } = usePagination(15);

  const fetchHistory = useCallback(async (range, search, status, start, end, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('is_archived', true)
      .order('created_at', { ascending: false })
      .range(range.from, range.to);

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    if (status === 'completed') {
      query = query.neq('status', 'Cancelled');
    } else if (status === 'cancelled') {
      query = query.eq('status', 'Cancelled');
    }

    if (start) {
      query = query.gte('created_at', `${start}T00:00:00Z`);
    }
    if (end) {
      query = query.lte('created_at', `${end}T23:59:59Z`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching order history:", error.message);
    }

    if (data) {
      setHistory(prev => append ? [...prev, ...data] : data);
      evaluateHasMore(range.from + data.length, count);
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [evaluateHasMore]);

  useEffect(() => {
    const range = resetPage();
    fetchHistory(range, debouncedSearch, statusFilter, startDate, endDate, false);
  }, [debouncedSearch, statusFilter, startDate, endDate, fetchHistory, resetPage]);

  const loadMore = () => {
    const range = nextPage();
    fetchHistory(range, debouncedSearch, statusFilter, startDate, endDate, true);
  };

  const validOrders = history.filter(order => order.status !== 'Cancelled');
  const totalRevenue = validOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

  return (
    <div className="space-y-6 pb-20 font-sans max-w-7xl mx-auto px-4 py-8">
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-3 bg-gray-50 rounded-full hover:bg-amber-50 hover:text-amber-600 transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order History</h1>
              <p className="text-gray-500 font-medium text-sm">Search, filter, and view archived orders.</p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search Name, ID, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-700"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Filter className="w-5 h-5 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:w-auto bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-400 font-bold appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed / Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 font-bold"
              />
            </div>
            <span className="text-gray-400 font-black text-xs px-1">TO</span>
            <div className="relative w-full sm:w-auto">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl outline-none focus:ring-2 focus:ring-amber-400 font-bold"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-gray-400 hover:text-red-500 transition p-2 bg-gray-50 hover:bg-red-50 rounded-xl shrink-0"
                title="Clear Dates"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm">
            <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue (This View)</p>
              <p className="text-3xl font-black text-gray-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 flex items-center gap-5 shadow-sm">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orders (This View)</p>
              <p className="text-3xl font-black text-gray-900">{validOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                <th className="px-6 py-5">Order ID</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Total</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-amber-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold italic">
                    {debouncedSearch || startDate || endDate || statusFilter !== 'all' 
                      ? "No matching orders found for these filters." 
                      : "No archived orders yet."}
                  </td>
                </tr>
              ) : (
                history.map(order => {
                  const isCancelled = order.status === 'Cancelled';

                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-amber-50 hover:shadow-sm transition-all duration-200 cursor-pointer group ${isCancelled ? 'opacity-70 bg-gray-50/50' : ''}`}
                    >
                      <td className={`px-6 py-5 font-mono text-xs font-bold ${isCancelled ? 'text-gray-400' : 'text-gray-500 group-hover:text-amber-700'}`}>
                        {order.order_number || 'N/A'}
                      </td>
                      <td className="px-6 py-5">
                        <p className={`text-sm font-black ${isCancelled ? 'text-gray-500' : 'text-gray-900'}`}>{order.customer_name}</p>
                        <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {order.phone_number}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 font-bold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-5 font-black text-lg ${isCancelled ? 'text-gray-400 line-through' : 'text-amber-600'}`}>
                        ${(Number(order.total_amount) || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-5">
                        {isCancelled ? (
                          <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3" /> Cancelled
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest w-max">
                            Delivered
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {hasMore && !loading && (
          <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50">
            <button 
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-white border border-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl shadow-sm hover:bg-gray-100 transition flex items-center gap-2"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More Orders"}
            </button>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-8 md:p-10 relative animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="absolute top-8 right-8 p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-8 pr-12">
              <span className={`text-[10px] font-black uppercase tracking-widest ${selectedOrder.status === 'Cancelled' ? 'text-red-600' : 'text-amber-600'}`}>
                {selectedOrder.status === 'Cancelled' ? 'Cancelled Record' : 'Archived Record'}
              </span>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{selectedOrder.customer_name}</h3>
              <p className="text-xs font-mono text-gray-400 mt-1">Order ID: {selectedOrder.order_number || 'N/A'}</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-3xl">
                  <Calendar className={`w-5 h-5 mb-2 ${selectedOrder.status === 'Cancelled' ? 'text-gray-400' : 'text-amber-600'}`} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{selectedOrder.delivery_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">{new Date(selectedOrder.scheduled_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl overflow-hidden">
                  <MapPin className={`w-5 h-5 mb-2 ${selectedOrder.status === 'Cancelled' ? 'text-gray-400' : 'text-amber-600'}`} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</p>
                  {selectedOrder.delivery_address.includes('http') ? (
                    <a href={selectedOrder.delivery_address} target="_blank" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      View Map <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{selectedOrder.delivery_address}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Ordered</h4>
                <div className={`space-y-3 bg-white border rounded-2xl p-4 ${selectedOrder.status === 'Cancelled' ? 'border-red-50 opacity-70' : 'border-gray-100'}`}>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <p className={`text-sm font-bold ${selectedOrder.status === 'Cancelled' ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{item.quantity}x {item.name}</p>
                      <p className={`text-sm font-black ${selectedOrder.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        ${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400"/> {selectedOrder.phone_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grand Total</p>
                  <p className={`text-3xl font-black leading-none ${selectedOrder.status === 'Cancelled' ? 'text-red-500 line-through' : 'text-amber-600'}`}>
                    ${(Number(selectedOrder.total_amount) || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              
              {selectedOrder.status === 'Cancelled' && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl text-center flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> This order was cancelled and is excluded from revenue.
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedOrder(null)}
              className="mt-8 w-full py-4 bg-gray-900 text-white font-bold rounded-[1.5rem] hover:bg-black transition shadow-xl"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}