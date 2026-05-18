"use client";

import Link from 'next/link';
import { ShoppingCart, LogOut, User, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const { cartCount, isMounted } = useCart();
  const [user, setUser] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      router.push('/cart');
    }
  };

  const isAdmin = user?.user_metadata?.is_admin === true;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Account';
  const displayName = isAdmin ? 'Admin' : firstName;
  const profileLink = isAdmin ? '/admin' : '/account';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png"
              alt="Kiara's Treats Logo"
              width={120}
              height={40}
            />
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 mr-2 border-r border-gray-200 pr-4">
                <Link 
                  href={profileLink} 
                  className={`p-2 transition flex items-center gap-2 rounded-full ${
                    isAdmin ? 'text-blue-700 hover:bg-blue-50' : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  {isAdmin ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  <span className="text-sm font-bold hidden sm:inline">{displayName}</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition flex items-center gap-2 rounded-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-semibold hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="mr-2 border-r border-gray-200 pr-4">
                <Link 
                  href="/login" 
                  className="text-sm font-semibold text-gray-700 hover:text-amber-600 transition px-3 py-2"
                >
                  Log In
                </Link>
              </div>
            )}

            <button 
              onClick={handleCartClick}
              className="relative p-2 text-gray-700 hover:text-amber-600 transition bg-amber-50 rounded-full"
            >
              <ShoppingCart className="w-6 h-6" />
              {isMounted && cartCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1 -translate-y-1 border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showLoginPrompt && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Login to Checkout</h3>
            <p className="text-gray-500 font-medium mb-8">
              You must login to proceed to checkout.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowLoginPrompt(false); router.push('/login?next=cart'); }}
                className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black hover:bg-amber-700 transition shadow-lg"
              >
                PROCEED TO LOGIN
              </button>
              <button 
                onClick={() => setShowLoginPrompt(false)}
                className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition"
              >
                CONTINUE BROWSING
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}