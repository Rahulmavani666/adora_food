"use client";
import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Star, Home, Briefcase, Tag } from "lucide-react";
import { savedAddressService } from "@/lib/firebase-services";
import type { SavedAddress } from "@/lib/types";
import { toast } from "sonner";

const LABEL_ICONS: Record<string, typeof Home> = { Home, Work: Briefcase };

export default function SavedAddresses({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = savedAddressService.subscribeToAddresses(userId, setAddresses);
    return () => unsub();
  }, [userId]);

  const handleAdd = async () => {
    if (!address.trim()) return;
    setSaving(true);
    try {
      await savedAddressService.addAddress({
        userId,
        label: label.trim() || "Home",
        address: address.trim(),
        isDefault: addresses.length === 0,
      });
      setAddress("");
      setLabel("Home");
      setShowForm(false);
      toast.success("Address saved");
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await savedAddressService.deleteAddress(id);
      toast.success("Address removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await savedAddressService.setDefault(userId, id);
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin size={20} className="text-violet-400" />
          Saved Addresses
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300 transition"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
          <div className="flex gap-2">
            {["Home", "Work", "Other"].map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  label === l
                    ? "border-violet-500 bg-violet-600/15 text-violet-300"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address (e.g. 123 Main St, Apt 4, City, PIN)"
            rows={2}
            className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none resize-none transition"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !address.trim()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-50 transition"
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
          </div>
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-500">
          <MapPin size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No saved addresses yet</p>
          <p className="text-xs text-gray-600 mt-1">Add one to speed up checkout</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => {
            const Icon = LABEL_ICONS[addr.label] || Tag;
            return (
              <div
                key={addr.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition ${
                  addr.isDefault
                    ? "border-violet-500/30 bg-violet-600/10"
                    : "border-gray-800 bg-gray-900/50"
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${addr.isDefault ? "bg-violet-600/20" : "bg-gray-800"}`}>
                  <Icon size={16} className={addr.isDefault ? "text-violet-400" : "text-gray-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-200">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{addr.address}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      title="Set as default"
                      className="p-1.5 rounded-lg hover:bg-violet-500/10 text-gray-500 hover:text-violet-400 transition"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    title="Delete address"
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
