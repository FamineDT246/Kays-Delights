"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Activity, PackageSearch, History, ChevronRight, Store, TrendingUp, Power, Loader2, AlertCircle } from 'lucide-react';

export default function AdminHub() {
  const [activeCount, setActiveCount] = useState(0);
  const [isSameDayEnabled, setIsSameDayEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch Active Orders Count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false);
      
      if (count) setActiveCount(count);

      // Fetch Global Store Settings
      const { data } = await supabase
        .from('store_settings')
        .select('same_day_enabled')
        .eq('id', 'default')
        .single();

      if (data) setIsSameDayEnabled(data.same_day_enabled);
    };
    fetchDashboardData();
  }, []);

  const toggleSameDayFulfillment = async () => {
    setIsUpdating(true);
    const newValue = !isSameDayEnabled;
    
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ same_day_enabled: newValue })
        .eq('id', 'default');

      if (error) throw error;
      setIsSameDayEnabled(newValue);
    } catch (error) {
      alert("Failed to update store settings. Ensure you are logged in as an Admin.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 font-sans px-4 pt-8">
      
      {/* Header */}
      <div className="bg-gray-900 rounded-[2.5rem] p-10 md:p-16 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-amber-400 font-black tracking-widest uppercase text-xs mb-2 block">Command Center</span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Welcome, Admin.</h1>
          <p className="text-gray-400 font-medium text-lg max-w-xl">What would you like to manage today? Select an option below to access your bakery tools.</p>
        </div>
        <Store className="absolute -bottom-10 -right-10 w-64 h-64 text-gray-800 opacity-50 pointer-events-none" />
      </div>

      {/* NEW: Store Controls Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl border-2 border-gray-50 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              Store Capacity: Same-Day Orders
            </h3>
            <p className="text-sm text-gray-500 max-w-xl">
              Toggle this off during high-volume periods to prevent overwhelming the kitchen. Customers will only be able to schedule future orders.
            </p>
          </div>
          
          <button
            onClick={toggleSameDayFulfillment}
            disabled={isUpdating}
            className={`relative inline-flex h-12 w-24 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-amber-500/30 disabled:opacity-50 ${
              isSameDayEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span className="sr-only">Toggle Same-Day Fulfillment</span>
            <span
              className={`absolute flex items-center justify-center h-10 w-10 transform rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out ${
                isSameDayEnabled ? 'translate-x-6' : '-translate-x-6'
              }`}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <Power className={`h-4 w-4 ${isSameDayEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              )}
            </span>
          </button>
        </div>
        {!isSameDayEnabled && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-amber-800">
              Same-day ordering is currently disabled across the entire storefront.
            </p>
          </div>
        )}
      </div>

      {/* The 4 Main Options (Restored 2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Option 1: Live Tracking */}
        <Link href="/admin/queue" className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
          <div className="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Activity className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Live Tracking</h2>
          <p className="text-gray-500 font-medium text-sm mb-8">Monitor incoming orders, update fulfillment statuses, and manage deliveries in real-time.</p>
          
          <div className="mt-auto flex items-center justify-between text-amber-600 font-bold">
            <span className="flex items-center gap-2">
              {activeCount > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
              {activeCount} Active Orders
            </span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        {/* Option 2: Manage Products */}
        <Link href="/admin/inventory/actions" className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col h-full">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PackageSearch className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Manage Menu</h2>
          <p className="text-gray-500 font-medium text-sm mb-8">Add new treats, edit pricing, upload photos, and update descriptions on the storefront.</p>
          
          <div className="mt-auto flex items-center justify-between text-blue-600 font-bold">
            <span>Edit Inventory</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        {/* Option 3: Order History */}
        <Link href="/admin/history" className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-400 transition-all duration-300 flex flex-col h-full">
          <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <History className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order History</h2>
          <p className="text-gray-500 font-medium text-sm mb-8">Search past purchases, review archived receipts, and find specific customer orders.</p>
          
          <div className="mt-auto flex items-center justify-between text-purple-600 font-bold">
            <span>View Archives</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        {/* Option 4: NEW INCOME TRACKER */}
        <Link href="/admin/income" className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-400 transition-all duration-300 flex flex-col h-full">
          <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Revenue Dashboard</h2>
          <p className="text-gray-500 font-medium text-sm mb-8">Track daily, weekly, and monthly income. Generate reports for specific months or years.</p>
          
          <div className="mt-auto flex items-center justify-between text-green-600 font-bold">
            <span>Calculate Income</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

      </div>
    </div>
  );
}