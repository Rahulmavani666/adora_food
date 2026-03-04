import { NextRequest, NextResponse } from 'next/server';

function createRazorpayInstance() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log('[Razorpay] Creating order with key:', keyId?.slice(0, 12) + '...');

    if (!keyId || keyId === 'rzp_test_YOUR_KEY_ID' || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay keys not configured. Add real keys to .env.local' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { amount, currency = 'INR', receipt, notes } = body;

    console.log('[Razorpay] Order request — amount:', amount, 'currency:', currency);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount * 100);

    // Always create a fresh instance to pick up latest env vars
    const razorpay = createRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    console.log('[Razorpay] Order created successfully:', order.id);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('[Razorpay] Create order FAILED:', error?.message || error);
    console.error('[Razorpay] Error details:', JSON.stringify(error?.error || error, null, 2));
    return NextResponse.json(
      { error: error?.error?.description || error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
