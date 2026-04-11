"use client";

import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Memproses login sosial...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const processCallback = () => {
      const params = new URLSearchParams(window.location.search);
      const state = params.get("state");
      const token = params.get("token") || params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      // Check for backend error
      if (error) {
        setIsError(true);
        setMessage(`Login gagal: ${errorDescription || error}`);
        return;
      }

      // Validate state parameter
      if (!state) {
        setIsError(true);
        setMessage("State validation gagal: state tidak ditemukan.");
        return;
      }

      const savedState = sessionStorage.getItem("oauth_state");
      if (savedState !== state) {
        setIsError(true);
        setMessage("State validation gagal: state tidak cocok.");
        return;
      }

      // Check for token
      if (!token) {
        setIsError(true);
        setMessage("Token tidak ditemukan dalam response.");
        return;
      }

      // Build data object
      const data: Record<string, unknown> = { type: "social-login-success" };

      params.forEach((value, key) => {
        if (key === "user") {
          try {
            data.user = JSON.parse(decodeURIComponent(value));
          } catch {
            data.user = value;
          }
        } else if (
          ![
            "state",
            "token",
            "access_token",
            "refresh_token",
            "error",
            "error_description",
          ].includes(key)
        ) {
          data[key] = value;
        }
      });

      data.token = token;
      if (refreshToken) {
        data.refresh_token = refreshToken;
      }

      // Send data to parent window or redirect
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(data, window.location.origin);
        setMessage("Login berhasil. Jendela akan ditutup.");
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        setMessage("Login berhasil. Silakan kembali ke halaman utama.");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }

      // Clean up state
      sessionStorage.removeItem("oauth_state");
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div
        className={`w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200 text-center`}
      >
        <p
          className={`text-xl font-semibold ${
            isError ? "text-red-600" : "text-slate-900"
          }`}
        >
          {isError ? "Otentikasi Gagal" : "Otentikasi Sosial"}
        </p>
        <p className={`mt-4 ${isError ? "text-red-600" : "text-slate-600"}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
