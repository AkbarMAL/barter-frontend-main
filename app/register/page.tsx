"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/services/api";
import { saveAuthData } from "@/services/authentication";
import { initiateGoogleLogin } from "@/services/social-auth";
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    wa_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  };

  const handleRegister = async () => {
    if (!acceptedTerms) {
      if (!acceptedTerms) {
        alert("Silakan centang 'Saya menyetujui syarat dan ketentuan' terlebih dahulu.");
        return;
      }
      return;
    }

    if (!form.name || !form.email || !form.phone || !form.password) {
      setErrorMessage("Semua field harus diisi");
      return;
    }

    if (form.password !== form.password_confirmation) {
      setErrorMessage("Password tidak cocok");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        wa_number: form.wa_number || form.phone,
      };

      const res = await api.post("/register", payload);

      if (res.data.success) {
        const { token, user } = res.data.data;

        if (!token || !user) {
          setErrorMessage("Response dari server tidak lengkap. Token atau user data hilang.");
          setLoading(false);
          console.error("Missing token or user in register response:", res.data.data);
          return;
        }

        saveAuthData(token, user);

        setErrorMessage("");
        alert("Registrasi berhasil! Selamat datang di RatheR");

        setTimeout(() => {
          if (user.is_seller) {
            router.push("/seller");
          } else {
            router.push(redirectUrl);
          }
        }, 100);
      } else {
        setErrorMessage(res.data.message || "Registrasi gagal. Silakan coba lagi.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Register error:", err.response?.data);

      const errors = err.response?.data?.errors;
      if (errors) {
        const errorText = Object.values(errors).flat().join(", ");
        setErrorMessage(errorText);
      } else {
        setErrorMessage(
          err.response?.data?.message || "Registrasi gagal. Silakan coba lagi."
        );
      }

      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!acceptedTerms) {
      setErrorMessage("Silakan setujui syarat dan ketentuan terlebih dahulu.");
      return;
    }

    setOAuthLoading(true);
    setErrorMessage("");

    try {
      await initiateGoogleLogin(redirectUrl);
    } catch (error: any) {
      setErrorMessage(error?.message || "Gagal menghubungkan ke Google.");
      setOAuthLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200">
        <div className="text-center mb-8">
          <p className="text-4xl font-semibold text-slate-900">RatheR</p>
          <p className="text-sm text-slate-500 mt-2">Buat akun baru Anda</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nama lengkap</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Masukkan nama lengkap"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Masukkan email"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nomor HP</span>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Masukkan nomor HP"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nomor WhatsApp</span>
            <input
              type="text"
              name="wa_number"
              value={form.wa_number}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              placeholder="Opsional, kosongkan jika sama dengan nomor HP"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <div className="mt-2 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                placeholder="Masukkan password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 text-sm text-slate-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Konfirmasi Password</span>
            <div className="mt-2 relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                placeholder="Ulangi password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 text-sm text-slate-500"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600 mt-1">
              Saya menyetujui syarat dan ketentuan yang berlaku.
            </span>
          </label>

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading || oauthLoading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs uppercase tracking-wide text-slate-400">
                atau
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!acceptedTerms) {
                alert("Silakan centang 'Saya menyetujui syarat dan ketentuan' terlebih dahulu.");
                return;
              }

              handleGoogleRegister();
            }}
            disabled={loading || oauthLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
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
                <span>Daftar dengan Google</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div >
  );
}