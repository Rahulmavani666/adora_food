"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { UtensilsCrossed, Trash2, Users, Leaf, TrendingUp, Sparkles } from "lucide-react";

const stats = [
  {
    key: "mealsSaved",
    label: "Meals Rescued",
    desc: "Surplus meals saved from landfills",
    target: 15420,
    icon: UtensilsCrossed,
    color: "emerald",
    gradient: "from-emerald-400 to-green-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    ring: "ring-emerald-400/40",
    glow: "shadow-emerald-500/20",
    iconBg: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    format: "number",
  },
  {
    key: "wasteReduced",
    label: "Waste Prevented",
    desc: "Kilograms of food waste diverted",
    target: 8230,
    icon: Trash2,
    color: "blue",
    gradient: "from-blue-400 to-cyan-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    ring: "ring-blue-400/40",
    glow: "shadow-blue-500/20",
    iconBg: "bg-blue-500/20",
    textColor: "text-blue-400",
    dotColor: "bg-blue-400",
    format: "weight",
  },
  {
    key: "peopleHelped",
    label: "People Fed",
    desc: "Community members received meals",
    target: 4560,
    icon: Users,
    color: "violet",
    gradient: "from-violet-400 to-purple-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    ring: "ring-violet-400/40",
    glow: "shadow-violet-500/20",
    iconBg: "bg-violet-500/20",
    textColor: "text-violet-400",
    dotColor: "bg-violet-400",
    format: "number",
  },
  {
    key: "carbonSaved",
    label: "CO₂ Reduced",
    desc: "Carbon emissions we helped avoid",
    target: 1250,
    icon: Leaf,
    color: "amber",
    gradient: "from-amber-400 to-yellow-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "ring-amber-400/40",
    glow: "shadow-amber-500/20",
    iconBg: "bg-amber-500/20",
    textColor: "text-amber-400",
    dotColor: "bg-amber-400",
    format: "weight",
  },
] as const;

type StatKey = (typeof stats)[number]["key"];

export default function ImpactCounter() {
  const [counts, setCounts] = useState<Record<StatKey, number>>({
    mealsSaved: 0,
    wasteReduced: 0,
    peopleHelped: 0,
    carbonSaved: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  useEffect(() => {
    if (!inView) return;
    setIsVisible(true);

    const duration = 2200;
    const steps = 70;
    const stepMs = duration / steps;
    let step = 0;

    const id = setInterval(() => {
      step++;
      const t = step / steps;
      const ease = 1 - Math.pow(1 - t, 4);

      setCounts({
        mealsSaved: Math.floor(15420 * ease),
        wasteReduced: Math.floor(8230 * ease),
        peopleHelped: Math.floor(4560 * ease),
        carbonSaved: Math.floor(1250 * ease),
      });

      if (step >= steps) {
        clearInterval(id);
        setCounts({ mealsSaved: 15420, wasteReduced: 8230, peopleHelped: 4560, carbonSaved: 1250 });
      }
    }, stepMs);

    return () => clearInterval(id);
  }, [inView]);

  const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n));
  const fmtW = (kg: number) => (kg >= 1000 ? (kg / 1000).toFixed(1) + " tons" : kg + " kg");

  return (
    <div ref={ref} className="w-full max-w-sm sm:max-w-md lg:max-w-none">
      <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-[28px] p-5 sm:p-7 border border-white/[0.1] shadow-2xl w-full lg:w-[420px] overflow-hidden transition-all duration-500 hover:border-white/[0.15] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
        {/* Decorative glow orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-center gap-2.5 mb-5 sm:mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20">
            <Sparkles size={16} className="text-violet-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Our Impact So Far
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="relative grid grid-cols-2 gap-2.5 sm:gap-3">
          {stats.map((s, i) => {
            const Icon = s.icon;
            const value = counts[s.key];
            const display = s.format === "weight" ? fmtW(value) : fmt(value);

            return (
              <div
                key={s.key}
                className={`group/card relative rounded-2xl ${s.bg} border ${s.border} p-3 sm:p-4 transition-all duration-500 hover:scale-[1.03] hover:shadow-lg ${s.glow}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`,
                }}
              >
                {/* Icon */}
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-2.5 sm:mb-3 transition-transform duration-300 group-hover/card:scale-110`}>
                  <Icon size={18} className={`${s.textColor} sm:w-5 sm:h-5`} />
                </div>

                {/* Number */}
                <div className={`text-xl sm:text-2xl font-extrabold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent leading-none mb-1`}>
                  {display}
                </div>

                {/* Label */}
                <div className="text-white/90 text-xs sm:text-sm font-semibold mb-0.5">
                  {s.label}
                </div>

                {/* Description */}
                <div className="text-white/40 text-[10px] sm:text-xs leading-snug">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly Growth Bar */}
        <div className="relative mt-4 sm:mt-5 bg-white/[0.04] rounded-2xl p-3 sm:p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-emerald-400" />
              <span className="text-white/70 text-[11px] sm:text-xs font-medium">Monthly Goal</span>
            </div>
            <span className="text-emerald-400 text-[11px] sm:text-xs font-semibold">78% · +12%</span>
          </div>
          <div className="w-full bg-white/[0.08] rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-cyan-400 transition-all duration-[1.5s] ease-out relative"
              style={{ width: isVisible ? "78%" : "0%" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>

        {/* Live pill */}
        <div className="relative flex justify-center mt-3.5 sm:mt-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Updating in real-time
          </div>
        </div>
      </div>
    </div>
  );
}
