'use client';

import React, { useState, useEffect, useRef } from 'react';
import { orderService } from '@/lib/firebase-services';
import type { Order, OrderStatus } from '@/lib/types';
import { toast } from 'sonner';
import { ChevronRight, Package, CheckCircle2, Camera, Image as ImageIcon, X, MessageCircle, CreditCard, Banknote } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OrderChat, { ChatButton } from '@/components/OrderChat';
import LoadingScreen from '@/components/ui/LoadingScreen';

const statusFlow: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'placed', label: 'Placed', color: 'bg-yellow-600' },
  { key: 'accepted', label: 'Accepted', color: 'bg-blue-600' },
  { key: 'preparing', label: 'Preparing', color: 'bg-orange-600' },
  { key: 'ready', label: 'Ready', color: 'bg-green-600' },
  { key: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-600' },
  { key: 'completed', label: 'Completed', color: 'bg-gray-600' },
];

function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = statusFlow.findIndex(s => s.key === current);
  if (idx === -1 || idx >= statusFlow.length - 1) return null;
  return statusFlow[idx + 1].key;
}

export default function RestaurantOrderManager({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUploadOrderId, setPhotoUploadOrderId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = orderService.subscribeToRestaurantOrders(restaurantId, (data) => {
      setOrders(data.filter(o => !['completed', 'rejected', 'cancelled'].includes(o.status)));
      setLoading(false);
    });
    return () => unsub();
  }, [restaurantId]);

  const advanceStatus = async (order: Order) => {
    const next = nextStatus(order.status);
    if (!next) return;

    // If advancing to 'completed', prompt for photo proof first
    if (next === 'completed') {
      setPhotoUploadOrderId(order.id);
      return;
    }

    try {
      await orderService.updateOrderStatus(order.id, next, order);
      toast.success(`Order #${order.id.slice(0, 6)} → ${next.replace('_', ' ')}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAndComplete = async (withPhoto: boolean) => {
    if (!photoUploadOrderId) return;
    const order = orders.find(o => o.id === photoUploadOrderId);
    if (!order) return;

    setUploadingPhoto(true);
    try {
      let proofUrl: string | undefined;

      if (withPhoto && fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
        formData.append('folder', 'delivery_proofs');

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        if (cloudName) {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          proofUrl = data.secure_url;
        }
      }

      // Save proof URL to order if available
      if (proofUrl) {
        await updateDoc(doc(db, 'orders', order.id), { deliveryProofUrl: proofUrl });
      }

      await orderService.updateOrderStatus(order.id, 'completed', order);
      toast.success(`Order #${order.id.slice(0, 6)} completed!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete order');
    } finally {
      setUploadingPhoto(false);
      setPhotoUploadOrderId(null);
      setProofPreview(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70">
        <LoadingScreen variant="section" title="Loading orders" />
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Active Orders</h3>
        <span className="text-xs text-gray-400">{orders.length} in progress</span>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center gap-3 text-gray-500 py-8 justify-center">
          <CheckCircle2 size={20} />
          <p>All orders processed! New orders appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const current = statusFlow.find(s => s.key === order.status);
            const next = nextStatus(order.status);
            const nextLabel = statusFlow.find(s => s.key === next)?.label;

            return (
              <div key={order.id} className="border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Package size={16} className="text-violet-400" />
                      Order #{order.id.slice(0, 6)}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">{order.clientName}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.items?.map((i, idx) => (
                        <span key={idx}>
                          {i.foodType} ×{i.quantity}
                          <span className="text-emerald-400 ml-1">₹{i.surplusPrice}</span>
                          <span className="text-gray-600 line-through ml-0.5">₹{i.originalPrice}</span>
                          {idx < (order.items?.length || 0) - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${current?.color || 'bg-gray-600'}`}>
                    {current?.label || order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <div className="text-sm flex items-center flex-wrap gap-2">
                    <span>
                      <span className="text-gray-400">Earning: </span>
                      <span className="text-emerald-400 font-semibold">₹{order.restaurantEarning?.toFixed(2)}</span>
                    </span>
                    {order.otp && (
                      <span className="text-gray-400">
                        OTP: <span className="text-violet-300 font-mono font-bold tracking-wider">{order.otp}</span>
                      </span>
                    )}
                    {/* Payment badge */}
                    {order.payment ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        order.payment.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        <CreditCard size={9} />
                        {order.payment.status === 'paid' ? 'Paid' : order.payment.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-500/15 text-gray-400">
                        <Banknote size={9} /> CoD
                      </span>
                    )}
                  </div>

                  {next && (
                    <button
                      onClick={() => advanceStatus(order)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm"
                    >
                      {nextLabel} <ChevronRight size={14} />
                    </button>
                  )}
                  <ChatButton
                    orderId={order.id}
                    myRole="restaurant"
                    onClick={() => setChatOrder(order)}
                    compact
                  />
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Created: {order.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Proof Modal */}
      {photoUploadOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Camera size={18} className="text-violet-400" />
                Delivery Proof
              </h3>
              <button onClick={() => { setPhotoUploadOrderId(null); setProofPreview(null); }}
                className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Upload a photo of the pickup/delivery to confirm completion. This builds trust with clients.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {proofPreview ? (
              <div className="relative mb-4">
                <img src={proofPreview} alt="Proof" className="w-full h-48 object-cover rounded-lg border border-gray-700" />
                <button
                  onClick={() => { setProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-violet-500 hover:text-violet-400 transition mb-4"
              >
                <ImageIcon size={28} />
                <span className="text-sm">Tap to take or select a photo</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => uploadAndComplete(false)}
                disabled={uploadingPhoto}
                className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 border border-gray-700 hover:bg-white/5 disabled:opacity-50"
              >
                Skip &amp; Complete
              </button>
              <button
                onClick={() => uploadAndComplete(true)}
                disabled={uploadingPhoto || !proofPreview}
                className="flex-1 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-medium disabled:opacity-50"
              >
                {uploadingPhoto ? "Uploading..." : "Upload & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Chat Drawer */}
      {chatOrder && (
        <OrderChat
          orderId={chatOrder.id}
          orderLabel={`Order #${chatOrder.id.slice(0, 6)}`}
          senderId={restaurantId}
          senderRole="restaurant"
          senderName={chatOrder.restaurantName || "Restaurant"}
          otherName={chatOrder.clientName}
          open={true}
          onClose={() => setChatOrder(null)}
        />
      )}
    </section>
  );
}