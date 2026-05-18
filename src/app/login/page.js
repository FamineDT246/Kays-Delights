"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Store } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      const isAdmin = data.user?.user_metadata?.is_admin === true;
      
      // Check the URL for a "next" parameter
      const searchParams = new URLSearchParams(window.location.search);
      const nextDestination = searchParams.get('next');

      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-sm border border-amber-100 p-8 md:p-10">
        
        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium px-4">Sign in to track your treats or manage the bakery.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 pl-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-900 bg-white outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-500 transition font-medium"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 pl-1 pr-1">
              <label className="text-sm font-bold text-gray-700">Password</label>
              <Link href="/forgot-password" hidden={loading} className="text-xs font-black text-amber-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-gray-900 bg-white outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-500 transition font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 rounded-xl transition disabled:opacity-50 flex justify-center items-center mt-6 shadow-md"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-gray-600 font-medium">
            Don't have an account?{' '}
            <Link href="/signup" className="text-amber-600 font-black hover:underline">
              Sign up here
            </Link>
          </p>
          <div className="pt-2">
            <Link href="/" className="text-xs text-gray-400 font-bold hover:text-amber-600 transition uppercase tracking-widest">
              &larr; Back to the menu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}