"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleOAuthCallback, clearOAuthSession, getOAuthRedirectUrl } from "@/services/social-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check if backend returned error via URL params
        const success = searchParams.get("success");
        const message = searchParams.get("message");

        if (success === "false" && message) {
          // Backend returned error - decode the message
          const decodedMessage = decodeURIComponent(message);
          console.error("Backend OAuth error:", decodedMessage);
          
          // Check for SSL certificate error
          if (decodedMessage.includes("SSL certificate") || decodedMessage.includes("unable to get local issuer")) {
            setError(
              `SSL Certificate Error pada backend: ${decodedMessage}\n\nSolusi:\n` +
              "1. Set VERIFY_SSL=false di backend .env\n" +
              "2. Atau disable SSL verification di config/http-client.php\n" +
              "3. Atau install CA certificates yang valid"
            );
          } else {
            setError(decodedMessage);
          }
          setLoading(false);
          return;
        }

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
          <p className="text-slate-600">Memproses login dengan akun sosial...</p>
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
          
          <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-red-700 whitespace-pre-wrap font-mono">
              {error}
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/login"
              className="flex-1 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Kembali ke Login
            </a>
            <a
              href="/"
              className="flex-1 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ke Beranda
            </a>
          </div>

          {error?.includes("SSL") && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-700 font-semibold mb-2">⚠️ Backend Configuration Issue</p>
              <p className="text-xs text-yellow-700 mb-3">
                Backend tidak bisa terkoneksi ke Google OAuth karena SSL certificate error. 
                Tim backend perlu:
              </p>
              <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
                <li>Pastikan VERIFY_SSL=false di .env</li>
                <li>Atau set CURL_VERIFY_SSL=0 di .env</li>
                <li>Atau install CA certificates yang valid</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
      </div>
    </div>
  );
}
