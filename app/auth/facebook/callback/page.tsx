"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleOAuthCallback, clearOAuthSession, getOAuthRedirectUrl } from "@/services/social-auth";

export default function FacebookCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Process OAuth callback
        await handleOAuthCallback(searchParams);

        // Clear OAuth session
        clearOAuthSession();

        // Get redirect URL from session (default to home)
        const redirectUrl = getOAuthRedirectUrl();

        // Redirect to the stored URL or home
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1000);
      } catch (err: any) {
        console.error("Callback error:", err);
        setError(err.message || "Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-600">Memproses login dengan Facebook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200">
        <div className="text-center">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Login Gagal</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    </div>
  );
}
