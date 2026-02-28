"use client";
import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Calendar, DollarSign, Star } from "lucide-react";
import { orderService, reviewService } from "@/lib/firebase-services";
import type { Order, Review } from "@/lib/types";

interface DayStat {
  date: string;
  orders: number;
  earnings: number;
  items: number;
}

export default function RestaurantAnalytics({ restaurantId }: { restaurantId: string }) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [period, setPeriod] = useState<"7" | "30">("7");

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = orderService.subscribeToRestaurantOrders(restaurantId, setAllOrders);
    return () => unsub();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub1 = reviewService.subscribeToRestaurantReviews(restaurantId, setReviews);
    const unsub2 = reviewService.subscribeToRestaurantRating(restaurantId, (avg, count) => {
      setAvgRating(avg);
      setReviewCount(count);
    });
    return () => { unsub1(); unsub2(); };
  }, [restaurantId]);

  // Compute daily stats
  const days = parseInt(period);
  const now = new Date();
  const dailyStats: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOrders = allOrders.filter(o => {
      const created = o.createdAt?.toDate?.();
      return created && created.toISOString().split("T")[0] === dateStr;
    });
    dailyStats.push({
      date: dateStr,
      orders: dayOrders.length,
      earnings: dayOrders.reduce((s, o) => s + (o.restaurantEarning || 0), 0),
      items: dayOrders.reduce((s, o) => s + (o.items?.length || 0), 0),
    });
  }

  const maxOrders = Math.max(...dailyStats.map(d => d.orders), 1);
  const totalEarnings = dailyStats.reduce((s, d) => s + d.earnings, 0);
  const totalOrders = dailyStats.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;

  // Popular items
  const itemCounts: Record<string, number> = {};
  allOrders.forEach(o => o.items?.forEach(i => {
    itemCounts[i.foodType] = (itemCounts[i.foodType] || 0) + i.quantity;
  }));
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <section id="analytics" className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart2 size={18} className="text-violet-400" />
          Analytics
        </h3>
        <div className="flex rounded-lg bg-gray-800 border border-gray-700 p-0.5">
          <button
            onClick={() => setPeriod("7")}
            className={`px-3 py-1 text-xs rounded-md transition ${period === "7" ? "bg-violet-600 text-white" : "text-gray-400"}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod("30")}
            className={`px-3 py-1 text-xs rounded-md transition ${period === "30" ? "bg-violet-600 text-white" : "text-gray-400"}`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniCard icon={<TrendingUp size={16} />} label="Orders" value={totalOrders} color="text-violet-400" />
        <MiniCard icon={<DollarSign size={16} />} label="Earnings" value={`₹${totalEarnings.toFixed(0)}`} color="text-emerald-400" />
        <MiniCard icon={<DollarSign size={16} />} label="Avg Order" value={`₹${avgOrderValue.toFixed(0)}`} color="text-amber-400" />
        <MiniCard icon={<Star size={16} />} label="Rating" value={reviewCount > 0 ? `${avgRating.toFixed(1)} ⭐` : "No reviews"} color="text-amber-400" />
      </div>

      {/* Bar chart */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Orders per day</p>
        <div className="flex items-end gap-1 h-32">
          {dailyStats.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-gray-500">{d.orders || ""}</span>
              <div
                className="w-full rounded-t bg-violet-600/70 transition-all"
                style={{ height: `${(d.orders / maxOrders) * 100}%`, minHeight: d.orders > 0 ? "4px" : "1px" }}
              />
              <span className="text-[8px] text-gray-600 rotate-0">
                {new Date(d.date).getDate()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top items + Reviews summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Top Items</p>
          {topItems.length === 0 ? (
            <p className="text-sm text-gray-500">No order data yet.</p>
          ) : (
            <div className="space-y-2">
              {topItems.map(([name, count], i) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    <span className="text-gray-500 mr-2">#{i + 1}</span>
                    {name}
                  </span>
                  <span className="text-xs text-gray-500">{count} units</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-gray-800 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Recent Reviews</p>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="text-sm">
                  <div className="flex items-center gap-1">
                    {"⭐".repeat(r.rating)}
                    <span className="text-gray-500 text-xs ml-1">{r.clientName}</span>
                  </div>
                  {r.comment && <p className="text-xs text-gray-400 mt-0.5">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-3">
      <div className={`${color} mb-1`}>{icon}</div>
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
