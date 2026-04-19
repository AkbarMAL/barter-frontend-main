"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import SidebarProfile from "@/components/sidebar-profile";
import { submitRefund, SubmitRefundPayload } from "@/services/refund";
import api from "@/services/api";
import {
  createMidtransPayment,
  openSeamlessPayment,
} from "@/services/transaction";
import { ProtectedRoute } from "@/components/protected-route";

const BASE_URL = "http://127.0.0.1:8000";

const buyerMenus = [
  { name: "Beranda", href: "/" },
  { name: "Notifikasi", href: "/notifications" },
  { name: "Favorit", href: "/favorites" },
  { name: "Pembelian", href: "/purchases" },
  { name: "Pindah ke seller", href: "/seller" },
];

const REFUND_REASONS = [
  "Barang rusak / cacat",
  "Barang tidak sesuai deskripsi",
  "Barang tidak sampai",
  "Barang tidak lengkap",
  "Salah kirim produk",
  "Lainnya",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStorageUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}/storage/${path}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "payment_confirmed": return "bg-blue-100 text-blue-800";
    case "cancelled": return "bg-red-100 text-red-700";
    case "processing": return "bg-indigo-100 text-indigo-800";
    case "shipped": return "bg-purple-100 text-purple-800";
    case "delivered": return "bg-teal-100 text-teal-800";
    case "cod_completed":
    case "completed": return "bg-green-100 text-green-800";
    case "refund_requested": return "bg-orange-100 text-orange-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: "Menunggu Pembayaran",
    payment_confirmed: "Pembayaran Dikonfirmasi",
    processing: "Sedang Diproses",
    shipped: "Dikirim",
    delivered: "Terkirim",
    completed: "Selesai",
    refund_requested: "Refund Diajukan",
    cancelled: "Dibatalkan",
    cod_waiting: "Menunggu COD",
    cod_completed: "COD Selesai",
  };
  return map[status] ?? status;
}

interface ApiTransaction {
  id: number;
  transaction_code: string;
  status: string;
  type: "cod" | "rekber";
  final_amount: number;
  total_price: number;
  created_at: string;
  has_rated?: boolean; // apakah buyer sudah beri rating
  product?: {
    id: number;
    title: string;
    images?: { image_path: string }[];
  };
  seller?: {
    id: number;
    name: string;
  };
}

// ── Rating Modal ──────────────────────────────────────────────────────────────

const API_BASE = "http://127.0.0.1:8000/api/v1";
function getAuthToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

