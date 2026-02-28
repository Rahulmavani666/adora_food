"use client";
import { useEffect, useState } from "react";
import { Share2, Copy, Check, Gift, Users } from "lucide-react";
import { referralService } from "@/lib/firebase-services";
import type { Referral } from "@/lib/types";
import { toast } from "sonner";

export default function ReferralSection({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    // Generate or get existing referral code
    setCode(referralService.generateCode(clientId));
    const unsub = referralService.subscribeToReferrals(clientId, setReferrals);
    return () => unsub();
  }, [clientId, clientName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      await referralService.redeemReferral(redeemCode.trim(), clientId, clientName);
      toast.success("Referral code redeemed! 🎉");
      setRedeemCode("");
    } catch (err: any) {
      toast.error(err.message || "Invalid referral code");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5 shadow">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Gift size={16} className="text-emerald-400" />
        Referral Program
      </h3>

      {/* Share your code */}
      <div className="rounded-lg border border-emerald-700/30 bg-emerald-600/5 p-4 mb-4">
        <p className="text-sm text-gray-300 mb-2">Share your code with friends:</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 font-mono text-sm text-emerald-400 tracking-wider">
            {code || "Loading..."}
          </div>
          <button
            onClick={handleCopy}
            disabled={!code}
            className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {navigator.share && (
            <button
              onClick={() => {
                navigator.share({
                  title: "Join Surplus Food Platform!",
                  text: `Use my referral code ${code} to join and help reduce food waste!`,
                });
              }}
              className="p-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 transition"
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Redeem a code */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter a referral code..."
          value={redeemCode}
          onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
          className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-violet-500 placeholder-gray-500 font-mono"
        />
        <button
          onClick={handleRedeem}
          disabled={redeeming || !redeemCode.trim()}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-medium disabled:opacity-50"
        >
          {redeeming ? "..." : "Redeem"}
        </button>
      </div>

      {/* Referral stats */}
      {referrals.length > 0 && (
        <div className="rounded-lg border border-gray-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-violet-400" />
            <span className="text-sm font-medium text-gray-300">
              {referrals.length} friend{referrals.length > 1 ? "s" : ""} referred
            </span>
          </div>
          <div className="space-y-1">
            {referrals.slice(0, 5).map(r => (
              <p key={r.id} className="text-xs text-gray-500">
                {r.referredUserName} joined {r.createdAt?.toDate?.()?.toLocaleDateString() || ""}
              </p>
            ))}
            {referrals.length > 5 && (
              <p className="text-xs text-gray-600">+{referrals.length - 5} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
