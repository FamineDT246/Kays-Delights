"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Store, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Email sent! Please check your inbox to verify your email address.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-amber-100 p-8">
        
        <div className="text-center mb-6">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Create an Account</h1>
          <p className="text-gray-500 text-sm mt-2">Join Kiara's Treats to easily track your orders.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 border border-green-100 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 transition"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-amber-500 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 items-start mt-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Your privacy matters.</strong> We only store your name and email to manage your account. Delivery details are securely collected only when you place an order.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading || !email || !password || !name}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 flex justify-center items-center mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-600 font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}