import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Timestamp, writeBatch, limit
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SurplusListing, Order, OrderStatus, OrderItem,
  Notification, NotificationType, PLATFORM_FEE_RATE,
  PlatformFees, ORDER_STATUS_FLOW,
  Review, Favorite, UserStreak, UserBadge, BadgeType, Referral,
  ChatMessage, MessageSender, PaymentInfo,
  RestaurantProfile, SavedAddress, RefundRequest, RefundStatus, RefundReason
} from './types';

// ─── Helper: Generate 6-digit OTP ───
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Helper: Calculate Platform Fees ───
function calculateFees(subtotal: number): PlatformFees {
  const clientFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
  const restaurantFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
  return {
    clientFeeRate: PLATFORM_FEE_RATE,
    restaurantFeeRate: PLATFORM_FEE_RATE,
    clientFee,
    restaurantFee,
  };
}

// ────────────────────────────────────────────────────────
//  LISTING SERVICE
// ────────────────────────────────────────────────────────
export const listingService = {
  /** Subscribe to all available listings in real-time */
  subscribeToAvailableListings(callback: (listings: SurplusListing[]) => void) {
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'available')
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SurplusListing[];
      // Sort client-side to avoid requiring a composite index
      data.sort((a, b) => {
        const ta = a.dateAdded?.toMillis?.() ?? 0;
        const tb = b.dateAdded?.toMillis?.() ?? 0;
        return tb - ta;
      });
      callback(data);
    }, (error) => {
      console.error('Error subscribing to available listings:', error);
    });
  },

  /** Subscribe to a restaurant's own listings */
  subscribeToRestaurantListings(restaurantId: string, callback: (listings: SurplusListing[]) => void) {
    const q = query(
      collection(db, 'listings'),
      where('restaurantId', '==', restaurantId)
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SurplusListing[];
      data.sort((a, b) => {
        const ta = a.dateAdded?.toMillis?.() ?? 0;
        const tb = b.dateAdded?.toMillis?.() ?? 0;
        return tb - ta;
      });
      callback(data);
    }, (error) => {
      console.error('Error subscribing to restaurant listings:', error);
    });
  },

  /** Add a new surplus food listing */
  async addListing(listingData: Omit<SurplusListing, 'id' | 'dateAdded' | 'lastUpdated'>): Promise<string> {
    // Strip undefined fields — Firestore rejects them
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(listingData)) {
      if (v !== undefined) clean[k] = v;
    }
    const ref = await addDoc(collection(db, 'listings'), {
      ...clean,
      dateAdded: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    // Notify all clients about new food
    await notificationService.broadcastToRole('client', {
      type: 'new_listing',
      title: 'New Surplus Food Available!',
      message: `${listingData.restaurantName} just listed ${listingData.foodType} — ₹${listingData.surplusPrice} (was ₹${listingData.originalPrice})`,
      listingId: ref.id,
    });

    return ref.id;
  },

  /** Update a listing */
  async updateListing(listingId: string, updates: Partial<SurplusListing>): Promise<void> {
    const ref = doc(db, 'listings', listingId);
    await updateDoc(ref, { ...updates, lastUpdated: serverTimestamp() });
  },

  /** Delete a listing */
  async deleteListing(listingId: string): Promise<void> {
    await deleteDoc(doc(db, 'listings', listingId));
  },

  /** Mark listing as claimed (reduce qty or set status) */
  async markAsClaimed(listingId: string, claimedQty: number): Promise<void> {
    const ref = doc(db, 'listings', listingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Listing not found');
    const data = snap.data();
    const remaining = (data.quantity || 0) - claimedQty;
    if (remaining <= 0) {
      await updateDoc(ref, { status: 'claimed', quantity: 0, lastUpdated: serverTimestamp() });
    } else {
      await updateDoc(ref, { quantity: remaining, lastUpdated: serverTimestamp() });
    }
  },

  /** Auto-expire listings past their availability window — called client-side */
  async expireStaleListings(): Promise<number> {
    const q = query(collection(db, 'listings'), where('status', '==', 'available'));
    const snap = await getDocs(q);
    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let expired = 0;

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      const data = d.data();
      const endTime = data.availability?.end;
      // If end time exists and is past
      if (endTime && endTime < nowHHMM) {
        batch.update(d.ref, { status: 'expired', lastUpdated: serverTimestamp() });
        expired++;
      }
      // Also expire listings older than 24h
      const added = data.dateAdded?.toMillis?.() ?? 0;
      if (added > 0 && Date.now() - added > 24 * 60 * 60 * 1000) {
        batch.update(d.ref, { status: 'expired', lastUpdated: serverTimestamp() });
        expired++;
      }
    });

    if (expired > 0) await batch.commit();
    return expired;
  },
};

