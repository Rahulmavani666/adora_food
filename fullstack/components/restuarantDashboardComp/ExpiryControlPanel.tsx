"use client";

import { useEffect, useState, useMemo } from "react";
import { listingService } from "@/lib/firebase-services";
import type { SurplusListing } from "@/lib/types";
import { Trash2, AlertTriangle, Clock, CheckCircle2, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";

interface ExpiryControlPanelProps {
  restaurantId: string;
}

type FilterMode = "all" | "expired_window" | "stale_24h" | "active";

export default function ExpiryControlPanel({ restaurantId }: ExpiryControlPanelProps) {
  const [listings, setListings] = useState<SurplusListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<string | null>(null);
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = listingService.subscribeToRestaurantListings(restaurantId, setListings);
    return () => unsub();
  }, [restaurantId]);

  // Compute expiry info for each listing
  const listingsWithExpiry = useMemo(() => {
    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    return listings.map((l) => {
      const endTime = l.availability?.end;
      const addedMs = l.dateAdded?.toMillis?.() ?? 0;
      const ageHours = addedMs > 0 ? (Date.now() - addedMs) / (1000 * 60 * 60) : 0;

      const isPastWindow = !!(endTime && endTime < nowHHMM);
      const isStale24h = ageHours > 24;
      const isAlreadyExpired = l.status === "expired" || l.status === "removed";
      const isActive = l.status === "available";

      let expiryTag: "active" | "past_window" | "stale" | "already_expired";
      if (isAlreadyExpired) {
        expiryTag = "already_expired";
      } else if (isPastWindow) {
        expiryTag = "past_window";
      } else if (isStale24h) {
        expiryTag = "stale";
      } else {
        expiryTag = "active";
      }

      return { ...l, isPastWindow, isStale24h, isAlreadyExpired, isActive, expiryTag, ageHours };
    });
  }, [listings]);

  // Filtered view
  const filtered = useMemo(() => {
    switch (filterMode) {
      case "expired_window":
        return listingsWithExpiry.filter((l) => l.expiryTag === "past_window");
      case "stale_24h":
        return listingsWithExpiry.filter((l) => l.expiryTag === "stale");
      case "active":
        return listingsWithExpiry.filter((l) => l.expiryTag === "active");
      default:
        return listingsWithExpiry;
    }
  }, [listingsWithExpiry, filterMode]);

  // Counts for badges
  const counts = useMemo(() => {
    let pastWindow = 0, stale = 0, active = 0, alreadyExpired = 0;
    for (const l of listingsWithExpiry) {
      if (l.expiryTag === "past_window") pastWindow++;
      else if (l.expiryTag === "stale") stale++;
      else if (l.expiryTag === "active") active++;
      else alreadyExpired++;
    }
    return { pastWindow, stale, active, alreadyExpired, needsAttention: pastWindow + stale };
  }, [listingsWithExpiry]);

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const removable = filtered.filter((l) => l.status === "available" || l.status === "claimed");
    if (selectedIds.size === removable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(removable.map((l) => l.id)));
    }
  };

  // Single remove
  const handleExpire = async (id: string) => {
    setRemoving(id);
    try {
      await listingService.updateListing(id, { status: "expired" });
      toast.success("Listing marked as expired");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to expire listing");
    } finally {
      setRemoving(null);
    }
  };

  // Single permanent delete
  const handleDelete = async (id: string) => {
    setRemoving(id);
    try {
      await listingService.deleteListing(id);
      toast.success("Listing permanently deleted");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete listing");
    } finally {
      setRemoving(null);
    }
  };

  // Bulk expire selected
  const handleBulkExpire = async () => {
    if (selectedIds.size === 0) return;
    setBulkRemoving(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await listingService.updateListing(id, { status: "expired" });
        success++;
      } catch {
        failed++;
      }
    }
    setBulkRemoving(false);
    setSelectedIds(new Set());
    if (success > 0) toast.success(`${success} listing(s) marked as expired`);
    if (failed > 0) toast.error(`${failed} listing(s) failed to expire`);
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkRemoving(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await listingService.deleteListing(id);
        success++;
      } catch {
        failed++;
      }
    }
    setBulkRemoving(false);
    setSelectedIds(new Set());
    if (success > 0) toast.success(`${success} listing(s) permanently deleted`);
    if (failed > 0) toast.error(`${failed} listing(s) failed to delete`);
  };

  // Re-activate an expired listing
  const handleReactivate = async (id: string) => {
    setRemoving(id);
    try {
      await listingService.updateListing(id, { status: "available" });
      toast.success("Listing reactivated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reactivate listing");
    } finally {
      setRemoving(null);
    }
  };

  function formatAge(hours: number) {
    if (hours < 1) return `${Math.round(hours * 60)}m ago`;
    if (hours < 24) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  return (
    <section id="expiry-control" className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Expiry Control Panel</h3>
          {counts.needsAttention > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-600/20 px-2.5 py-1 rounded-full border border-amber-700/40">
              <AlertTriangle size={12} /> {counts.needsAttention} need attention
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{listings.length} total listing(s)</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { key: "all", label: "All", count: listingsWithExpiry.length },
          { key: "expired_window", label: "Past Pickup Window", count: counts.pastWindow },
          { key: "stale_24h", label: "Older than 24h", count: counts.stale },
          { key: "active", label: "Active", count: counts.active },
        ] as { key: FilterMode; label: string; count: number }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilterMode(tab.key); setSelectedIds(new Set()); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition ${
              filterMode === tab.key
                ? "bg-violet-600/20 text-violet-300 border-violet-600/40"
                : "bg-gray-800/60 text-gray-400 border-gray-700/50 hover:text-white hover:border-gray-600"
            }`}
          >
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              filterMode === tab.key ? "bg-violet-600/30 text-violet-200" : "bg-gray-700/60 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {filtered.filter((l) => l.status === "available" || l.status === "claimed").length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-800/40 border border-gray-800">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              className="accent-violet-500 w-4 h-4"
              checked={selectedIds.size > 0 && selectedIds.size === filtered.filter((l) => l.status === "available" || l.status === "claimed").length}
              onChange={toggleSelectAll}
            />
            Select all ({filtered.filter((l) => l.status === "available" || l.status === "claimed").length})
          </label>
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-violet-300">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkExpire}
                disabled={bulkRemoving}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-amber-600/20 text-amber-300 border border-amber-700/40 hover:bg-amber-600/30 transition disabled:opacity-50"
              >
                <Clock size={12} /> {bulkRemoving ? "Expiring…" : "Expire Selected"}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkRemoving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-rose-600/20 text-rose-300 border border-rose-700/40 hover:bg-rose-600/30 transition disabled:opacity-50"
              >
                <Trash2 size={12} /> {bulkRemoving ? "Deleting…" : "Delete Selected"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Listing Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-2 w-8"></th>
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">Qty</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">Pickup Window</th>
              <th className="py-2 pr-4">Age</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Expiry Flag</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const canSelect = l.status === "available" || l.status === "claimed";
              return (
                <tr key={l.id} className={`border-b border-gray-900/60 ${l.expiryTag === "past_window" || l.expiryTag === "stale" ? "bg-amber-900/5" : ""}`}>
                  {/* Checkbox */}
                  <td className="py-3 pr-2">
                    {canSelect && (
                      <input
                        type="checkbox"
                        className="accent-violet-500 w-4 h-4"
                        checked={selectedIds.has(l.id)}
                        onChange={() => toggleSelect(l.id)}
                      />
                    )}
                  </td>
                  {/* Item */}
                  <td className="py-3 pr-4 font-medium">{l.foodType}</td>
                  {/* Qty */}
                  <td className="py-3 pr-4">{l.quantity} {l.unit}</td>
                  {/* Price */}
                  <td className="py-3 pr-4">
                    <span className="text-gray-400 line-through mr-1">₹{l.originalPrice}</span>
                    <span className="text-emerald-400 font-semibold">₹{l.surplusPrice}</span>
                  </td>
                  {/* Pickup Window */}
                  <td className="py-3 pr-4 text-gray-400">
                    {l.availability?.start && l.availability?.end
                      ? `${l.availability.start} – ${l.availability.end}`
                      : "—"}
                  </td>
                  {/* Age */}
                  <td className="py-3 pr-4 text-gray-400">
                    {l.ageHours > 0 ? formatAge(l.ageHours) : "—"}
                  </td>
                  {/* Current Status */}
                  <td className="py-3 pr-4">
                    <StatusBadge status={l.status} />
                  </td>
                  {/* Expiry Flag */}
                  <td className="py-3 pr-4">
                    <ExpiryFlag tag={l.expiryTag} />
                  </td>
                  {/* Actions */}
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      {canSelect && (
                        <>
                          <button
                            onClick={() => handleExpire(l.id)}
                            disabled={removing === l.id}
                            title="Mark as expired"
                            className="p-1.5 rounded hover:bg-amber-600/20 text-amber-400 transition disabled:opacity-50"
                          >
                            <Clock size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            disabled={removing === l.id}
                            title="Permanently delete"
                            className="p-1.5 rounded hover:bg-rose-600/20 text-rose-400 transition disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {l.isAlreadyExpired && (
                        <>
                          <button
                            onClick={() => handleReactivate(l.id)}
                            disabled={removing === l.id}
                            title="Reactivate listing"
                            className="p-1.5 rounded hover:bg-emerald-600/20 text-emerald-400 transition disabled:opacity-50"
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            disabled={removing === l.id}
                            title="Permanently delete"
                            className="p-1.5 rounded hover:bg-rose-600/20 text-rose-400 transition disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">
                  {filterMode === "all" ? "No listings yet." : "No listings match this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---- Helper Components ---- */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-emerald-600/20 text-emerald-300 border-emerald-700/40",
    claimed: "bg-violet-600/20 text-violet-300 border-violet-700/40",
    expired: "bg-amber-600/20 text-amber-300 border-amber-700/40",
    removed: "bg-rose-600/20 text-rose-300 border-rose-700/40",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded border ${styles[status] ?? styles.removed}`}>
      {status}
    </span>
  );
}

function ExpiryFlag({ tag }: { tag: string }) {
  switch (tag) {
    case "past_window":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-300 bg-amber-600/15 px-2 py-0.5 rounded border border-amber-700/30">
          <AlertTriangle size={11} /> Past window
        </span>
      );
    case "stale":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-orange-300 bg-orange-600/15 px-2 py-0.5 rounded border border-orange-700/30">
          <Clock size={11} /> &gt;24h old
        </span>
      );
    case "already_expired":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-700/30 px-2 py-0.5 rounded border border-gray-700/30">
          <CheckCircle2 size={11} /> Expired
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-600/15 px-2 py-0.5 rounded border border-emerald-700/30">
          <CheckCircle2 size={11} /> Fresh
        </span>
      );
  }
}
