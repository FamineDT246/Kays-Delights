"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Activity, PackageSearch, History, ChevronRight, Store, TrendingUp } from 'lucide-react'; // ADDED TrendingUp

export default function AdminHub() {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchActiveCount = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false);
      
      if (count) setActiveCount(count);
    };
    fetchActiveCount();
  }, []);

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

      {/* The 4 Main Options (Changed to a 2x2 Grid) */}
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