// ────────────────────────────────────────────────────────
//  ORDER SERVICE
// ────────────────────────────────────────────────────────
export const orderService = {
  /** Create a new order from a client claiming surplus food */
  async createOrder(orderData: {
    clientId: string;
    clientName: string;
    clientPhone?: string;
    clientAddress?: string;
    restaurantId: string;
    restaurantName: string;
    items: OrderItem[];
    notes?: string;
    payment?: PaymentInfo;
  }): Promise<string> {
    const subtotal = orderData.items.reduce((sum, item) => sum + item.itemTotal, 0);
    const fees = calculateFees(subtotal);
    const otp = generateOTP();

    // Strip undefined fields — Firestore rejects them
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(orderData)) {
      if (v !== undefined) clean[k] = v;
    }

    const order = {
      ...clean,
      subtotal,
      platformFees: fees,
      clientTotal: Math.round((subtotal + fees.clientFee) * 100) / 100,
      restaurantEarning: Math.round((subtotal - fees.restaurantFee) * 100) / 100,
      status: 'placed' as OrderStatus,
      otp,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'orders'), order);

    // Mark listings as claimed
    for (const item of orderData.items) {
      await listingService.markAsClaimed(item.listingId, item.quantity);
    }

    // Send notification to restaurant
    await notificationService.send({
      userId: orderData.restaurantId,
      userRole: 'business',
      type: 'order_placed',
      title: 'New Order Received!',
      message: `${orderData.clientName} claimed ${orderData.items.length} item(s) — ₹${order.clientTotal.toFixed(2)} total`,
      orderId: ref.id,
    });

    return ref.id;
  },

  /** Update order status and notify relevant party */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, order?: Order): Promise<void> {
    const ref = doc(db, 'orders', orderId);

    // Fetch order if not provided
    if (!order) {
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Order not found');
      order = { id: snap.id, ...snap.data() } as Order;
    }

    await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });

    // Build notification
    const statusMessages: Record<string, { title: string; msg: string; toClient: boolean }> = {
      accepted: { title: 'Order Accepted!', msg: `Your order from ${order.restaurantName} has been accepted.`, toClient: true },
      rejected: { title: 'Order Rejected', msg: `Your order from ${order.restaurantName} was rejected.`, toClient: true },
      preparing: { title: 'Food Being Prepared', msg: `${order.restaurantName} is preparing your food.`, toClient: true },
      ready: { title: 'Food Ready!', msg: `Your order from ${order.restaurantName} is ready for pickup/delivery.`, toClient: true },
      out_for_delivery: { title: 'On the Way!', msg: `Your order from ${order.restaurantName} is out for delivery.`, toClient: true },
      completed: { title: 'Order Completed!', msg: `Order #${orderId.slice(0, 6)} has been completed. Thank you!`, toClient: true },
    };

    const info = statusMessages[newStatus];
    if (info) {
      // Notify client
      if (info.toClient) {
        await notificationService.send({
          userId: order.clientId,
          userRole: 'client',
          type: newStatus === 'completed' ? 'order_completed' : 'status_update',
          title: info.title,
          message: info.msg,
          orderId,
        });
      }
      // Also notify restaurant on completion
      if (newStatus === 'completed') {
        await notificationService.send({
          userId: order.restaurantId,
          userRole: 'business',
          type: 'order_completed',
          title: 'Order Completed!',
          message: `Order #${orderId.slice(0, 6)} completed. Earning: ₹${order.restaurantEarning?.toFixed(2)}`,
          orderId,
        });
      }
    }
  },

  /** Subscribe to client's orders in real-time */
  subscribeToClientOrders(clientId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      where('clientId', '==', clientId)
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      data.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      callback(data);
    }, (error) => {
      console.error('Error subscribing to client orders:', error);
    });
  },

  /** Subscribe to restaurant's orders in real-time */
  subscribeToRestaurantOrders(restaurantId: string, callback: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId)
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      data.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      callback(data);
    }, (error) => {
      console.error('Error subscribing to restaurant orders:', error);
    });
  },

  /** Subscribe to a single order for live tracking */
  subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
    const ref = doc(db, 'orders', orderId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Order);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to order:', error);
    });
  },
};

