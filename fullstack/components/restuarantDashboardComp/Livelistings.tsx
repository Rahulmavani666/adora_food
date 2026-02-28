


"use client";

import { useEffect, useState } from "react";
import { listingService } from "@/lib/firebase-services";
import type { SurplusListing } from "@/lib/types";
import { Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Livelisting({ restaurantId }: { restaurantId: string }) {
  const [listings, setListings] = useState<SurplusListing[]>([]);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = listingService.subscribeToRestaurantListings(restaurantId, setListings);
    return () => unsub();
  }, [restaurantId]);

  const handleDelete = async (id: string) => {
    try {
      await listingService.deleteListing(id);
      toast.success("Listing deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete listing");
    }
  };

  return (
    <section id="listings" className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Food Listings</h3>
        <span className="text-xs text-gray-400">{listings.length} listing(s)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">Qty</th>
              <th className="py-2 pr-4">Freshness</th>
              <th className="py-2 pr-4">Original</th>
              <th className="py-2 pr-4">Surplus Price</th>
              <th className="py-2 pr-4">Discount</th>
              <th className="py-2 pr-4">Storage</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const discountPct = l.originalPrice > 0 ? Math.round((1 - l.surplusPrice / l.originalPrice) * 100) : 0;
              return (
              <tr key={l.id} className="border-b border-gray-900/60">
                <td className="py-3 pr-4 font-medium">{l.foodType}</td>
                <td className="py-3 pr-4">{l.quantity} {l.unit}</td>
                <td className="py-3 pr-4">
                  <Badge tone={l.freshnessStatus === "Fresh" ? "emerald" : l.freshnessStatus === "Good" ? "sky" : "amber"}>
                    {l.freshnessStatus}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-gray-400 line-through">₹{l.originalPrice ?? "—"}</td>
                <td className="py-3 pr-4 text-emerald-400 font-semibold">₹{l.surplusPrice ?? "—"}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-medium text-emerald-300 bg-emerald-600/20 px-2 py-0.5 rounded border border-emerald-700/40">
                    {discountPct}% off
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-400">{l.storageCondition}</td>
                <td className="py-3 pr-4">
                  <Badge tone={l.status === "available" ? "emerald" : l.status === "claimed" ? "violet" : "rose"}>
                    {l.status}
                  </Badge>
                </td>
                <td className="py-3 flex items-center gap-2">
                  <button
                    className="p-2 rounded hover:bg-white/5 text-rose-400"
                    title="Delete"
                    onClick={() => handleDelete(l.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
              );
            })}
            {listings.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-500">No listings yet. Add surplus food above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Badge({ children, tone = "violet" }: { children: React.ReactNode; tone?: "violet" | "emerald" | "amber" | "rose" | "sky" }) {
  const map: Record<string, string> = {
    violet: "bg-violet-600/20 text-violet-300 border-violet-700/40",
    emerald: "bg-emerald-600/20 text-emerald-300 border-emerald-700/40",
    amber: "bg-amber-600/20 text-amber-300 border-amber-700/40",
    rose: "bg-rose-600/20 text-rose-300 border-rose-700/40",
    sky: "bg-sky-600/20 text-sky-300 border-sky-700/40",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded border ${map[tone]}`}>{children}</span>;
}
