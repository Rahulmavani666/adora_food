"use client";

import React, { useState, useEffect } from "react";
import {
  Users, ShoppingBag, Leaf, DollarSign, BarChart2,
  AlertTriangle, CheckCircle2, XCircle, Clock,
  TrendingUp, Utensils, RefreshCw, FileText,
} from "lucide-react";
import {
  adminService, refundService,
} from "@/lib/firebase-services";
import type { Order, RefundRequest } from "@/lib/types";
import { REFUND_REASON_LABELS } from "@/lib/types";
import { toast, Toaster } from "sonner";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "orders" | "refunds">("overview");

  // Platform stats
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalClients: 0,
    totalOrders: 0, completedOrders: 0,
    totalRevenue: 0, platformEarnings: 0,
    totalFoodSavedKg: 0, co2Reduced: 0,
    totalListings: 0, activeListings: 0, pendingRefunds: 0,
  });

  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);

  useEffect(() => {
    const unsubs = [
      adminService.subscribeToPlatformStats(setStats),
      adminService.subscribeToAllUsers(setUsers),
      adminService.subscribeToAllOrders(setOrders),
      refundService.subscribeToAllRefunds(setRefunds),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const handleRefundAction = async (refundId: string, action: "approved" | "rejected", note?: string) => {
    try {
      await refundService.updateRefundStatus(refundId, action, note || (action === "approved" ? "Approved by admin" : "Rejected by admin"));
      toast.success(`Refund ${action}`);
    } catch {
      toast.error("Failed to update refund");
    }
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart2 },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "orders" as const, label: "Orders", icon: ShoppingBag },
    { id: "refunds" as const, label: `Refunds${stats.pendingRefunds > 0 ? ` (${stats.pendingRefunds})` : ""}`, icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Toaster theme="dark" position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="text-violet-400" size={22} />
            Admin Dashboard
          </h1>
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ─── Overview Tab ─── */}
        {activeTab === "overview" && (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<Users className="text-violet-400" />} label="Total Users" value={stats.totalUsers} sub={`${stats.totalRestaurants} restaurants, ${stats.totalClients} clients`} />
              <StatCard icon={<ShoppingBag className="text-emerald-400" />} label="Total Orders" value={stats.totalOrders} sub={`${stats.completedOrders} completed`} />
              <StatCard icon={<DollarSign className="text-amber-400" />} label="Platform Earnings" value={`₹${stats.platformEarnings.toFixed(0)}`} sub={`From ₹${stats.totalRevenue.toFixed(0)} total revenue`} />
              <StatCard icon={<Leaf className="text-green-400" />} label="Food Saved" value={`${stats.totalFoodSavedKg} kg`} sub={`${stats.co2Reduced} kg CO₂ reduced`} />
              <StatCard icon={<Utensils className="text-blue-400" />} label="Total Listings" value={stats.totalListings} sub={`${stats.activeListings} active now`} />
              <StatCard icon={<TrendingUp className="text-violet-400" />} label="Avg Order Value" value={stats.completedOrders > 0 ? `₹${(stats.totalRevenue / stats.completedOrders).toFixed(0)}` : "₹0"} sub="Per completed order" />
              <StatCard icon={<AlertTriangle className="text-amber-400" />} label="Pending Refunds" value={stats.pendingRefunds} sub="Needs review" />
              <StatCard icon={<CheckCircle2 className="text-emerald-400" />} label="Completion Rate" value={stats.totalOrders > 0 ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}%` : "0%"} sub="Orders completed" />
            </div>
          </>
        )}

        {/* ─── Users Tab ─── */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/70 overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold">All Users ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="text-left p-3 pl-5">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Org</th>
                    <th className="text-left p-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition">
                      <td className="p-3 pl-5 font-medium">{u.displayName || u.fullName || "—"}</td>
                      <td className="p-3 text-gray-400">{u.email || "—"}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === "business" ? "bg-violet-600/20 text-violet-300" : "bg-blue-600/20 text-blue-300"
                        }`}>
                          {u.role === "business" ? "Restaurant" : "Client"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">{u.phone || u.phoneNumber || "—"}</td>
                      <td className="p-3 text-gray-400">{u.orgName || "—"}</td>
                      <td className="p-3 text-gray-500 text-xs">{u.createdAt?.toDate?.()?.toLocaleDateString?.() || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Orders Tab ─── */}
        {activeTab === "orders" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/70 overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold">All Orders ({orders.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="text-left p-3 pl-5">Order ID</th>
                    <th className="text-left p-3">Client</th>
                    <th className="text-left p-3">Restaurant</th>
                    <th className="text-left p-3">Items</th>
                    <th className="text-left p-3">Total</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 100).map(o => (
                    <tr key={o.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition">
                      <td className="p-3 pl-5 font-mono text-xs text-violet-300">#{o.id.slice(0, 8)}</td>
                      <td className="p-3">{o.clientName}</td>
                      <td className="p-3 text-gray-400">{o.restaurantName}</td>
                      <td className="p-3 text-gray-400 text-xs">{o.items?.map(i => i.foodType).join(", ")}</td>
                      <td className="p-3 font-medium">₹{(o.clientTotal || 0).toFixed(0)}</td>
                      <td className="p-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="p-3 text-xs text-gray-400">{o.payment?.method || "—"} / {o.payment?.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Refunds Tab ─── */}
        {activeTab === "refunds" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Refund Requests ({refunds.length})</h2>
            {refunds.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
                <p>No refund requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {refunds.map(r => (
                  <div key={r.id} className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-violet-300">Order #{r.orderId.slice(0, 8)}</span>
                          <RefundStatusBadge status={r.status} />
                        </div>
                        <p className="text-sm font-medium">{r.clientName} &rarr; {r.restaurantName}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          <span className="text-amber-400">{REFUND_REASON_LABELS[r.reason]}</span>
                          {r.description && ` — "${r.description}"`}
                        </p>
                        <p className="text-lg font-bold text-white mt-2">₹{r.amount.toFixed(0)}</p>
                        {r.adminNote && <p className="text-xs text-gray-500 mt-1">Admin: {r.adminNote}</p>}
                      </div>
                      {r.status === "requested" && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleRefundAction(r.id, "approved")}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleRefundAction(r.id, "rejected")}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium transition"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    placed: "bg-yellow-600/20 text-yellow-300",
    accepted: "bg-blue-600/20 text-blue-300",
    preparing: "bg-orange-600/20 text-orange-300",
    ready: "bg-emerald-600/20 text-emerald-300",
    out_for_delivery: "bg-purple-600/20 text-purple-300",
    completed: "bg-gray-600/20 text-gray-300",
    rejected: "bg-red-600/20 text-red-300",
    cancelled: "bg-red-600/20 text-red-300",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-600/20 text-gray-300"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function RefundStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    requested: "bg-amber-600/20 text-amber-300 border-amber-600/30",
    approved: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
    rejected: "bg-red-600/20 text-red-300 border-red-600/30",
    resolved: "bg-gray-600/20 text-gray-300 border-gray-600/30",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status] || ""}`}>
      {status}
    </span>
  );
}
