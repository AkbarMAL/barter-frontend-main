"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

export default function UnauthenticatedHome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-2xl">
        {/* Header Logo/Branding */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">↔️</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Barter Platform
          </h1>
          <p className="text-lg text-gray-600">
            Tukar barang favoritmu dengan mudah dan aman
          </p>
        </div>

        {/* Main Call to Action */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mulai Bertransaksi Sekarang
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Login untuk mulai transaksi dan temukan barang-barang menarik dari pengguna lain. 
              Tukar, jual, atau beli dengan aman di platform kami.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
            <div className="text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Cari Barang</h3>
              <p className="text-sm text-gray-600">Jelajahi ribuan barang dari komunitas kami</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Tukar Barang</h3>
              <p className="text-sm text-gray-600">Tukar dengan fair dan sesuai keinginanmu</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">Aman & Terpercaya</h3>
              <p className="text-sm text-gray-600">Transaksi dijamin aman dan terpercaya</p>
            </div>
          </div>

          {/* Login Button */}
          <div className="flex flex-col gap-4">
            <Link
              href="/login"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition duration-300 flex items-center justify-center gap-2 text-lg"
            >
              <span>Login untuk Mulai</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-3">
                Belum punya akun?
              </p>
              <Link
                href="/register"
                className="inline-block text-indigo-600 hover:text-indigo-700 font-semibold text-lg"
              >
                Daftar di sini →
              </Link>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <div className="text-center text-gray-600">
          <p className="text-sm">
            Platform barter terpercaya untuk mengubah barang lawas menjadi berkah bagi orang lain
          </p>
        </div>
      </div>
    </div>
  );
}
