"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import { logout } from "@/services/authentication";
import { usePathname } from "next/navigation";

const BASE_URL = "http://127.0.0.1:8000/api/v1"; // ganti kalau pakai domain

interface Category {
  id: string | number;
  name: string;
  icon?: string;
}

interface ProductImage {
  image_path: string;
}

interface SellerProfile {
  city?: string;
}

interface Seller {
  profile?: SellerProfile;
}

interface ApiProduct {
  id: string | number;
  title: string;
  price: number | string;
  images?: ProductImage[];
  is_promoted?: boolean;
  seller?: Seller;
}

export default function Dashboard() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [recommendations, setRecommendations] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH DATA =================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const cached = localStorage.getItem('dashboard_data');
    if (cached) {
      const data = JSON.parse(cached);
      setCategories(data.categories);
      setProducts(data.products);
      setRecommendations(data.recommendations);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [catRes, prodRes] = await Promise.all([
        fetch(`${BASE_URL}/categories`),
        fetch(`${BASE_URL}/products`),
      ]);

      const catJson = await catRes.json();
      const prodJson = await prodRes.json();

      if (catJson.success) {
        setCategories(catJson.data);
      }

      if (prodJson.success) {
        const allProducts = (prodJson.data.data || prodJson.data) as ApiProduct[];

        // Produk promosi (ads)
        const promoted = allProducts.filter((p) => p.is_promoted);

        // Rekomendasi = produk biasa
        const normal = allProducts.filter((p) => !p.is_promoted);

        setProducts(promoted);
        setRecommendations(normal);

        // Cache data
        localStorage.setItem('dashboard_data', JSON.stringify({
          categories: catJson.data,
          products: promoted,
          recommendations: normal,
        }));
      }
    } catch (error) {
      console.error("Error fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  // helper ambil gambar pertama
  const getImage = (product: ApiProduct) => {
    if (product.images && product.images.length > 0) {
      return `http://127.0.0.1:8000/storage/${product.images[0].image_path}`;
    }
    return "/no-image.png";
  };

  const fetchByCategory = async (categoryId: string | number) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/categories/${categoryId}/products`
      );
      const json = await res.json();

      if (json.success) {
        const data = (json.data.data || json.data) as ApiProduct[];

        const promoted = data.filter((p) => p.is_promoted);
        const normal = data.filter((p) => !p.is_promoted);

        setProducts(promoted);
        setRecommendations(normal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">RatheR</h1>

          <nav className="mt-6 space-y-2">
            {[
              { name: "Beranda", href: "/" },
              { name: "Notifikasi", href: "/notifications", badge: 3 },
              { name: "Favorit", href: "/favorites" },
              { name: "Pembelian", href: "/purchases" },
              { name: "Pindah ke seller", href: "/seller" },
            ].map((item) => (
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

                {item.badge && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Profile */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
              AS
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                Ahmad Saputra
              </p>
              <p className="text-xs text-blue-600 cursor-pointer">
                Lihat Profil
              </p>
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

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {/* Search */}
        <input
          placeholder="Cari barang bekas..."
          className="w-full p-3 rounded-lg border mb-6 text-primary outline-none focus:ring-2 focus:ring-blue-200"
        />

        {/* Categories */}
        <h2 className="font-semibold mb-3 text-primary">Kategori</h2>
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => fetchByCategory(cat.id)}
              className="flex flex-col items-center min-w-[70px] cursor-pointer"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                {cat.icon || "📦"}
              </div>

              <span className="text-xs mt-2 text-center text-primary">
                {cat.name}
              </span>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && <p>Loading...</p>}

        {/* Promo */}
        <h2 className="font-semibold mb-3 text-primary">Iklan Promosi</h2>
        <div className="flex gap-4 overflow-x-auto mb-8">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="min-w-[240px] rounded-lg bg-white shadow p-2 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative">
                <Image
                  src={getImage(p)}
                  width={240}
                  height={160}
                  alt={p.title}
                  className="rounded-lg object-cover"
                />

                <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  Promoted
                </span>

                <HeartIcon className="w-5 h-5 absolute top-2 right-2 text-white" />
              </div>

              <p className="text-sm mt-2 text-primary">{p.title}</p>
              <p className="text-blue-600 font-semibold">
                Rp {Number(p.price).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-gray-500">
                {p.seller?.profile?.city || "Unknown"}
              </p>
            </Link>
          ))}
        </div>

        {/* Recommendations */}
        <h2 className="font-semibold mb-3 text-primary">
          Rekomendasi Untukmu
        </h2>
        <div className="flex gap-4 overflow-x-auto">
          {recommendations.map((r) => (
            <Link
              key={r.id}
              href={`/product/${r.id}`}
              className="min-w-[240px] rounded-lg bg-white shadow p-2 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative">
                <Image
                  src={getImage(r)}
                  width={240}
                  height={160}
                  alt={r.title}
                  className="rounded-lg object-cover"
                />

                <HeartIcon className="w-5 h-5 absolute top-2 right-2 text-red-500" />
              </div>

              <p className="text-sm mt-2 text-primary">{r.title}</p>
              <p className="text-blue-600 font-semibold">
                Rp {Number(r.price).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-gray-500">
                {r.seller?.profile?.city || "Unknown"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}