// ────────────────────────────────────────────────────────
//  NOTIFICATION SERVICE
// ────────────────────────────────────────────────────────
export const notificationService = {
  /** Send a notification */
  async send(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Subscribe to a user's notifications in real-time */
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[];
      data.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      callback(data);
    }, (error) => {
      console.error('Error subscribing to notifications:', error);
    });
  },

  /** Mark notification as read */
  async markAsRead(notificationId: string): Promise<void> {
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
  },

  /** Mark all notifications for a user as read */
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  },

  /** Broadcast a notification to all users of a given role (e.g., new listing -> all clients) */
  async broadcastToRole(
    role: 'client' | 'business',
    data: Omit<Notification, 'id' | 'userId' | 'userRole' | 'read' | 'createdAt'>
  ): Promise<void> {
    const usersSnap = await getDocs(
      query(collection(db, 'users'), where('role', '==', role))
    );
    const promises = usersSnap.docs.map(userDoc =>
      addDoc(collection(db, 'notifications'), {
        ...data,
        userId: userDoc.id,
        userRole: role,
        read: false,
        createdAt: serverTimestamp(),
      })
    );
    await Promise.all(promises);
  },
};

// ────────────────────────────────────────────────────────
//  STATS SERVICE (for overview dashboards)
// ────────────────────────────────────────────────────────
export const statsService = {
  /** Subscribe to live stats for a restaurant */
  subscribeToRestaurantStats(restaurantId: string, callback: (stats: {
    totalListings: number;
    activeListings: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalEarnings: number;
    foodSavedKg: number;
    peopleServed: number;
  }) => void) {
    const listingsQ = query(
      collection(db, 'listings'),
      where('restaurantId', '==', restaurantId)
    );
    const ordersQ = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId)
    );

    let listings: any[] = [];
    let orders: any[] = [];

    const computeStats = () => {
      const activeListings = listings.filter(l => l.status === 'available').length;
      const completedOrders = orders.filter(o => o.status === 'completed');
      const pendingOrders = orders.filter(o => o.status === 'placed').length;
      const totalEarnings = completedOrders.reduce((s: number, o: any) => s + (o.restaurantEarning || 0), 0);
      const foodSavedKg = completedOrders.reduce((s: number, o: any) =>
        s + (o.items?.reduce((si: number, item: any) => si + (item.quantity || 0), 0) || 0), 0);
      const peopleServed = completedOrders.length * 2;

      callback({
        totalListings: listings.length,
        activeListings,
        totalOrders: orders.length,
        pendingOrders,
        completedOrders: completedOrders.length,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        foodSavedKg,
        peopleServed,
      });
    };

    const unsub1 = onSnapshot(listingsQ, (snap) => {
      listings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      computeStats();
    }, (error) => {
      console.error('Error subscribing to restaurant listing stats:', error);
    });

    const unsub2 = onSnapshot(ordersQ, (snap) => {
      orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      computeStats();
    }, (error) => {
      console.error('Error subscribing to restaurant order stats:', error);
    });

    return () => { unsub1(); unsub2(); };
  },

  /** Subscribe to live stats for a client */
  subscribeToClientStats(clientId: string, callback: (stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalSpent: number;
    totalSaved: number;
    foodRescuedKg: number;
    co2Reduced: number;
  }) => void) {
    const q = query(
      collection(db, 'orders'),
      where('clientId', '==', clientId)
    );
    return onSnapshot(q, (snap) => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      const completed = orders.filter(o => o.status === 'completed');
      const active = orders.filter(o =>
        ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status));
      const totalSpent = completed.reduce((s, o) => s + (o.clientTotal || 0), 0);
      const totalOriginal = completed.reduce((s: number, o: Order) =>
        s + (o.items?.reduce((si: number, item: OrderItem) => si + (item.originalPrice * item.quantity), 0) || 0), 0);
      const foodRescuedKg = completed.reduce((s: number, o: Order) =>
        s + (o.items?.reduce((si: number, item: OrderItem) => si + item.quantity, 0) || 0), 0);

      callback({
        totalOrders: orders.length,
        activeOrders: active.length,
        completedOrders: completed.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalSaved: Math.round((totalOriginal - totalSpent) * 100) / 100,
        foodRescuedKg,
        co2Reduced: Math.round(foodRescuedKg * 1.9 * 100) / 100,
      });
    }, (error) => {
      console.error('Error subscribing to client stats:', error);
    });
  },
};

