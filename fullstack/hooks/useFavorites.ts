"use client";
import { useEffect, useState } from "react";
import { favoriteService } from "@/lib/firebase-services";
import type { Favorite } from "@/lib/types";

export function useFavorites(clientId: string) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    if (!clientId) return;
    const unsub = favoriteService.subscribeToFavorites(clientId, setFavorites);
    return () => unsub();
  }, [clientId]);

  const favoriteRestaurantIds = new Set(favorites.map(f => f.restaurantId));

  const isFavorite = (restaurantId: string) => favoriteRestaurantIds.has(restaurantId);

  const toggleFavorite = (restaurantId: string, restaurantName: string) =>
    favoriteService.toggleFavorite(clientId, restaurantId, restaurantName);

  return { favorites, isFavorite, toggleFavorite };
}
