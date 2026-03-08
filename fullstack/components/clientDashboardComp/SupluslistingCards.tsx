"use client";
import {
  MapPin, ShoppingCart, Clock, Search, Filter, X, Heart, Star,
  Plus, Check as CheckIcon, Navigation, ExternalLink,
  CreditCard, Banknote, Smartphone, Bike, Percent, Flame,
  Zap,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { listingService, orderService, reviewService } from "@/lib/firebase-services";
import type { SurplusListing, OrderItem, PaymentInfo, PaymentMethod, DietaryTag, CuisineType } from "@/lib/types";
import { PLATFORM_FEE_RATE, DIETARY_TAG_LABELS, CUISINE_TYPES } from "@/lib/types";
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

/* ─── Payment Method Selector (Zomato-style bottom sheet) ─── */
function PaymentSelector({
  open,
  onClose,
  onSelect,
  grandTotal,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  grandTotal: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Choose Payment Method</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Total: <span className="text-emerald-400 font-semibold">₹{grandTotal.toFixed(2)}</span>
          </p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {/* UPI */}
          <button
            onClick={() => onSelect("upi")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-800/50 hover:bg-violet-600/10 hover:border-violet-500/40 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
              <Smartphone size={22} className="text-violet-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white group-hover:text-violet-300 transition">Pay via UPI</p>
              <p className="text-xs text-gray-500">GPay, PhonePe, Paytm & more</p>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={14} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Instant</span>
            </div>
          </button>

          {/* Online Payment (Razorpay) */}
          <button
            onClick={() => onSelect("razorpay")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-800/50 hover:bg-violet-600/10 hover:border-violet-500/40 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <CreditCard size={22} className="text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white group-hover:text-violet-300 transition">Credit / Debit Card</p>
              <p className="text-xs text-gray-500">Visa, Mastercard, Rupay</p>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard size={12} className="text-gray-500" />
              <span className="text-xs text-gray-500">Secure</span>
            </div>
          </button>

          {/* Cash on Delivery */}
          <button
            onClick={() => onSelect("cod")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-800/50 hover:bg-violet-600/10 hover:border-violet-500/40 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center shrink-0">
              <Banknote size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white group-hover:text-violet-300 transition">Cash on Delivery</p>
              <p className="text-xs text-gray-500">Pay when you receive your order</p>
            </div>
            <div className="flex items-center gap-1">
              <Banknote size={12} className="text-gray-500" />
              <span className="text-xs text-gray-500">Cash</span>
            </div>
          </button>
        </div>

        {/* Safe badge */}
        <div className="p-4 pt-0">
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <CreditCard size={12} />
            <span>100% Secure Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function SurplusListingCard({
  clientId,
  clientName,
  clientPhone,
  clientAddress,
}: SurplusListingCardProps) {
  const [listings, setListings] = useState<SurplusListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [otpMap, setOtpMap] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Payment selector state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingClaimListing, setPendingClaimListing] = useState<SurplusListing | null>(null);

  const { isFavorite, toggleFavorite } = useFavorites(clientId);
  const { addItem, isInCart } = useCart();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterFreshness, setFilterFreshness] = useState<string>("all");
  const [filterStorage, setFilterStorage] = useState<string>("all");
  const [filterPriceMax, setFilterPriceMax] = useState<number>(0);
  const [filterDietary, setFilterDietary] = useState<DietaryTag[]>([]);
  const [filterCuisine, setFilterCuisine] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "discount" | "nearest">("newest");
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  const { position: userPosition } = useGeolocation();
  const { initiatePayment, paying } = usePayment();

  useEffect(() => {
    const unsub = listingService.subscribeToAvailableListings((data) => {
      setListings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const restaurantIds = [...new Set(listings.map((l) => l.restaurantId))];
    const unsubs = restaurantIds.map((rid) =>
      reviewService.subscribeToRestaurantRating(rid, (avg, count) => {
        setRatings((prev) => ({ ...prev, [rid]: { avg, count } }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [listings]);

  // Filtered + sorted listings
  const filteredListings = useMemo(() => {
    let result = [...listings];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.foodType.toLowerCase().includes(q) ||
          item.restaurantName.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q)
      );
    }
    if (filterFreshness !== "all") result = result.filter((i) => i.freshnessStatus === filterFreshness);
    if (filterStorage !== "all") result = result.filter((i) => i.storageCondition === filterStorage);
    if (filterPriceMax > 0) result = result.filter((i) => i.surplusPrice <= filterPriceMax);
    if (filterDietary.length > 0) result = result.filter((i) => i.dietaryTags && filterDietary.every(tag => i.dietaryTags!.includes(tag)));
    if (filterCuisine !== "all") result = result.filter((i) => i.cuisineType === filterCuisine);

    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.surplusPrice - b.surplusPrice);
        break;
      case "price_high":
        result.sort((a, b) => b.surplusPrice - a.surplusPrice);
        break;
      case "discount":
        result.sort((a, b) => (1 - b.surplusPrice / b.originalPrice) - (1 - a.surplusPrice / a.originalPrice));
        break;
      case "nearest":
        if (userPosition) {
          result.sort((a, b) => {
            const dA = a.latitude && a.longitude ? haversineDistance(userPosition.latitude, userPosition.longitude, a.latitude, a.longitude) : Infinity;
            const dB = b.latitude && b.longitude ? haversineDistance(userPosition.latitude, userPosition.longitude, b.latitude, b.longitude) : Infinity;
            return dA - dB;
          });
        }
        break;
      default:
        break;
    }
    return result;
  }, [listings, searchQuery, filterFreshness, filterStorage, filterPriceMax, filterDietary, filterCuisine, sortBy, userPosition]);

  const activeFilterCount = [filterFreshness !== "all", filterStorage !== "all", filterPriceMax > 0, filterDietary.length > 0, filterCuisine !== "all"].filter(Boolean).length;
  const clearFilters = () => {
    setFilterFreshness("all");
    setFilterStorage("all");
    setFilterPriceMax(0);
    setFilterDietary([]);
    setFilterCuisine("all");
    setSortBy("newest");
    setSearchQuery("");
  };

  /* Open payment selector before claiming */
  function openPaymentSelector(listing: SurplusListing) {
    if (!clientId) return toast.error("Please log in to order food");
    setPendingClaimListing(listing);
    setPaymentModalOpen(true);
  }

  /* Process claim with selected payment method */
  async function handleClaimWithPayment(method: PaymentMethod) {
    const listing = pendingClaimListing;
    if (!listing) return;
    setPaymentModalOpen(false);
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

      const subtotal = item.itemTotal;
      const clientFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
      const clientTotal = Math.round((subtotal + clientFee) * 100) / 100;

      let payment: PaymentInfo;

      if (method === "cod") {
        // Cash on Delivery — no online payment needed
        payment = { method: "cod", status: "pending" };
      } else {
        // UPI or Razorpay — go through payment gateway
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

        payment = {
          method: method === "upi" ? "upi" : "razorpay",
          status: "paid",
          razorpayOrderId: paymentResult.razorpayOrderId,
          razorpayPaymentId: paymentResult.razorpayPaymentId,
          razorpaySignature: paymentResult.razorpaySignature,
          paidAt: new Date().toISOString(),
        };
      }

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

      setClaimedIds((prev) => new Set(prev).add(listing.id));
      setOtpMap((prev) => ({ ...prev, [listing.id]: orderId.slice(0, 6).toUpperCase() }));
      toast.success(method === "cod" ? "Order placed! Pay on delivery." : "Payment successful! Order placed.");
    } catch (error) {
      console.error("Error claiming food:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setClaimingId(null);
      setPendingClaimListing(null);
    }
  }

  // Keyword-based placeholder image
  function getImageUrl(listing: SurplusListing): string {
    if (listing.imageUrl) return listing.imageUrl;
    const t = (listing.foodType || "").toLowerCase();
    if (t.includes("salad")) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80";
    if (t.includes("bread") || t.includes("bakery")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80";
    if (t.includes("curry") || t.includes("rice")) return "https://images.unsplash.com/photo-1655075459341-a62d7c5a04ce?w=800&q=80";
    if (t.includes("pasta")) return "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80";
    if (t.includes("soup")) return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80";
    if (t.includes("pizza")) return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80";
    if (t.includes("burger")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80";
    if (t.includes("biryani")) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80";
    if (t.includes("dessert") || t.includes("cake") || t.includes("sweet")) return "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80";
    return "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80";
  }

  // Pending listing total for payment modal
  const pendingTotal = pendingClaimListing
    ? Math.round(pendingClaimListing.surplusPrice * pendingClaimListing.quantity * (1 + PLATFORM_FEE_RATE) * 100) / 100
    : 0;

  return (
    <section id="surplus" className="space-y-5">
      {/* ── Zomato-style header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Order food online</h2>
          <p className="text-sm text-gray-400 mt-0.5">{filteredListings.length} surplus deals near you</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search for food, restaurant, cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-gray-900 border border-gray-700/50 pl-11 pr-10 py-3 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 placeholder-gray-500 transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              showFilters
                ? "border-violet-500 bg-violet-600/20 text-violet-300"
                : "border-gray-700/50 bg-gray-900 text-gray-300 hover:border-gray-600"
            }`}
          >
            <Filter size={15} /> Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl bg-gray-900 border border-gray-700/50 px-4 py-3 text-sm font-medium outline-none focus:border-violet-500 text-gray-300 cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low-High</option>
            <option value="price_high">Price: High-Low</option>
            <option value="discount">Best Discount</option>
            <option value="nearest">Nearest</option>
          </select>
        </div>
      </div>

      {/* ── Quick category chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {["All", "Fresh", "Good", "Quick Pickup"].map((chip) => {
          const val = chip === "All" ? "all" : chip === "Quick Pickup" ? "Needs Quick Pickup" : chip;
          const isActive = filterFreshness === val;
          return (
            <button
              key={chip}
              onClick={() => setFilterFreshness(val)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "bg-gray-800/80 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-gray-700/50"
              }`}
            >
              {chip === "Quick Pickup" && <Flame size={13} className="inline mr-1 -mt-0.5" />}
              {chip}
            </button>
          );
        })}
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Storage Condition</label>
            <select
              value={filterStorage}
              onChange={(e) => setFilterStorage(e.target.value)}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-violet-500 text-gray-300"
            >
              <option value="all">All</option>
              <option value="Refrigerated">Refrigerated</option>
              <option value="Room Temp">Room Temp</option>
              <option value="Frozen">Frozen</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Max Price (₹)</label>
            <input
              type="number"
              placeholder="No limit"
              value={filterPriceMax || ""}
              onChange={(e) => setFilterPriceMax(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Cuisine</label>
            <select
              value={filterCuisine}
              onChange={(e) => setFilterCuisine(e.target.value)}
              className="w-full rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-violet-500 text-gray-300"
            >
              <option value="all">All Cuisines</option>
              {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Dietary Preferences</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(DIETARY_TAG_LABELS) as [DietaryTag, string][]).map(([tag, label]) => (
                <button
                  key={tag}
                  onClick={() => setFilterDietary(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    filterDietary.includes(tag)
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-violet-400 hover:text-violet-300 font-medium">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {filteredListings.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-500">
          <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-400">
            {listings.length === 0 ? "No surplus food available right now" : "No items match your search"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {listings.length === 0 ? "Check back soon — new deals appear every few hours!" : "Try adjusting your filters."}
          </p>
          {listings.length > 0 && (
            <button onClick={clearFilters} className="mt-3 text-sm text-violet-400 hover:text-violet-300 font-medium">
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading && <SkeletonListingGrid count={6} />}

      {/* ── Zomato-style cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredListings.map((item) => {
          const isClaimed = claimedIds.has(item.id);
          const isClaiming = claimingId === item.id;
          const discountPct = Math.round((1 - item.surplusPrice / item.originalPrice) * 100);
          const itemSubtotal = Math.round(item.surplusPrice * item.quantity * 100) / 100;
          const platformFee = Math.round(itemSubtotal * PLATFORM_FEE_RATE * 100) / 100;
          const clientTotal = Math.round((itemSubtotal + platformFee) * 100) / 100;
          const savings = Math.round((item.originalPrice * item.quantity - itemSubtotal) * 100) / 100;
          const dist =
            item.latitude && item.longitude && userPosition
              ? haversineDistance(userPosition.latitude, userPosition.longitude, item.latitude, item.longitude)
              : null;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-white/[0.06] bg-gray-900/60 shadow-lg hover:shadow-xl hover:shadow-violet-900/10 overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Image with overlays */}
              <div className="h-44 w-full relative overflow-hidden">
                <img
                  src={getImageUrl(item)}
                  alt={item.foodType}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />

                {/* Top badges */}
                {discountPct > 0 && (
                  <div className="absolute top-3 left-3 bg-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-lg flex items-center gap-1">
                    <Percent size={11} />
                    {discountPct}% OFF
                  </div>
                )}

                {/* Fav button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.restaurantId, item.restaurantName);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
                >
                  <Heart size={16} className={isFavorite(item.restaurantId) ? "text-rose-500 fill-rose-500" : "text-white/80"} />
                </button>

                {/* Bottom info on image */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg">{item.foodType}</h3>
                    <p className="text-xs text-gray-300/90 mt-0.5">{item.restaurantName}</p>
                  </div>
                  {dist !== null && (
                    <span className="shrink-0 text-xs bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg flex items-center gap-1">
                      <Bike size={12} /> {formatDistance(dist)}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                {/* Rating + Freshness row */}
                <div className="flex items-center gap-3 text-sm">
                  {ratings[item.restaurantId] && ratings[item.restaurantId].count > 0 && (
                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                      <Star size={10} className="fill-white" />
                      {ratings[item.restaurantId].avg.toFixed(1)}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                      item.freshnessStatus === "Fresh"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : item.freshnessStatus === "Needs Quick Pickup"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-gray-500/15 text-gray-400"
                    }`}
                  >
                    {item.freshnessStatus === "Needs Quick Pickup" && <Flame size={10} />}
                    {item.freshnessStatus}
                  </span>
                  <span className="text-xs text-gray-500">{item.storageCondition}</span>
                </div>

                {/* Description */}
                {item.description && <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>}

                {/* Dietary Tags */}
                {item.dietaryTags && item.dietaryTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.dietaryTags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-600/15 text-emerald-400 border border-emerald-600/20">
                        {DIETARY_TAG_LABELS[tag]}
                      </span>
                    ))}
                    {item.cuisineType && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-600/15 text-violet-400 border border-violet-600/20">
                        {item.cuisineType}
                      </span>
                    )}
                  </div>
                )}
                {item.allergenInfo && (
                  <p className="text-[10px] text-amber-400/80">⚠️ {item.allergenInfo}</p>
                )}

                {/* Quantity + Time */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    {item.quantity} {item.unit} available
                  </span>
                  {item.availability?.start && item.availability?.end && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {item.availability.start} - {item.availability.end}
                    </span>
                  )}
                </div>

                {/* Map */}
                {item.latitude && item.longitude && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedMapId(expandedMapId === item.id ? null : item.id)}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition"
                    >
                      <MapPin size={12} /> {expandedMapId === item.id ? "Hide Map" : "View on Map"}
                    </button>
                    <a
                      href={getDirectionsUrl(item.latitude, item.longitude, item.restaurantName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition"
                    >
                      <Navigation size={11} /> Directions <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                {expandedMapId === item.id && item.latitude && item.longitude && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <MapCard latitude={item.latitude} longitude={item.longitude} restaurantName={item.restaurantName} userPosition={userPosition} compact />
                  </div>
                )}

                {/* Pricing (Zomato-style) */}
                <div className="mt-auto pt-3 border-t border-gray-800/60">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">₹{item.surplusPrice}</span>
                        {discountPct > 0 && <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500">+₹{platformFee.toFixed(0)} fee</span>
                        {savings > 0 && <span className="text-[11px] text-emerald-400 font-medium">Save ₹{savings.toFixed(0)}</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isClaimed ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400">
                          <CheckIcon size={15} /> Ordered
                        </span>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Ref: <span className="text-violet-300 font-mono">{otpMap[item.id]}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addItem(item)}
                          disabled={isInCart(item.id)}
                          className={`p-2.5 rounded-xl text-sm font-semibold transition border ${
                            isInCart(item.id)
                              ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-400"
                              : "border-gray-700 bg-gray-800 text-gray-300 hover:border-violet-500 hover:text-violet-400"
                          }`}
                          title={isInCart(item.id) ? "In cart" : "Add to cart"}
                        >
                          {isInCart(item.id) ? <CheckIcon size={16} /> : <Plus size={16} />}
                        </button>
                        <button
                          className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-bold transition shadow-lg shadow-violet-900/30 disabled:opacity-50 flex items-center gap-1.5"
                          onClick={() => openPaymentSelector(item)}
                          disabled={isClaiming || paying}
                        >
                          {isClaiming || (paying && claimingId === item.id) ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Processing
                            </span>
                          ) : (
                            <>Order ₹{clientTotal}</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment method selector modal */}
      <PaymentSelector
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPendingClaimListing(null);
        }}
        onSelect={handleClaimWithPayment}
        grandTotal={pendingTotal}
      />
    </section>
  );
}
