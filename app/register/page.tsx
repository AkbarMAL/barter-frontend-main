"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    role: "buyer",
    shop_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async () => {
    if (!acceptedTerms) {
      alert("Silakan setujui syarat dan ketentuan terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = { ...form };
      if (payload.role !== "seller") {
        delete payload.shop_name;
      }

      const res = await api.post("/register", payload);
      console.log("REGISTER:", res.data);
      alert("Registrasi berhasil, silakan login");
      window.location.href = "/login";
    } catch (err: any) {
      console.log(err.response?.data);
      if (err.response?.status === 422) {
        alert("Validasi gagal: " + JSON.stringify(err.response.data.errors));
      } else {
        alert("Register gagal");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-200">
        <div className="text-center mb-8">
          <p className="text-4xl font-semibold text-slate-900">RatheR</p>
          <p className="text-sm text-slate-500 mt-2">Buat akun baru Anda</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Nama Lengkap
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
            className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="nama@email.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <label className="block text-sm font-medium text-slate-700">
            Nomor Telepon
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="08xx xxxx xxxx"
            className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <label className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {showPassword ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              placeholder="Ulangi password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              Saya setuju dengan{" "}
              <span className="font-semibold text-blue-600">
                Syarat & Ketentuan
              </span>{" "}
              dan{" "}
              <span className="font-semibold text-blue-600">
                Kebijakan Privasi
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Daftar"}
          </button>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="h-px flex-1 bg-slate-200"></div>
            atau daftar dengan
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
            Daftar dengan Google
          </button>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M22 12.07C22 6.75 17.52 2.7 12 2.7S2 6.75 2 12.07c0 4.98 3.66 9.1 8.44 9.95v-7.05H7.9v-2.9h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34v7.05C18.34 21.17 22 17.05 22 12.07Z" />
              </svg>
            </span>
            Daftar dengan Facebook
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
