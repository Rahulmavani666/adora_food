"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Leaf,
  Package,
  Truck,
  Users,
  Activity,
  BarChart2,
  IndianRupee,
  ShoppingCart,
  Heart,
  Trophy,
  Gift,
  Menu,
  X,
} from "lucide-react";

import ClientEvent from "@/components/clientDashboardComp/ClientEvent";
import SurplusListingCard from "@/components/clientDashboardComp/SupluslistingCards";
import ClientOrders from "@/components/clientDashboardComp/ClientOrders";
import FavoriteRestaurants from "@/components/clientDashboardComp/FavoriteRestaurants";
import StreaksAndBadges from "@/components/clientDashboardComp/StreaksAndBadges";
import ReferralSection from "@/components/clientDashboardComp/ReferralSection";
import CartDrawer from "@/components/clientDashboardComp/CartDrawer";
import NotificationBell from "@/components/NotificationBell";
import { CartProvider } from "@/hooks/useCart";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { statsService } from "@/lib/firebase-services";
import { Toaster } from "sonner";

/** ---------- Page ---------- */
export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("impact");

  // Live stats from Firestore
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    totalSaved: 0,
    foodRescuedKg: 0,
    co2Reduced: 0,
  });

  const sections = [
    { id: "impact", name: "Impact Summary", icon: Activity },
    { id: "surplus", name: "Available Food", icon: Package },
    { id: "favorites", name: "Favorites", icon: Heart },
    { id: "orders", name: "My Orders", icon: ShoppingCart },
    { id: "streaks", name: "Streaks & Badges", icon: Trophy },
    { id: "referral", name: "Referrals", icon: Gift },
    { id: "calendar", name: "Event Calendar", icon: Calendar },
  ];

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
      } else {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists() && snap.data().role === "client") {
          setUser(u);
          setDisplayName(snap.data().displayName || u.displayName || "Client");
        } else {
          router.push("/restaurantdashboard");
        }
      }
    });
    return () => unsub();
  }, [router]);

  // Subscribe to live stats
  useEffect(() => {
    if (!user) return;
    const unsub = statsService.subscribeToClientStats(user.uid, setStats);
    return () => unsub();
  }, [user]);

  if (!user) return <p className="text-white p-8">Loading...</p>;

  return (
    <CartProvider>
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      <Toaster theme="dark" position="top-right" />

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 bg-black/80 backdrop-blur-xl border-r border-gray-800 p-6 space-y-6 transition-transform z-40 lg:translate-x-0 lg:static lg:w-64`}
      >
        <h1 className="text-xl font-bold">Surplus Food</h1>
        <nav className="space-y-1">
          {sections.map((s) => (
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
              <s.icon className={`w-5 h-5 ${activeSection === s.id ? "text-violet-400" : "text-gray-500"}`} /> {s.name}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/40">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition text-gray-400" onClick={() => setSidebarOpen((s) => !s)}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-lg sm:text-xl font-semibold">Surplus Food • Client Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={user.uid} />
              <button
                onClick={() => signOut(auth)}
                className="bg-violet-500 px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
              <div className="w-9 h-9 rounded-full bg-violet-600/80 flex items-center justify-center text-sm font-semibold">
                {displayName[0]?.toUpperCase() || "C"}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 space-y-8">
          {/* Impact Summary — DYNAMIC */}
          <section id="impact" className="flex flex-col gap-6">
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5 shadow">
              <h3 className="font-semibold mb-4">Impact Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <CardStat icon={<ShoppingCart />} label="Total Orders" value={stats.totalOrders} />
                <CardStat icon={<Package />} label="Active Orders" value={stats.activeOrders} />
                <CardStat icon={<IndianRupee />} label="Money Saved" value={`₹${stats.totalSaved.toFixed(0)}`} />
                <CardStat icon={<Leaf />} label="Food Rescued" value={`${stats.foodRescuedKg} kg`} />
                <CardStat icon={<Users />} label="Completed" value={stats.completedOrders} />
                <CardStat icon={<IndianRupee />} label="Total Spent" value={`₹${stats.totalSpent.toFixed(0)}`} />
                <CardStat icon={<Leaf />} label="CO₂ Reduced" value={`${stats.co2Reduced.toFixed(0)} kg`} />
              </div>
              <p className="mt-4 text-xs text-gray-400">
                * Live data from your orders on the platform.
              </p>
            </div>
          </section>

          {/* Available Surplus Food */}
          <section id="surplus">
            <SurplusListingCard
              clientId={user.uid}
              clientName={displayName}
            />
          </section>

          {/* Favorite Restaurants */}
          <section id="favorites">
            <FavoriteRestaurants clientId={user.uid} />
          </section>

          {/* My Orders + Tracking */}
          <section id="orders">
            <ClientOrders clientId={user.uid} />
          </section>

          {/* Streaks & Badges */}
          <section id="streaks">
            <StreaksAndBadges clientId={user.uid} />
          </section>

          {/* Referral Program */}
          <section id="referral">
            <ReferralSection clientId={user.uid} clientName={displayName} />
          </section>

          {/* Event Calendar */}
          <section id="calendar">
            <ClientEvent />
          </section>
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        clientId={user.uid}
        clientName={displayName}
      />
    </div>
    </CartProvider>
  );
}

/** ---------- Small UI helpers ---------- */
function CardStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
      <div className="flex items-center gap-3 text-gray-300">
        <div className="p-2 rounded-md bg-white/5">{icon}</div>
        <div>
          <div className="text-xs text-gray-400">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

