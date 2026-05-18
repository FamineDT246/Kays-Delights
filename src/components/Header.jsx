import { Search, ShoppingCart, User, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Brand Name - Links to Home */}
        <Link href="/" className="text-2xl font-bold text-amber-800 hover:text-amber-600 transition">
          Kiara's Treats
        </Link>

        {/* Search Bar */}
        <div className="flex-1 mx-8 relative hidden md:block">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search for cookies, cakes, bread..." 
              className="w-full bg-gray-100 border-none rounded-full py-2 px-10 focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-6">
          
          {/* Admin Link (For Development) */}
          <Link href="/admin" className="flex flex-col items-center text-gray-400 hover:text-amber-600 transition">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1">POS</span>
          </Link>

          {/* Account Link */}
          <Link href="/account" className="flex flex-col items-center text-gray-600 hover:text-amber-600 transition">
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Account</span>
          </Link>
          
          {/* Cart Link */}
          <Link href="/cart" className="flex flex-col items-center text-gray-600 relative hover:text-amber-600 transition">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs mt-1">Cart</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </Link>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="bg-amber-50 border-t">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto py-2 flex gap-8 text-sm font-medium text-amber-900 whitespace-nowrap">
          <Link href="/" className="hover:text-amber-600 transition">All Treats</Link>
          <button className="hover:text-amber-600 transition">Cakes</button>
          <button className="hover:text-amber-600 transition">Cookies</button>
          <button className="hover:text-amber-600 transition">Breads</button>
          <button className="hover:text-amber-600 transition">Pastries</button>
        </div>
      </nav>
    </header>
  );
}