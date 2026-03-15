import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { otpStore } from "../_otpStore";

/**
 * POST /api/auth/send-email-otp
 * Generates a 6-digit OTP, stores it in-memory, and sends it via Gmail (Nodemailer).
 *
 * Body: { email: string, userId: string }
 *
 * Required env vars:
 *   GMAIL_USER     – your Gmail address (e.g., yourname@gmail.com)
 *   GMAIL_APP_PASS – Gmail App Password (16 chars, from https://myaccount.google.com/apppasswords)
 */

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Create reusable transporter
function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and userId are required" },
        { status: 400 }
      );
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
      return NextResponse.json(
        { error: "Gmail credentials not configured. Add GMAIL_USER and GMAIL_APP_PASS to .env.local" },
        { status: 503 }
      );
    }

    const otp = generateOtp();

    // Store OTP in memory (10 min expiry)
    otpStore.set(userId, {
      otp,
      email,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    // Send OTP via Gmail
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"Adora Food" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code — Adora Food",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; background: #0f0f15; border-radius: 16px; color: #e5e5e5;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #a78bfa; margin: 0 0 4px 0; font-size: 20px;">🍀 Adora Food</h2>
            <p style="color: #888; font-size: 13px; margin: 0;">Email Verification</p>
          </div>
          <div style="background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="color: #aaa; font-size: 13px; margin: 0 0 12px 0;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #a78bfa; font-family: monospace;">${otp}</div>
            <p style="color: #666; font-size: 11px; margin: 12px 0 0 0;">Valid for 10 minutes</p>
          </div>
          <p style="color: #666; font-size: 11px; text-align: center; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send email OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please check Gmail credentials." },
      { status: 500 }
    );
  }
}