// ────────────────────────────────────────────────────────
//  REVIEW SERVICE
// ────────────────────────────────────────────────────────
export const reviewService = {
  /** Submit a review for a completed order */
  async submitReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v;
    }
    const ref = await addDoc(collection(db, 'reviews'), {
      ...clean,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Subscribe to reviews for a restaurant */
  subscribeToRestaurantReviews(restaurantId: string, callback: (reviews: Review[]) => void) {
    const q = query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Review[];
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      callback(data);
    }, (error) => {
      console.error('Error subscribing to reviews:', error);
    });
  },

  /** Check if user already reviewed an order */
  async hasReviewed(orderId: string): Promise<boolean> {
    const q = query(collection(db, 'reviews'), where('orderId', '==', orderId));
    const snap = await getDocs(q);
    return !snap.empty;
  },

  /** Get average rating for a restaurant */
  subscribeToRestaurantRating(restaurantId: string, callback: (avg: number, count: number) => void) {
    const q = query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId));
    return onSnapshot(q, (snap) => {
      const reviews = snap.docs.map(d => d.data());
      const count = reviews.length;
      const avg = count > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
      callback(Math.round(avg * 10) / 10, count);
    });
  },
};

// ────────────────────────────────────────────────────────
//  FAVORITES SERVICE
// ────────────────────────────────────────────────────────
export const favoriteService = {
  /** Toggle favorite restaurant */
  async toggleFavorite(clientId: string, restaurantId: string, restaurantName: string): Promise<boolean> {
    const q = query(
      collection(db, 'favorites'),
      where('clientId', '==', clientId),
      where('restaurantId', '==', restaurantId)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      await addDoc(collection(db, 'favorites'), {
        clientId, restaurantId, restaurantName,
        createdAt: serverTimestamp(),
      });
      return true; // added
    } else {
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      return false; // removed
    }
  },

  /** Subscribe to a client's favorites */
  subscribeToFavorites(clientId: string, callback: (favorites: Favorite[]) => void) {
    const q = query(collection(db, 'favorites'), where('clientId', '==', clientId));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Favorite[];
      callback(data);
    }, (error) => {
      console.error('Error subscribing to favorites:', error);
    });
  },
};

