"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarProfile from "@/components/sidebar-profile";
import { getMyRefunds, escalateRefund, RefundItem } from "@/services/refund";

const BASE_URL = "http://127.0.0.1:8000";

const buyerMenus = [
  { name: "Beranda", href: "/" },
  { name: "Notifikasi", href: "/notifications" },
  { name: "Favorit", href: "/favorites" },
  { name: "Pembelian", href: "/purchases" },
  { name: "Pindah ke seller", href: "/seller" },
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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStorageUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}/storage/${path}`;
}

// ── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: string; description: string }
> = {
  pending: {
    label: "Menunggu Penjual",
    className: "bg-amber-100 text-amber-800",
    icon: "⏳",
    description: "Permintaan refund Anda sudah dikirim. Penjual akan merespons dalam 2×24 jam.",
  },
  seller_reviewing: {
    label: "Sedang Ditinjau Penjual",
    className: "bg-blue-100 text-blue-800",
    icon: "🔍",
    description: "Penjual sedang meninjau permintaan refund Anda.",
  },
  seller_approved: {
    label: "Disetujui Penjual",
    className: "bg-green-100 text-green-800",
    icon: "✅",
    description: "Refund Anda disetujui! Dana akan segera dikembalikan ke rekening Anda.",
  },
  seller_rejected: {
    label: "Ditolak Penjual",
    className: "bg-red-100 text-red-700",
    icon: "❌",
    description: "Penjual menolak refund Anda. Anda dapat mengeskalasi ke admin jika tidak setuju.",
  },
  admin_reviewing: {
    label: "Ditinjau Admin",
    className: "bg-purple-100 text-purple-800",
    icon: "🛡️",
    description: "Admin sedang meninjau kasus Anda. Proses membutuhkan 1-3 hari kerja.",
  },
  rejected: {
    label: "Ditolak Admin",
    className: "bg-red-100 text-red-700",
    icon: "🚫",
    description: "Refund Anda ditolak oleh admin.",
  },
  processed: {
    label: "Dana Dikembalikan",
    className: "bg-emerald-100 text-emerald-800",
    icon: "💰",
    description: "Proses refund selesai. Dana telah dikembalikan.",
  },
};

// ── Timeline ──────────────────────────────────────────────────────────────────

function RefundTimeline({ refund }: { refund: RefundItem }) {
  const steps = [
    { key: "submitted", label: "Refund Diajukan", date: refund.created_at, done: true },
    {
      key: "reviewing",
      label: "Ditinjau Penjual",
      date: refund.status === "seller_reviewing" ? refund.updated_at : null,
      done: ["seller_reviewing", "seller_approved", "seller_rejected", "admin_reviewing", "rejected", "processed"].includes(refund.status),
    },
    {
      key: "responded",
      label: refund.status === "seller_rejected" ? "Ditolak Penjual" : "Disetujui Penjual",
      date: refund.seller_responded_at,
      done: ["seller_approved", "seller_rejected", "admin_reviewing", "rejected", "processed"].includes(refund.status),
      isRejected: refund.status === "seller_rejected" && !refund.is_escalated,
    },
    ...(refund.is_escalated
      ? [
          {
            key: "escalated",
            label: "Dieskalasi ke Admin",
            date: refund.escalated_at,
            done: true,
          },
          {
            key: "admin",
            label: "Keputusan Admin",
            date: ["rejected", "processed"].includes(refund.status) ? refund.updated_at : null,
            done: ["rejected", "processed"].includes(refund.status),
          },
        ]
      : []),
    {
      key: "done",
      label: "Selesai",
      date: refund.status === "processed" ? refund.updated_at : null,
      done: refund.status === "processed",
    },
  ];

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />
      <div className="space-y-4">
        {steps.map((s) => (
          <div key={s.key} className="flex items-start gap-3 relative">
            <div
              className={`absolute -left-4 w-3 h-3 rounded-full border-2 mt-1 flex-shrink-0
              ${s.done
                ? s.isRejected
                  ? "bg-red-400 border-red-400"
                  : "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300"
              }`}
            />
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${s.done ? (s.isRejected ? "text-red-600" : "text-gray-900") : "text-gray-400"}`}>
                {s.label}
              </p>
              {s.date && (
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.date)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BuyerRefundsPage() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [escalateConfirm, setEscalateConfirm] = useState<number | null>(null);

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

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyRefunds();
      setRefunds(res.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Gagal memuat data refund.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleEscalate = async (refundId: number) => {
    setEscalateConfirm(null);
    setActionLoading(refundId);
    try {
      const res = await escalateRefund(refundId);
      showToast(res.message, "success");
      setRefunds((prev) => prev.map((r) => (r.id === refundId ? res.data : r)));
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Gagal mengeskalasi refund.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold
          ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Escalate Confirm Modal */}
      {escalateConfirm !== null && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="text-3xl mb-3 text-center">🛡️</div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Eskalasi ke Admin?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Permintaan Anda akan diteruskan ke tim admin untuk ditinjau ulang. Admin akan merespons dalam <strong>1-3 hari kerja</strong>. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEscalateConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleEscalate(escalateConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700"
              >
                Ya, Eskalasi ke Admin
              </button>
            </div>
          </div>
        </div>
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
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/purchases" className="text-sm text-blue-500 hover:underline">← Pembelian</Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Riwayat Refund Saya</h1>
            <p className="text-gray-500 text-sm mt-1">Pantau status semua pengajuan refund Anda.</p>
          </div>
          <button
            onClick={fetchRefunds}
            disabled={loading}
            className="text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl px-4 py-2 hover:bg-blue-50 disabled:opacity-50 transition"
          >
            {loading ? "Memuat…" : "↻ Refresh"}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm">
            <p className="text-red-500 font-semibold">{error}</p>
            <button onClick={fetchRefunds} className="mt-4 text-sm text-blue-500 underline">Coba lagi</button>
          </div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada pengajuan refund</h3>
            <p className="text-gray-500 mt-2 text-sm">Jika ada masalah dengan pesanan, Anda bisa mengajukan refund dari halaman Pembelian.</p>
            <Link href="/purchases" className="mt-4 inline-block text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl px-5 py-2 hover:bg-blue-50">
              Ke Halaman Pembelian
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {refunds.map((r) => {
              const cfg = STATUS_CONFIG[r.status] ?? {
                label: r.status,
                className: "bg-gray-100 text-gray-700",
                icon: "•",
                description: "",
              };
              const isExpanded = expandedId === r.id;
              const isActing = actionLoading === r.id;
              const canEscalate = r.status === "seller_rejected" && !r.is_escalated;

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Status Banner */}
                  <div className={`px-5 py-3 flex items-center gap-3 ${cfg.className} border-b`}>
                    <span className="text-xl">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{cfg.label}</p>
                      {cfg.description && (
                        <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{cfg.description}</p>
                      )}
                    </div>
                    <span className="text-xs opacity-70 whitespace-nowrap">{formatDate(r.created_at)}</span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex gap-4 items-start">
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1 font-mono">Refund #{r.id} · Transaksi #{r.transaction_id}</p>
                        <p className="font-bold text-gray-900 text-base line-clamp-1">
                          {r.transaction?.product?.name ?? `Produk Transaksi #${r.transaction_id}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">Penjual: <span className="font-medium text-gray-700">{r.seller?.sellerProfile?.shop_name ?? r.seller?.name ?? `#${r.seller_id}`}</span></p>
                        <div className="mt-3 flex items-center gap-4 flex-wrap">
                          <div>
                            <p className="text-xs text-gray-400">Nominal Refund</p>
                            <p className="font-black text-blue-600">{formatRupiah(r.refund_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Rekening Tujuan</p>
                            <p className="text-sm font-semibold text-gray-700">{r.refund_bank} · {r.refund_account}</p>
                            <p className="text-xs text-gray-500">{r.refund_holder}</p>
                          </div>
                        </div>
                      </div>

                      {/* Evidence Images (compact) */}
                      {r.evidence_images?.length > 0 && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          {r.evidence_images.slice(0, 3).map((img, i) => (
                            <a key={i} href={getStorageUrl(img)} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getStorageUrl(img)}
                                alt=""
                                className="w-14 h-14 object-cover rounded-xl border border-gray-200 hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                          {r.evidence_images.length > 3 && (
                            <div className="w-14 h-14 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                              +{r.evidence_images.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reason Chip */}
                    <div className="mt-3">
                      <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                        {r.reason}
                      </span>
                      {r.description && (
                        <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 italic">&ldquo;{r.description}&rdquo;</p>
                      )}
                    </div>

                    {/* Seller Note */}
                    {r.seller_note && (
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-gray-500 mb-1">Catatan Penjual:</p>
                        <p className="text-sm text-gray-700">{r.seller_note}</p>
                      </div>
                    )}

                    {/* Escalated Notice */}
                    {r.is_escalated && (
                      <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        <div>
                          <p className="text-xs font-bold text-purple-700">Dieskalasi ke Admin</p>
                          {r.escalated_at && (
                            <p className="text-xs text-purple-500">{formatDate(r.escalated_at)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expand Toggle & Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                      <button
                        onClick={() => toggleExpand(r.id)}
                        className="text-sm text-blue-500 hover:text-blue-700 font-semibold"
                      >
                        {isExpanded ? "▲ Sembunyikan Timeline" : "▼ Lihat Timeline Proses"}
                      </button>

                      <div className="flex gap-2">
                        {isActing ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                            Memproses…
                          </div>
                        ) : canEscalate ? (
                          <button
                            onClick={() => setEscalateConfirm(r.id)}
                            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 shadow-sm transition"
                          >
                            🛡️ Eskalasi ke Admin
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Timeline */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Timeline Refund</p>
                        <RefundTimeline refund={r} />
                      </div>
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
