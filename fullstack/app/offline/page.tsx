"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
      <p className="text-gray-400 text-center max-w-sm mb-6">
        It looks like you&apos;ve lost your internet connection. Please check
        your network and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 transition font-medium"
      >
        Retry
      </button>
    </div>
  );
}