// ────────────────────────────────────────────────────────
//  STREAK & BADGES SERVICE
// ────────────────────────────────────────────────────────
export const streakService = {
  /** Get or initialize streak data for a user */
  async getStreak(userId: string): Promise<UserStreak> {
    const ref = doc(db, 'streaks', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as UserStreak;
    const initial: UserStreak = {
      currentStreak: 0,
      longestStreak: 0,
      lastOrderDate: '',
      badges: [],
    };
    return initial;
  },

  /** Record a completed order and update streak */
  async recordOrderCompletion(userId: string, totalOrders: number, totalFoodKg: number): Promise<UserBadge[]> {
    const ref = doc(db, 'streaks', userId);
    const snap = await getDoc(ref);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let streak: UserStreak;
    if (snap.exists()) {
      streak = snap.data() as UserStreak;
    } else {
      streak = { currentStreak: 0, longestStreak: 0, lastOrderDate: '', badges: [] };
    }

    // Update streak
    if (streak.lastOrderDate === today) {
      // Already counted today
    } else if (streak.lastOrderDate === yesterday) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }
    streak.lastOrderDate = today;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    // Check for new badges
    const newBadges: UserBadge[] = [];
    const earned = new Set(streak.badges.map(b => b.type));

    const checks: [boolean, BadgeType][] = [
      [totalOrders >= 1 && !earned.has('first_rescue'), 'first_rescue'],
      [streak.currentStreak >= 3 && !earned.has('streak_3'), 'streak_3'],
      [streak.currentStreak >= 7 && !earned.has('streak_7'), 'streak_7'],
      [streak.currentStreak >= 30 && !earned.has('streak_30'), 'streak_30'],
      [totalOrders >= 10 && !earned.has('food_hero_10'), 'food_hero_10'],
      [totalOrders >= 50 && !earned.has('food_hero_50'), 'food_hero_50'],
      [totalFoodKg >= 50 && !earned.has('eco_warrior'), 'eco_warrior'],
    ];

    for (const [cond, type] of checks) {
      if (cond) {
        const badge: UserBadge = { type, earnedAt: serverTimestamp() };
        streak.badges.push(badge);
        newBadges.push(badge);
      }
    }

    await updateDoc(ref, streak as any).catch(async () => {
      // doc doesn't exist yet, set it
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, streak);
    });

    return newBadges;
  },
};

// ────────────────────────────────────────────────────────
//  REFERRAL SERVICE
// ────────────────────────────────────────────────────────
export const referralService = {
  /** Generate a referral code for a user */
  generateCode(userId: string): string {
    return `SURPLUS-${userId.slice(0, 6).toUpperCase()}`;
  },

  /** Save referral record when someone signs up with a code */
  async redeemReferral(code: string, newUserId: string, newUserName: string): Promise<boolean> {
    // Find referrer by code pattern
    const referrerId = code.replace('SURPLUS-', '').toLowerCase();
    // Check if referrer exists
    const userSnap = await getDocs(query(collection(db, 'users')));
    const referrer = userSnap.docs.find(d => d.id.slice(0, 6).toLowerCase() === referrerId);
    if (!referrer) return false;

    await addDoc(collection(db, 'referrals'), {
      referrerId: referrer.id,
      referrerName: referrer.data().displayName || 'User',
      referredUserId: newUserId,
      referredUserName: newUserName,
      code,
      redeemed: true,
      createdAt: serverTimestamp(),
    });
    return true;
  },

  /** Subscribe to referrals for a user */
  subscribeToReferrals(userId: string, callback: (referrals: Referral[]) => void) {
    const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Referral[];
      callback(data);
    }, (error) => {
      console.error('Error subscribing to referrals:', error);
    });
  },
};

// ────────────────────────────────────────────────────────
//  CHAT SERVICE
// ────────────────────────────────────────────────────────
export const chatService = {
  /** Send a message for a specific order */
  async sendMessage(data: {
    orderId: string;
    senderId: string;
    senderRole: MessageSender;
    senderName: string;
    text: string;
  }): Promise<string> {
    const ref = await addDoc(
      collection(db, 'orders', data.orderId, 'messages'),
      {
        orderId: data.orderId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        senderName: data.senderName,
        text: data.text,
        createdAt: serverTimestamp(),
      }
    );
    return ref.id;
  },

  /** Subscribe to messages for an order in real time (ordered by createdAt asc) */
  subscribeToMessages(orderId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'orders', orderId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChatMessage[];
      callback(data);
    }, (error) => {
      console.error('Error subscribing to chat messages:', error);
    });
  },

  /** Get unread message count (messages not from the given role) */
  subscribeToUnreadCount(
    orderId: string,
    myRole: MessageSender,
    callback: (count: number) => void
  ) {
    const q = query(
      collection(db, 'orders', orderId, 'messages'),
      where('senderRole', '!=', myRole)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.size);
    });
  },
};

