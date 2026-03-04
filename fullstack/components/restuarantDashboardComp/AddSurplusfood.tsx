"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, IndianRupee, MapPin, Locate } from "lucide-react";
import { listingService } from "@/lib/firebase-services";
import type { FreshnessStatus, StorageCondition } from "@/lib/types";
import { toast } from "sonner";

export default function RestaurantCreateListing({ uid, restaurantName }: { uid: string; restaurantName: string }) {
  const [form, setForm] = useState({
    item: "",
    qtyKg: "",
    unit: "kg",
    freshness: "Fresh" as FreshnessStatus,
    windowStart: "",
    windowEnd: "",
    storage: "Refrigerated" as StorageCondition,
    dateAdded: "",
    originalPrice: "",
    discountPercent: "50",
    location: "",
    latitude: "",
    longitude: "",
  });

  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
        // Reverse geocode to get a readable location name
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`);
          const data = await res.json();
          const name = data.address?.road
            ? `${data.address.road}${data.address.suburb ? ", " + data.address.suburb : ""}`
            : data.display_name?.split(",").slice(0, 2).join(",") || "";
          if (name) setForm(prev => ({ ...prev, location: name }));
        } catch {
          // Reverse geocode failed, that's fine — coordinates are enough
        }
        setDetectingLocation(false);
        toast.success("Location detected!");
      },
      () => {
        toast.error("Could not detect location. Please enter manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const discountFraction = Number(form.discountPercent) / 100;
  const surplusPrice = form.originalPrice
    ? Math.round(Number(form.originalPrice) * (1 - discountFraction) * 100) / 100
    : 0;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary", error);
      return null;
    }
  };

  const addListing = async () => {
    if (!form.item || !form.qtyKg || !form.originalPrice) {
      toast.error("Please fill food type, quantity and original price.");
      return;
    }
    try {
      setLoading(true);

      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      await listingService.addListing({
        restaurantId: uid,
        restaurantName,
        foodType: form.item,
        quantity: Number(form.qtyKg),
        unit: form.unit,
        originalPrice: Number(form.originalPrice),
        surplusPrice,
        freshnessStatus: form.freshness,
        storageCondition: form.storage,
        availability: {
          start: form.windowStart || null,
          end: form.windowEnd || null,
        },
        imageUrl,
        status: "available",
        ...(form.location && { location: form.location }),
        ...(form.latitude && form.longitude && {
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }),
      });

      toast.success("Listing added! Clients have been notified.");
      setForm({ item: "", qtyKg: "", unit: "kg", freshness: "Fresh", windowStart: "", windowEnd: "", storage: "Refrigerated", dateAdded: "", originalPrice: "", discountPercent: "50", location: "", latitude: "", longitude: "" });
      clearImage();
    } catch (err) {
      console.error(err);
      toast.error("Error adding listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="add" className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <h3 className="text-lg font-semibold mb-4">Add Surplus Food</h3>

      {/* Image Upload Area */}
      <div className="mb-6">
        <label className="block text-xs text-gray-400 mb-2">Food Image (Optional)</label>
        {imagePreview ? (
          <div className="relative w-40 h-32 rounded-lg overflow-hidden border border-gray-700">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={clearImage}
              className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-rose-600 transition"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-40 h-32 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:border-violet-500 hover:text-violet-400 cursor-pointer transition bg-gray-800/50"
          >
            <ImagePlus size={24} className="mb-2" />
            <span className="text-xs">Upload Photo</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">

        {/* Food Type Datalist Input */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Food type</label>
          <input
            list="food-types"
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            placeholder="Type or select food..."
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <datalist id="food-types">
            {["Bread", "curry", "salad", "rice", "pasta", "soup", "fried Snacks", "panner curry ", "Dal", "Vegetable Stir Fry", "Chicken Curry", "fish Curry", "Egg Curry ", "Soyabeam curry", "mutton Curry", "Mixed Vegetable Curry"].map(opt => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Quantity & Unit</label>
          <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden focus-within:border-violet-500">
            <input
              type="number"
              placeholder="e.g., 8"
              value={form.qtyKg}
              onChange={(e) => setForm({ ...form, qtyKg: e.target.value })}
              className="w-[70%] bg-transparent px-3 py-2 text-sm outline-none border-r border-gray-700"
            />
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-[30%] bg-gray-800 px-2 py-2 text-sm outline-none text-gray-300"
            >
              <option value="kg">kg</option>
              <option value="pieces">pieces</option>
              <option value="plates">plates</option>
              <option value="liters">liters</option>
              <option value="boxes">boxes</option>
            </select>
          </div>
        </div>

        <Select label="Freshness status" value={form.freshness}
          onChange={(v: any) => setForm({ ...form, freshness: v as any })}
          options={["Fresh", "Good", "Needs Quick Pickup"]} />

        {/* Availability Window */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Availability Window</label>
          <div className="flex gap-2">
            <input
              type="time"
              value={form.windowStart}
              onChange={(e) => setForm({ ...form, windowStart: e.target.value })}
              className="w-1/2 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
            <span className="text-gray-500 self-center">to</span>
            <input
              type="time"
              value={form.windowEnd}
              onChange={(e) => setForm({ ...form, windowEnd: e.target.value })}
              className="w-1/2 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <Select label="Storage condition" value={form.storage}
          onChange={(v: any) => setForm({ ...form, storage: v })}
          options={["Refrigerated", "Room Temp", "Frozen"]} />

        {/* Pricing */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Original Price (₹)</label>
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden focus-within:border-violet-500">
            <IndianRupee size={14} className="ml-3 text-gray-400" />
            <input
              type="number"
              placeholder="e.g., 200"
              value={form.originalPrice}
              onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              className="w-full bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {/* Discount Percentage */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Discount (%)</label>
          <select
            value={form.discountPercent}
            onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
          >
            <option value="0">No Offer</option>
            {[10, 20, 30, 40, 50, 60, 70, 80].map((pct) => (
              <option key={pct} value={String(pct)}>
                {pct}% off
              </option>
            ))}
          </select>
          {form.originalPrice && (
            <p className="text-xs text-emerald-400 mt-1">
              {Number(form.discountPercent) === 0
                ? `Listing price: ₹${Number(form.originalPrice)} (No offer)`
                : `Surplus price: ₹${surplusPrice} (${form.discountPercent}% off)`}
            </p>
          )}
        </div>

        <Input label="Date added" type="date"
          value={form.dateAdded} onChange={(v: any) => setForm({ ...form, dateAdded: v })} />
      </div>

      {/* Location Section */}
      <div className="mt-4">
        <label className="block text-xs text-gray-400 mb-2">
          <MapPin size={12} className="inline mr-1" />
          Restaurant Location (helps clients find you)
        </label>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="e.g., MG Road, Bangalore"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-700/40 bg-violet-600/10 px-3 py-2 text-xs text-violet-400 hover:bg-violet-600/20 transition disabled:opacity-50"
          >
            <Locate size={14} className={detectingLocation ? "animate-spin" : ""} />
            {detectingLocation ? "Detecting..." : "Auto-detect Location"}
          </button>
        </div>
        {form.latitude && form.longitude && (
          <p className="text-[11px] text-gray-500 mt-1.5">
            Coordinates: {form.latitude}, {form.longitude}
            <span className="text-emerald-400 ml-1">✓ Will show on map for clients</span>
          </p>
        )}
      </div>

      {/* Prediction + Actions */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* <button
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-sm font-medium"
          onClick={predictExpiry}
        >
          <Clock size={16} /> Predict Expiry (ML)
        </button>
        {predictedHours && (
          <div className="text-sm text-gray-300">
            <span className="text-violet-300 font-medium">Estimated safe window:</span> ~{predictedHours} hours
          </div>
        )} */}
        <div className="ms-auto" />
        <button
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium disabled:opacity-50"
          onClick={addListing}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Listing"}
        </button>
      </div>
    </section>
  );
}


function Input({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
      />
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
