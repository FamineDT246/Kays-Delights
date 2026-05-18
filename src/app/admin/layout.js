"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // The middleware ensures they have a session, but we double-check the admin flag here
      const isAdmin = session?.user?.user_metadata?.is_admin === true;
      
      if (!isAdmin) {
        router.push('/account'); // Kick regular customers back to their dashboard silently
      } else {
        setIsAuthorized(true);
      }
    };
    
    verifyAdminStatus();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}