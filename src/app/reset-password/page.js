"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create New Password</h1>
          <p className="text-gray-500 font-medium">
            Please enter and confirm your new password below.
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-700"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition p-1"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition font-bold text-gray-700"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition p-1"
                tabIndex="-1"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-amber-600/20 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}