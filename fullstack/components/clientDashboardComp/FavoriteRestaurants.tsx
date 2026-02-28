"use client";
import { Heart, Star, ExternalLink } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useEffect, useState } from "react";
import { reviewService } from "@/lib/firebase-services";

export default function FavoriteRestaurants({ clientId }: { clientId: string }) {
  const { favorites, toggleFavorite } = useFavorites(clientId);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Subscribe to ratings for favorite restaurants
  useEffect(() => {
    if (favorites.length === 0) return;
    const unsubs = favorites.map(f =>
      reviewService.subscribeToRestaurantRating(f.restaurantId, (avg, count) => {
        setRatings(prev => ({ ...prev, [f.restaurantId]: { avg, count } }));
      })
    );
    return () => unsubs.forEach(u => u());
  }, [favorites]);

  if (favorites.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6 text-center">
        <Heart size={28} className="mx-auto mb-2 text-gray-600" />
        <p className="text-gray-500 text-sm">No favorite restaurants yet.</p>
        <p className="text-gray-600 text-xs mt-1">Tap the heart on listing cards to save restaurants here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5 shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Heart size={16} className="text-rose-400" />
          Favorite Restaurants
        </h3>
        <span className="text-xs text-gray-500">{favorites.length} saved</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {favorites.map(fav => {
          const rating = ratings[fav.restaurantId];
          return (
            <div
              key={fav.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-sm text-gray-200">{fav.restaurantName}</p>
                {rating && rating.count > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-amber-300">{rating.avg.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({rating.count})</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleFavorite(fav.restaurantId, fav.restaurantName)}
                className="p-1.5 rounded-full hover:bg-white/5 transition"
              >
                <Heart size={16} className="text-rose-500 fill-rose-500" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
