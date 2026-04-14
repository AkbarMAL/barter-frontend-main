"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPaymentStatus,
  cancelPayment,
  createMidtransPayment,
  loadMidtransSnap,
  openMidtransSnap,
  PaymentStatus,
} from "@/services/transaction";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status Config ────────────────────────────────────────────────────────────

type PaymentStatusKey = "pending" | "success" | "failure" | "expire" | "cancel";

const STATUS_CONFIG: Record<
  PaymentStatusKey,
  { icon: string; title: string; desc: string; color: string; bg: string }
> = {
  pending: {
    icon: "⏳",
    title: "Menunggu Pembayaran",
    desc: "Selesaikan pembayaran sebelum batas waktu habis.",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  success: {
    icon: "✅",
    title: "Pembayaran Berhasil!",
    desc: "Pembayaran dikonfirmasi. Penjual akan segera memproses pesananmu.",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  failure: {
    icon: "❌",
    title: "Pembayaran Gagal",
    desc: "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
  expire: {
    icon: "🕐",
    title: "Pembayaran Kedaluwarsa",
    desc: "Batas waktu pembayaran habis. Pesanan telah dibatalkan.",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  },
  cancel: {
    icon: "🚫",
    title: "Pembayaran Dibatalkan",
    desc: "Pembayaran telah dibatalkan. Pesanan otomatis dibatalkan.",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const transactionId = parseInt(id);
  const router = useRouter();

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [snapReady, setSnapReady] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getPaymentStatus(transactionId);
      if (res.success) {
        setStatus(res.data);
        // Auto-redirect jika payment_confirmed
        if (res.data.transaction_status === "payment_confirmed") {
          setTimeout(() => router.push("/purchases"), 2500);
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Gagal memuat status pembayaran."
      );
    } finally {
      setLoading(false);
    }
  }, [transactionId, router]);

  // Polling setiap 5 detik jika status masih pending
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (status?.payment_status === "pending") {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, status?.payment_status]);

  const handlePayNow = async () => {
    setActionLoading(true);
    try {
      let snapToken = status?.snap_token;
      let isProduction = false;
      let clientKey = "";

      // Selalu panggil create endpoint untuk ngambil info client key + production terbaru,
      // kalaupun pending, endpoint ini hanya memgembalikan data yang sama tapi config environment ikut
      const res = await createMidtransPayment(transactionId);
      if (!res.success) {
        showToast("Gagal memuat link pembayaran.", "error");
        return;
      }
      
      snapToken = res.data.snap_token;
      clientKey = res.data.client_key;
      isProduction = res.data.is_production;

      setStatus((prev) =>
        prev ? { ...prev, snap_token: snapToken! } : prev
      );

      await loadMidtransSnap(clientKey, isProduction);
      setSnapReady(true);

      openMidtransSnap(snapToken!, {
        onSuccess: () => {
          showToast("Pembayaran berhasil!", "success");
          fetchStatus();
        },
        onPending: () => {
          showToast(
            "Pembayaran pending, menunggu konfirmasi.",
            "success"
          );
          fetchStatus();
        },
        onError: () => {
          showToast("Pembayaran gagal. Coba lagi.", "error");
        },
        onClose: () => {
          fetchStatus();
        },
      });
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ?? "Terjadi kesalahan.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Batalkan pembayaran
  const handleCancel = async () => {
    if (
      !confirm(
        "Yakin ingin membatalkan pembayaran? Pesanan akan dibatalkan."
      )
    )
      return;
    setActionLoading(true);
    try {
      const res = await cancelPayment(transactionId);
      showToast(res.message, "success");
      fetchStatus();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ?? "Gagal membatalkan pembayaran.",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm font-medium">
            Memuat status pembayaran...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-red-500 text-sm">{error}</p>
          <Link
            href="/purchases"
            className="mt-6 inline-block text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl px-5 py-2 hover:bg-blue-50"
          >
            ← Kembali ke Pembelian
          </Link>
        </div>
      </div>
    );
  }

  const payStatus = (status?.payment_status ?? "pending") as PaymentStatusKey;
  const cfg = STATUS_CONFIG[payStatus] ?? STATUS_CONFIG.pending;
  const isPending = payStatus === "pending";
  const isDone = ["success", "failure", "expire", "cancel"].includes(payStatus);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition
            ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Auto-redirect notice */}
      {status?.transaction_status === "payment_confirmed" && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          Pembayaran dikonfirmasi! Mengalihkan ke Pembelian...
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 md:p-8 pt-8">
        {/* Back Nav */}
        <div className="mb-6">
          <Link
            href="/purchases"
            className="text-sm text-blue-500 hover:underline flex items-center gap-1"
          >
            ← Kembali ke Pembelian
          </Link>
        </div>

        {/* Status Card */}
        <div
          className={`rounded-3xl border-2 p-6 mb-6 flex items-start gap-4 ${cfg.bg}`}
        >
          <span className="text-4xl flex-shrink-0">{cfg.icon}</span>
          <div>
            <h1 className={`text-xl font-bold ${cfg.color}`}>{cfg.title}</h1>
            <p className={`text-sm mt-1 ${cfg.color} opacity-80`}>{cfg.desc}</p>

            {/* Auto-redirect notice */}
            {status?.transaction_status === "payment_confirmed" && (
              <p className="text-sm font-semibold text-green-600 mt-2">
                Mengarahkan ke halaman pembelian...
              </p>
            )}
          </div>
        </div>

        {/* Payment Details */}
        {status && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-base mb-4">
              Detail Pembayaran
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Nominal</p>
                <p className="font-bold text-blue-600 text-lg">
                  {formatRupiah(status.amount)}
                </p>
              </div>

              {status.payment_type && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Metode Bayar</p>
                  <p className="font-semibold text-gray-800 capitalize text-sm">
                    {status.payment_type_label ?? status.payment_type}
                  </p>
                </div>
              )}

              {status.va_number && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Nomor Virtual Account</p>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-gray-800 text-lg tracking-widest">
                      {status.va_number}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(status.va_number ?? "");
                        showToast("Nomor VA disalin!", "success");
                      }}
                      className="text-xs text-blue-500 border border-blue-200 rounded-lg px-2 py-1 hover:bg-blue-50"
                    >
                      Salin
                    </button>
                  </div>
                </div>
              )}

              {status.expired_at && isPending && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Bayar Sebelum</p>
                  <p className="font-semibold text-amber-600 text-sm">
                    {formatDate(status.expired_at)}
                  </p>
                </div>
              )}

              {status.paid_at && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Waktu Pembayaran</p>
                  <p className="font-semibold text-gray-800 text-sm">
                    {formatDate(status.paid_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions for Virtual Account */}
        {isPending && status?.payment_type?.includes("bank_transfer") && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
            <p className="text-sm font-bold text-blue-800 mb-2">
              📋 Cara Pembayaran Virtual Account
            </p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Buka aplikasi mobile banking atau ATM</li>
              <li>Pilih menu Transfer / Virtual Account</li>
              <li>Masukkan nomor VA di atas</li>
              <li>Konfirmasi jumlah transfer</li>
              <li>Selesaikan pembayaran</li>
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isPending && (
            <>
              <button
                id="pay-now-btn"
                onClick={handlePayNow}
                disabled={actionLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-base rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
              >
                {actionLoading && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                💳 Bayar Sekarang
              </button>

              <button
                id="cancel-payment-btn"
                onClick={handleCancel}
                disabled={actionLoading}
                className="w-full py-3 border-2 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 font-semibold text-sm rounded-2xl transition"
              >
                Batalkan Pembayaran
              </button>
            </>
          )}

          {isDone && (
            <Link
              href="/purchases"
              id="back-to-purchases-btn"
              className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-sm transition text-center"
            >
              Lihat Pembelian Saya →
            </Link>
          )}

          <button
            onClick={fetchStatus}
            className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm rounded-2xl transition"
          >
            ↻ Perbarui Status
          </button>
        </div>

        {/* Polling Indicator */}
        {isPending && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Status diperbarui otomatis setiap 5 detik
          </p>
        )}
      </div>
    </div>
  );
}
