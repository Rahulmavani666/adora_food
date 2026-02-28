"use client";

import { useEffect, useRef } from "react";
import { Navigation, ExternalLink } from "lucide-react";
import { getDirectionsUrl, formatDistance, haversineDistance } from "@/lib/geo";
import type { GeoPosition } from "@/hooks/useGeolocation";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapCardProps {
  latitude: number;
  longitude: number;
  restaurantName: string;
  userPosition?: GeoPosition | null;
  compact?: boolean;
}

/**
 * Interactive Leaflet map card showing the restaurant location
 * with a directions link to Google Maps.
 */
export default function MapCard({
  latitude,
  longitude,
  restaurantName,
  userPosition,
  compact = false,
}: MapCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const distance = userPosition
    ? haversineDistance(userPosition.latitude, userPosition.longitude, latitude, longitude)
    : null;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: !compact,
      dragging: !compact,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    L.marker([latitude, longitude], { icon: DefaultIcon })
      .addTo(map)
      .bindPopup(`<b>${restaurantName}</b>`)
      .openPopup();

    // Show user location if available
    if (userPosition) {
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;background:#7c3aed;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(124,58,237,0.6)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      L.marker([userPosition.latitude, userPosition.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup("You are here");

      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [latitude, longitude],
        [userPosition.latitude, userPosition.longitude]
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, restaurantName, userPosition, compact]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
      {/* Map */}
      <div
        ref={mapRef}
        className={compact ? "h-32 w-full" : "h-48 w-full"}
        style={{ zIndex: 0 }}
      />

      {/* Info bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900/90">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation size={13} className="text-violet-400 shrink-0" />
          <span className="text-xs text-gray-300 truncate">{restaurantName}</span>
          {distance !== null && (
            <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">
              {formatDistance(distance)}
            </span>
          )}
        </div>
        <a
          href={getDirectionsUrl(latitude, longitude, restaurantName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition whitespace-nowrap"
        >
          Directions <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
