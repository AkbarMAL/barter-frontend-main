"use client";

import { useEffect, useState, use, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartIcon as HeartOutline, ShareIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid, StarIcon, MapPinIcon } from "@heroicons/react/24/solid";
import {
  createTransaction,
  createMidtransPayment,
  openSeamlessPayment,
} from "@/services/transaction";

const BASE_URL = "http://127.0.0.1:8000/api/v1";

// ================= DUMMY DATA =================
const dummyPromoted = [
  { id: "p1", title: "iPhone 11 Pro Gold - Mulus Fullset", price: 6500000, condition: "Bekas - Sangat Baik", image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1200&q=80", location: "Jakarta Selatan", rating: 4.8, description: "iPhone 11 Pro eks garansi iBox, body mulus 99%, battery health awet 92%. Semua fungsi normal face ID ON, true tone ON." },
  { id: "p2", title: "Laptop ASUS VivoBook - Intel Core i5", price: 7200000, condition: "Bekas - Pemakaian", image: "https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?w=1200&q=80", location: "Bandung", rating: 4.5, description: "Laptop asus siap pakai kerja dan nugas. Spesifikasi Core i5 gen 10 RAM 8GB SSD 512GB mulus." },
  { id: "p3", title: "Kulkas AQUA 1 Pintu Motif Bunga", price: 1100000, condition: "Bekas - Pemakaian", image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1200&q=80", location: "Surabaya", rating: 4.9, description: "Masih sangat dingin, freezer aman tanpa lecet parah. Body samping sedikit baret wajar." },
  { id: "p4", title: "Sony WH-1000XM4 Headphones", price: 3500000, condition: "Bekas - Seperti Baru", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=1200&q=80", location: "Jakarta Barat", rating: 5.0, description: "Headphone noise-cancelling premium dalam kondisi sempurna, sangat terawat tanpa cacat dan berfungsi normal. Kualitas suara jernih dengan fitur peredam bising yang optimal, nyaman digunakan untuk berbagai aktivitas." },
];

const dummyRecommendations = [
  { id: "r1", title: "MacBook Pro 14\" M1 Pro 2021", price: 25000000, condition: "Bekas - Seperti Baru", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80", location: "Bandung", rating: 4.9, description: "CC sangat rendah. Jarang dipakai nge-render berat." },
  { id: "r2", title: "Meja Kayu Minimalis Aesthetic", price: 1500000, condition: "Bekas - Bagus", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=1200&q=80", location: "Surabaya", rating: 4.7, description: "Kuat kokoh dan estetik. Bahan kayu jati belanda." },
  { id: "r3", title: "Nike Air Jordan 1 Mid Red", price: 1800000, condition: "Baru", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80", location: "Jakarta Pusat", rating: 4.8, description: "100% Original full tag. Belum pernah dipakai di luar." },
  { id: "r4", title: "Kamera Canon EOS M50 Mark II", price: 7500000, condition: "Bekas - Sangat Baik", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80", location: "Yogyakarta", rating: 4.6, description: "Fungsi jepret sangat normal lancar jaya no minus no jamur." },
];

const allMockupProducts = [...dummyPromoted, ...dummyRecommendations];

// ================= TYPES =================
interface ApiProduct {
  id: string | number;
  title: string;
  price: number;
  condition?: string;
  description?: string;
  images?: { image_path: string }[];
  location_city?: string;
  seller?: {
    id: number;
    name: string;
    profile?: { city?: string }
  };
}

interface SellerRatings {
  average_rating: number;
  total_reviews: number;
  total_products: number; // custom info for mock if needed
  start_counts?: { [key: number]: number };
  reviews: any[];
}

// ─── Checkout Modal ──────────────────────────────────────────────────────────

interface CheckoutModalProps {
  product: any;
  onClose: () => void;
  onSuccess: (transactionId: number, type: "cod" | "rekber") => void;
}

function CheckoutModal({ product, onClose, onSuccess }: CheckoutModalProps) {
  const [type, setType] = useState<"cod" | "rekber">("rekber");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (type === "rekber") {
      if (!address.trim()) e.address = "Alamat pengiriman wajib diisi.";
      if (!city.trim()) e.city = "Kota tujuan wajib diisi.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await createTransaction({
        product_id: Number(product.id),
        quantity: 1,
        type,
        ...(type === "rekber"
          ? { shipping_address: address, shipping_city: city }
          : {}),
        notes: notes || undefined,
      });
      if (res.success) {
        onSuccess(res.data.id, type);
      } else {
        setErrors({ _general: res.message ?? "Gagal membuat pesanan." });
      }
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([k, v]) => {
          flat[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(flat);
      } else {
        setErrors({
          _general:
            err?.response?.data?.message ?? "Terjadi kesalahan. Coba lagi.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{product.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition ml-2 flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* General error */}
          {errors._general && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
              {errors._general}
            </div>
          )}

          {/* Ringkasan Produk */}
          <div className="flex gap-3 items-center bg-gray-50 rounded-2xl p-4">
            {product.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.title}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-sm line-clamp-2">{product.title}</p>
              <p className="text-blue-600 font-extrabold text-base mt-1">
                Rp {Number(product.price).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Metode Transaksi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Metode Transaksi *</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                {
                  value: "rekber",
                  label: "Rekber",
                  sublabel: "Rekening Bersama",
                  icon: "🏦",
                  desc: "Bayar via Midtrans (QRIS, GoPay, VA, dll)",
                },
                {
                  value: "cod",
                  label: "COD",
                  sublabel: "Cash on Delivery",
                  icon: "🚗",
                  desc: "Bayar saat barang tiba",
                },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setType(opt.value); setErrors({}); }}
                  className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition
                    ${type === opt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <span className="font-bold text-sm text-gray-900">{opt.label}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Alamat (hanya jika Rekber) */}
          {type === "rekber" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">💳 Pembayaran via Midtrans</p>
                <p className="text-blue-600 text-xs">Mendukung QRIS, GoPay, ShopeePay, Virtual Account BCA/BNI/BRI, dan kartu kredit.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Pengiriman *</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })); }}
                  placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kecamatan..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                {errors.shipping_address && <p className="text-xs text-red-500 mt-1">{errors.shipping_address}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kota Tujuan *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setErrors(p => ({ ...p, city: "" })); }}
                  placeholder="cth: Jakarta Selatan, Bandung, Surabaya"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                {errors.shipping_city && <p className="text-xs text-red-500 mt-1">{errors.shipping_city}</p>}
              </div>
            </div>
          )}

          {/* Catatan (opsional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Catatan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan untuk penjual..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {/* Ringkasan Biaya */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Harga produk</span>
              <span className="font-medium">Rp {Number(product.price).toLocaleString("id-ID")}</span>
            </div>
            {type === "rekber" && (
              <div className="flex justify-between text-gray-600">
                <span>Biaya platform (3%)</span>
                <span className="font-medium">Rp {Math.round(Number(product.price) * 0.03).toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span className="text-blue-600">
                Rp {(
                  Number(product.price) +
                  (type === "rekber" ? Math.round(Number(product.price) * 0.03) : 0)
                ).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-2xl hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            id="checkout-submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 min-w-[140px]"
          >
            {submitting && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? "Memproses..." : (type === "rekber" ? "🛒 Buat & Bayar" : "🚗 Buat Pesanan")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [product, setProduct] = useState<any>(null);
  const [sellerStats, setSellerStats] = useState<SellerRatings | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMockProduct, setIsMockProduct] = useState(false);
  const [sellerWhatsApp, setSellerWhatsApp] = useState<string>("");
  const [sellerSocialMedia, setSellerSocialMedia] = useState<{ name: string; url: string }[]>([]);
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutToast, setCheckoutToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showCheckoutToast = useCallback((msg: string, type: "success" | "error") => {
    setCheckoutToast({ msg, type });
    setTimeout(() => setCheckoutToast(null), 4000);
  }, []);

  const handleCheckoutSuccess = useCallback(
    async (transactionId: number, type: "cod" | "rekber") => {
      setIsCheckoutOpen(false);

      if (type === "cod") {
        showCheckoutToast("Pesanan COD berhasil dibuat!", "success");
        setTimeout(() => router.push("/purchases"), 1500);
        return;
      }

      // Rekber: redirect ke halaman pembayaran Midtrans
      try {
        showCheckoutToast("Memuat halaman pembayaran...", "success");
        const payRes = await createMidtransPayment(transactionId);
        if (payRes.success && payRes.data?.redirect_url) {
          window.location.href = payRes.data.redirect_url;
        } else {
          router.push("/purchases");
        }
      } catch {
        router.push("/purchases");
      }
    },
    [router, showCheckoutToast]
  );

  // Cek jika ID berawalan 'p' atau 'r'
  useEffect(() => {
    const isMock = typeof id === 'string' && (id.startsWith('p') || id.startsWith('r'));
    setIsMockProduct(isMock);

    if (isMock) {
      loadMockProduct(id);
    } else {
      loadRealProduct(id);
    }
  }, [id]);

  const loadMockProduct = (id: string) => {
    const found = allMockupProducts.find(p => p.id === id);
    if (!found) {
      setIsLoading(false);
      return;
    }

    setProduct({
      id: found.id,
      title: found.title,
      price: found.price,
      condition: found.condition,
      description: found.description,
      image: found.image,
      location: found.location,
      sellerName: "Budi Santoso",
      sellerRating: 4.7,
      followers: 189,
      totalProducts: 1
    });
    setSellerWhatsApp("6281234567890");
    setSellerSocialMedia([
      { name: "Instagram", url: "https://instagram.com/budi.santoso" },
      { name: "Tokopedia", url: "https://www.tokopedia.com/budisantoso" },
    ]);

    setSellerStats({
      average_rating: 5.0,
      total_reviews: 3,
      total_products: 1,
      reviews: [
        { id: 1, reviewer_name: "Rina Wati", rating: 5, comment: "Penjual ramah dan responsif. Barang sesuai deskripsi!", helpful: 12 },
        { id: 2, reviewer_name: "Joko Widodo", rating: 4, comment: "Pengiriman cepat, packaging rapi. Recommended!", helpful: 12 },
        { id: 3, reviewer_name: "Linda Hartono", rating: 5, comment: "Barang original dan kondisi sangat bagus. Terima kasih!", helpful: 12 }
      ]
    });

    // Cek Local Storage untuk status favoritenya
    const favStr = localStorage.getItem('mock_favorites');
    if (favStr) {
      const favSet = new Set(JSON.parse(favStr));
      setIsFavorite(favSet.has(id));
    }

    setIsLoading(false);
  };

  const loadRealProduct = async (id: string) => {
    try {
      // 1. Fetch Product
      const prodRes = await fetch(`${BASE_URL}/products/${id}`);
      const prodJson = await prodRes.json();

      if (!prodJson.success) {
        setIsLoading(false);
        return;
      }

      const pData = prodJson.data;

      let imgPath = "/no-image.png";
      if (pData.images && pData.images.length > 0) {
        imgPath = `http://127.0.0.1:8000/storage/${pData.images[0].image_path}`;
      }

      setProduct({
        id: pData.id,
        title: pData.title,
        price: pData.price,
        condition: pData.condition || "Bekas",
        description: pData.description,
        image: imgPath,
        location: pData.location_city || pData.seller?.profile?.city || "Lokasi tidak diketahui",
        sellerId: pData.seller?.id,
        sellerName: pData.seller?.name || "Penjual Anonim",
      });
      setSellerWhatsApp(pData.seller?.wa_number || pData.seller?.profile?.wa_number || "");
      setSellerSocialMedia(pData.seller?.profile?.social_media || []);

      // 2. Fetch Seller Ratings (jika ID real backend ada provider ratingnya)
      if (pData.seller?.id) {
        try {
          const ratRes = await fetch(`${BASE_URL}/ratings/seller/${pData.seller.id}`);
          const ratJson = await ratRes.json();
          if (ratJson.success) {
            setSellerStats(ratJson.data);
          }
        } catch (e) {
          console.log("Could not fetch seller rating", e);
        }
      }

      // 3. Cek Favorites dari API (if logged in)
      const token = localStorage.getItem("token");
      if (token) {
        const favRes = await fetch(`${BASE_URL}/my/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const favJson = await favRes.json();
        if (favJson.success) {
          const arr = favJson.data.data || favJson.data;
          const isFav = arr.some((f: any) => f.product_id == id);
          setIsFavorite(isFav);
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    // ── Logika Mockup ──
    if (isMockProduct) {
      const nextFav = !isFavorite;
      setIsFavorite(nextFav);
      const favStr = localStorage.getItem('mock_favorites');
      let favSet = new Set<string>();
      if (favStr) favSet = new Set(JSON.parse(favStr));

      if (nextFav) favSet.add(id);
      else favSet.delete(id);

      localStorage.setItem('mock_favorites', JSON.stringify([...favSet]));
      return;
    }

    // ── Logika Asli (API Back-End) ──
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Silakan login terlebih dahulu untuk menyimpan favorit.");
      return;
    }

    // Optimistic UI
    setIsFavorite(!isFavorite);
    try {
      const res = await fetch(`${BASE_URL}/products/${id}/favorite`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setIsFavorite(json.is_favorite);
      } else {
        setIsFavorite(isFavorite); // rollback
      }
    } catch (err) {
      setIsFavorite(isFavorite); // rollback
      alert("Terjadi kesalahan.");
    }
  };

  const formatWhatsAppUrl = (number: string) => {
    const digits = number.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  };

  const openContact = () => {
    setIsContactPopupOpen(true);
  };

  const closeContact = () => {
    setIsContactPopupOpen(false);
  };

  const openWhatsApp = () => {
    const url = formatWhatsAppUrl(sellerWhatsApp);
    if (!url) {
      alert("Nomor WhatsApp penjual belum tersedia.");
      return;
    }
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">Produk tidak ditemukan</p>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-20 font-sans">

      {/* ── TOP NAV BAR (Persis Mockup) ── */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>

          <div className="flex items-center gap-4 text-gray-600">
            <button onClick={toggleFavorite} className="hover:scale-110 transition-transform hover:text-red-500">
              {isFavorite ? <HeartSolid className="w-6 h-6 text-red-500" /> : <HeartOutline className="w-6 h-6" />}
            </button>
            <button className="hover:scale-110 hover:text-blue-500 transition-transform">
              <ShareIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">

        {/* ── BAGIAN UTAMA PRODUK: FOTO & KETERANGAN ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* FOTO PRODUK */}
          <div className="w-full lg:w-3/5">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* KOLOM KANAN: KETERANGAN PRODUK */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {product.title}
            </h1>
            <p className="mt-4 text-[32px] md:text-4xl font-extrabold text-blue-600 tracking-tight">
              Rp {Number(product.price).toLocaleString("id-ID")}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold tracking-wide uppercase border border-blue-100">
                {product.condition}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                {product.location}
              </span>
            </div>

            <div className="mt-8 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="buy-now-btn"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      router.push("/login");
                      return;
                    }
                    if (isMockProduct) {
                      alert("Pembelian hanya tersedia untuk produk asli.");
                      return;
                    }
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Beli Sekarang
                </button>
                <button onClick={openContact} className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Hubungi Penjual
                </button>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                Barter / Tukar Tambah
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Lokasi Produk</p>
                <p className="text-xs text-slate-500">{product.location}</p>
              </div>
              <div className="rounded-3xl overflow-hidden shadow-sm">
                <div className="h-25 md:h-35">
                  <iframe
                    title="Lokasi Produk"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(product.location)}&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-3">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Deskripsi</h3>
              <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none">
                <p>{product.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD SELLER INFO ── */}
        <div className="mt-12 rounded-3xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            {/* Seller profile left */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-sm overflow-hidden border-2 border-transparent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {product.sellerName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <p className="text-xs font-medium text-gray-500">Online 2 jam lalu</p>
                </div>
              </div>
            </div>

            {/* Seller stats right/center */}
            <div className="flex bg-gray-50 rounded-2xl py-3 px-6 divide-x divide-gray-200 text-center gap-6 md:gap-0">
              <div className="px-4 md:px-8">
                <p className="text-xs text-gray-500 mb-1 font-medium">Rating</p>
                <p className="font-bold text-gray-900 flex items-center justify-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  {sellerStats?.average_rating || product.sellerRating || "0"}
                </p>
              </div>
              <div className="px-4 md:px-8">
                <p className="text-xs text-gray-500 mb-1 font-medium">Pengikut</p>
                <p className="font-bold text-gray-900">
                  {product.followers || "0"}
                </p>
              </div>
              <div className="px-4 md:px-8">
                <p className="text-xs text-gray-500 mb-1 font-medium">Produk</p>
                <p className="font-bold text-gray-900">
                  {sellerStats?.total_products || product.totalProducts || "0"}
                </p>
              </div>
            </div>

          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={openContact} className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Hubungi Penjual
            </button>
            <button onClick={openContact} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Hubungi Penjual
            </button>
          </div>
        </div>

        {/* ── ULASAN SELLER ── */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Ulasan Seller</h2>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 md:p-10 shadow-sm flex flex-col md:flex-row gap-10 md:items-center">

            {/* Box Kiri: Nilai Rating Besar */}
            <div className="flex flex-col items-center justify-center md:w-1/3">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-extrabold text-gray-900">{sellerStats?.average_rating || "5.0"}</span>
                <span className="text-xl font-bold text-gray-400">/ 5</span>
              </div>
              <div className="flex mt-3 mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-6 h-6 text-orange-500" />
                ))}
              </div>
              <p className="text-sm font-medium text-gray-500">
                {sellerStats?.total_reviews || "3"} Ulasan
              </p>
            </div>

            {/* Progress Bars Tengah */}
            <div className="flex-1 space-y-3">
              {[5, 4, 3, 2, 1].map((ratingNum) => {
                // Hardcode logic mockup diagram supaya presisi sama gambar Figma
                let count = 0;
                let percent = "0%";
                if (ratingNum === 5) { count = 2; percent = "66%"; }
                if (ratingNum === 4) { count = 1; percent = "33%"; }

                return (
                  <div key={ratingNum} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-10 text-xs font-bold text-gray-600">
                      <StarIcon className="w-3.5 h-3.5 text-orange-500" /> {ratingNum}
                    </div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: percent }}
                      ></div>
                    </div>
                    <div className="w-6 text-right text-xs font-bold text-gray-400">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-6 max-w-4xl">
            {sellerStats?.reviews?.map((review: any, i: number) => (
              <div key={i} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden shrink-0 mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.pravatar.cc/150?u=${review.id || i}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{review.reviewer_name}</p>
                  <div className="flex my-1.5">
                    {[...Array(5)].map((_, index) => (
                      <StarIcon key={index} className={`w-4 h-4 ${index < review.rating ? 'text-orange-500' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm mt-3 mb-4 leading-relaxed">
                    {review.comment}
                  </p>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" /></svg>
                    Membantu ({review.helpful || 12})
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Checkout Toast */}
      {checkoutToast && (
        <div
          className={`fixed top-5 right-5 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition
            ${checkoutToast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {checkoutToast.msg}
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && product && (
        <CheckoutModal
          product={product}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {isContactPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Hubungi Penjual</p>
                <h2 className="text-xl font-bold text-slate-900">Media Kontak</h2>
              </div>
              <button
                type="button"
                onClick={closeContact}
                className="text-2xl leading-none text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {sellerWhatsApp ? (
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="w-full rounded-2xl bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-green-600 text-center"
                >
                  WhatsApp
                </button>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 text-center">
                  Nomor WhatsApp belum tersedia.
                </div>
              )}

              {sellerSocialMedia.length > 0 ? (
                <div className="space-y-3">
                  {sellerSocialMedia.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 text-center"
                    >
                      {social.name}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 text-center">
                  Media sosial penjual belum tersedia.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeContact}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
