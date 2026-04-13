"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid, StarIcon } from "@heroicons/react/24/solid";
import { logout, isAuthenticated, getCurrentUser } from "@/services/authentication";
import SidebarProfile from "@/components/sidebar-profile";

// ================= DUMMY DATA FOR PRESENTATION =================
// Menggunakan Unsplash API untuk gambar agar langsung tampil cantik
const dummyCategories = [
  { id: 1, name: "Elektronik", icon: "💻" },
  { id: 2, name: "Fashion", icon: "👕" },
  { id: 3, name: "Kendaraan", icon: "🚗" },
  { id: 4, name: "Furnitur", icon: "🛋️" },
  { id: 5, name: "Gadget", icon: "📱" },
  { id: 6, name: "Buku", icon: "📖" },
  { id: 7, name: "Olahraga", icon: "🚲" },
  { id: 8, name: "Lainnya", icon: "📦" },
];

const PRODUCT_API_BASE = "http://127.0.0.1:8000/api/v1";

export default function Dashboard() {
  const pathname = usePathname();
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  // State untuk menyimpan daftar id produk yang difavoritkan (Mockup)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites dan check auth on component mount
  useEffect(() => {
    const mockStr = localStorage.getItem('mock_favorites');
    if (mockStr) {
      setFavorites(new Set(JSON.parse(mockStr)));
    }

    // Check authentication status and get user data
    const authenticated = isAuthenticated();
    setIsUserAuthenticated(authenticated);
    if (authenticated) {
      const user = getCurrentUser();
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${PRODUCT_API_BASE}/products`);
        const json = await res.json();

        if (json.success) {
          const rawProducts = json.data?.data || json.data || [];
          const normalized = rawProducts.map((item: any) => {
            const firstImage =
              item.images?.[0]?.image_path ||
              item.images?.[0]?.image ||
              item.photo ||
              item.image;
            const imageUrl = firstImage
              ? firstImage.toString().startsWith("http")
                ? firstImage.toString()
                : `http://127.0.0.1:8000/storage/${firstImage}`
              : "https://via.placeholder.com/500";

            return {
              id: item.id,
              title: item.title || item.name || item.product_name || "Produk",
              price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
              image: imageUrl,
              location: item.location_city || item.location || item.city || "Lokasi tidak diketahui",
              rating: item.rating || item.average_rating || 0,
            };
          });

          setProducts(normalized);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Fungsi toggle favorit statis & API (mockup + real)
  const promotedProducts = products.slice(0, 4);
  const recommendedProducts = products.slice(4, 8);

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string | number) => {
    e.preventDefault();
    e.stopPropagation();

    // Logika untuk UI Mockup (ID berawalan 'p' atau 'r')
    if (typeof productId === 'string' && (productId.startsWith('p') || productId.startsWith('r'))) {
      setFavorites(prev => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        localStorage.setItem('mock_favorites', JSON.stringify([...next]));
        return next;
      });
      return;
    }

    // Logika untuk API Asli (ID berupa angka / integer)
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Silakan login terlebih dahulu untuk menambahkan ke favorit");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/products/${productId}/favorite`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setFavorites((prev) => {
          const next = new Set(prev);
          if (json.is_favorite) {
            next.add(productId.toString());
          } else {
            next.delete(productId.toString());
          }
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-4 hidden md:flex flex-col justify-between fixed h-screen z-10">
        <div>
          <h1 className="text-2xl font-bold text-blue-500 tracking-wide">RatheR</h1>

          <nav className="mt-8 space-y-2">
            {[
              { name: "Beranda", href: "/" },
              { name: "Notifikasi", href: "/notifications" },
              { name: "Favorit", href: "/favorites" },
              { name: "Pembelian", href: "/purchases" },
              { name: "Pindah ke seller", href: "/seller" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${pathname === item.href
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <SidebarProfile user={currentUser} />
      </div>

      {/* Main Content Area - with left margin to accommodate fixed sidebar */}
      <div className="flex-1 md:ml-64 p-6 lg:p-8 bg-white min-h-screen">

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari barang bekas..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-10">

          {/* Categories Section */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-bold text-gray-900">Kategori</h2>
              <Link href="/Kategori" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {dummyCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/Kategori/${cat.name.toLowerCase()}`}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors shadow-sm border border-blue-100/50">
                    {cat.icon}
                  </div>
                  <span className="text-xs font-medium mt-3 text-gray-600 group-hover:text-blue-600 transition-colors text-center">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Iklan Promosi Section */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-bold text-gray-900">Iklan Promosi</h2>
              <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {promotedProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Promoted Badge */}
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md z-10 tracking-wide">
                      Promoted
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, p.id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md transition-transform hover:scale-110 z-10"
                    >
                      {favorites.has(String(p.id)) ? (
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        Rp {p.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {p.location}
                      </div>
                      <div className="flex items-center text-xs font-semibold text-gray-700">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-400 mr-1" />
                        {p.rating}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Rekomendasi Untukmu Section */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Rekomendasi Untukmu</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recommendedProducts.map((r) => (
                <Link
                  key={r.id}
                  href={`/product/${r.id}`}
                  className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, r.id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md transition-transform hover:scale-110 z-10"
                    >
                      {favorites.has(String(r.id)) ? (
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        Rp {r.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {r.location}
                      </div>
                      <div className="flex items-center text-xs font-semibold text-gray-700">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-400 mr-1" />
                        {r.rating}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}