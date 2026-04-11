"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/services/authentication";

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

export default function SellerRefundsPage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<any[]>([]);

  useEffect(() => {
    // Menggunakan Mock Data karena spesifikasi Backend untuk Seller View Refund belum ada
    const mockRefunds = [
      {
        id: "RFN-001",
        txId: "TRX-9921",
        buyerName: "Budi Santoso",
        productName: "Kulkas AQUA 1 Pintu Motif Bunga",
        amount: "Rp 1.100.000",
        reason: "Barang rusak / cacat",
        description: "Bang, kok pas dicolokin dinginnya cuma bentar terus mati total? Kompresornya bunyi keras banget.",
        date: "2026-04-10",
        status: "pending",
        evidence: [
          "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500&q=80"
        ]
      },
      {
        id: "RFN-002",
        txId: "TRX-8120",
        buyerName: "Siti Nurhaliza",
        productName: "Laptop ASUS VivoBook",
        amount: "Rp 7.200.000",
        reason: "Barang tidak sesuai deskripsi",
        description: "Di deskripsi ditulis Intel Core i5 bang, tapi pas saya cek di properties malah Core i3?!",
        date: "2026-04-09",
        status: "pending",
        evidence: [
          "https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?w=500&q=80"
        ]
      }
    ];

    setTimeout(() => {
      setRefunds(mockRefunds);
      setLoading(false);
    }, 800);
  }, []);

  const handleAction = (id: string, action: 'approve'|'reject') => {
      if(!confirm(`Apakah Anda yakin ingin ${action === 'approve'? 'MENERIMA' : 'MENOLAK'} refund ini?`)) return;
      
      setRefunds(prev => prev.map(r => {
          if(r.id === id) {
              return {...r, status: action === 'approve' ? 'approved' : 'rejected'};
          }
          return r;
      }));
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-slate-800">
      
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

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
        <div className="mb-8">
           <h1 className="text-2xl font-bold text-slate-900">Manajemen Refund</h1>
           <p className="text-slate-500 mt-1">Tinjau dan proses keluhan dari pembeli untuk menjaga rating toko Anda.</p>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
        ) : refunds.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Tidak ada pengajuan refund</h3>
                <p className="text-gray-500 mt-2">Semua pembeli puas dengan produk Anda!</p>
            </div>
        ) : (
            <div className="space-y-6">
                {refunds.map(r => (
                    <div key={r.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                        
                        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-sm text-gray-500">{r.id}</span>
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-lg">Refund Diajukan</span>
                            </div>
                            <span className="font-medium text-sm text-gray-400">{r.date}</span>
                        </div>

                        <div className="p-6 md:flex gap-8">
                            {/* Kiri - Data Penjualan */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pembeli</p>
                                    <p className="font-bold text-gray-900 mt-0.5">{r.buyerName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Produk</p>
                                    <p className="font-bold text-blue-600 mt-0.5">{r.productName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dana Ditahan</p>
                                    <p className="font-black text-lg text-gray-900 mt-0.5">{r.amount}</p>
                                </div>
                            </div>

                            {/* Tengah - Alasan Komplain */}
                            <div className="flex-[2] bg-orange-50 rounded-2xl border border-orange-100 p-5 mt-6 md:mt-0">
                                <span className="inline-block bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded-md mb-2">
                                    {r.reason}
                                </span>
                                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                    "{r.description}"
                                </p>

                                <div className="mt-4 pt-4 border-t border-orange-200/50">
                                    <p className="text-xs font-bold text-gray-500 mb-2">Foto Barang Bukti:</p>
                                    <div className="flex gap-2">
                                        {r.evidence.map((img: string, i: number) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img key={i} src={img} alt="Bukti" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="border-t border-gray-100 px-6 py-4 bg-white flex justify-end gap-3">
                            {r.status === 'pending' ? (
                                <>
                                 <button onClick={() => handleAction(r.id, 'reject')} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm bg-white hover:bg-gray-50">Tolak Refund</button>
                                 <button onClick={() => handleAction(r.id, 'approve')} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-sm hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">Setujui & Kembalikan Dana</button>
                                </>
                            ) : r.status === 'approved' ? (
                                <span className="px-4 py-2 bg-green-50 text-green-700 font-bold text-sm rounded-xl">Dana telah dikembalikan</span>
                            ) : (
                                <span className="px-4 py-2 bg-red-50 text-red-700 font-bold text-sm rounded-xl">Refund ditolak penjual</span>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
