"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { SurplusListing, OrderItem } from "@/lib/types";

export interface CartItem extends OrderItem {
  restaurantId: string;
  restaurantName: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (listing: SurplusListing) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  isInCart: (listingId: string) => boolean;
  cartCount: number;
  cartTotal: number;
  /** Group items by restaurant */
  groupedByRestaurant: Record<string, { restaurantName: string; items: CartItem[] }>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((listing: SurplusListing) => {
    setItems(prev => {
      if (prev.some(i => i.listingId === listing.id)) return prev;
      return [...prev, {
        listingId: listing.id,
        foodType: listing.foodType,
        quantity: listing.quantity,
        unit: listing.unit,
        surplusPrice: listing.surplusPrice,
        originalPrice: listing.originalPrice,
        itemTotal: listing.surplusPrice * listing.quantity,
        restaurantId: listing.restaurantId,
        restaurantName: listing.restaurantName,
      }];
    });
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems(prev => prev.filter(i => i.listingId !== listingId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((listingId: string) => items.some(i => i.listingId === listingId), [items]);

  const cartTotal = items.reduce((s, i) => s + i.itemTotal, 0);

  // Group by restaurant
  const groupedByRestaurant = items.reduce<Record<string, { restaurantName: string; items: CartItem[] }>>((acc, item) => {
    if (!acc[item.restaurantId]) {
      acc[item.restaurantId] = { restaurantName: item.restaurantName, items: [] };
    }
    acc[item.restaurantId].items.push(item);
    return acc;
  }, {});

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      isInCart,
      cartCount: items.length,
      cartTotal,
      groupedByRestaurant,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
