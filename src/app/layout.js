import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kiara's Treats",
  description: "Freshly baked Bajan treats and pastries.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Navbar />
          
          <div className="max-w-7xl mx-auto my-2 sm:my-6 px-2 sm:px-4">
            <main className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl sm:rounded-3xl border border-white/20 min-h-[85vh] p-4 sm:p-6 md:p-10 text-gray-900">
              {children}
            </main>
          </div>
          
        </CartProvider>
      </body>
    </html>
  );
}