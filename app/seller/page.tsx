"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/services/authentication";
import SidebarProfile from "@/components/sidebar-profile";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
const BASE_URL = "http://127.0.0.1:8000/api/v1";

interface ProductImage {
  image_path: string;
}

interface ApiProduct {
  id: string | number;
  title: string;
  price: number | string;
  images?: ProductImage[];
  status?: string;
  created_at?: string;
}

interface Transaction {
  id: string | number;
  status: string;
  final_amount: number;
  created_at: string;
  product?: ApiProduct;
}

interface Wallet {
  balance: number;
}

interface Ad {
  id: string | number;
  package_name: string;
  status: string;
  created_at: string;
}

interface BarterRequest {
  id: number;
  status: string;
  offer_item_name: string;
  created_at: string;
  product?: ApiProduct;
  buyer?: { name: string };
}

export default function SellerDashboard() {
  const pathname = usePathname();
  const [myProducts, setMyProducts] = useState<ApiProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [barters, setBarters] = useState<BarterRequest[]>([]);
  const [wallet, setWallet] = useState<Wallet>({ balance: 0 });
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const sellerMenus = [
    { name: "Dashboard", href: "/seller" },
    { name: "Produk", href: "/seller/products" },
    { name: "Transaksi", href: "/seller/transactions" },
    { name: "Refunds", href: "/seller/refunds" },
    { name: "Wallet", href: "/seller/wallet" },
    { name: "Notifikasi", href: "/seller/notifications" },
    { name: "Pindah ke halaman pembeli", href: "/" }
  ];

  function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // ================= FETCH DATA =================
  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem("current_user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }

    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      setLoading(true);

      // Fetch multiple data in parallel with auth headers
      const [prodRes, transRes, walletRes, adsRes, barterRes] = await Promise.all([
        fetch(`${BASE_URL}/my/products`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/transactions?role=seller`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/wallet/balance`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/ads/my`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/seller/barter`, { headers: getAuthHeaders() }),
      ]);

      const prodJson = await prodRes.json();
      const transJson = await transRes.json();
      const walletJson = await walletRes.json();
      const adsJson = await adsRes.json();
      const barterJson = await barterRes.json();

      if (prodJson.success) {
        setMyProducts(prodJson.data.data || prodJson.data);
      }

      if (transJson.success) {
        setTransactions(transJson.data.data || transJson.data);
      }

      if (walletJson.success) {
        setWallet(walletJson.data);
      }

      if (adsJson.success) {
        setAds(adsJson.data.data || adsJson.data);
      }

      if (barterJson.success) {
        setBarters(barterJson.data.data || barterJson.data || []);
      }
    } catch (error) {
      console.error("Error fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveImageUrl = (path: string) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const normalizedPath = path.replace(/^\//, "");
    if (normalizedPath.startsWith("storage/")) {
      return `http://127.0.0.1:8000/${normalizedPath}`;
    }
    return `http://127.0.0.1:8000/storage/${normalizedPath}`;
  };

  const getImage = (product: ApiProduct) => {
    if (product.images && product.images.length > 0) {
      return resolveImageUrl(product.images[0].image_path);
    }
    return "/no-image.png";
  };

  return (
    <ProtectedRoute requiredRole="seller">
      <div className="flex min-h-screen w-full bg-white">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r p-4 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-500" style={{ letterSpacing: '2px' }}>Rather&apos;s</h1>
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

          <SidebarProfile user={user} />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <h1 className="text-2xl font-bold text-primary mb-6">Dashboard Penjual</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-primary">Total Produk</h3>
              <p className="text-2xl font-bold text-blue-600">{myProducts.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-primary">Transaksi</h3>
              <p className="text-2xl font-bold text-green-600">{transactions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-primary">Saldo Wallet</h3>
              <p className="text-2xl font-bold text-orange-600">Rp {(wallet.balance ?? 0).toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-primary">Iklan Aktif</h3>
              <p className="text-2xl font-bold text-purple-600">{ads.filter(ad => ad.status === 'active').length}</p>
            </div>
          </div>

          {/* Loading */}
          {loading && <p className="text-primary pb-4">Loading...</p>}

          {/* Recent Products */}
          <h2 className="font-semibold mb-3 text-primary">Produk Terbaru</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 mb-8">
            {myProducts.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="min-w-[240px] max-w-[240px] flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition"
              >
                <div className="w-full h-[140px] bg-gray-100 overflow-hidden">
                  <Image
                    src={getImage(p)}
                    width={240}
                    height={140}
                    alt={p.title}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3 flex flex-col gap-1 flex-1">
                  <p className="text-sm font-semibold text-primary line-clamp-2">
                    {p.title}
                  </p>

                  <p className="text-blue-600 font-bold text-sm">
                    Rp {Number(p.price).toLocaleString("id-ID")}
                  </p>

                  <p className="text-xs text-gray-500 mt-auto">
                    Status:{" "}
                    <span className="font-medium text-gray-700">
                      {p.status || "Active"}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Transactions */}
          <h2 className="font-semibold mb-3 text-primary">Transaksi Terbaru</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="space-y-2">
              {transactions.slice(0, 5).map((t) => (
                <div key={`tx-${t.id}`} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="text-sm font-medium">{t.product?.title || 'Product'}</p>
                    <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">Rp {(t.final_amount ?? 0).toLocaleString('id-ID')}</p>
                    <p className={`text-xs ${t.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {t.status}
                    </p>
                  </div>
                </div>
              ))}
              {barters.slice(0, 3).map((b) => (
                <div key={`barter-${b.id}`} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="text-sm font-medium">
                      <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded mr-1">Barter</span>
                      {b.product?.title || 'Produk'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ditawar: <span className="font-medium text-gray-700">{b.offer_item_name}</span> • {new Date(b.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'completed' ? 'bg-green-100 text-green-700' :
                      b.status === 'rejected' || b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      b.status === 'accepted' || b.status === 'payment_confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {b.status === 'pending' || b.status === 'seller_reviewing' ? 'Menunggu Review' :
                       b.status === 'accepted' ? 'Disetujui' :
                       b.status === 'payment_pending' ? 'Menunggu Bayar' :
                       b.status === 'payment_confirmed' ? 'Bayar Dikonfirmasi' :
                       b.status === 'completed' ? 'Selesai' :
                       b.status === 'rejected' ? 'Ditolak' :
                       b.status === 'cancelled' ? 'Dibatalkan' : b.status}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && transactions.length === 0 && barters.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada transaksi</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}