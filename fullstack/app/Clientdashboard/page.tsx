"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

import ClientEvent from "@/components/clientDashboardComp/ClientEvent";
import SurplusListingCard from "@/components/clientDashboardComp/SupluslistingCards";
import ClientOrders from "@/components/clientDashboardComp/ClientOrders";
import FavoriteRestaurants from "@/components/clientDashboardComp/FavoriteRestaurants";
import StreaksAndBadges from "@/components/clientDashboardComp/StreaksAndBadges";
import ReferralSection from "@/components/clientDashboardComp/ReferralSection";
import CartDrawer from "@/components/clientDashboardComp/CartDrawer";
import NotificationBell from "@/components/NotificationBell";
import LoadingScreen from "@/components/ui/LoadingScreen";
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

  // Navigation handler
  const mainRef = useRef<HTMLDivElement>(null);
  const navigateTo = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Sidebar groups
  const sidebarGroups = [
    {
      label: "Overview",
      items: [
        { id: "impact", name: "Impact Summary", icon: Activity },
      ],
    },
    {
      label: "Food",
      items: [
        { id: "surplus", name: "Available Food", icon: Package },
        { id: "favorites", name: "Favorites", icon: Heart },
      ],
    },
    {
      label: "Orders",
      items: [
        { id: "orders", name: "My Orders", icon: ShoppingCart },
      ],
    },
    {
      label: "Rewards",
      items: [
        { id: "streaks", name: "Streaks & Badges", icon: Trophy },
        { id: "referral", name: "Referrals", icon: Gift },
      ],
    },
    {
      label: "Events",
      items: [
        { id: "calendar", name: "Event Calendar", icon: Calendar },
      ],
    },
  ];

  // Flat list for prev/next
  const allSections = sidebarGroups.flatMap(g => g.items);
  const currentIdx = allSections.findIndex(s => s.id === activeSection);
  const prevSection = currentIdx > 0 ? allSections[currentIdx - 1] : null;
  const nextSection = currentIdx < allSections.length - 1 ? allSections[currentIdx + 1] : null;

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

  if (!user) return <LoadingScreen variant="fullscreen" title="Loading Dashboard" subtitle="Discovering surplus food near you…" />;

  return (
    <CartProvider>
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      <Toaster theme="dark" position="top-right" />

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:sticky lg:top-0 lg:translate-x-0 inset-y-0 left-0 w-72 h-screen bg-gray-900/95 backdrop-blur border-r border-gray-800 transition-transform duration-300 z-40 flex flex-col`}
      >
        <div className="h-16 px-5 flex items-center gap-2 border-b border-gray-800 shrink-0">
          <Leaf className="text-emerald-400" />
          <span className="font-semibold">Surplus Food</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-3 mb-2">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((s) => {
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigateTo(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group relative ${
                        isActive
                          ? "bg-violet-600/20 text-violet-300 shadow-sm shadow-violet-500/5"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-400 rounded-r-full transition-all" />
                      )}
                      <s.icon size={18} className={`shrink-0 transition-colors duration-200 ${isActive ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"}`} />
                      <span className="flex-1 text-sm">{s.name}</span>
                      {isActive && <ChevronRight size={14} className="text-violet-400/60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {/* Sidebar footer */}
        <div className="shrink-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600/70 flex items-center justify-center text-xs uppercase">
              {displayName[0] || "C"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-[10px] text-gray-500">Client</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-white/10 bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-gray-950/40 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition text-gray-400" onClick={() => setSidebarOpen((s) => !s)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400">
              <span className="text-gray-500">Dashboard</span>
              <ChevronRight size={12} className="text-gray-600" />
              <span className="text-gray-200 font-medium">
                {allSections.find(s => s.id === activeSection)?.name ?? "Impact Summary"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell userId={user.uid} />
            <button
              onClick={() => signOut(auth)}
              className="bg-violet-500 hover:bg-violet-600 px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {/* Section transition wrapper */}
          <div key={activeSection} className="animate-fadeIn space-y-6">

            {/* Impact Summary */}
            {activeSection === "impact" && (
              <section className="flex flex-col gap-6">
                <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5 shadow">
                  <SectionHeader title="Impact Summary" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
            )}

            {/* Available Surplus Food */}
            {activeSection === "surplus" && (
              <SurplusListingCard clientId={user.uid} clientName={displayName} />
            )}

            {/* Favorite Restaurants */}
            {activeSection === "favorites" && (
              <FavoriteRestaurants clientId={user.uid} />
            )}

            {/* My Orders + Tracking */}
            {activeSection === "orders" && (
              <ClientOrders clientId={user.uid} />
            )}

            {/* Streaks & Badges */}
            {activeSection === "streaks" && (
              <StreaksAndBadges clientId={user.uid} />
            )}

            {/* Referral Program */}
            {activeSection === "referral" && (
              <ReferralSection clientId={user.uid} clientName={displayName} />
            )}

            {/* Event Calendar */}
            {activeSection === "calendar" && (
              <ClientEvent />
            )}

            {/* Prev / Next Section Navigation */}
            <div className="flex items-center justify-between pt-6 pb-2 border-t border-gray-800/50 mt-8">
              {prevSection ? (
                <button
                  onClick={() => navigateTo(prevSection.id)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <ChevronRight size={16} className="rotate-180 text-gray-600 group-hover:text-violet-400 transition-colors" />
                  <span>{prevSection.name}</span>
                </button>
              ) : <span />}
              {nextSection ? (
                <button
                  onClick={() => navigateTo(nextSection.id)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <span>{nextSection.name}</span>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-violet-400 transition-colors" />
                </button>
              ) : <span />}
            </div>
          </div>
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
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  );
}

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

