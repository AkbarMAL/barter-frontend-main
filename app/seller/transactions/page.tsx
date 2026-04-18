"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/services/authentication";
import SidebarProfile from "@/components/sidebar-profile";
import { ProtectedRoute } from "@/components/protected-route";

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
        case "cod_completed":
        case "completed": return "bg-green-100 text-green-800 border-green-200";
        case "refund_requested": return "bg-orange-100 text-orange-800 border-orange-200";
        case "cancelled": return "bg-red-100 text-red-800 border-red-200";
        default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
}

function getStatusText(status: string) {
    switch (status) {
        case "cod_waiting": return "Menunggu COD";
        case "cod_completed": return "COD Selesai";
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

// ─── Seller Rating Modal ────────────────────────────────────────────────────
interface SellerRatingModalProps {
    transaction: ApiTransaction;
    onClose: () => void;
    onSuccess: (txId: number) => void;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
                        className={`w-10 h-10 transition-colors ${star <= (hover || value) ? "text-yellow-400" : "text-gray-200"}`}
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

const STAR_LABELS: Record<number, string> = {
    1: "Sangat Buruk 😞", 2: "Kurang Baik 😕", 3: "Cukup 😐", 4: "Baik 😊", 5: "Sangat Baik 🤩",
};

function SellerRatingModal({ transaction, onClose, onSuccess }: SellerRatingModalProps) {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (rating === 0) { setError("Pilih rating bintang terlebih dahulu."); return; }
        setError("");
        setSubmitting(true);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const res = await fetch(`${BASE_URL}/ratings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    transaction_id: transaction.id,
                    type: "seller_to_buyer",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Beri Rating Pembeli ⭐</h2>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                            {transaction.product?.title ?? `Transaksi #${transaction.transaction_code}`}
                        </p>
                        {transaction.buyer && (
                            <p className="text-xs text-gray-400 mt-0.5">
                                Pembeli: <span className="font-semibold text-gray-600">{transaction.buyer.name}</span>
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
                    <div className="text-center py-2">
                        <p className="text-sm font-semibold text-gray-700 mb-4">Bagaimana pengalaman transaksi dengan pembeli ini?</p>
                        <div className="flex justify-center">
                            <StarInput value={rating} onChange={setRating} />
                        </div>
                        <div className="h-7 mt-3">
                            {rating > 0 && (
                                <p className="text-base font-bold text-yellow-500">{STAR_LABELS[rating]}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Ulasan <span className="text-gray-400 font-normal">(opsional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Ceritakan pengalaman transaksi dengan pembeli ini..."
                            maxLength={1000}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{review.length}/1000</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">{error}</div>
                    )}
                </div>

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
                        className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2"
                    >
                        {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {submitting ? "Mengirim..." : "⭐ Kirim Rating"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Seller Barter Component ───────────────────────────────────────────────
function BarterSellerList() {
    const [barters, setBarters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [actionModal, setActionModal] = useState<{ id: number, type: 'accept' | 'reject' } | null>(null);
    const [sellerNote, setSellerNote] = useState("");
    const [additionalPrice, setAdditionalPrice] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchBarters = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/seller/barter`, {
                headers: getAuthHeaders(),
            });
            const json = await res.json();
            if (json.success) {
                setBarters(json.data.data || json.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBarters(); }, [fetchBarters]);

    const handleAction = async () => {
        if (!actionModal) return;
        setSubmitting(true);
        try {
            const url = `${BASE_URL}/seller/barter/${actionModal.id}/${actionModal.type}`;
            const body: any = { seller_note: sellerNote };
            if (actionModal.type === 'accept' && additionalPrice) {
                body.offer_additional_price = parseInt(additionalPrice, 10);
            }

            const res = await fetch(url, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (json.success) {
                setActionModal(null);
                setSellerNote("");
                setAdditionalPrice("");
                fetchBarters();
            } else {
                alert(json.message || "Gagal memproses barter.");
            }
        } catch (err) {
            alert("Kesalahan jaringan.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async (id: number) => {
        if (!confirm("Konfirmasi bahwa pertemuan COD telah selesai dan barang ditukar?")) return;
        try {
            const res = await fetch(`${BASE_URL}/seller/barter/${id}/complete`, {
                method: "POST",
                headers: getAuthHeaders()
            });
            const json = await res.json();
            if (json.success) {
                fetchBarters();
            } else { alert("Gagal menyelesaikan barter."); }
        } catch { alert("Kesalahan jaringan."); }
    };

    const barterFilters = [
        { label: "Semua", value: "all" },
        { label: "Menunggu", value: "pending" },
        { label: "Menunggu Bayar Pembeli", value: "payment_pending" },
        { label: "Selesai / Setuju COD", value: "completed" },
        { label: "Ditolak / Batal", value: "cancelled" }
    ];

    const filtered = filter === "all" ? barters : barters.filter(b => {
        if (filter === "pending") return ["pending", "seller_reviewing"].includes(b.status);
        if (filter === "completed") return ["payment_confirmed", "accepted", "completed"].includes(b.status);
        if (filter === "cancelled") return ["cancelled", "rejected"].includes(b.status);
        return b.status === filter;
    });

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "pending": case "seller_reviewing": return { text: "Perlu Direview", color: "bg-yellow-100 text-yellow-800" };
            case "accepted": return { text: "Disetujui (Tunggu COD)", color: "bg-blue-100 text-blue-800" };
            case "payment_pending": return { text: "Menunggu Bayar Selisih", color: "bg-orange-100 text-orange-800" };
            case "payment_confirmed": return { text: "Pembayaran Dikonfirmasi (Tunggu COD)", color: "bg-blue-100 text-blue-800" };
            case "completed": return { text: "Selesai", color: "bg-green-100 text-green-800" };
            case "cancelled": return { text: "Dibatalkan Pembeli", color: "bg-red-100 text-red-800" };
            case "rejected": return { text: "Anda Tolak", color: "bg-red-100 text-red-800" };
            default: return { text: status, color: "bg-gray-100 text-gray-800" };
        }
    };

    return (
        <div className="mt-4">
            <div className="flex gap-2 mb-6 flex-wrap">
                {barterFilters.map(f => (
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
                <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                    <h3 className="text-gray-500">Belum ada pengajuan barter dari pembeli.</h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(b => {
                        const statusInfo = getStatusInfo(b.status);

                        let images = [];
                        try {
                            if (b.offer_images) images = JSON.parse(b.offer_images);
                        } catch (e) { }

                        return (
                            <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-5">
                                {/* Foto Produk */}
                                <div className="flex-shrink-0 flex justify-center md:justify-start">
                                    {b.product?.images && b.product.images.length > 0 ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`http://127.0.0.1:8000/storage/${b.product.images[0].image_path}`}
                                            alt={b.product?.title || "Produk"}
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
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
                                        <p className="text-xs text-gray-400 font-mono">ID: {b.id} • Dibuat: {new Date(b.created_at).toLocaleDateString("id-ID")}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Barang Anda yang diincar:</p>
                                        <p className="font-bold text-gray-800">{b.product?.title}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tawaran Pembeli</p>
                                        <h3 className="font-bold text-lg text-gray-800">{b.offer_item_name}</h3>
                                        <p className="text-sm text-gray-600 mb-2">Tawaran Selisih: <strong className="text-orange-600">{b.offer_additional_price > 0 ? formatRupiah(b.offer_additional_price) : "Tidak ada bayaran"}</strong></p>

                                        {images.length > 0 && (
                                            <div className="flex gap-2">
                                                {images.map((img: string, i: number) => (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img key={i} src={`http://127.0.0.1:8000/storage/${img}`} alt="" className="w-16 h-16 object-cover rounded-lg border bg-white" />
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm italic mt-2 text-gray-500">"{b.offer_description}"</p>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-2">
                                        <span className="font-semibold text-gray-700">Oleh:</span> {b.buyer?.name} ({b.buyer?.email})
                                    </p>
                                </div>

                                <div className="md:w-56 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5">
                                    {["pending", "seller_reviewing"].includes(b.status) && (
                                        <>
                                            <button onClick={() => setActionModal({ id: b.id, type: 'accept' })} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-sm transition">Terima Tawaran</button>
                                            <button onClick={() => setActionModal({ id: b.id, type: 'reject' })} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 border border-red-200 transition">Tolak</button>
                                        </>
                                    )}

                                    {["accepted", "payment_confirmed"].includes(b.status) && (
                                        <button onClick={() => handleComplete(b.id)} className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 shadow-sm transition">Sudah Selesai COD</button>
                                    )}

                                    {b.seller_note && (
                                        <div className="text-xs bg-orange-50 border border-orange-100 p-3 rounded-xl text-orange-800">
                                            <b>Balasan Anda:</b><br />{b.seller_note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl text-gray-900">
                        <h2 className="font-bold text-xl text-gray-900 mb-1">{actionModal.type === 'accept' ? 'Terima Tawaran Barter' : 'Tolak Tawaran Barter'}</h2>
                        <p className="text-sm text-gray-900 mb-5">{actionModal.type === 'accept' ? 'Lakukan penyesuaian akhir pembayaran dan catatan COD.' : 'Berikan alasan menolak pengajuan ini agar pembeli tahu.'}</p>

                        {actionModal.type === 'accept' && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Set Nominal Selisih Akhir (Rp)</label>
                                <input type="number" placeholder="0" className="w-full border border-gray-200 p-3 bg-gray-50 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none" value={additionalPrice} onChange={e => setAdditionalPrice(e.target.value)} />
                                <p className="text-xs text-gray-900 mt-1.5 leading-relaxed">Kosongkan atau ketik 0 jika setuju barter murni 1 banding 1. Jika diisi, pembeli wajib membayar selisih ini melalui Rekening Bersama (Midtrans) sebelum Anda COD.</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Pesan Balasan *</label>
                            <textarea className="w-full border border-gray-200 p-3 bg-gray-50 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none" rows={3} placeholder={actionModal.type === 'accept' ? "Kapan, dimana bisa COD dan pastikan setuju..." : "Maaf, barang kurang sesuai ekspektasi..."} value={sellerNote} onChange={e => setSellerNote(e.target.value)}></textarea>
                            <p className="text-xs text-red-400 mt-1">{!sellerNote.trim() && "Pesan tidak boleh kosong."}</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setActionModal(null)} className="flex-1 py-3 border border-gray-200 font-bold text-gray-600 rounded-2xl hover:bg-gray-50">Batal</button>
                            <button onClick={handleAction} disabled={submitting || !sellerNote.trim()} className={`flex-1 py-3 text-white font-bold rounded-2xl flex justify-center items-center gap-2 ${actionModal.type === 'accept' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}>
                                {submitting && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {submitting ? "Tunggu..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function SellerTransactionsPage() {
    const pathname = usePathname();
    const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<"purchases" | "barters">("purchases");
    const [user, setUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [trackingModal, setTrackingModal] = useState<{ transactionId: number } | null>(null);
    const [ratingModal, setRatingModal] = useState<ApiTransaction | null>(null);
    const [ratedTxIds, setRatedTxIds] = useState<Set<number>>(new Set());

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
        if (filter === "completed") return t.status === "completed" || t.status === "cod_completed";
        if (filter === "processing") return t.status === "processing" || t.status === "cod_waiting";
        return t.status === filter;
    });

    return (
        <ProtectedRoute requiredRole="seller">
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
                    <SidebarProfile user={user} />
                </div>

                {/* ── Main Content ── */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
                    {/* Header */}
                    <div className="mb-6 md:mb-8">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Manajemen Penjualan</h1>
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

                        {/* Main Toggle Bar */}
                        <div className="flex gap-6 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab("purchases")}
                                className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === "purchases" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                Penjualan Reguler
                            </button>
                            <button
                                onClick={() => setActiveTab("barters")}
                                className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${activeTab === "barters" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                Tukar Tambah (Barter)
                            </button>
                        </div>
                    </div>

                    {activeTab === "purchases" ? (
                        <>

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

                                                            {/* Beri Rating Pembeli — hanya untuk transaksi selesai */}
                                                            {transaction.status === "completed" && !ratedTxIds.has(transaction.id) && (
                                                                <button
                                                                    onClick={() => setRatingModal(transaction)}
                                                                    className="rounded-lg bg-yellow-50 border border-yellow-300 px-4 py-2 text-sm font-bold text-yellow-700 hover:bg-yellow-100 transition"
                                                                >
                                                                    ⭐ Beri Rating Pembeli
                                                                </button>
                                                            )}
                                                            {transaction.status === "completed" && ratedTxIds.has(transaction.id) && (
                                                                <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    Pembeli Sudah Dirating
                                                                </span>
                                                            )}

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        <BarterSellerList />
                    )}
                </div>

                {/* Tracking Number Modal */}
                {trackingModal && (
                    <TrackingModal
                        onConfirm={confirmShip}
                        onClose={() => setTrackingModal(null)}
                    />
                )}

                {/* Seller Rating Modal */}
                {ratingModal && (
                    <SellerRatingModal
                        transaction={ratingModal}
                        onClose={() => setRatingModal(null)}
                        onSuccess={(txId) => {
                            setRatingModal(null);
                            setRatedTxIds((prev) => new Set([...prev, txId]));
                            showToast("success", "Rating pembeli berhasil dikirim! ⭐");
                        }}
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
        </ProtectedRoute>
    );
}