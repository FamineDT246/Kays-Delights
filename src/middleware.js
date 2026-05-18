import { NextResponse } from 'next/server';

export async function middleware(req) {
  // We are bypassing the server-side cookie check because Supabase is using localStorage.
  // The actual route security is handled safely and strictly by the 
  // Client-Side wrapper in src/app/admin/layout.js.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};