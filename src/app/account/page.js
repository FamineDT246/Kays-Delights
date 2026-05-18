"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, Save, Loader2, User } from 'lucide-react';

export default function Account() {
  const [user, setUser] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile States
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const router = useRouter();

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");
        setUser(session.user);

        // Fetch User Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("phone, default_address")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          setPhone(profileData.phone || '');
          setAddress(profileData.default_address || '');
        }

        // Fetch Active Orders
        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: false });

        if (orderData) setActiveOrders(orderData);

        // Secure Real-Time Subscription
        const channel = supabase
          .channel(`user-orders-${session.user.id}`)
          .on("postgres_changes", { 
            event: "UPDATE", 
            schema: "public", 
            table: "orders",
            filter: `user_id=eq.${session.user.id}`
          },
            (payload) => {
              setActiveOrders((prevActive) => {
                if (payload.new.is_archived) {
                  return prevActive.filter((order) => order.id !== payload.new.id);
                } 
                return prevActive.map((o) => 
                  o.id === payload.new.id ? { ...o, ...payload.new } : o
                );
              });
            }
          ).subscribe();

        return () => supabase.removeChannel(channel);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, [router]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone, default_address: address })
        .eq('id', user.id);

      if (error) throw error;
      setProfileMessage('Profile saved successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (error) {
      setProfileMessage('Error saving profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = { Received: 1, Prepping: 2, Ready: 3, Delivered: 4 };
    return steps[status] || 1;
  };

  const getProgressWidth = (step) => {
    if (step <= 1) return 'w-0';
    if (step === 2) return 'w-1/3';
    if (step === 3) return 'w-2/3';
    return 'w-full';
  };

  // For the vertical mobile tracker
  const getVerticalProgressHeight = (step) => {
    if (step <= 1) return 'h-0';
    if (step === 2) return 'h-[33%]';
    if (step === 3) return 'h-[66%]';
    return 'h-full';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-500 font-medium">Manage your details and track your active orders.</p>
      </div>

      {/* Profile Settings Section */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-black text-gray-900">Profile Details</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Default Delivery Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your default address"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className={`text-sm font-bold ${profileMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {profileMessage}
          </p>
          <button 
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Details
          </button>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <Package className="w-6 h-6 text-amber-600" />
        <h2 className="text-xl font-black text-gray-900">Active Orders</h2>
      </div>

      <div className="space-y-6">
        {activeOrders.length === 0 ? (
          <div className="bg-gray-50 p-10 rounded-[2rem] text-center border border-gray-100">
            <p className="text-gray-500 font-bold">You have no active orders right now.</p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const currentStep = getStatusStep(order.status);
            
            const stepsArray = [
              { step: 1, icon: Package, label: 'Received' },
              { step: 2, icon: Clock, label: 'Prepping' },
              { step: 3, icon: CheckCircle, label: 'Ready' },
              { step: 4, icon: Truck, label: 'Delivered' }
            ];

            return (
              <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Order #{order.id.split('-')[0]}</p>
                    <p className="text-lg font-black text-gray-900">${Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <span className="bg-amber-50 text-amber-600 font-black text-xs px-4 py-2 rounded-full uppercase tracking-widest w-max">
                    {order.status}
                  </span>
                </div>

                {/* DESKTOP HORIZONTAL TRACKER */}
                <div className="hidden md:block relative mb-8 mt-4 max-w-2xl mx-auto">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-gray-100 rounded-full z-0"></div>
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-amber-500 rounded-full z-0 transition-all duration-1000 ${getProgressWidth(currentStep)}`}></div>
                  
                  <div className="relative z-10 flex justify-between">
                    {stepsArray.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentStep >= item.step;
                      return (
                        <div key={item.step} className="flex flex-col items-center gap-2 bg-white px-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 border-4 border-white shadow-sm ${isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MOBILE VERTICAL TRACKER */}
                <div className="md:hidden relative mt-6 mb-2 ml-2">
                  <div className="absolute left-[19px] top-0 bottom-0 w-1 bg-gray-100 rounded-full z-0"></div>
                  <div className={`absolute left-[19px] top-0 w-1 bg-amber-500 rounded-full z-0 transition-all duration-1000 ${getVerticalProgressHeight(currentStep)}`}></div>
                  
                  <div className="flex flex-col gap-6 relative z-10">
                    {stepsArray.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentStep >= item.step;
                      return (
                        <div key={item.step} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-colors duration-500 border-4 border-white shadow-sm ${isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}