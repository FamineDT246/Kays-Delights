"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("kiaras_cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      setCart([]);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("kiaras_cart", JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: quantity }];
      }
    });
  }, []);

  const addItemsToCart = useCallback((itemsToReorder) => {
    setCart((prevCart) => {
      const currentCartMap = new Map(prevCart.map((item) => [item.id, item]));

      itemsToReorder.forEach((newItem) => {
        if (currentCartMap.has(newItem.id)) {
          const existingItem = currentCartMap.get(newItem.id);
          currentCartMap.set(newItem.id, {
            ...existingItem,
            quantity: existingItem.quantity + newItem.quantity,
          });
        } else {
          currentCartMap.set(newItem.id, newItem);
        }
      });

      return Array.from(currentCartMap.values());
    });
  }, []);

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const value = {
    cart,
    addToCart,
    addItemsToCart,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    isMounted,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}