// ────────────────────────────────────────────────────────
//  RESTAURANT PROFILE SERVICE
// ────────────────────────────────────────────────────────
export const restaurantProfileService = {
  /** Get or create a restaurant profile */
  async getProfile(restaurantId: string): Promise<RestaurantProfile | null> {
    const ref = doc(db, 'restaurantProfiles', restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { id: snap.id, ...snap.data() } as RestaurantProfile;
    return null;
  },

  /** Save/update restaurant profile */
  async saveProfile(restaurantId: string, data: Partial<RestaurantProfile>): Promise<void> {
    const ref = doc(db, 'restaurantProfiles', restaurantId);
    const snap = await getDoc(ref);
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v;
    }
    if (snap.exists()) {
      await updateDoc(ref, { ...clean, updatedAt: serverTimestamp() });
    } else {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, { ...clean, id: restaurantId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  },

  /** Subscribe to a restaurant profile */
  subscribeToProfile(restaurantId: string, callback: (profile: RestaurantProfile | null) => void) {
    const ref = doc(db, 'restaurantProfiles', restaurantId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as RestaurantProfile);
      } else {
        callback(null);
      }
    });
  },

  /** Get all restaurant profiles (for client browsing) */
  subscribeToAllProfiles(callback: (profiles: RestaurantProfile[]) => void) {
    const q = query(collection(db, 'restaurantProfiles'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RestaurantProfile[];
      callback(data);
    });
  },
};

// ────────────────────────────────────────────────────────
//  SAVED ADDRESS SERVICE
// ────────────────────────────────────────────────────────
export const savedAddressService = {
  /** Add a saved address */
  async addAddress(data: Omit<SavedAddress, 'id' | 'createdAt'>): Promise<string> {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      const q = query(collection(db, 'savedAddresses'), where('userId', '==', data.userId), where('isDefault', '==', true));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { isDefault: false }));
      if (!snap.empty) await batch.commit();
    }
    const ref = await addDoc(collection(db, 'savedAddresses'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Delete a saved address */
  async deleteAddress(addressId: string): Promise<void> {
    await deleteDoc(doc(db, 'savedAddresses', addressId));
  },

  /** Subscribe to user's saved addresses */
  subscribeToAddresses(userId: string, callback: (addresses: SavedAddress[]) => void) {
    const q = query(collection(db, 'savedAddresses'), where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SavedAddress[];
      data.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      callback(data);
    });
  },

  /** Set an address as default */
  async setDefault(userId: string, addressId: string): Promise<void> {
    const q = query(collection(db, 'savedAddresses'), where('userId', '==', userId), where('isDefault', '==', true));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { isDefault: false }));
    batch.update(doc(db, 'savedAddresses', addressId), { isDefault: true });
    await batch.commit();
  },
};

// ────────────────────────────────────────────────────────
//  REFUND / DISPUTE SERVICE
// ────────────────────────────────────────────────────────
export const refundService = {
  /** Submit a refund request */
  async submitRefund(data: Omit<RefundRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'refunds'), {
      ...data,
      status: 'requested' as RefundStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Notify restaurant
    await notificationService.send({
      userId: data.restaurantId,
      userRole: 'business',
      type: 'status_update',
      title: 'Refund Requested',
      message: `${data.clientName} has requested a refund for order #${data.orderId.slice(0, 6)}`,
      orderId: data.orderId,
    });

    return ref.id;
  },

  /** Update refund status (admin/restaurant) */
  async updateRefundStatus(refundId: string, status: RefundStatus, adminNote?: string): Promise<void> {
    const ref = doc(db, 'refunds', refundId);
    const updates: Record<string, any> = { status, updatedAt: serverTimestamp() };
    if (adminNote) updates.adminNote = adminNote;
    await updateDoc(ref, updates);

    // If approved, update payment status on order
    if (status === 'approved') {
      const refundSnap = await getDoc(ref);
      if (refundSnap.exists()) {
        const refundData = refundSnap.data();
        const orderRef = doc(db, 'orders', refundData.orderId);
        await updateDoc(orderRef, { 'payment.status': 'refunded', updatedAt: serverTimestamp() });

        // Notify client
        await notificationService.send({
          userId: refundData.clientId,
          userRole: 'client',
          type: 'status_update',
          title: 'Refund Approved',
          message: `Your refund of ₹${refundData.amount} has been approved.`,
          orderId: refundData.orderId,
        });
      }
    }
  },

  /** Subscribe to refunds for a client */
  subscribeToClientRefunds(clientId: string, callback: (refunds: RefundRequest[]) => void) {
    const q = query(collection(db, 'refunds'), where('clientId', '==', clientId));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RefundRequest[];
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      callback(data);
    });
  },

  /** Subscribe to refunds for a restaurant */
  subscribeToRestaurantRefunds(restaurantId: string, callback: (refunds: RefundRequest[]) => void) {
    const q = query(collection(db, 'refunds'), where('restaurantId', '==', restaurantId));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RefundRequest[];
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      callback(data);
    });
  },

  /** Subscribe to all refunds (admin) */
  subscribeToAllRefunds(callback: (refunds: RefundRequest[]) => void) {
    const q = query(collection(db, 'refunds'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RefundRequest[];
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      callback(data);
    });
  },
};

