"use client";
import { useEffect, useState, useRef } from "react";
import { notificationService } from "@/lib/firebase-services";
import type { Notification } from "@/lib/types";
import { toast } from "sonner";

const NOTIF_ICONS: Record<string, string> = {
  new_listing: "🍽️",
  order_placed: "📦",
  order_accepted: "✅",
  order_rejected: "❌",
  status_update: "🔄",
  order_completed: "🎉",
  listing_expiring: "⏰",
};

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!userId) return;
    const unsub = notificationService.subscribeToNotifications(userId, (notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);

      // Show toast for genuinely new notifications (skip initial load)
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        prevIdsRef.current = new Set(notifs.map(n => n.id));
        return;
      }

      const prevIds = prevIdsRef.current;
      const newNotifs = notifs.filter(n => !prevIds.has(n.id) && !n.read);
      for (const n of newNotifs) {
        toast(n.title, {
          description: n.message,
          icon: NOTIF_ICONS[n.type] || "🔔",
          duration: 5000,
        });
      }
      prevIdsRef.current = new Set(notifs.map(n => n.id));
    });
    return () => unsub();
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    if (userId) await notificationService.markAllAsRead(userId);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
