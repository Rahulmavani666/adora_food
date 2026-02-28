"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { chatService } from "@/lib/firebase-services";
import type { ChatMessage, MessageSender } from "@/lib/types";

interface OrderChatProps {
  orderId: string;
  orderLabel: string;        // e.g., "Order #a1b2c3"
  senderId: string;
  senderRole: MessageSender;
  senderName: string;
  otherName: string;         // e.g., restaurant name or client name
  open: boolean;
  onClose: () => void;
}

/**
 * Per-order chat drawer.
 * Uses Firestore subcollection: orders/{orderId}/messages
 */
export default function OrderChat({
  orderId,
  orderLabel,
  senderId,
  senderRole,
  senderName,
  otherName,
  open,
  onClose,
}: OrderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!open || !orderId) return;
    const unsub = chatService.subscribeToMessages(orderId, setMessages);
    return () => unsub();
  }, [open, orderId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setDraft("");
    try {
      await chatService.sendMessage({
        orderId,
        senderId,
        senderRole,
        senderName,
        text,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setDraft(text); // restore draft on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Chat Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col bg-gray-900 border-l border-gray-800 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/95 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-100 truncate flex items-center gap-2">
              <MessageCircle size={15} className="text-violet-400 shrink-0" />
              {orderLabel}
            </h3>
            <p className="text-xs text-gray-400 truncate">Chat with {otherName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <MessageCircle size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">
                Send a message about this order — e.g., &ldquo;Running 5 min late&rdquo; or &ldquo;We substituted X for Y&rdquo;
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === senderId;
            const ts = msg.createdAt?.toDate?.();
            const time = ts
              ? ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    isMe
                      ? "bg-violet-600 text-white rounded-br-md"
                      : "bg-gray-800 text-gray-200 rounded-bl-md border border-gray-700"
                  }`}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 px-1">
                  <span className="text-[10px] text-gray-500">
                    {isMe ? "You" : msg.senderName}
                  </span>
                  {time && (
                    <span className="text-[10px] text-gray-600">{time}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick replies */}
        <div className="px-4 pb-1 flex gap-1.5 flex-wrap shrink-0">
          {(senderRole === "client"
            ? ["I'm on my way", "Running 5 min late", "Can I get extra sauce?", "Thank you!"]
            : ["We're preparing your order", "Substituted X for Y", "Ready for pickup!", "Running a bit late"]
          ).map((quickMsg) => (
            <button
              key={quickMsg}
              onClick={() => setDraft(quickMsg)}
              className="text-[10px] px-2 py-1 rounded-full border border-gray-700 text-gray-400 hover:text-violet-300 hover:border-violet-600/40 transition"
            >
              {quickMsg}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-xl bg-gray-800 border border-gray-700 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Chat badge button — shows unread count indicator.
 */
export function ChatButton({
  orderId,
  myRole,
  onClick,
  compact = false,
}: {
  orderId: string;
  myRole: MessageSender;
  onClick: () => void;
  compact?: boolean;
}) {
  const [unread, setUnread] = useState(0);
  const [prevCount, setPrevCount] = useState(0);

  useEffect(() => {
    const unsub = chatService.subscribeToUnreadCount(orderId, myRole, (count) => {
      setUnread(count);
      setPrevCount((prev) => {
        // Only flash when count increases
        if (count > prev) return count;
        return prev;
      });
    });
    return () => unsub();
  }, [orderId, myRole]);

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 rounded-lg border transition ${
        compact
          ? "p-1.5 border-gray-700 hover:bg-white/5"
          : "border-sky-700/40 bg-sky-600/10 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-600/20"
      }`}
      title="Chat about this order"
    >
      <MessageCircle size={compact ? 14 : 13} className={compact ? "text-sky-400" : ""} />
      {!compact && "Chat"}
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-sky-500 text-white text-[9px] font-bold px-1 animate-pulse">
          {unread}
        </span>
      )}
    </button>
  );
}
