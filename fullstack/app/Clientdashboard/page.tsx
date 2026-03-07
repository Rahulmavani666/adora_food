"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Calendar,
  Leaf,
  Package,
  Users,
  Activity,
  IndianRupee,
  ShoppingCart,
  Heart,
  Trophy,
  Gift,
  Menu,
  X,
  ChevronRight,
  MapPin,
  Search,
  UserCircle,
  Mail,
  Phone,
  Building2,
  LogOut,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
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
import EmailVerification from "@/components/EmailVerification";
import ProfileCompletion from "@/components/ProfileCompletion";
import { CartProvider } from "@/hooks/useCart";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { statsService } from "@/lib/firebase-services";
import { Toaster } from "sonner";

/** ---------- Page ---------- */
export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    orgName: string;
    createdAt: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    verifiedEmail: string;
    verifiedPhone: string;
    emailVerifiedAt: string;
    photoURL: string;
  } | null>(null);
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
    {
      label: "Account",
      items: [
        { id: "profile", name: "My Profile", icon: UserCircle },
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
          const d = snap.data();
          setDisplayName(d.displayName || d.fullName || u.displayName || "Client");
          setUserEmail(d.email || u.email || "");
          const photo = d.photoURL || u.photoURL || null;
          setUserPhoto(photo);
          // Persist photoURL to Firestore if we got it from Auth but it's missing in Firestore
          if (!d.photoURL && u.photoURL) {
            updateDoc(doc(db, "users", u.uid), { photoURL: u.photoURL }).catch(() => {});
          }
          setProfileData({
            fullName: d.fullName || d.displayName || u.displayName || "",
            email: d.email || u.email || "",
            phone: d.phone || d.phoneNumber || "",
            address: d.address || "",
            city: d.city || "",
            state: d.state || "",
            pincode: d.pincode || "",
            orgName: d.orgName || "",
            createdAt: d.createdAt?.toDate?.()?.toLocaleDateString() || d.createdAt || "N/A",
            emailVerified: !!d.emailVerified,
            phoneVerified: !!d.phoneVerified,
            verifiedEmail: d.verifiedEmail || "",
            verifiedPhone: d.phoneNumber || "",
            emailVerifiedAt: d.emailVerifiedAt || "",
            photoURL: photo || "",
          });
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
          } fixed lg:sticky lg:top-0 lg:translate-x-0 inset-y-0 left-0 w-72 h-screen bg-gray-950/95 backdrop-blur-xl border-r border-white/[0.06] transition-transform duration-300 z-40 flex flex-col`}
      >
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/[0.06] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-emerald-500 flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">Adora Food</span>
            <p className="text-[10px] text-gray-500 -mt-0.5">Save Food, Save Earth</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600 px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((s) => {
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigateTo(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group relative ${
                        isActive
                          ? "bg-violet-600/15 text-violet-300"
                          : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-500 rounded-r-full" />
                      )}
                      <div className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-violet-600/20" : "bg-white/[0.04] group-hover:bg-white/[0.06]"}`}>
                        <s.icon size={16} className={`${isActive ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"}`} />
                      </div>
                      <span className="flex-1 text-sm font-medium">{s.name}</span>
                      {isActive && <ChevronRight size={14} className="text-violet-500/60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {/* Sidebar footer */}
        <div className="shrink-0 p-4 border-t border-white/[0.06] space-y-3">
          <button
            onClick={() => navigateTo("profile")}
            className={`w-full flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 group ${
              activeSection === "profile"
                ? "bg-violet-600/15 ring-1 ring-violet-500/30"
                : "hover:bg-white/[0.06]"
            }`}
          >
            <div className="relative shrink-0">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/40 group-hover:ring-violet-500/70 transition-all shadow-lg shadow-violet-900/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-sm font-bold uppercase ring-2 ring-violet-500/40 group-hover:ring-violet-500/70 transition-all shadow-lg shadow-violet-900/30">
                  {displayName[0] || "C"}
                </div>
              )}
              {profileData?.emailVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-gray-950">
                  <BadgeCheck size={10} className="text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold truncate text-white">{displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">{userEmail || "Client Account"}</p>
            </div>
            <ChevronRight
              size={14}
              className={`shrink-0 transition ${
                activeSection === "profile"
                  ? "text-violet-400"
                  : "text-gray-600 group-hover:text-gray-400"
              }`}
            />
          </button>
          <ProfileCompletion userId={user.uid} role="client" />
          <EmailVerification userId={user.uid} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl hover:bg-white/[0.06] transition text-gray-400" onClick={() => setSidebarOpen((s) => !s)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400">
              <span className="text-gray-600">Dashboard</span>
              <ChevronRight size={12} className="text-gray-700" />
              <span className="text-white font-semibold">
                {allSections.find(s => s.id === activeSection)?.name ?? "Impact Summary"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={user.uid} />
            {/* Profile photo — click to open profile */}
            <button
              onClick={() => navigateTo("profile")}
              className="relative group"
              title="View Profile"
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-violet-500 transition-all shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-[11px] font-bold uppercase border-2 border-transparent group-hover:border-violet-500 transition-all shadow-md">
                  {displayName[0] || "C"}
                </div>
              )}
              {profileData?.emailVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center border-[1.5px] border-gray-950">
                  <CheckCircle2 size={8} className="text-white" />
                </div>
              )}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="bg-white/[0.06] hover:bg-white/10 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors text-gray-300 border border-white/[0.06]"
            >
              Logout
            </button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {/* Section transition wrapper */}
          <div key={activeSection} className="animate-fadeIn space-y-6">

            {/* Impact Summary — Zomato-style dashboard cards */}
            {activeSection === "impact" && (
              <section className="flex flex-col gap-6">
                {/* Welcome banner */}
                <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 via-violet-600/10 to-emerald-600/10 border border-violet-500/20 p-6">
                  <h3 className="text-xl font-bold text-white">Welcome back, {displayName.split(" ")[0]}! 👋</h3>
                  <p className="text-sm text-gray-400 mt-1">Here&#39;s your impact on reducing food waste</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <CardStat icon={<ShoppingCart size={20} />} label="Total Orders" value={stats.totalOrders} accent="violet" />
                  <CardStat icon={<Package size={20} />} label="Active Orders" value={stats.activeOrders} accent="blue" />
                  <CardStat icon={<IndianRupee size={20} />} label="Money Saved" value={`₹${stats.totalSaved.toFixed(0)}`} accent="emerald" />
                  <CardStat icon={<Leaf size={20} />} label="Food Rescued" value={`${stats.foodRescuedKg} kg`} accent="green" />
                  <CardStat icon={<Users size={20} />} label="Completed" value={stats.completedOrders} accent="violet" />
                  <CardStat icon={<IndianRupee size={20} />} label="Total Spent" value={`₹${stats.totalSpent.toFixed(0)}`} accent="amber" />
                  <CardStat icon={<Leaf size={20} />} label="CO₂ Reduced" value={`${stats.co2Reduced.toFixed(0)} kg`} accent="emerald" />
                </div>

                <p className="text-xs text-gray-500">* Live data from your orders on the platform</p>
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

            {/* Profile Details */}
            {activeSection === "profile" && profileData && (
              <section className="flex flex-col gap-6">
                {/* Profile Header Card */}
                <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 via-violet-600/10 to-emerald-600/10 border border-violet-500/20 p-8">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      {userPhoto ? (
                        <img
                          src={userPhoto}
                          alt={displayName}
                          className="w-28 h-28 rounded-2xl object-cover shadow-xl shadow-violet-900/40 border-2 border-violet-500/30"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-4xl font-bold uppercase shadow-xl shadow-violet-900/40 border-2 border-violet-500/30">
                          {displayName[0] || "C"}
                        </div>
                      )}
                      {/* Verified badge on photo */}
                      {profileData.emailVerified && (
                        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-gray-950 shadow-lg">
                          <BadgeCheck size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-2xl font-bold text-white">{profileData.fullName || displayName}</h2>
                      <p className="text-sm text-gray-400 mt-1">{profileData.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/20 text-violet-300 text-xs font-medium border border-violet-500/20">
                          <Shield size={12} />
                          Client Account
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-300 text-xs font-medium border border-emerald-500/20">
                          <Clock size={12} />
                          Joined {profileData.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Status Banner */}
                <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-violet-400" />
                    Verification Status
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email Verification */}
                    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition ${
                      profileData.emailVerified
                        ? "bg-emerald-600/10 border-emerald-500/20"
                        : "bg-amber-600/10 border-amber-500/20"
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        profileData.emailVerified ? "bg-emerald-600/20" : "bg-amber-600/20"
                      }`}>
                        {profileData.emailVerified
                          ? <CheckCircle2 size={20} className="text-emerald-400" />
                          : <AlertTriangle size={20} className="text-amber-400" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${
                          profileData.emailVerified ? "text-emerald-300" : "text-amber-300"
                        }`}>
                          {profileData.emailVerified ? "Email Verified" : "Email Not Verified"}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {profileData.emailVerified
                            ? profileData.verifiedEmail || profileData.email
                            : "Verify to secure your account"}
                        </p>
                      </div>
                      {profileData.emailVerified && (
                        <BadgeCheck size={18} className="text-emerald-400 shrink-0" />
                      )}
                    </div>

                    {/* Phone Verification */}
                    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition ${
                      profileData.phoneVerified
                        ? "bg-emerald-600/10 border-emerald-500/20"
                        : "bg-amber-600/10 border-amber-500/20"
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        profileData.phoneVerified ? "bg-emerald-600/20" : "bg-amber-600/20"
                      }`}>
                        {profileData.phoneVerified
                          ? <CheckCircle2 size={20} className="text-emerald-400" />
                          : <AlertTriangle size={20} className="text-amber-400" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${
                          profileData.phoneVerified ? "text-emerald-300" : "text-amber-300"
                        }`}>
                          {profileData.phoneVerified ? "Phone Verified" : "Phone Not Verified"}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {profileData.phoneVerified
                            ? profileData.verifiedPhone
                            : "Verify for order updates"}
                        </p>
                      </div>
                      {profileData.phoneVerified && (
                        <BadgeCheck size={18} className="text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Grid — with verification indicators */}
                <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-5">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <UserCircle size={16} className="text-violet-400" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileCard icon={<UserCircle size={20} />} label="Full Name" value={profileData.fullName} accent="violet" verified={!!profileData.fullName} />
                    <ProfileCard icon={<Mail size={20} />} label="Email Address" value={profileData.email} accent="blue" verified={profileData.emailVerified} verifiedLabel="Verified" />
                    <ProfileCard icon={<Phone size={20} />} label="Phone Number" value={profileData.phone || "Not provided"} accent="emerald" empty={!profileData.phone} verified={profileData.phoneVerified} verifiedLabel="Verified" />
                    <ProfileCard icon={<MapPin size={20} />} label="Address" value={profileData.address || "Not provided"} accent="amber" empty={!profileData.address} verified={!!profileData.address} />
                    <ProfileCard icon={<Building2 size={20} />} label="City" value={profileData.city || "Not provided"} accent="violet" empty={!profileData.city} verified={!!profileData.city} />
                    <ProfileCard icon={<MapPin size={20} />} label="State" value={profileData.state || "Not provided"} accent="blue" empty={!profileData.state} verified={!!profileData.state} />
                    <ProfileCard icon={<MapPin size={20} />} label="Pincode" value={profileData.pincode || "Not provided"} accent="emerald" empty={!profileData.pincode} verified={!!profileData.pincode} />
                  </div>
                </div>

                {/* Quick Stats on Profile Page */}
                <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-violet-400" />
                    Your Activity
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MiniStat label="Orders" value={stats.totalOrders} />
                    <MiniStat label="Food Rescued" value={`${stats.foodRescuedKg} kg`} />
                    <MiniStat label="Money Saved" value={`₹${stats.totalSaved.toFixed(0)}`} />
                    <MiniStat label="CO₂ Reduced" value={`${stats.co2Reduced.toFixed(0)} kg`} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <ProfileCompletion userId={user.uid} role="client" />
                  <EmailVerification userId={user.uid} />
                  <button
                    onClick={() => signOut(auth)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 px-5 py-2.5 text-sm font-medium transition-colors text-red-400"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </section>
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

function CardStat({ icon, label, value, accent = "violet" }: { icon: React.ReactNode; label: string; value: number | string; accent?: string }) {
  const accentColors: Record<string, string> = {
    violet: "bg-violet-600/15 text-violet-400",
    blue: "bg-blue-600/15 text-blue-400",
    emerald: "bg-emerald-600/15 text-emerald-400",
    green: "bg-green-600/15 text-green-400",
    amber: "bg-amber-600/15 text-amber-400",
  };
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-4 hover:bg-gray-900/80 transition">
      <div className={`w-10 h-10 rounded-xl ${accentColors[accent] || accentColors.violet} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

function ProfileCard({ icon, label, value, accent = "violet", empty = false, verified = false, verifiedLabel }: { icon: React.ReactNode; label: string; value: string; accent?: string; empty?: boolean; verified?: boolean; verifiedLabel?: string }) {
  const accentColors: Record<string, string> = {
    violet: "bg-violet-600/15 text-violet-400",
    blue: "bg-blue-600/15 text-blue-400",
    emerald: "bg-emerald-600/15 text-emerald-400",
    amber: "bg-amber-600/15 text-amber-400",
  };
  return (
    <div className="rounded-xl border border-white/[0.06] bg-gray-800/30 p-4 hover:bg-gray-800/50 transition group">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg ${accentColors[accent] || accentColors.violet} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
            {verified && verifiedLabel && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-400 text-[9px] font-semibold">
                <CheckCircle2 size={9} />
                {verifiedLabel}
              </span>
            )}
            {!verified && !empty && !verifiedLabel && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600/10 text-emerald-500/60 text-[9px] font-medium">
                <CheckCircle2 size={9} />
                Filled
              </span>
            )}
          </div>
          <p className={`text-sm font-semibold truncate ${empty ? "text-gray-600 italic" : "text-white"}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-3 rounded-xl bg-gray-800/50">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

