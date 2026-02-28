"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

/**
 * Hook to get the user's current geolocation.
 * Returns { position, error, loading, refresh }.
 */
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("Failed to get location.");
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // cache for 5 min
      }
    );
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { position, error, loading, refresh };
}
