"use client";

import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard'; 
import { supabase } from '@/lib/supabase';
import { Search, ShoppingBag, User, X, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { createPortal } from 'react-dom';
import { useDebounce } from '@/hooks/useDebounce';

export default function Home() {
  const router = useRouter();
  const { cartCount, addToCart } = useCart();
  
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const [selectedTreat, setSelectedTreat] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const [treats, setTreats] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setMounted(true);
    fetchTreats();

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTreats = async () => {
    const { data, error } = await supabase.from('treats').select('*');
    if (error) {
      console.error("Error fetching treats:", error);
    } else {
      setTreats(data || []);
    }
    setLoading(false);
  };

  const handleOpenQuickView = (treat) => {
    setSelectedTreat(treat);
    setQuantity(1); 
  };

  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredTreats = treats.filter(treat => {
    const matchesCategory = activeCategory === 'all' || treat.category === activeCategory;
    const matchesSearch = treat.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
                          (treat.description && treat.description.toLowerCase().includes(debouncedQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="font-sans">
      
      {/* Immersive Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 bg-amber-50/50 border-b border-amber-100 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="text-amber-600 font-black tracking-widest uppercase text-sm mb-4 block">Handcrafted with Love</span>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-6 leading-tight">
            Welcome to <br/><span className="text-amber-600">Kay's Delights!</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium mb-10 max-w-2xl mx-auto">
            Freshly baked cakes, cookies, and artisan breads. Order for pickup or delivery today.
          </p>
          <button 
            onClick={scrollToMenu}
            className="group bg-amber-600 hover:bg-amber-700 text-white font-black py-4 px-10 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 mx-auto text-lg"
          >
            Browse Menu 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main id="menu-section" className="max-w-7xl mx-auto px-4 py-16 relative">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
            <h2 className="text-3xl font-black text-gray-900 whitespace-nowrap">Our Menu</h2>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search treats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition shadow-sm bg-white"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Treats' },
              { id: 'cakes', label: '🍰 Cakes' },
              { id: 'cookies', label: '🍪 Cookies' },
              { id: 'breads', label: '🍞 Breads' },
              { id: 'pastries', label: '🥐 Pastries' }
            ].map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-amber-600 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
              <p className="text-amber-600 font-bold animate-pulse">Baking fresh treats...</p>
            </div>
          ) : filteredTreats.length === 0 ? (
            <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-16 text-center">
              <p className="text-gray-500 font-bold text-xl mb-3">No treats match your search.</p>
              <button 
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }} 
                className="text-amber-600 font-black hover:text-amber-700 transition"
              >
                Clear filters and view all menu items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
              {filteredTreats.map((treat, index) => (
                <div 
                  key={treat.id || index} 
                  onClick={(e) => {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    handleOpenQuickView(treat);
                  }} 
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <ProductCard product={treat} />
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTreat && (
          <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedTreat(null)}
          >
            <div 
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedTreat(null)} 
                className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full text-gray-800 hover:bg-white hover:scale-110 transition shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto flex-1 hide-scrollbar">
                <div className="h-64 sm:h-80 w-full relative bg-gray-100">
                  <img 
                    src={selectedTreat.image_url} 
                    alt={selectedTreat.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                      {selectedTreat.name}
                    </h3>
                    <p className="text-2xl text-amber-600 font-black shrink-0">
                      ${selectedTreat.price?.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-amber-50/50 rounded-2xl p-5 mb-4 border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">Description & Ingredients</p>
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {selectedTreat.description || "A delicious, freshly baked treat made with love from Kiara's kitchen."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                {selectedTreat.is_available !== false ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-1 w-full sm:w-auto h-14">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-amber-600 hover:bg-white rounded-xl transition"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="w-12 text-center font-black text-lg text-gray-900">
                        {quantity}
                      </span>
                      <button 
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-amber-600 hover:bg-white rounded-xl transition"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        addToCart(selectedTreat, quantity); 
                        setSelectedTreat(null);
                      }}
                      className="flex-1 w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition shadow-lg shadow-amber-600/20 h-14"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>ADD TO CART</span>
                      <span className="bg-white/20 px-2 py-1 rounded-md text-sm ml-2">
                        ${(selectedTreat.price * quantity).toFixed(2)}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-500 font-black py-4 rounded-2xl cursor-not-allowed h-14"
                  >
                    CURRENTLY SOLD OUT
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {mounted && cartCount > 0 && createPortal(
          <>
            <button
              onClick={() => {
                if (!user) setShowLoginPrompt(true);
                else router.push('/cart');
              }}
              className="fixed bottom-24 right-6 md:right-10 z-[999] bg-gray-900 text-white px-6 py-4 rounded-full font-black shadow-2xl hover:bg-black hover:scale-105 transition-all flex items-center gap-3 border-[3px] border-white ring-4 ring-gray-900/10"
            >
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              Checkout
              <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-xs shadow-inner border border-amber-600">
                {cartCount}
              </span>
            </button>

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
                      onClick={() => router.push('/login?next=cart')}
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
          </>,
          document.body 
        )}
      </main>
    </div>
  );
}