"use client";
import { MapPin, ShoppingCart, Tag, Clock, Search, Filter, X, Heart, Star, Plus, Check as CheckIcon, Navigation, ExternalLink, Locate, CreditCard } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { listingService, orderService, reviewService } from "@/lib/firebase-services";
import type { SurplusListing, OrderItem, PaymentInfo } from "@/lib/types";
import { PLATFORM_FEE_RATE } from "@/lib/types";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePayment } from "@/hooks/usePayment";
import { haversineDistance, formatDistance, getDirectionsUrl } from "@/lib/geo";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const MapCard = dynamic(() => import("@/components/MapCard"), { ssr: false });
import { SkeletonListingGrid } from "@/components/ui/Skeletons";

interface SurplusListingCardProps {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
}

export default function SurplusListingCard({ clientId, clientName, clientPhone, clientAddress }: SurplusListingCardProps) {
  const [listings, setListings] = useState<SurplusListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [otpMap, setOtpMap] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Favorites
  const { isFavorite, toggleFavorite } = useFavorites(clientId);

  // Cart
  const { addItem, isInCart } = useCart();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterFreshness, setFilterFreshness] = useState<string>("all");
  const [filterStorage, setFilterStorage] = useState<string>("all");
  const [filterPriceMax, setFilterPriceMax] = useState<number>(0); // 0 = no limit
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "discount" | "nearest">("newest");
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  // Geolocation for distance sorting & display
  const { position: userPosition, loading: geoLoading, refresh: refreshGeo } = useGeolocation();

  // Payment
  const { initiatePayment, paying, isDemoMode } = usePayment();

  useEffect(() => {
    const unsub = listingService.subscribeToAvailableListings((data) => {
      setListings(data);
      setLoading(false);
    });
    // Auto-expire stale listings on mount
    listingService.expireStaleListings().catch(console.error);
    return () => unsub();
  }, []);

  // Subscribe to ratings for each restaurant
  useEffect(() => {
    const restaurantIds = [...new Set(listings.map(l => l.restaurantId))];
    const unsubs = restaurantIds.map(rid =>
      reviewService.subscribeToRestaurantRating(rid, (avg, count) => {
        setRatings(prev => ({ ...prev, [rid]: { avg, count } }));
      })
    );
    return () => unsubs.forEach(u => u());
  }, [listings]);

  // Filtered + sorted listings
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.foodType.toLowerCase().includes(q) ||
        item.restaurantName.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      );
    }

    // Freshness filter
    if (filterFreshness !== "all") {
      result = result.filter(item => item.freshnessStatus === filterFreshness);
    }

    // Storage filter
    if (filterStorage !== "all") {
      result = result.filter(item => item.storageCondition === filterStorage);
    }

    // Price filter
    if (filterPriceMax > 0) {
      result = result.filter(item => item.surplusPrice <= filterPriceMax);
    }

    // Sort
    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.surplusPrice - b.surplusPrice);
        break;
      case "price_high":
        result.sort((a, b) => b.surplusPrice - a.surplusPrice);
        break;
      case "discount":
        result.sort((a, b) => {
          const dA = 1 - a.surplusPrice / a.originalPrice;
          const dB = 1 - b.surplusPrice / b.originalPrice;
          return dB - dA;
        });
        break;
      case "nearest":
        if (userPosition) {
          result.sort((a, b) => {
            const distA = (a.latitude && a.longitude)
              ? haversineDistance(userPosition.latitude, userPosition.longitude, a.latitude, a.longitude)
              : Infinity;
            const distB = (b.latitude && b.longitude)
              ? haversineDistance(userPosition.latitude, userPosition.longitude, b.latitude, b.longitude)
              : Infinity;
            return distA - distB;
          });
        }
        break;
      default: // newest — already sorted by dateAdded desc from service
        break;
    }

    return result;
  }, [listings, searchQuery, filterFreshness, filterStorage, filterPriceMax, sortBy, userPosition]);

  const activeFilterCount = [
    filterFreshness !== "all",
    filterStorage !== "all",
    filterPriceMax > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterFreshness("all");
    setFilterStorage("all");
    setFilterPriceMax(0);
    setSortBy("newest");
    setSearchQuery("");
  };

  async function handleClaim(listing: SurplusListing) {
    if (!clientId) return alert("Please log in to claim food");
    setClaimingId(listing.id);

    try {
      const item: OrderItem = {
        listingId: listing.id,
        foodType: listing.foodType,
        quantity: listing.quantity,
        unit: listing.unit,
        surplusPrice: listing.surplusPrice,
        originalPrice: listing.originalPrice,
        itemTotal: listing.surplusPrice * listing.quantity,
      };

      // Calculate total with platform fee
      const subtotal = item.itemTotal;
      const clientFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
      const clientTotal = Math.round((subtotal + clientFee) * 100) / 100;

      // ── Initiate Payment ──
      const paymentResult = await initiatePayment({
        amount: clientTotal,
        customerName: clientName,
        customerPhone: clientPhone,
        description: `${listing.foodType} from ${listing.restaurantName}`,
        receipt: `claim_${listing.id}_${Date.now()}`,
      });

      if (!paymentResult.success) {
        if (paymentResult.error !== "Payment cancelled by user") {
          toast.error(paymentResult.error || "Payment failed");
        }
        return;
      }

      // ── Payment succeeded — create Firestore order ──
      const payment: PaymentInfo = {
        method: 'razorpay',
        status: 'paid',
        razorpayOrderId: paymentResult.razorpayOrderId,
        razorpayPaymentId: paymentResult.razorpayPaymentId,
        razorpaySignature: paymentResult.razorpaySignature,
        paidAt: new Date().toISOString(),
      };

      const orderId = await orderService.createOrder({
        clientId,
        clientName,
        clientPhone,
        clientAddress,
        restaurantId: listing.restaurantId,
        restaurantName: listing.restaurantName,
        items: [item],
        payment,
      });

      setClaimedIds(prev => new Set(prev).add(listing.id));
      setOtpMap(prev => ({ ...prev, [listing.id]: orderId.slice(0, 6).toUpperCase() }));
      toast.success("Payment successful! Order placed.");
    } catch (error) {
      console.error("Error claiming food:", error);
      toast.error("Failed to claim food. Please try again.");
    } finally {
      setClaimingId(null);
    }
  }

  // Keyword-based placeholder image
  function getImageUrl(listing: SurplusListing): string {
    if (listing.imageUrl) return listing.imageUrl;
    const typeLower = (listing.foodType || "").toLowerCase();
    if (typeLower.includes("salad")) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80";
    if (typeLower.includes("bread") || typeLower.includes("bakery")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80";
    if (typeLower.includes("curry") || typeLower.includes("rice")) return "https://images.unsplash.com/photo-1655075459341-a62d7c5a04ce?w=800&q=80";
    if (typeLower.includes("pasta")) return "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80";
    if (typeLower.includes("soup")) return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80";
    return "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80";
  }

  return (
    <section id="surplus" className="space-y-4">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Available Surplus Food</h2>
        <span className="text-sm text-gray-400">
          {filteredListings.length} of {listings.length} items
        </span>
      </div>

      {/* Search bar + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search food type, restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-violet-500 placeholder-gray-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${showFilters ? "border-violet-500 bg-violet-600/20 text-violet-300" : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"}`}
          >
            <Filter size={14} /> Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-violet-500 text-gray-300"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="discount">Biggest Discount</option>
            <option value="nearest">Nearest First</option>
          </select>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Freshness</label>
            <select value={filterFreshness} onChange={e => setFilterFreshness(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500 text-gray-300">
              <option value="all">All</option>
              <option value="Fresh">Fresh</option>
              <option value="Good">Good</option>
              <option value="Needs Quick Pickup">Needs Quick Pickup</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Storage</label>
            <select value={filterStorage} onChange={e => setFilterStorage(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500 text-gray-300">
              <option value="all">All</option>
              <option value="Refrigerated">Refrigerated</option>
              <option value="Room Temp">Room Temp</option>
              <option value="Frozen">Frozen</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Max Price (₹)</label>
            <input
              type="number"
              placeholder="No limit"
              value={filterPriceMax || ""}
              onChange={e => setFilterPriceMax(Number(e.target.value) || 0)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-violet-400 hover:text-violet-300 sm:col-span-3 text-left">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {filteredListings.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-50" />
          <p>{listings.length === 0 ? "No surplus food available right now. Check back soon!" : "No items match your search/filters."}</p>
          {listings.length > 0 && (
            <button onClick={clearFilters} className="mt-2 text-sm text-violet-400 hover:text-violet-300">Clear filters</button>
          )}
        </div>
      )}

      {loading && <SkeletonListingGrid count={6} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredListings.map((item) => {
          const isClaimed = claimedIds.has(item.id);
          const isClaiming = claimingId === item.id;
          const discountPct = Math.round((1 - item.surplusPrice / item.originalPrice) * 100);
          const itemSubtotal = Math.round(item.surplusPrice * item.quantity * 100) / 100;
          const platformFee = Math.round(itemSubtotal * PLATFORM_FEE_RATE * 100) / 100;
          const clientTotal = Math.round((itemSubtotal + platformFee) * 100) / 100;
          const totalOriginal = Math.round(item.originalPrice * item.quantity * 100) / 100;
          const savings = Math.round((totalOriginal - itemSubtotal) * 100) / 100;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-gray-900/50 shadow overflow-hidden flex flex-col group"
            >
              {/* Image */}
              <div className="h-40 w-full relative overflow-hidden">
                <img
                  src={getImageUrl(item)}
                  alt={item.foodType}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white">
                  {discountPct}% OFF
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.restaurantId, item.restaurantName); }}
                    className="p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition"
                  >
                    <Heart
                      size={16}
                      className={isFavorite(item.restaurantId) ? "text-rose-500 fill-rose-500" : "text-white/70"}
                    />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 flex items-center gap-1 rounded text-xs font-medium text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white leading-tight">{item.foodType}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      by <span className="font-medium text-gray-300">{item.restaurantName}</span>
                    </p>
                    {ratings[item.restaurantId] && ratings[item.restaurantId].count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-300 font-medium">{ratings[item.restaurantId].avg.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({ratings[item.restaurantId].count})</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.latitude && item.longitude ? (
                      <button
                        onClick={() => setExpandedMapId(expandedMapId === item.id ? null : item.id)}
                        className="inline-flex items-center gap-1 text-xs text-violet-300 bg-violet-600/20 px-2 py-1 rounded whitespace-nowrap hover:bg-violet-600/30 transition"
                      >
                        <MapPin size={12} /> {item.location || "View Map"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-violet-300 bg-violet-600/20 px-2 py-1 rounded whitespace-nowrap">
                        <MapPin size={12} /> {item.location || "Nearby"}
                      </span>
                    )}
                    {item.latitude && item.longitude && userPosition && (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {formatDistance(haversineDistance(userPosition.latitude, userPosition.longitude, item.latitude, item.longitude))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable Map Card */}
                {expandedMapId === item.id && item.latitude && item.longitude && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <MapCard
                      latitude={item.latitude}
                      longitude={item.longitude}
                      restaurantName={item.restaurantName}
                      userPosition={userPosition}
                      compact
                    />
                  </div>
                )}

                {/* Directions link (always visible if coords exist) */}
                {item.latitude && item.longitude && (
                  <a
                    href={getDirectionsUrl(item.latitude, item.longitude, item.restaurantName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition"
                  >
                    <Navigation size={11} /> Get Directions <ExternalLink size={10} />
                  </a>
                )}

                {/* Pricing */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-400">₹{item.surplusPrice}</span>
                    <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
                    <span className="text-xs font-medium text-emerald-300 bg-emerald-600/20 px-1.5 py-0.5 rounded">
                      {discountPct}% off
                    </span>
                  </div>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400">
                      {item.quantity} {item.unit} × ₹{item.surplusPrice} = <span className="text-gray-200 font-medium">₹{itemSubtotal}</span>
                      <span className="ml-1 text-gray-500">(was ₹{totalOriginal})</span>
                    </p>
                  )}
                  <p className="text-xs text-emerald-400/80">
                    You save ₹{savings}{item.quantity > 1 ? " total" : ""}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoBadge label="Quantity" value={`${item.quantity} ${item.unit}`} />
                  <InfoBadge label="Freshness" value={item.freshnessStatus || "N/A"} />
                  <InfoBadge label="Storage" value={item.storageCondition || "N/A"} />
                  <InfoBadge
                    label="Window"
                    value={
                      item.availability?.start && item.availability?.end
                        ? `${item.availability.start} - ${item.availability.end}`
                        : "Anytime"
                    }
                  />
                </div>

                {/* Platform fee info */}
                <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-1">
                  <Tag size={10} /> Platform fee (5%): ₹{platformFee} | Total: <span className="text-emerald-300 font-semibold">₹{clientTotal}</span>
                </div>

                <div className="mt-auto pt-5">
                  {isClaimed ? (
                    <div className="text-center">
                      <div className="w-full rounded-lg bg-emerald-600/20 border border-emerald-600/30 py-3 text-sm font-semibold text-emerald-400">
                        Order Placed!
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Order Ref: <span className="text-emerald-400 font-mono tracking-wider">{otpMap[item.id]}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 py-3 text-sm font-semibold transition shadow-lg shadow-violet-900/20 disabled:opacity-50"
                        onClick={() => handleClaim(item)}
                        disabled={isClaiming || paying}
                      >
                        {isClaiming || (paying && claimingId === item.id) ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {paying ? "Processing payment..." : "Claiming..."}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <CreditCard size={14} />
                            {`Pay & Claim • ₹${clientTotal}`}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => addItem(item)}
                        disabled={isInCart(item.id)}
                        className={`rounded-lg px-3 py-3 text-sm font-semibold transition border ${
                          isInCart(item.id)
                            ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-400"
                            : "border-gray-700 bg-gray-800 text-gray-300 hover:border-violet-500 hover:text-violet-400"
                        }`}
                        title={isInCart(item.id) ? "Already in cart" : "Add to cart"}
                      >
                        {isInCart(item.id) ? <CheckIcon size={16} /> : <Plus size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-gray-200">{value}</div>
    </div>
  );
}