// ────────────────────────────────────────────────────────
//  ADMIN SERVICE
// ────────────────────────────────────────────────────────
export const adminService = {
  /** Get platform-wide stats */
  subscribeToPlatformStats(callback: (stats: {
    totalUsers: number;
    totalRestaurants: number;
    totalClients: number;
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    platformEarnings: number;
    totalFoodSavedKg: number;
    co2Reduced: number;
    totalListings: number;
    activeListings: number;
    pendingRefunds: number;
  }) => void) {
    let users: any[] = [];
    let orders: any[] = [];
    let listings: any[] = [];
    let refunds: any[] = [];

    const compute = () => {
      const restaurants = users.filter(u => u.role === 'business').length;
      const clients = users.filter(u => u.role === 'client').length;
      const completed = orders.filter(o => o.status === 'completed');
      const totalRevenue = completed.reduce((s: number, o: any) => s + (o.clientTotal || 0), 0);
      const platformEarnings = completed.reduce((s: number, o: any) => s + ((o.platformFees?.clientFee || 0) + (o.platformFees?.restaurantFee || 0)), 0);
      const foodSavedKg = completed.reduce((s: number, o: any) =>
        s + (o.items?.reduce((si: number, item: any) => si + (item.quantity || 0), 0) || 0), 0);
      const activeListings = listings.filter(l => l.status === 'available').length;
      const pendingRefunds = refunds.filter(r => r.status === 'requested').length;

      callback({
        totalUsers: users.length,
        totalRestaurants: restaurants,
        totalClients: clients,
        totalOrders: orders.length,
        completedOrders: completed.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        platformEarnings: Math.round(platformEarnings * 100) / 100,
        totalFoodSavedKg: foodSavedKg,
        co2Reduced: Math.round(foodSavedKg * 1.9 * 100) / 100,
        totalListings: listings.length,
        activeListings,
        pendingRefunds,
      });
    };

    const u1 = onSnapshot(query(collection(db, 'users')), snap => { users = snap.docs.map(d => ({ id: d.id, ...d.data() })); compute(); });
    const u2 = onSnapshot(query(collection(db, 'orders')), snap => { orders = snap.docs.map(d => ({ id: d.id, ...d.data() })); compute(); });
    const u3 = onSnapshot(query(collection(db, 'listings')), snap => { listings = snap.docs.map(d => ({ id: d.id, ...d.data() })); compute(); });
    const u4 = onSnapshot(query(collection(db, 'refunds')), snap => { refunds = snap.docs.map(d => ({ id: d.id, ...d.data() })); compute(); });

    return () => { u1(); u2(); u3(); u4(); };
  },

  /** Get all users */
  subscribeToAllUsers(callback: (users: any[]) => void) {
    return onSnapshot(query(collection(db, 'users')), snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  /** Get all orders */
  subscribeToAllOrders(callback: (orders: Order[]) => void) {
    return onSnapshot(query(collection(db, 'orders')), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      callback(data);
    });
  },
};
