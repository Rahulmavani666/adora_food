interface OtpEntry {
  otp: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

const globalStore = globalThis as unknown as { __otpStore?: Map<string, OtpEntry> };

if (!globalStore.__otpStore) {
  globalStore.__otpStore = new Map();
}

export const otpStore = globalStore.__otpStore;
