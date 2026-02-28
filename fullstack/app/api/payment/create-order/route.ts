import { NextRequest, NextResponse } from 'next/server';

let razorpayInstance: any = null;

function getRazorpay() {
  if (!razorpayInstance) {
    // Dynamic import avoids crashing at module-load time when keys are missing
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return razorpayInstance;
}

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId || keyId === 'rzp_test_YOUR_KEY_ID') {
      return NextResponse.json(
        { error: 'Razorpay keys not configured. Add real keys to .env.local' },
        { status: 503 }
      );
    }

    const { amount, currency = 'INR', receipt, notes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount * 100);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
