/**
 * Haversine formula — calculates the great-circle distance (in km)
 * between two points on a sphere given their latitude and longitude.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Format distance for display.
 * < 1 km → shows meters, else shows km with 1 decimal.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Build a Google Maps directions URL (no API key required).
 */
export function getDirectionsUrl(lat: number, lng: number, label?: string): string {
  const dest = `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${label ? `&destination_place_id=${encodeURIComponent(label)}` : ""}`;
}

/**
 * Build a static OpenStreetMap tile URL for a given lat/lng + zoom.
 * Good for fallback thumbnails without Leaflet.
 */
export function getStaticMapUrl(lat: number, lng: number, zoom = 15, width = 400, height = 200): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;
}
