"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarProfile from "@/components/sidebar-profile";
import { submitRefund, SubmitRefundPayload } from "@/services/refund";
import api from "@/services/api";
import {
  createMidtransPayment,
  loadMidtransSnap,
  openMidtransSnap,
} from "@/services/transaction";

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
    case "processing": return "bg-indigo-100 text-indigo-800";
    case "shipped": return "bg-purple-100 text-purple-800";
    case "delivered": return "bg-teal-100 text-teal-800";
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [refundModal, setRefundModal] = useState<ApiTransaction | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState<number | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("current_user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }
  }, []);

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
    ["delivered", "completed"].includes(t.status);

  const canConfirm = (t: ApiTransaction) =>
    ["shipped", "delivered"].includes(t.status);

  const canPay = (t: ApiTransaction) =>
    t.status === "pending" && t.type === "rekber";

  const handlePayNow = async (t: ApiTransaction) => {
    setPaymentLoading(t.id);
    try {
      const res = await createMidtransPayment(t.id);
      if (res.success) {
        await loadMidtransSnap(res.data.client_key, res.data.is_production);
        openMidtransSnap(res.data.snap_token, {
          onSuccess: () => {
            showToast("Pembayaran berhasil! Pesanan sedang diproses.", "success");
            fetchTransactions();
          },
          onPending: () => {
            showToast("Pembayaran pending, menunggu konfirmasi.", "success");
          },
          onError: () => {
            showToast("Pembayaran gagal. Silakan coba lagi.", "error");
          },
          onClose: () => {
            // User menutup popup, tidak ada aksi
          },
        });
      } else {
        showToast("Gagal memuat halaman pembayaran.", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Gagal membuka pembayaran.", "error");
    } finally {
      setPaymentLoading(null);
    }
  };

  const filtered = transactions.filter((t) =>
    filter === "all" ? true : t.status === filter
  );

  const filters = [
    { label: "Semua", value: "all" },
    { label: "Menunggu Bayar", value: "pending" },
    { label: "Diproses", value: "processing" },
    { label: "Dikirim", value: "shipped" },
    { label: "Terkirim", value: "delivered" },
    { label: "Selesai", value: "completed" },
    { label: "Refund", value: "refund_requested" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition
          ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pembelian Saya</h1>
            <p className="text-gray-500 text-sm mt-1">Pantau status pembelian dan ajukan refund jika diperlukan.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/purchases/refunds"
              className="text-sm font-semibold text-orange-600 border border-orange-200 bg-orange-50 rounded-xl px-4 py-2 hover:bg-orange-100 transition"
            >
              📋 Riwayat Refund Saya
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
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
