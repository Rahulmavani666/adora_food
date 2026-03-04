import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/verify-email-otp
 * Verifies the 6-digit OTP against in-memory store.
 *
 * Body: { otp: string, userId: string }
 */

// Import the shared OTP store from the send route
import { otpStore } from "../send-email-otp/route";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { otp, userId } = await req.json();

    if (!otp || !userId) {
      return NextResponse.json(
        { error: "OTP and userId are required" },
        { status: 400 }
      );
    }

    const entry = otpStore.get(userId);

    if (!entry) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 404 }
      );
    }

    // Check max attempts
    if (entry.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(userId);
      return NextResponse.json(
        { error: "Too many attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    // Check expiry
    if (entry.expiresAt < Date.now()) {
      otpStore.delete(userId);
      return NextResponse.json(
        { error: "OTP expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Increment attempts
    entry.attempts += 1;

    // Check OTP
    if (entry.otp !== otp) {
      return NextResponse.json(
        {
          error: `Invalid OTP. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.`,
        },
        { status: 400 }
      );
    }

    // OTP is correct — return success (client-side will update Firestore user doc)
    const verifiedEmail = entry.email;
    otpStore.delete(userId);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      email: verifiedEmail,
    });
  } catch (error) {
    console.error("Verify email OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
