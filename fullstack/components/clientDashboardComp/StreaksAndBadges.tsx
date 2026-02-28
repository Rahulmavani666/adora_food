"use client";
import { useEffect, useState } from "react";
import { Flame, Trophy, Award, Zap } from "lucide-react";
import { streakService } from "@/lib/firebase-services";
import type { UserStreak, BadgeType } from "@/lib/types";

const BADGE_INFO: Record<BadgeType, { emoji: string; label: string; description: string }> = {
  first_rescue: { emoji: "🌱", label: "First Rescue", description: "Completed your first order" },
  streak_3: { emoji: "🔥", label: "3-Day Streak", description: "Ordered 3 days in a row" },
  streak_7: { emoji: "⚡", label: "Week Warrior", description: "7-day order streak" },
  streak_30: { emoji: "🏆", label: "Monthly Legend", description: "30-day order streak" },
  food_hero_10: { emoji: "🦸", label: "Food Hero", description: "Rescued food 10 times" },
  food_hero_50: { emoji: "👑", label: "Super Saver", description: "50 orders completed" },
  eco_warrior: { emoji: "🌍", label: "Eco Warrior", description: "50kg+ food saved from waste" },
  referral_star: { emoji: "⭐", label: "Referral Star", description: "Referred a new user" },
};

const ALL_BADGES: BadgeType[] = [
  "first_rescue", "streak_3", "streak_7", "streak_30",
  "food_hero_10", "food_hero_50", "eco_warrior", "referral_star",
];

export default function StreaksAndBadges({ clientId }: { clientId: string }) {
  const [streak, setStreak] = useState<UserStreak | null>(null);

  useEffect(() => {
    if (!clientId) return;
    streakService.getStreak(clientId).then(setStreak);
  }, [clientId]);

  const earnedBadgeTypes = new Set(streak?.badges?.map(b => b.type) || []);

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5 shadow">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-amber-400" />
        Streaks &amp; Badges
      </h3>

      {/* Streak counter */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-orange-700/30 bg-orange-600/10 px-5 py-4">
          <Flame size={28} className="text-orange-400" />
          <div>
            <p className="text-2xl font-bold text-orange-300">{streak?.currentStreak ?? 0}</p>
            <p className="text-xs text-gray-400">Day streak</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-violet-700/30 bg-violet-600/10 px-5 py-4">
          <Zap size={28} className="text-violet-400" />
          <div>
            <p className="text-2xl font-bold text-violet-300">{streak?.longestStreak ?? 0}</p>
            <p className="text-xs text-gray-400">Best streak</p>
          </div>
        </div>
      </div>

      {/* Badges grid */}
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Badges</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ALL_BADGES.map(type => {
          const info = BADGE_INFO[type];
          const earned = earnedBadgeTypes.has(type);
          return (
            <div
              key={type}
              className={`rounded-lg border p-3 text-center transition ${
                earned
                  ? "border-amber-700/40 bg-amber-600/10"
                  : "border-gray-800 bg-gray-800/30 opacity-40"
              }`}
            >
              <span className="text-2xl">{info.emoji}</span>
              <p className={`text-xs font-medium mt-1 ${earned ? "text-amber-300" : "text-gray-500"}`}>
                {info.label}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{info.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
