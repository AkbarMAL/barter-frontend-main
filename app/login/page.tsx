"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/services/api";
import { saveAuthData } from "@/services/authentication";
import { initiateGoogleLogin, initiateFacebookLogin } from "@/services/social-auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [oauthLoading, setOAuthLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Email dan password harus diisi!");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.post("/login", {
        email,
        password,
      });

      if (res.data.success) {
        // Response contains: user, token, roles, is_seller, seller_profile
        const { token, user } = res.data.data;

        // Save auth data using centralized function
        saveAuthData(token, user);
        
        // If remember me is checked, extend cookie duration to 30 days
        if (rememberMe) {
          document.cookie = `token=${token}; path=/; samesite=lax; max-age=2592000`;
          document.cookie = `auth_token=${token}; path=/; samesite=lax; max-age=2592000`;
        }

        // Redirect based on user roles
        // If user is seller, redirect to seller dashboard, otherwise redirect to home or requested page
        if (user.is_seller) {
          router.push("/seller");
        } else {
          router.push(redirectUrl);
        }
      } else {
        setErrorMessage(res.data.message || "Login gagal");
      }
    } catch (err: any) {
      console.error("Login error:", err.response?.data ?? err.message);
      
      if (err.response?.status === 401) {
        setErrorMessage("Email atau password salah");
      } else if (err.response?.status === 403) {
        setErrorMessage("Akun Anda telah dinonaktifkan");
      } else if (err.response?.status === 422) {
        setErrorMessage("Validasi gagal. Silakan periksa input Anda");
      } else {
        setErrorMessage(
          err.response?.data?.message || "Login gagal. Silakan coba lagi nanti."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  const handleGoogleLogin = async () => {
    setOAuthLoading(true);
    setErrorMessage("");
    try {
      await initiateGoogleLogin(redirectUrl);
    } catch (error: any) {
      setOAuthLoading(false);
      setErrorMessage(
        error.message || "Gagal menghubungkan ke Google. Silakan coba lagi."
      );
      console.error("Google login error:", error);
    }
  };

  const handleFacebookLogin = async () => {
    setOAuthLoading(true);
    setErrorMessage("");
    try {
      await initiateFacebookLogin(redirectUrl);
    } catch (error: any) {
      setOAuthLoading(false);
      setErrorMessage(
        error.message || "Gagal menghubungkan ke Facebook. Silakan coba lagi."
      );
      console.error("Facebook login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200">
        <div className="text-center mb-8">
          <p className="text-4xl font-semibold text-slate-900">RatheR</p>
          <p className="text-sm text-slate-500 mt-2">Masuk ke akun Anda</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="nama@email.com"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                onKeyPress={handleKeyPress}
                placeholder="Masukkan password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.97 10.97 0 0 1 12 19c-5.5 0-10-4.5-10-10 0-1.9.5-3.7 1.36-5.28" />
                    <path d="M1 1l22 22" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Ingat saya
            </label>
            <Link
              href="#"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Lupa password?
            </Link>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="h-px flex-1 bg-slate-200"></div>
            atau
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <button
            type="button"
<<<<<<< HEAD
            onClick={() => handleSocialLogin("google")}
            disabled={loading || oauthLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.35 11.1H12v2.8h5.2c-.25 1.45-1.3 2.8-2.8 3.45v2.85h4.55c2.65-2.45 4.15-6.05 4.15-10.1 0-.7-.05-1.4-.15-2.05z"
                  fill="#4285F4"
                />
                <path
                  d="M12 22c2.7 0 4.95-.9 6.6-2.45l-4.55-2.85c-.8.55-1.85.85-3.05.85-2.35 0-4.35-1.6-5.05-3.75H2.25v2.35C3.9 19.9 7.7 22 12 22z"
                  fill="#34A853"
                />
                <path
                  d="M6.95 13.8c-.2-.6-.35-1.25-.35-1.8s.15-1.2.35-1.8V7.85H2.25A9.97 9.97 0 0 0 1 12c0 1.6.35 3.15.95 4.55z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.4c1.45 0 2.75.5 3.8 1.45l2.85-2.85C16.95 2.35 14.7 1.4 12 1.4 7.7 1.4 3.9 3.5 2.25 7.85l4.7 3.5C7.65 7 9.65 5.4 12 5.4z"
                  fill="#EA4335"
                />
              </svg>
            </span>
            {loading || oauthLoading ? "Memproses..." : "Masuk dengan Google"}
=======
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35 11.1H12v2.8h5.2c-.25 1.45-1.3 2.8-2.8 3.45v2.85h4.55c2.65-2.45 4.15-6.05 4.15-10.1 0-.7-.05-1.4-.15-2.05z" fill="#4285F4" />
                    <path d="M12 22c2.7 0 4.95-.9 6.6-2.45l-4.55-2.85c-.8.55-1.85.85-3.05.85-2.35 0-4.35-1.6-5.05-3.75H2.25v2.35C3.9 19.9 7.7 22 12 22z" fill="#34A853" />
                    <path d="M6.95 13.8c-.2-.6-.35-1.25-.35-1.8s.15-1.2.35-1.8V7.85H2.25A9.97 9.97 0 0 0 1 12c0 1.6.35 3.15.95 4.55z" fill="#FBBC05" />
                    <path d="M12 5.4c1.45 0 2.75.5 3.8 1.45l2.85-2.85C16.95 2.35 14.7 1.4 12 1.4 7.7 1.4 3.9 3.5 2.25 7.85l4.7 3.5C7.65 7 9.65 5.4 12 5.4z" fill="#EA4335" />
                  </svg>
                </span>
                <span>Masuk dengan Google</span>
              </>
            )}
>>>>>>> efc0a269f6d284a59a797098dfcac5566bc96b5e
          </button>

          <button
            type="button"
<<<<<<< HEAD
            onClick={() => handleSocialLogin("facebook")}
            disabled={loading || oauthLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M22 12.07C22 6.75 17.52 2.7 12 2.7S2 6.75 2 12.07c0 4.98 3.66 9.1 8.44 9.95v-7.05H7.9v-2.9h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34v7.05C18.34 21.17 22 17.05 22 12.07Z" />
              </svg>
            </span>
            {loading || oauthLoading ? "Memproses..." : "Masuk dengan Facebook"}
=======
            onClick={handleFacebookLogin}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M22 12.07C22 6.75 17.52 2.7 12 2.7S2 6.75 2 12.07c0 4.98 3.66 9.1 8.44 9.95v-7.05H7.9v-2.9h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34v7.05C18.34 21.17 22 17.05 22 12.07Z" />
                  </svg>
                </span>
                <span>Masuk dengan Facebook</span>
              </>
            )}
>>>>>>> efc0a269f6d284a59a797098dfcac5566bc96b5e
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
