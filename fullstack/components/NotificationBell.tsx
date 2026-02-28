"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/lib/types";

function timeAgo(date: any): string {
  if (!date) return "";
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getNotifIcon(type: string): string {
  switch (type) {
    case "new_listing": return "🍽️";
    case "order_placed": return "📦";
    case "order_accepted": return "✅";
    case "order_rejected": return "❌";
    case "status_update": return "🔄";
    case "order_completed": return "🎉";
    case "listing_expiring": return "⏰";
    default: return "🔔";
  }
}

export default function NotificationBell({ userId }: { userId: string | null }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Play sound on new unread notification
  const [prevCount, setPrevCount] = useState(0);
  useEffect(() => {
    if (unreadCount > prevCount && prevCount > 0) {
      // Simple audio notification (browser beep)
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 800;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 150);
      } catch {}
    }
    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-400 hover:text-white transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h4 className="text-sm font-semibold text-gray-200">Notifications</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No notifications yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-gray-800/50 cursor-pointer transition ${
                    !notif.read ? "bg-violet-900/10 border-l-2 border-l-violet-500" : ""
                  }`}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getNotifIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-200 truncate">{notif.title}</p>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
