"use client";
import { useState } from "react";
import { Star, X } from "lucide-react";
import { reviewService } from "@/lib/firebase-services";
import type { Order } from "@/lib/types";
import { toast } from "sonner";

interface ReviewModalProps {
  order: Order;
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export default function ReviewModal({ order, clientId, clientName, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.submitReview({
        orderId: order.id,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        clientId,
        clientName,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Review submitted! Thank you.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Rate Your Order</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-1">
          Order #{order.id.slice(0, 6)} from <span className="text-gray-200">{order.restaurantName}</span>
        </p>
        <p className="text-xs text-gray-500 mb-4">
          {order.items?.map(i => i.foodType).join(", ")}
        </p>

        {/* Star rating */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-600"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 self-center text-sm text-gray-400">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </span>
          )}
        </div>

        {/* Comment */}
        <textarea
          placeholder="Share your experience (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none placeholder-gray-500"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5">
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
