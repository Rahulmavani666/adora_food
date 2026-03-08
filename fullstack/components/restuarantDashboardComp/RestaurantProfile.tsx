"use client";

import { useState, useEffect } from "react";
import {
  Building2, Clock, Phone, Mail, MapPin, Shield, Save, Camera, Star,
} from "lucide-react";
import { restaurantProfileService } from "@/lib/firebase-services";
import type { RestaurantProfile, CuisineType } from "@/lib/types";
import { CUISINE_TYPES } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  restaurantId: string;
  restaurantName: string;
  email?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function RestaurantProfileEditor({ restaurantId, restaurantName, email }: Props) {
  const [profile, setProfile] = useState<Partial<RestaurantProfile>>({
    name: restaurantName,
    email: email || "",
    description: "",
    phone: "",
    address: "",
    fssaiLicense: "",
    cuisineTypes: [],
    operatingHours: { open: "09:00", close: "22:00", daysOff: [] },
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = restaurantProfileService.subscribeToProfile(restaurantId, (p) => {
      if (p) {
        setProfile(prev => ({ ...prev, ...p }));
      }
      setLoaded(true);
    });
    return () => unsub();
  }, [restaurantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await restaurantProfileService.saveProfile(restaurantId, {
        ...profile,
        ownerId: restaurantId,
        name: profile.name || restaurantName,
      });
      toast.success("Profile saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    const current = profile.cuisineTypes || [];
    setProfile({
      ...profile,
      cuisineTypes: current.includes(cuisine)
        ? current.filter(c => c !== cuisine)
        : [...current, cuisine],
    });
  };

  const toggleDayOff = (day: string) => {
    const current = profile.operatingHours?.daysOff || [];
    setProfile({
      ...profile,
      operatingHours: {
        open: profile.operatingHours?.open || "09:00",
        close: profile.operatingHours?.close || "22:00",
        daysOff: current.includes(day)
          ? current.filter(d => d !== day)
          : [...current, day],
      },
    });
  };

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-800 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 size={20} className="text-violet-400" /> Restaurant Profile
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Restaurant Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Restaurant Name</label>
          <input
            value={profile.name || ""}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs text-gray-400 mb-1"><Phone size={11} className="inline mr-1" />Phone</label>
          <input
            value={profile.phone || ""}
            onChange={e => setProfile({ ...profile, phone: e.target.value })}
            placeholder="+91 XXXX XXXX XX"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs text-gray-400 mb-1"><Mail size={11} className="inline mr-1" />Email</label>
          <input
            value={profile.email || ""}
            onChange={e => setProfile({ ...profile, email: e.target.value })}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {/* FSSAI License */}
        <div>
          <label className="block text-xs text-gray-400 mb-1"><Shield size={11} className="inline mr-1" />FSSAI License Number</label>
          <input
            value={profile.fssaiLicense || ""}
            onChange={e => setProfile({ ...profile, fssaiLicense: e.target.value })}
            placeholder="14-digit FSSAI number"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-400 mb-1"><MapPin size={11} className="inline mr-1" />Address</label>
          <input
            value={profile.address || ""}
            onChange={e => setProfile({ ...profile, address: e.target.value })}
            placeholder="Full restaurant address"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">About / Description</label>
          <textarea
            value={profile.description || ""}
            onChange={e => setProfile({ ...profile, description: e.target.value })}
            placeholder="Tell customers about your restaurant, specialties, mission..."
            rows={3}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
          />
        </div>
      </div>

      {/* Cuisine Types */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Cuisine Types</label>
        <div className="flex flex-wrap gap-2">
          {CUISINE_TYPES.map(cuisine => (
            <button
              key={cuisine}
              type="button"
              onClick={() => toggleCuisine(cuisine)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                (profile.cuisineTypes || []).includes(cuisine)
                  ? "bg-violet-600/30 border-violet-500 text-violet-300"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Operating Hours */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          <Clock size={11} className="inline mr-1" />Operating Hours
        </label>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Opens at</label>
            <input
              type="time"
              value={profile.operatingHours?.open || "09:00"}
              onChange={e => setProfile({
                ...profile,
                operatingHours: { ...profile.operatingHours!, open: e.target.value },
              })}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Closes at</label>
            <input
              type="time"
              value={profile.operatingHours?.close || "22:00"}
              onChange={e => setProfile({
                ...profile,
                operatingHours: { ...profile.operatingHours!, close: e.target.value },
              })}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
        </div>
        <label className="block text-[10px] text-gray-500 mb-1.5">Days Off (select closed days)</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDayOff(day)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
                (profile.operatingHours?.daysOff || []).includes(day)
                  ? "bg-red-600/30 border-red-500 text-red-300"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
