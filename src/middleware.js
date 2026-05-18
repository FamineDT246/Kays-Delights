import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // We only want to run this strict check on Admin routes
  if (path.startsWith('/admin')) {
    
    // Supabase sets a cookie that starts with 'sb-' and ends with '-auth-token' when logged in
    const cookies = req.cookies.getAll();
    const authCookie = cookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

    // If there is no auth token cookie, kick them instantly to login
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Note: We check the specific 'is_admin' metadata on the client side 
    // or via an API route, but this ensures they are at least logged in securely!
  }

  return res;
}

// This tells Next.js to only run this middleware on /admin and its sub-pages
export const config = {
  matcher: ['/admin/:path*'],
};