"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/services/authentication";

const BASE_URL = "http://127.0.0.1:8000/api/v1";

// ─── Types sesuai response API ─────────────────────────────────────────────
interface ApiTransaction {
    id: number;
    transaction_code: string;
    status: string;
    type: "cod" | "rekber";
    final_amount: number;
    total_price: number;
    shipping_address: string | null;
    shipping_city: string | null;
    created_at: string;
    product?: {
        id: number;
        title: string;
        images?: { image_path: string }[];
    };
    buyer?: {
        id: number;
        name: string;
        email: string;
    };
}

// ─── Sidebar menus ────────────────────────────────────────────────────────
const sellerMenus = [
    { name: "Dashboard", href: "/seller" },
    { name: "Produk", href: "/seller/products" },
    { name: "Transaksi", href: "/seller/transactions" },
    { name: "Refunds", href: "/seller/refunds" },
    { name: "Wallet", href: "/seller/wallet" },
    { name: "Ads", href: "/seller/ads" },
    { name: "Notifikasi", href: "/seller/notifications" },
    { name: "Pindah ke halaman pembeli", href: "/" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function getStatusColor(status: string) {
    switch (status) {
        case "cod_waiting":
        case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "payment_confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
        case "processing": return "bg-indigo-100 text-indigo-800 border-indigo-200";
        case "shipped": return "bg-purple-100 text-purple-800 border-purple-200";
        case "delivered": return "bg-teal-100 text-teal-800 border-teal-200";
        case "completed": return "bg-green-100 text-green-800 border-green-200";
        case "refund_requested": return "bg-orange-100 text-orange-800 border-orange-200";
        case "cancelled": return "bg-red-100 text-red-800 border-red-200";
        default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
}

function getStatusText(status: string) {
    switch (status) {
        case "cod_waiting": return "Menunggu COD";
        case "pending": return "Menunggu Pembayaran";
        case "payment_confirmed": return "Pembayaran Dikonfirmasi";
        case "processing": return "Sedang Diproses";
        case "shipped": return "Sedang Dikirim";
        case "delivered": return "Terkirim";
        case "completed": return "Selesai";
        case "refund_requested": return "Refund Diajukan";
        case "cancelled": return "Dibatalkan";
        default: return status;
    }
}

function getProductImage(transaction: ApiTransaction) {
    if (transaction.product?.images && transaction.product.images.length > 0) {
        return `http://127.0.0.1:8000/storage/${transaction.product.images[0].image_path}`;
    }
    return null;
}

// ─── Tracking Number Modal ────────────────────────────────────────────────
function TrackingModal({ onConfirm, onClose }: { onConfirm: (tracking: string) => void; onClose: () => void }) {
    const [tracking, setTracking] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <h3 className="font-bold text-gray-800 mb-1">Masukkan Nomor Resi</h3>
                <p className="text-sm text-gray-500 mb-4">Nomor resi pengiriman untuk pembeli.</p>
                <input
                    type="text"
                    placeholder="cth: JNE123456789"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-4"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition">
                        Batal
                    </button>
                    <button
                        onClick={() => tracking.trim() && onConfirm(tracking.trim())}
                        disabled={!tracking.trim()}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition"
                    >
                        Konfirmasi
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function SellerTransactionsPage() {
    const pathname = usePathname();
    const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [user, setUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [trackingModal, setTrackingModal] = useState<{ transactionId: number } | null>(null);

    useEffect(() => {
        // Load user
        const userStr = localStorage.getItem("current_user");
        if (userStr) {
            try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
        }
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/transactions?role=seller`, {
                headers: getAuthHeaders(),
            });
            const json = await res.json();
            if (json.success) {
                setTransactions(json.data.data || json.data);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
            showToast("error", "Gagal memuat data transaksi.");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // Update status via API
    const updateStatus = async (transactionId: number, newStatus: string, trackingNumber?: string) => {
        setActionLoading(transactionId);
        try {
            const body: Record<string, string> = { status: newStatus };
            if (trackingNumber) body.tracking_number = trackingNumber;

            const res = await fetch(`${BASE_URL}/transactions/${transactionId}/status`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.success) {
                showToast("success", "Status transaksi berhasil diperbarui.");
                // Update local state
                setTransactions(prev =>
                    prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t)
                );
            } else {
                showToast("error", json.message || "Gagal memperbarui status.");
            }
        } catch {
            showToast("error", "Terjadi kesalahan jaringan.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleShip = (transactionId: number) => {
        setTrackingModal({ transactionId });
    };

    const confirmShip = async (tracking: string) => {
        if (!trackingModal) return;
        setTrackingModal(null);
        await updateStatus(trackingModal.transactionId, "shipped", tracking);
    };

    // Stats
    const totalPendapatan = transactions
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + (t.total_price ?? 0), 0);

    const filteredTransactions = transactions.filter(t => {
        if (filter === "all") return true;
        return t.status === filter;
    });

    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* ── Sidebar ── */}
            <div className="w-64 bg-white border-r p-4 hidden md:flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-blue-500" style={{ letterSpacing: "2px" }}>Rather&apos;s</h1>
                    <p className="text-sm text-gray-500 mb-4">Seller Dashboard</p>

                    <nav className="mt-6 space-y-2">
                        {sellerMenus.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition
                  ${pathname === item.href
                                        ? "bg-blue-100 text-blue-600"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Profile */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                            S
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">Seller Name</p>
                            <p className="text-xs text-blue-600 cursor-pointer">Lihat Profil</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
                {/* Header */}
                <div className="mb-6 md:mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Transaksi Penjualan</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Kelola semua transaksi produk yang Anda jual
                        </p>
                    </div>
                    <button
                        onClick={fetchTransactions}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="rounded-full bg-blue-50 p-2 text-blue-500">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 pl-1">{transactions.length}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="rounded-full bg-yellow-50 p-2 text-yellow-500">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Perlu Diproses</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 pl-1">
                            {transactions.filter(t => t.status === "payment_confirmed").length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="rounded-full bg-green-50 p-2 text-green-500">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Selesai</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 pl-1">
                            {transactions.filter(t => t.status === "completed").length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 overflow-hidden relative group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="rounded-full bg-indigo-50 p-2 text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-indigo-600 pl-1 break-words">
                            {formatRupiah(totalPendapatan)}
                        </p>
                        <Link href="/seller/wallet" className="absolute top-4 right-4 text-gray-400 hover:text-indigo-500 transition-colors" title="Lihat Wallet">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100 inline-block overflow-x-auto max-w-full">
                    <div className="flex gap-1 flex-nowrap md:flex-wrap">
                        {[
                            { value: "all", label: "Semua" },
                            { value: "payment_confirmed", label: "Perlu Diproses" },
                            { value: "processing", label: "Diproses" },
                            { value: "shipped", label: "Dikirim" },
                            { value: "completed", label: "Selesai" },
                            { value: "refund_requested", label: "Refund" },
                            { value: "cancelled", label: "Batal" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={`rounded-lg px-3 py-2 whitespace-nowrap text-sm font-medium transition ${filter === option.value
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-transparent text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-100">
                            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum ada transaksi</h3>
                            <p className="text-gray-500 text-sm">Transaksi akan muncul di sini setelah ada pembelian produk Anda</p>
                        </div>
                    ) : (
                        filteredTransactions.map((transaction) => {
                            const productImage = getProductImage(transaction);
                            const isProcessing = actionLoading === transaction.id;
                            return (
                                <div key={transaction.id} className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-5">
                                        {/* Product Image */}
                                        <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
                                            {productImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={productImage}
                                                    alt={transaction.product?.title || "Produk"}
                                                    className="rounded-xl object-cover border border-gray-100 h-28 w-28 md:h-24 md:w-24"
                                                />
                                            ) : (
                                                <div className="rounded-xl bg-gray-100 border border-gray-200 h-28 w-28 md:h-24 md:w-24 flex items-center justify-center">
                                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Transaction Details */}
                                        <div className="flex-1 min-w-0 w-full">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-2 md:gap-0">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                                                        {transaction.product?.title || "Produk"}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 inline-block px-2 py-1 rounded font-mono">
                                                        {transaction.transaction_code}
                                                    </p>
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {formatRupiah(transaction.final_amount ?? transaction.total_price ?? 0)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(transaction.created_at).toLocaleDateString("id-ID", {
                                                            day: "numeric", month: "long", year: "numeric"
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div>
                                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Pembeli</p>
                                                    <p className="text-sm font-bold text-gray-700">{transaction.buyer?.name || "-"}</p>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">{transaction.buyer?.email || "-"}</p>
                                                </div>

                                                <div>
                                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Metode</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {transaction.type === "cod" ? (
                                                            <span className="w-5 h-5 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">🚗</span>
                                                        ) : (
                                                            <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">🏦</span>
                                                        )}
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {transaction.type === "cod" ? "Cash on Delivery" : "Rekening Bersama"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                                    <div className="mt-1">
                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${getStatusColor(transaction.status)}`}>
                                                            {getStatusText(transaction.status)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {(transaction.shipping_address || transaction.shipping_city) && (
                                                    <div className="sm:col-span-2 lg:col-span-1">
                                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tujuan</p>
                                                        <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed">
                                                            {[transaction.shipping_address, transaction.shipping_city].filter(Boolean).join(", ")}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 flex-wrap items-center mt-2 border-t border-gray-50 pt-4">
                                                {/* Seller: Proses setelah pembayaran dikonfirmasi */}
                                                {transaction.status === "payment_confirmed" && (
                                                    <button
                                                        onClick={() => updateStatus(transaction.id, "processing")}
                                                        disabled={isProcessing}
                                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm disabled:opacity-60"
                                                    >
                                                        {isProcessing ? "Memproses..." : "Proses Pesanan"}
                                                    </button>
                                                )}

                                                {/* Seller: Kirim barang */}
                                                {transaction.status === "processing" && (
                                                    <button
                                                        onClick={() => handleShip(transaction.id)}
                                                        disabled={isProcessing}
                                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
                                                    >
                                                        {isProcessing ? "Memproses..." : "Kirim Barang"}
                                                    </button>
                                                )}

                                                {/* COD: Seller selesaikan COD */}
                                                {transaction.status === "cod_waiting" && (
                                                    <button
                                                        onClick={() => updateStatus(transaction.id, "cod_completed")}
                                                        disabled={isProcessing}
                                                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition shadow-sm disabled:opacity-60"
                                                    >
                                                        {isProcessing ? "Memproses..." : "Selesaikan COD"}
                                                    </button>
                                                )}

                                                <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm">
                                                    Hubungi Pembeli
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Tracking Number Modal */}
            {trackingModal && (
                <TrackingModal
                    onConfirm={confirmShip}
                    onClose={() => setTrackingModal(null)}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-medium
                    ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.type === "success" ? "✅" : "❌"} {toast.message}
                </div>
            )}
        </div>
    );
}