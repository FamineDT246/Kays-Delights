"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setMessage('Password reset link sent! Please check your email.');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 relative">
        
        <Link 
          href="/login" 
          className="absolute top-8 left-8 p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex flex-col items-center text-center mt-8 mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <KeyRound className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Reset Password</h1>
          <p className="text-gray-500 font-medium">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-700"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-xl text-center">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 text-green-600 text-sm font-bold p-4 rounded-xl text-center">
              {message}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition shadow-xl disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}