interface RatingModalProps {
  transaction: ApiTransaction;
  onClose: () => void;
  onSuccess: (txId: number) => void;
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <svg
            className={`w-10 h-10 transition-colors drop-shadow-sm ${star <= (hover || value) ? "text-yellow-400" : "text-gray-200"
              }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Sangat Buruk 😞",
  2: "Kurang Baik 😕",
  3: "Cukup 😐",
  4: "Baik 😊",
  5: "Sangat Baik 🤩",
};

function RatingModal({ transaction, onClose, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) { setError("Pilih rating bintang terlebih dahulu."); return; }
    setError("");
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transaction_id: transaction.id,
          type: "buyer_to_seller",
          rating,
          review: review.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess(transaction.id);
      } else {
        setError(json.message || "Gagal mengirim rating.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Beri Rating Penjual ⭐</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
              {transaction.product?.title ?? `Transaksi #${transaction.transaction_code}`}
            </p>
            {transaction.seller && (
              <p className="text-xs text-gray-400 mt-0.5">
                Penjual: <span className="font-semibold text-gray-600">{transaction.seller.name}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition ml-2 flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Star input */}
          <div className="text-center py-2">
            <p className="text-sm font-semibold text-gray-700 mb-4">Seberapa puas kamu dengan penjual?</p>
            <div className="flex justify-center">
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
            <div className="h-7 mt-3">
              {rating > 0 && (
                <p className="text-base font-bold text-yellow-500">{RATING_LABELS[rating]}</p>
              )}
            </div>
          </div>

          {/* Review text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ulasan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Ceritakan pengalaman berbelanjaanmu kepada pembeli lain..."
              maxLength={1000}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{review.length}/1000</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-2xl hover:bg-gray-50 transition"
          >
            Nanti Saja
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? "Mengirim..." : "⭐ Kirim Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Refund Modal ──────────────────────────────────────────────────────────────

interface RefundModalProps {
  transaction: ApiTransaction;
  onClose: () => void;
  onSuccess: (txId: number) => void;
}

function RefundModal({ transaction, onClose, onSuccess }: RefundModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + images.length > 5) {
      setErrors((p) => ({ ...p, images: "Maksimal 5 foto." }));
      return;
    }
    setErrors((p) => ({ ...p, images: "" }));
    setImages((p) => [...p, ...files]);
    setPreviewUrls((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setPreviewUrls((p) => p.filter((_, idx) => idx !== i));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!reason) e.reason = "Alasan wajib dipilih.";
    if (images.length === 0) e.images = "Minimal 1 foto bukti.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!bank.trim()) e.bank = "Nama bank wajib diisi.";
    if (!account.trim()) e.account = "Nomor rekening wajib diisi.";
    if (!holder.trim()) e.holder = "Nama pemilik rekening wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const payload: SubmitRefundPayload = {
        transaction_id: transaction.id,
        reason,
        description: description || undefined,
        evidence_images: images,
        refund_bank: bank,
        refund_account: account,
        refund_holder: holder,
      };
      await submitRefund(payload);
      onSuccess(transaction.id);
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([k, v]) => {
          flat[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(flat);
      } else {
        setErrors({ _general: err?.response?.data?.message ?? "Gagal mengajukan refund." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-4">

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ajukan Refund</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {transaction.product?.title ?? `Transaksi #${transaction.transaction_code}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 px-6 py-3 bg-gray-50 text-xs font-semibold">
          <div className={`flex items-center gap-1.5 ${step === 1 ? "text-blue-600" : "text-green-600"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${step === 1 ? "bg-blue-500" : "bg-green-500"}`}>
              {step === 1 ? "1" : "✓"}
            </span>
            Alasan & Bukti
          </div>
          <div className={`w-8 h-px mx-2 ${step === 2 ? "bg-blue-400" : "bg-gray-300"}`} />
          <div className={`flex items-center gap-1.5 ${step === 2 ? "text-blue-600" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${step === 2 ? "bg-blue-500" : "bg-gray-300"}`}>2</span>
            Info Rekening
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {errors._general && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{errors._general}</div>
          )}

          {step === 1 ? (
            <>
              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alasan Refund *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REFUND_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setReason(r); setErrors((p) => ({ ...p, reason: "" })); }}
                      className={`text-left text-sm px-3 py-2.5 rounded-xl border-2 transition font-medium
                        ${reason === r ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-300"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi <span className="text-gray-400 font-normal">(opsional)</span></label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan masalah yang Anda alami secara detail..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Foto Bukti * <span className="text-gray-400 font-normal">(maks. 5 foto)</span></label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600"
                      >✕</button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                      <span className="text-2xl text-gray-300">+</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
                {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
              </div>
            </>
          ) : (
            <>
              {/* Bank Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">💳 Informasi Rekening Pengembalian Dana</p>
                <p className="text-blue-600">Dana refund sebesar <strong>{formatRupiah(transaction.final_amount ?? transaction.total_price)}</strong> akan dikembalikan ke rekening ini setelah disetujui seller.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Bank *</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => { setBank(e.target.value); setErrors((p) => ({ ...p, bank: "" })); }}
                    placeholder="cth: BCA, Mandiri, BRI, BNI"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder:text-gray-400"
                  />
                  {errors.bank && <p className="text-xs text-red-500 mt-1">{errors.bank}</p>}
                  {errors.refund_bank && <p className="text-xs text-red-500 mt-1">{errors.refund_bank}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Rekening *</label>
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => { setAccount(e.target.value); setErrors((p) => ({ ...p, account: "" })); }}
                    placeholder="cth: 1234567890"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder:text-gray-400"
                  />
                  {errors.account && <p className="text-xs text-red-500 mt-1">{errors.account}</p>}
                  {errors.refund_account && <p className="text-xs text-red-500 mt-1">{errors.refund_account}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Pemilik Rekening *</label>
                  <input
                    type="text"
                    value={holder}
                    onChange={(e) => { setHolder(e.target.value); setErrors((p) => ({ ...p, holder: "" })); }}
                    placeholder="Nama sesuai buku tabungan"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder:text-gray-400"
                  />
                  {errors.holder && <p className="text-xs text-red-500 mt-1">{errors.holder}</p>}
                  {errors.refund_holder && <p className="text-xs text-red-500 mt-1">{errors.refund_holder}</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={() => { if (validateStep1()) setStep(2); }}
                className="px-5 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600"
              >
                Lanjutkan →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
                ← Kembali
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-60 flex items-center gap-2"
              >
                {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {submitting ? "Mengirim..." : "Kirim Permintaan Refund"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Barter History Component ──────────────────────────────────────────────────

function BarterHistoryList() {
  const [barters, setBarters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchBarters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/barter");
      if (res.data.success) {
        setBarters(res.data.data?.data ?? res.data.data ?? []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat barter.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBarters(); }, [fetchBarters]);

  const barterFilters = [
    { label: "Semua", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Menunggu Bayar", value: "payment_pending" },
    { label: "Selesai", value: "completed" },
    { label: "Dibatalkan / Ditolak", value: "cancelled" }
  ];

  const filtered = filter === "all" ? barters : barters.filter(b => {
    if (filter === "cancelled") return ["cancelled", "rejected"].includes(b.status);
    if (filter === "completed") return ["completed", "payment_confirmed", "accepted"].includes(b.status);
    return b.status === filter;
  });

  const getBarterStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu Penjual";
      case "seller_reviewing": return "Ditinjau Penjual";
      case "accepted": return "Disetujui (Menunggu Selesai)";
      case "payment_pending": return "Menunggu Bayar Selisih";
      case "payment_confirmed": return "Pembayaran Dikonfirmasi";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan Pembeli";
      case "rejected": return "Ditolak Penjual";
      default: return status;
    }
  };

  const getBarterStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "seller_reviewing": return "bg-gray-100 text-gray-800";
      case "payment_pending": return "bg-orange-100 text-orange-800";
      case "payment_confirmed":
      case "accepted": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled":
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Yakin ingin membatalkan pengajuan barter?")) return;
    try {
      const res = await api.post(`/barter/${id}/cancel`);
      if (res.data.success) {
        fetchBarters();
      }
    } catch {
      alert("Gagal membatalkan barter.");
    }
  };

  const handlePay = async (id: number) => {
    try {
      const res = await api.post(`/barter/${id}/pay`);
      if (res.data.success && res.data.data?.snap_token) {
        window.location.href = res.data.data.redirect_url;
      }
    } catch {
      alert("Gagal memanggil pembayaran.");
    }
  };

  return (
    <div className="mt-4">
      {/* Barter Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {barterFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
                ${filter === f.value ? "bg-blue-500 text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
      ) : error ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-red-100 text-red-500 font-semibold shadow-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">🔄</div>
          <h3 className="text-lg font-bold text-gray-900">Belum ada barter aktif</h3>
          <p className="text-gray-500 mt-2 text-sm">Temukan barang di marketplace dan mulai tukar tambah!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const imgPath = b.product?.images?.[0]?.image_path;
            const productImg = imgPath ? getStorageUrl(imgPath) : null;
            const selisih = Number(b.offer_additional_price);

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row gap-5 shadow-sm hover:shadow-md transition">
                {productImg && <img src={productImg} alt="Produk" className="w-24 h-24 object-cover rounded-xl shrink-0 border" />}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getBarterStatusColor(b.status)}`}>
                      {getBarterStatusText(b.status)}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">ID: {b.id} • {formatDate(b.created_at)}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Incaran: {b.product?.title}</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p><span className="font-semibold text-gray-800">Barang ditawarkan:</span> {b.offer_item_name}</p>
                    {selisih > 0 && (
                      <p><span className="font-semibold text-gray-800">Menawarkan selisih:</span> <span className="text-orange-600 font-bold">{formatRupiah(selisih)}</span></p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 italic">"{b.offer_description}"</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 justify-center">
                  {["pending", "seller_reviewing"].includes(b.status) && (
                    <button onClick={() => handleCancel(b.id)} className="px-4 py-2 text-sm border-2 border-red-100 text-red-500 rounded-xl hover:bg-red-50 font-bold transition">
                      Batalkan
                    </button>
                  )}
                  {b.status === "payment_pending" && (
                    <button onClick={() => handlePay(b.id)} className="px-5 py-2.5 text-sm bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold shadow-sm transition">
                      Bayar Selisih
                    </button>
                  )}
                  {b.seller_note && (
                    <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded max-w-[200px]">
                      <span className="font-bold">Balasan Penjual:</span> {b.seller_note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [refundModal, setRefundModal] = useState<ApiTransaction | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"purchases" | "barters">("purchases");
  const [confirmLoading, setConfirmLoading] = useState<number | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);
  const [ratingModal, setRatingModal] = useState<ApiTransaction | null>(null);
  const [ratedTxIds, setRatedTxIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const userStr = localStorage.getItem("current_user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("tab") === "barters") {
      setActiveTab("barters");
    }
  }, [searchParams]);


  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/transactions?role=buyer");
      const json = res.data;
      if (json.success) {
        setTransactions(json.data?.data ?? json.data ?? []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memuat transaksi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Deteksi kembali dari halaman Midtrans dan sync status pembayaran
  useEffect(() => {
    const transactionStatus = searchParams.get("transaction_status");
    const orderId = searchParams.get("order_id");

    if (!transactionStatus || !orderId) return;

    // Bersihkan URL dari params Midtrans
    router.replace("/purchases");

    const syncStatus = async () => {
      setSyncing(true);
      try {
        // Ambil semua transaksi rekber pending, coba sync statusnya
        const res = await api.get("/transactions?role=buyer");
        const allTx: ApiTransaction[] = res.data?.data?.data ?? res.data?.data ?? [];

        // Cari transaksi yang order_id-nya cocok
        const pendingRekber = allTx.filter(
          (t) => t.status === "pending" && t.type === "rekber"
        );

        // Panggil status endpoint untuk setiap transaksi pending
        // Backend akan query ke Midtrans dan update DB otomatis
        await Promise.allSettled(
          pendingRekber.map((t) => api.get(`/payment/status/${t.id}`))
        );

        // Refresh list setelah sync
        await fetchTransactions();

        if (["settlement", "capture"].includes(transactionStatus)) {
          showToast("Pembayaran berhasil dikonfirmasi!", "success");
        }
      } catch (err) {
        // Gagal sync, tetap reload aja
        fetchTransactions();
      } finally {
        setSyncing(false);
      }
    };

    syncStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const handleRefundSuccess = (txId: number) => {
    setRefundModal(null);
    showToast("Permintaan refund berhasil dikirim ke penjual!", "success");
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: "refund_requested" } : t))
    );
  };

  const handleConfirmReceived = async (txId: number) => {
    if (!confirm("Konfirmasi barang sudah diterima? Dana akan dicairkan ke penjual.")) return;
    setConfirmLoading(txId);
    try {
      const res = await api.post(`/transactions/${txId}/confirm`);
      if (res.data.success) {
        showToast("Barang dikonfirmasi diterima. Dana dicairkan ke penjual!", "success");
        setTransactions((prev) =>
          prev.map((t) => (t.id === txId ? { ...t, status: "completed" } : t))
        );
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Gagal mengkonfirmasi penerimaan.", "error");
    } finally {
      setConfirmLoading(null);
    }
  };

  const canRefund = (t: ApiTransaction) =>
    ["delivered", "completed", "cod_completed"].includes(t.status);

  const canRate = (t: ApiTransaction) =>
    (t.status === "completed" || t.status === "cod_completed") && !ratedTxIds.has(t.id);

  const handleRatingSuccess = (txId: number) => {
    setRatingModal(null);
    setRatedTxIds((prev) => new Set([...prev, txId]));
    showToast("Rating berhasil dikirim! Terima kasih atas ulasanmu. ⭐", "success");
  };

  const canConfirm = (t: ApiTransaction) =>
    ["shipped", "delivered"].includes(t.status);

  const canPay = (t: ApiTransaction) =>
    t.status === "pending" && t.type === "rekber";

  const canCancel = (t: ApiTransaction) =>
    t.status === "pending" && t.type === "rekber";

  const handlePayNow = async (t: ApiTransaction) => {
    setPaymentLoading(t.id);
    try {
      const res = await createMidtransPayment(t.id);
      if (res.success && res.data?.redirect_url) {
        window.location.href = res.data.redirect_url;
      } else {
        showToast("Gagal memuat link pembayaran.", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Gagal membuka pembayaran.", "error");
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleCancelOrder = async (t: ApiTransaction) => {
    if (!confirm(`Batalkan pesanan ${t.transaction_code}?\nTindakan ini tidak bisa dibatalkan.`)) return;
    setCancelLoading(t.id);
    try {
      const res = await api.post(`/payment/cancel/${t.id}`);
      if (res.data.success) {
        showToast("Pesanan berhasil dibatalkan.", "success");
        setTransactions((prev) =>
          prev.map((tx) => tx.id === t.id ? { ...tx, status: "cancelled" } : tx)
        );
      } else {
        showToast(res.data.message ?? "Gagal membatalkan pesanan.", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Gagal membatalkan pesanan.", "error");
    } finally {
      setCancelLoading(null);
    }
  };

  const filtered = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "completed") return t.status === "completed" || t.status === "cod_completed";
    return t.status === filter;
  });

  const filters = [
    { label: "Semua", value: "all" },
    { label: "Menunggu Bayar", value: "pending" },
    { label: "Diproses", value: "processing" },
    { label: "Dikirim", value: "shipped" },
    { label: "Selesai", value: "completed" },
    { label: "Refund", value: "refund_requested" },
    { label: "Dibatalkan", value: "cancelled" },
  ];

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full bg-white font-sans">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition
          ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {toast.msg}
          </div>
        )}

        {/* Syncing overlay — saat cek status ke Midtrans */}
        {syncing && (
          <div className="fixed inset-0 z-40 bg-black/20 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
              <p className="text-sm font-semibold text-gray-700">Mengkonfirmasi pembayaran...</p>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal && (
          <RatingModal
            transaction={ratingModal}
            onClose={() => setRatingModal(null)}
            onSuccess={handleRatingSuccess}
          />
        )}

        {/* Refund Modal */}
        {refundModal && (
          <RefundModal
            transaction={refundModal}
            onClose={() => setRefundModal(null)}
            onSuccess={handleRefundSuccess}
          />
        )}

        {/* Sidebar */}
        <div className="w-64 bg-white border-r p-4 hidden md:flex flex-col justify-between fixed h-screen z-10">
          <div>
            <h1 className="text-2xl font-bold text-blue-500 tracking-wide">RatheR</h1>
            <nav className="mt-8 space-y-2">
              {buyerMenus.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${pathname === item.href ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <SidebarProfile user={user} />
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-64 p-6 bg-gray-50 min-h-screen">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Aktivitas Belanja</h1>
                <p className="text-gray-500 text-sm mt-1">Pantau status pembelian dan ajukan refund jika diperlukan.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/purchases/refunds"
                  className="text-sm font-semibold text-orange-600 border border-orange-200 bg-orange-50 rounded-xl px-4 py-2 hover:bg-orange-100 transition"
                >
                  📋 Riwayat Refund
                </Link>
                <button
                  onClick={fetchTransactions}
                  disabled={loading}
                  className="text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl px-4 py-2 hover:bg-blue-50 disabled:opacity-50 transition"
                >
                  {loading ? "Memuat…" : "↻ Refresh"}
                </button>
              </div>
            </div>

            {/* Main Toggle Bar */}
            <div className="flex gap-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("purchases")}
                className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === "purchases" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
              >
                Pembelian Reguler
              </button>
              <button
                onClick={() => setActiveTab("barters")}
                className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === "barters" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
              >
                Tukar Tambah (Barter)
              </button>
            </div>
          </div>

          {activeTab === "purchases" ? (
            <>
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
                    ${filter === f.value ? "bg-blue-500 text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex justify-center py-24">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm">
                  <p className="text-red-500 font-semibold">{error}</p>
                  <button onClick={fetchTransactions} className="mt-4 text-sm text-blue-500 underline">Coba lagi</button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-4">🛍️</div>
                  <h3 className="text-lg font-bold text-gray-900">Belum ada transaksi</h3>
                  <p className="text-gray-500 mt-2 text-sm">Yuk mulai belanja di marketplace kami!</p>
                  <Link href="/" className="mt-4 inline-block text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl px-5 py-2 hover:bg-blue-50">
                    Jelajahi Produk
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((t) => {
                    const imgPath = t.product?.images?.[0]?.image_path;
                    const productImg = imgPath ? getStorageUrl(imgPath) : null;

                    return (
                      <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">

                        {/* Card Header */}
                        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500">{t.transaction_code}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(t.status)}`}>
                              {getStatusText(t.status)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(t.created_at)}</span>
                        </div>

                        <div className="p-5 flex gap-4 items-start">
                          {/* Product Image */}
                          {productImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={productImg}
                              alt={t.product?.title ?? "Produk"}
                              className="w-20 h-20 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">🛍️</div>
                          )}

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug">
                              {t.product?.title ?? `Transaksi #${t.transaction_code}`}
                            </h3>
                            {t.seller && (
                              <p className="text-xs text-gray-500 mt-1">Penjual: <span className="font-medium text-gray-700">{t.seller.name}</span></p>
                            )}
                            <p className="text-sm font-bold text-blue-600 mt-2">{formatRupiah(t.final_amount ?? t.total_price)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{t.type === "cod" ? "Cash on Delivery" : "Rekening Bersama"}</p>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-gray-100 px-5 py-3 flex justify-end gap-3 flex-wrap bg-white">
                          {confirmLoading === t.id ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500" />
                              Mengkonfirmasi…
                            </div>
                          ) : paymentLoading === t.id ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                              Memuat pembayaran…
                            </div>
                          ) : cancelLoading === t.id ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                              Membatalkan…
                            </div>
                          ) : t.status === "refund_requested" ? (
                            <Link
                              href="/purchases/refunds"
                              className="text-sm font-semibold text-orange-600 border border-orange-200 rounded-xl px-4 py-2 hover:bg-orange-50 transition"
                            >
                              Lihat Status Refund
                            </Link>
                          ) : (
                            <>
                              {/* Bayar Sekarang — untuk rekber yang masih pending */}
                              {canPay(t) && (
                                <button
                                  id={`pay-btn-${t.id}`}
                                  onClick={() => handlePayNow(t)}
                                  className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 transition shadow-sm flex items-center gap-1.5"
                                >
                                  💳 Bayar Sekarang
                                </button>
                              )}
                              {/* Batalkan Pesanan — untuk rekber yang masih pending */}
                              {canCancel(t) && (
                                <button
                                  onClick={() => handleCancelOrder(t)}
                                  className="text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl px-4 py-2 transition"
                                >
                                  ✕ Batalkan Pesanan
                                </button>
                              )}
                              {/* Konfirmasi Terima — untuk status shipped/delivered */}
                              {canConfirm(t) && (
                                <button
                                  onClick={() => handleConfirmReceived(t.id)}
                                  className="text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 rounded-xl px-4 py-2 transition shadow-sm"
                                >
                                  ✓ Konfirmasi Barang Diterima
                                </button>
                              )}
                              {/* Ajukan Refund — untuk status delivered/completed */}
                              {canRefund(t) && (
                                <button
                                  onClick={() => setRefundModal(t)}
                                  className="text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl px-4 py-2 transition shadow-sm"
                                >
                                  Ajukan Refund
                                </button>
                              )}
                              {/* Beri Rating — untuk transaksi selesai yang belum dirating */}
                              {canRate(t) && (
                                <button
                                  onClick={() => setRatingModal(t)}
                                  className="text-sm font-bold text-yellow-700 bg-yellow-50 border border-yellow-300 hover:bg-yellow-100 rounded-xl px-4 py-2 transition"
                                >
                                  ⭐ Beri Rating
                                </button>
                              )}
                              {ratedTxIds.has(t.id) && t.status === "completed" && (
                                <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Sudah Dirating
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <BarterHistoryList />
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
