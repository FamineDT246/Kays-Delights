"use client";

export default function ProductCard({ product }) {
  if (!product) {
    return <div className="animate-pulse bg-gray-100 rounded-[1.5rem] h-64 w-full border border-gray-200"></div>;
  }
  
  // Determines if the product can be bought
  const isAvailable = product.is_available !== false;

  return (
    <div className={`bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-sm flex flex-col h-full transition-all duration-300 ${isAvailable ? 'hover:shadow-md' : 'opacity-80'}`}>
      
      {/* Image Area */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-50">
        <img 
          src={product.image_url || '/placeholder.jpg'} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-transform duration-500 ${isAvailable ? 'group-hover:scale-105' : 'grayscale'}`}
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-[10px] w-fit font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
            {product.category}
          </span>
          {!isAvailable && (
            <span className="bg-red-500/95 backdrop-blur-sm text-white text-[10px] w-fit font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3 className={`text-xl font-black leading-tight transition-colors duration-200 ${isAvailable ? 'text-gray-900 group-hover:text-amber-600' : 'text-gray-400'}`}>
            {product.name}
          </h3>
          <p className={`text-lg font-black shrink-0 ${isAvailable ? 'text-amber-600' : 'text-gray-400'}`}>
            ${Number(product.price).toFixed(2)}
          </p>
        </div>
        <p className="text-sm text-gray-500 font-medium line-clamp-2 mt-auto">
          {product.description || "Freshly baked and made to order."}
        </p>
      </div>
    </div>
  );
}