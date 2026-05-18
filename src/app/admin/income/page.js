"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, DollarSign, ShoppingBag, Calendar, Loader2, TrendingUp, TrendingDown, Receipt, Truck } from 'lucide-react';
import Link from 'next/link';

export default function IncomeDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total_revenue: 0, 
    total_delivery_fees: 0,
    total_rush_fees: 0,
    total_cogs: 0,
    net_profit: 0,
    total_orders: 0 
  });
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const firstDay = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const lastDay = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const fetchIncomeStats = useCallback(async () => {
    setLoading(true);
    
    const start = `${startDate}T00:00:00Z`;
    const end = `${endDate}T23:59:59Z`;

    try {
      const { data, error } = await supabase.rpc('get_income_stats', { 
        start_date: start, 
        end_date: end 
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setStats({
          total_revenue: data[0].total_revenue || 0,
          total_delivery_fees: data[0].total_delivery_fees || 0,
          total_rush_fees: data[0].total_rush_fees || 0,
          total_cogs: data[0].total_cogs || 0,
          net_profit: data[0].net_profit || 0,
          total_orders: data[0].total_orders || 0
        });
      } else {
        setStats({ total_revenue: 0, total_delivery_fees: 0, total_rush_fees: 0, total_cogs: 0, net_profit: 0, total_orders: 0 });
      }
    } catch (error) {
      console.error("Error fetching income:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchIncomeStats();
  }, [fetchIncomeStats]);

  const totalFees = Number(stats.total_delivery_fees) + Number(stats.total_rush_fees);
  const profitMargin = stats.total_revenue > 0 ? ((stats.net_profit / stats.total_revenue) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-3 bg-gray-50 rounded-full hover:bg-amber-50 hover:text-amber-600 transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Overview</h1>
            <p className="text-gray-500 font-medium text-sm">Track gross revenue, profit margins, and costs.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 transition font-bold text-gray-700 text-sm"
            />
          </div>
          <span className="text-gray-400 font-black">TO</span>
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 transition font-bold text-gray-700 text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Hero Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-[2.5rem] p-10 flex flex-col justify-center shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> Net Profit (Gains)
              </p>
              <h2 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-4">
                ${Number(stats.net_profit).toFixed(2)}
              </h2>
              <div className="inline-block bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold w-max backdrop-blur-md">
                {profitMargin}% Overall Profit Margin
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col justify-center shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Gross Revenue</p>
                  <p className="text-gray-500 text-sm font-bold">Total money collected</p>
                </div>
              </div>
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter">
                ${Number(stats.total_revenue).toFixed(2)}
              </h2>
            </div>
          </div>

          {/* Breakdown Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Cost of Goods (COGS)</p>
                <Receipt className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-1">
                ${Number(stats.total_cogs).toFixed(2)}
              </h3>
              <p className="text-xs font-bold text-gray-500">Total cost to bake items</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Service Fees</p>
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-1">
                ${totalFees.toFixed(2)}
              </h3>
              <p className="text-xs font-bold text-gray-500">Delivery & Rush fees collected</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Completed Orders</p>
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-1">
                {stats.total_orders}
              </h3>
              <p className="text-xs font-bold text-gray-500">Successfully fulfilled</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}