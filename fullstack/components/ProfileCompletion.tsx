"use client";

import { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface ProfileCompletionProps {
  userId: string;
  role: "client" | "business";
}

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  orgName: string; // restaurant name or empty for client
}

const PROFILE_FIELDS_CLIENT: (keyof ProfileData)[] = [
  "fullName",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
];

const PROFILE_FIELDS_BUSINESS: (keyof ProfileData)[] = [
  "fullName",
  "email",
  "phone",
  "orgName",
  "address",
  "city",
  "state",
  "pincode",
];

function getRequiredFields(role: "client" | "business") {
  return role === "business" ? PROFILE_FIELDS_BUSINESS : PROFILE_FIELDS_CLIENT;
}

function calcCompletion(data: ProfileData, role: "client" | "business") {
  const fields = getRequiredFields(role);
  const filled = fields.filter((f) => data[f]?.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

export default function ProfileCompletion({
  userId,
  role,
}: ProfileCompletionProps) {
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    orgName: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load profile from Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
          const d = snap.data();
          setProfile({
            fullName: d.fullName || d.displayName || "",
            email: d.email || "",
            phone: d.phone || d.phoneNumber || "",
            address: d.address || "",
            city: d.city || "",
            state: d.state || "",
            pincode: d.pincode || "",
            orgName: d.orgName || "",
          });
        }
      } catch {
        // silently fail
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [userId]);

  const completion = calcCompletion(profile, role);
  const isComplete = completion === 100;

  const handleSave = async () => {
    if (!profile.fullName.trim()) {
      toast.error("Name is required.");
      return;
    }
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", userId), {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
        state: profile.state.trim(),
        pincode: profile.pincode.trim(),
        ...(role === "business" && { orgName: profile.orgName.trim() }),
        profileUpdatedAt: new Date().toISOString(),
      });
      toast.success("Profile updated!");
      setModalOpen(false);
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <>
      {/* Sidebar widget */}
      <button
        onClick={() => setModalOpen(true)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border transition group ${
          isComplete
            ? "bg-emerald-600/10 border-emerald-700/30"
            : "bg-violet-600/10 border-violet-700/30 hover:bg-violet-600/20"
        }`}
      >
        {isComplete ? (
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle size={14} className="text-violet-400 shrink-0" />
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className={`text-[11px] font-medium ${isComplete ? "text-emerald-400" : "text-violet-300"}`}>
            {isComplete ? "Profile Complete" : "Complete Profile"}
          </p>
          {!isComplete && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-500">{completion}%</span>
            </div>
          )}
        </div>
        <ChevronRight
          size={12}
          className={`shrink-0 transition ${
            isComplete
              ? "text-emerald-500/50"
              : "text-violet-500/50 group-hover:text-violet-400"
          }`}
        />
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md max-h-[90vh] rounded-2xl border border-gray-800 bg-gray-900 shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-600/20">
                  <User size={18} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Your Profile</h3>
                  <p className="text-[10px] text-gray-500">
                    {isComplete
                      ? "All details filled"
                      : `${completion}% complete — fill the remaining fields`}
                  </p>
                </div>
              </div>
              <button
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar */}
            {!isComplete && (
              <div className="px-5 pt-3 shrink-0">
                <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            )}

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Full Name */}
              <FormField
                icon={<User size={14} />}
                label="Full Name *"
                value={profile.fullName}
                onChange={(v) => setProfile({ ...profile, fullName: v })}
                placeholder="John Doe"
              />

              {/* Org Name (business only) */}
              {role === "business" && (
                <FormField
                  icon={<Building2 size={14} />}
                  label="Restaurant / Business Name *"
                  value={profile.orgName}
                  onChange={(v) => setProfile({ ...profile, orgName: v })}
                  placeholder="My Restaurant"
                />
              )}

              {/* Email */}
              <FormField
                icon={<Mail size={14} />}
                label="Email *"
                type="email"
                value={profile.email}
                onChange={(v) => setProfile({ ...profile, email: v })}
                placeholder="you@example.com"
              />

              {/* Phone */}
              <FormField
                icon={<Phone size={14} />}
                label="Contact Number *"
                type="tel"
                value={profile.phone}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    phone: v.replace(/[^\d+\s-]/g, ""),
                  })
                }
                placeholder="+91 XXXXXXXXXX"
              />

              {/* Address */}
              <FormField
                icon={<MapPin size={14} />}
                label="Address *"
                value={profile.address}
                onChange={(v) => setProfile({ ...profile, address: v })}
                placeholder="Street address, area, landmark"
                multiline
              />

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="City *"
                  value={profile.city}
                  onChange={(v) => setProfile({ ...profile, city: v })}
                  placeholder="Mumbai"
                />
                <FormField
                  label="State *"
                  value={profile.state}
                  onChange={(v) => setProfile({ ...profile, state: v })}
                  placeholder="Maharashtra"
                />
              </div>

              {/* Pincode */}
              <FormField
                label="Pincode *"
                value={profile.pincode}
                onChange={(v) =>
                  setProfile({
                    ...profile,
                    pincode: v.replace(/\D/g, "").slice(0, 6),
                  })
                }
                placeholder="400001"
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 p-5 border-t border-gray-800 flex items-center justify-between">
              <button
                onClick={() => setModalOpen(false)}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 text-sm font-medium transition"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Form Field Helper ---------- */
function FormField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const filled = value.trim().length > 0;
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
        {icon}
        {label}
        {filled && (
          <CheckCircle2 size={10} className="text-emerald-400 ml-auto" />
        )}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500 transition resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500 transition"
        />
      )}
    </div>
  );
}
