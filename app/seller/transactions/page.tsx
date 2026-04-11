"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { products, Product } from "@/lib/products";
import { logout } from "@/services/authentication";

const BASE_URL = "http://127.0.0.1:8000/api/v1";

interface Transaction {
    id: string;
    product: Product;
    buyerName: string;
    buyerEmail: string;
    paymentMethod: "cod" | "bank";
    status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
    amount: string;
    orderDate: string;
    shippingAddress?: string;
}

interface WalletBalance {
    balance: number;
    balance_formatted: string;
}

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

export default function SellerTransactionsPage() {
    const pathname = usePathname();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    // Mock data untuk demonstrasi - dalam implementasi nyata ini akan dari API
    useEffect(() => {
        const mockTransactions: Transaction[] = [
            {
                id: "TRX001",
                product: products[0],
                buyerName: "Ahmad Rahman",
                buyerEmail: "ahmad@example.com",
                paymentMethod: "cod",
                status: "pending",
                amount: "Rp 2.500.000",
                orderDate: "2024-01-15",
                shippingAddress: "Jl. Sudirman No. 123, Jakarta"
            },
            {
                id: "TRX002",
                product: products[1],
                buyerName: "Siti Nurhaliza",
                buyerEmail: "siti@example.com",
                paymentMethod: "bank",
                status: "paid",
                amount: "Rp 1.800.000",
                orderDate: "2024-01-14",
                shippingAddress: "Jl. Malioboro No. 45, Yogyakarta"
            },
            {
                id: "TRX003",
                product: products[2],
                buyerName: "Budi Santoso",
                buyerEmail: "budi@example.com",
                paymentMethod: "cod",
                status: "shipped",
                amount: "Rp 950.000",
                orderDate: "2024-01-13",
                shippingAddress: "Jl. Braga No. 67, Bandung"
            },
            {
                id: "TRX004",
                product: products[3],
                buyerName: "Maya Sari",
                buyerEmail: "maya@example.com",
                paymentMethod: "bank",
                status: "completed",
                amount: "Rp 3.200.000",
                orderDate: "2024-01-12",
                shippingAddress: "Jl. Thamrin No. 89, Jakarta"
            }
        ];

        // Simulate API call
        setTimeout(() => {
            setTransactions(mockTransactions);
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "paid": return "bg-blue-100 text-blue-800 border-blue-200";
            case "shipped": return "bg-purple-100 text-purple-800 border-purple-200";
            case "completed": return "bg-green-100 text-green-800 border-green-200";
            case "cancelled": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending": return "Menunggu Pembayaran";
            case "paid": return "Sudah Dibayar";
            case "shipped": return "Sedang Dikirim";
            case "completed": return "Selesai";
            case "cancelled": return "Dibatalkan";
            default: return status;
        }
    };

    const getPaymentMethodText = (method: string) => {
        switch (method) {
            case "cod": return "Cash on Delivery";
            case "bank": return "Transfer Bank";
            default: return method;
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        if (filter === "all") return true;
        return transaction.status === filter;
    });

    const updateTransactionStatus = (transactionId: string, newStatus: Transaction["status"]) => {
        setTransactions(prev =>
            prev.map(trx =>
                trx.id === transactionId ? { ...trx, status: newStatus } : trx
            )
        );
    };

    // Calculate total earnings from completed transactions
    const totalPendapatan = transactions
        .filter(t => t.status === "completed")
        .reduce((sum, t) => {
            const num = parseInt(t.amount.replace(/[^0-9]/g, ""), 10);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);

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
                            <p className="text-sm font-medium text-gray-600">Menunggu</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 pl-1">
                            {transactions.filter(t => t.status === "pending").length}
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
                            { value: "pending", label: "Menunggu" },
                            { value: "paid", label: "Dibayar" },
                            { value: "shipped", label: "Dikirim" },
                            { value: "completed", label: "Selesai" },
                            { value: "cancelled", label: "Batal" }
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Belum ada transaksi
                            </h3>
                            <p className="text-gray-500 text-sm">
                                Transaksi akan muncul di sini setelah ada pembelian produk Anda
                            </p>
                        </div>
                    ) : (
                        filteredTransactions.map((transaction) => (
                            <div key={transaction.id} className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row items-start gap-4 md:gap-5">
                                    {/* Product Image */}
                                    <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
                                        <Image
                                            src={transaction.product.image}
                                            width={100}
                                            height={100}
                                            alt={transaction.product.name}
                                            className="rounded-xl object-cover border border-gray-100 h-28 w-28 md:h-24 md:w-24"
                                        />
                                    </div>

                                    {/* Transaction Details */}
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-2 md:gap-0">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg mb-1">
                                                    {transaction.product.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 inline-block px-2 py-1 rounded font-mono">
                                                    ID: {transaction.id}
                                                </p>
                                            </div>
                                            <div className="md:text-right">
                                                <p className="text-lg font-bold text-blue-600">
                                                    {transaction.amount}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(transaction.orderDate).toLocaleDateString("id-ID", {
                                                        day: "numeric", month: "long", year: "numeric"
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div>
                                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Pembeli</p>
                                                <p className="text-sm font-bold text-gray-700">{transaction.buyerName}</p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{transaction.buyerEmail}</p>
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Metode</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {transaction.paymentMethod === 'cod' ? (
                                                        <span className="w-5 h-5 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs">🚗</span>
                                                    ) : (
                                                        <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">🏦</span>
                                                    )}
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {getPaymentMethodText(transaction.paymentMethod)}
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
                                            
                                            {transaction.shippingAddress && (
                                                <div className="sm:col-span-2 lg:col-span-1">
                                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tujuan</p>
                                                    <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed" title={transaction.shippingAddress}>{transaction.shippingAddress}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 flex-wrap items-center mt-2 border-t border-gray-50 pt-4">
                                            {transaction.status === "pending" && transaction.paymentMethod === "bank" && (
                                                <button
                                                    onClick={() => updateTransactionStatus(transaction.id, "paid")}
                                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
                                                >
                                                    Konfirmasi Pembayaran
                                                </button>
                                            )}

                                            {transaction.status === "paid" && (
                                                <button
                                                    onClick={() => updateTransactionStatus(transaction.id, "shipped")}
                                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm"
                                                >
                                                    Kirim Barang
                                                </button>
                                            )}

                                            {transaction.status === "shipped" && (
                                                <button
                                                    onClick={() => updateTransactionStatus(transaction.id, "completed")}
                                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 transition shadow-sm"
                                                >
                                                    Tandai Selesai
                                                </button>
                                            )}

                                            <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm">
                                                Hubungi Pembeli
                                            </button>

                                            {(transaction.status === "pending" || transaction.status === "paid") && (
                                                <button className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition shadow-sm ml-auto">
                                                    Batalkan
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}