"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, CheckCircle2, Users, AlertTriangle, Bell,
  Calendar as CalendarIcon, Clock, Plus, X, Check, BarChart2, Menu, QrCode, Keyboard
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { statsService, orderService } from "@/lib/firebase-services";
import type { Order } from "@/lib/types";
import { Toaster, toast } from "sonner";

import NotificationBell from "@/components/NotificationBell";
import EventIntegration from "@/components/restuarantDashboardComp/Event_integration";
import AddSurplusfood from "@/components/restuarantDashboardComp/AddSurplusfood";
import Livelisting from "@/components/restuarantDashboardComp/Livelistings";
import AcceptAndReject from "@/components/restuarantDashboardComp/AcceptAndReject";
import RestaurantOrderManager from "@/components/restuarantDashboardComp/RestaurantOrderManager";
import RestaurantAnalytics from "@/components/restuarantDashboardComp/RestaurantAnalytics";
import dynamic from "next/dynamic";

const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false });

/* ---------------------------------- UI ---------------------------------- */
export default function RestaurantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  // Live stats
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    foodSavedKg: 0,
    peopleServed: 0,
  });

  // All completed orders for OTP verification
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  // OTP verify modal
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [verifyMode, setVerifyMode] = useState<"manual" | "scan">("manual");

  const today = new Date();

  // Calendar props
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => (i < firstDay ? "" : String(i - firstDay + 1)));
  const eventPrompts = [
    { day: 5, title: "Seminar @ Hall A", expect: "Snacks surplus expected" },
    { day: 14, title: "Tech Fest", expect: "High surplus likely" },
    { day: 22, title: "Alumni Meet Dinner", expect: "Catered dinner surplus" },
  ];

  // Dummy setForm for event integration compatibility
  const [form, setForm] = useState<any>({});

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
      } else {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists() && snap.data().role === "business") {
          setUser(u);
          setDisplayName(snap.data().displayName || u.displayName || "Restaurant");
        } else {
          router.push("/Clientdashboard");
        }
      }
    });
    return () => unsub();
  }, [router]);

  // Subscribe to live stats
  useEffect(() => {
    if (!user) return;
    const unsub = statsService.subscribeToRestaurantStats(user.uid, setStats);
    return () => unsub();
  }, [user]);

  // Subscribe to orders for OTP verification
  useEffect(() => {
    if (!user) return;
    const unsub = orderService.subscribeToRestaurantOrders(user.uid, (orders) => {
      setCompletedOrders(orders.filter(o => o.status === "out_for_delivery" || o.status === "ready"));
    });
    return () => unsub();
  }, [user]);

  const openVerify = (order: Order) => {
    setVerifyTarget(order);
    setOtpInput("");
    setVerifyMode("manual");
    setVerifyOpen(true);
  };

  const confirmVerify = async () => {
    if (!verifyTarget) return;
    if (otpInput === verifyTarget.otp) {
      await orderService.updateOrderStatus(verifyTarget.id, "completed", verifyTarget);
      toast.success("Order verified and completed!");
      setVerifyOpen(false);
    } else {
      toast.error("Invalid OTP. Try again.");
    }
  };

  const handleQRScan = async (scannedOrderId: string, scannedOtp: string) => {
    if (!verifyTarget) return;
    if (scannedOrderId === verifyTarget.id && scannedOtp === verifyTarget.otp) {
      await orderService.updateOrderStatus(verifyTarget.id, "completed", verifyTarget);
      toast.success("QR verified — order completed!");
      setVerifyOpen(false);
    } else if (scannedOrderId !== verifyTarget.id) {
      toast.error("QR code does not match this order.");
    } else {
      toast.error("Invalid OTP in QR code.");
    }
  };

  if (!user) return <p className="text-white p-8">Loading...</p>;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Toaster theme="dark" position="top-right" />

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:static lg:translate-x-0 inset-y-0 left-0 w-72 bg-gray-900/95 backdrop-blur border-r border-gray-800 transition-transform duration-300 z-40`}
      >
        <div className="h-16 px-5 flex items-center gap-2 border-b border-gray-800">
          <LayoutDashboard className="text-violet-400" />
          <span className="font-semibold">Restaurant Dashboard</span>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { id: "overview", name: "Overview", icon: LayoutDashboard },
            { id: "add", name: "Add Surplus Food", icon: Plus },
            { id: "listings", name: "Live Food Listings", icon: Package },
            { id: "incoming", name: "Incoming Orders", icon: CheckCircle2 },
            { id: "active-orders", name: "Active Orders", icon: Clock },
            { id: "verify", name: "OTP Verification", icon: Check },
            { id: "analytics", name: "Analytics", icon: BarChart2 },
            { id: "events", name: "Event Integration", icon: CalendarIcon },
          ].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => { setActiveSection(s.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeSection === s.id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-600/30"
                  : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <s.icon size={18} className={activeSection === s.id ? "text-violet-400" : "text-gray-500"} />
              {s.name}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-gray-900/70 backdrop-blur border-b border-gray-800 flex items-center justify-between px-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition" onClick={() => setSidebarOpen((s) => !s)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell userId={user.uid} />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-600/70 flex items-center justify-center text-xs uppercase">
                {displayName[0] || "R"}
              </div>
              <span className="text-sm text-gray-300 hidden sm:inline">{displayName}</span>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="bg-violet-500 px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-10 max-w-7xl mx-auto w-full">
          {/* ---- Overview ---- */}
          <section id="overview" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Dashboard Overview</h2>
              <span className="text-xs text-gray-400">Today • {today.toDateString()}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI
                icon={<Package className="text-violet-400" />}
                label="Active Listings"
                value={stats.activeListings}
              />
              <KPI
                icon={<CheckCircle2 className="text-emerald-400" />}
                label="Total Listings"
                value={stats.totalListings}
              />
              <KPI
                icon={<Clock className="text-amber-400" />}
                label="Pending Orders"
                value={stats.pendingOrders}
              />
              <KPI
                icon={<Users className="text-blue-400" />}
                label="People Served"
                value={stats.peopleServed}
              />
              <KPI
                icon={<CheckCircle2 className="text-emerald-400" />}
                label="Completed Orders"
                value={stats.completedOrders}
              />
              <KPI
                icon={<Package className="text-violet-400" />}
                label="Total Orders"
                value={stats.totalOrders}
              />
              <KPI
                icon={<CheckCircle2 className="text-emerald-400" />}
                label="Total Earnings"
                value={`₹${stats.totalEarnings.toFixed(0)}`}
              />
              <KPI
                icon={<AlertTriangle className="text-rose-400" />}
                label="Food Saved (kg)"
                value={stats.foodSavedKg}
              />
            </div>
          </section>

          {/* ---- Add Surplus Food ---- */}
          <AddSurplusfood uid={user.uid} restaurantName={displayName} />

          {/* ---- Live Food Listings ---- */}
          <Livelisting restaurantId={user.uid} />

          {/* ---- Incoming Orders (Accept/Reject) ---- */}
          <div id="incoming">
            <AcceptAndReject restaurantId={user.uid} />
          </div>

          {/* ---- Active Orders (Status Progression) ---- */}
          <div id="active-orders">
            <RestaurantOrderManager restaurantId={user.uid} />
          </div>

          {/* ---- OTP Verification for Ready/Delivery Orders ---- */}
          <section id="verify" className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
            <h3 className="text-lg font-semibold mb-4">OTP Verification</h3>
            {completedOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders ready for OTP verification.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Order #{order.id.slice(0, 6)}</div>
                      <span className="text-xs bg-amber-600/20 text-amber-300 px-2 py-0.5 rounded border border-amber-700/40">
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-300">
                      <div>{order.clientName}</div>
                      <div className="text-gray-400">
                        {order.items?.map(i => `${i.foodType} ×${i.quantity}`).join(", ")}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs hover:bg-white/5"
                        onClick={() => openVerify(order)}
                      >
                        <Keyboard size={14} /> Enter OTP
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-violet-700/40 bg-violet-600/10 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-600/20"
                        onClick={() => {
                          setVerifyTarget(order);
                          setVerifyMode("scan");
                          setVerifyOpen(true);
                        }}
                      >
                        <QrCode size={14} /> Scan QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- Analytics ---- */}
          <RestaurantAnalytics restaurantId={user.uid} />

          {/* ---- Event Integration ---- */}
          <EventIntegration
            today={today}
            year={year}
            cells={cells}
            eventPrompts={eventPrompts}
            setForm={setForm}
          />
        </main>
      </div>

      {/* OTP Verify Modal */}
      {verifyOpen && verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Verify Pickup — #{verifyTarget.id.slice(0, 6)}</div>
              <button className="p-1 rounded hover:bg-white/5" onClick={() => setVerifyOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="text-sm text-gray-300 mb-3">
              {verifyTarget.clientName} — {verifyTarget.items?.map(i => i.foodType).join(", ")}
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-lg bg-gray-800 border border-gray-700 p-0.5 mb-4">
              <button
                onClick={() => setVerifyMode("manual")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition ${
                  verifyMode === "manual" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Keyboard size={12} /> Enter OTP
              </button>
              <button
                onClick={() => setVerifyMode("scan")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition ${
                  verifyMode === "scan" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <QrCode size={12} /> Scan QR
              </button>
            </div>

            {verifyMode === "manual" ? (
              <>
                <div>
                  <label className="text-xs text-gray-400">Enter 6-digit OTP from client</label>
                  <input
                    className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
                    placeholder="6-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                  />
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm"
                    onClick={confirmVerify}
                  >
                    <Check size={14} /> Verify & Complete
                  </button>
                </div>
              </>
            ) : (
              <QRScanner
                onScan={handleQRScan}
                onClose={() => setVerifyMode("manual")}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Small Components ---- */

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/5">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-gray-400">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
