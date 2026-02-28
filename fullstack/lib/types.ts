// ─── Core Types for Surplus Food Redistribution Platform ───

export type UserRole = 'client' | 'business';

export interface PlatformUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  orgName?: string;
  phone?: string;
  address?: string;
  createdAt: any;
}

// ─── Listings (Surplus Food) ───

export type FreshnessStatus = 'Fresh' | 'Good' | 'Needs Quick Pickup';
export type StorageCondition = 'Refrigerated' | 'Room Temp' | 'Frozen';
export type ListingStatus = 'available' | 'claimed' | 'expired' | 'removed';

export interface SurplusListing {
  id: string;
  restaurantId: string;
  restaurantName: string;
  foodType: string;
  description?: string;
  quantity: number;
  unit: string;
  originalPrice: number;      // restaurant's original price
  surplusPrice: number;       // discounted price (typically ~50%)
  freshnessStatus: FreshnessStatus;
  storageCondition: StorageCondition;
  availability: {
    start: string | null;
    end: string | null;
  };
  location?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string | null;
  status: ListingStatus;
  dateAdded: any;
  lastUpdated: any;
}

// ─── Orders ───

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
];

export interface OrderItem {
  listingId: string;
  foodType: string;
  quantity: number;
  unit: string;
  surplusPrice: number;
  originalPrice: number;
  itemTotal: number;        // surplusPrice * quantity
}

export interface PlatformFees {
  clientFeeRate: number;       // e.g. 0.05 = 5%
  restaurantFeeRate: number;   // e.g. 0.05 = 5%
  clientFee: number;           // actual fee amount
  restaurantFee: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'razorpay' | 'pay_on_pickup';

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: any;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;           // sum of itemTotal
  platformFees: PlatformFees;
  clientTotal: number;        // subtotal + clientFee
  restaurantEarning: number;  // subtotal - restaurantFee
  status: OrderStatus;
  otp: string;                // 6-digit verification code
  payment?: PaymentInfo;      // payment gateway info
  notes?: string;
  deliveryProofUrl?: string;  // photo proof of delivery/pickup
  estimatedPickupMin?: number;  // estimated pickup time in minutes
  createdAt: any;
  updatedAt: any;
}

// ─── Notifications ───

export type NotificationType =
  | 'new_listing'        // restaurant added new food → notify all clients
  | 'order_placed'       // client claimed food → notify restaurant
  | 'order_accepted'     // restaurant accepted → notify client
  | 'order_rejected'     // restaurant rejected → notify client
  | 'status_update'      // status changed → notify client
  | 'order_completed'    // order done → notify both
  | 'listing_expiring';  // listing about to expire → notify restaurant

export interface Notification {
  id: string;
  userId: string;          // recipient user ID
  userRole: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  listingId?: string;
  read: boolean;
  createdAt: any;
}

// ─── Events ───

export interface SurplusEvent {
  id: string;
  title: string;
  date: any;
  expect?: string;
  createdBy: string;
  orgName?: string;
  createdAt: any;
}

// ─── Reviews / Ratings ───

export interface Review {
  id: string;
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  clientId: string;
  clientName: string;
  rating: number;           // 1-5 stars
  comment?: string;
  createdAt: any;
}

// ─── Favorites ───

export interface Favorite {
  id: string;
  clientId: string;
  restaurantId: string;
  restaurantName: string;
  createdAt: any;
}

// ─── Streaks / Badges ───

export type BadgeType =
  | 'first_rescue'         // First completed order
  | 'streak_3'             // 3-day streak
  | 'streak_7'             // 7-day streak
  | 'streak_30'            // 30-day streak
  | 'food_hero_10'         // 10 completed orders
  | 'food_hero_50'         // 50 completed orders
  | 'eco_warrior'          // 50kg+ food rescued
  | 'referral_star';       // First successful referral

export interface UserBadge {
  type: BadgeType;
  earnedAt: any;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastOrderDate: string;   // YYYY-MM-DD
  badges: UserBadge[];
}

// ─── Referrals ───

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredUserId: string;
  referredUserName: string;
  code: string;
  redeemed: boolean;
  createdAt: any;
}

// ─── Chat Messages ───

export type MessageSender = 'client' | 'restaurant';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: MessageSender;
  senderName: string;
  text: string;
  createdAt: any;
}

// ─── Constants ───

export const PLATFORM_FEE_RATE = 0.05; // 5% platform fee for both sides
export const DEFAULT_DISCOUNT = 0.5;   // 50% off original price for surplus
