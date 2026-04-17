"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HeartIcon as HeartIconSolid, StarIcon } from "@heroicons/react/24/solid";
import { logout } from "@/services/authentication";
import SidebarProfile from "@/components/sidebar-profile";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";

const BASE_URL = "http://127.0.0.1:8000/api/v1";

interface ApiProduct {
  id: string | number;
  title: string;
  price: number | string;
  images?: { image_path: string }[];
  is_promoted?: boolean;
  seller?: { profile?: { city?: string } };
  location?: string;
  rating?: number;
  image?: string;
}

interface FavoriteItem {
  id: number | string; // Bisa berupa ID API asli atau ID mock yang kita buat
  product_id: number | string;
  product: ApiProduct;
}

// ==== MOCK DATA KEMBALI DI-IMPORT ATAU DIDEKLARASI UNTUK FAVORITES LOKAL ====
const dummyPromoted = [
  { id: "p1", title: "iPhone 11 Pro Gold - Mulus Fullset (Sesuai Gambar)", price: 6500000, image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=500&q=80", location: "Jakarta Selatan", rating: 4.8 },
  { id: "p2", title: "Laptop ASUS VivoBook - Intel Core i5 (Sesuai Gambar)", price: 7200000, image: "https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?w=500&q=80", location: "Bandung", rating: 4.5 },
  { id: "p3", title: "Kulkas AQUA 1 Pintu Motif Bunga - Dingin Normal", price: 1100000, image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500&q=80", location: "Surabaya", rating: 4.9 },
  { id: "p4", title: "Sony WH-1000XM4 Noise Cancelling Headphones", price: 3500000, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80", location: "Jakarta Barat", rating: 5.0 },
];
const dummyRecommendations = [
  { id: "r1", title: "MacBook Pro 14\" M1 Pro 2021", price: 25000000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80", location: "Bandung", rating: 4.9 },
  { id: "r2", title: "Meja Kayu Minimalis Aesthetic untuk Kerja", price: 1500000, image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80", location: "Surabaya", rating: 4.7 },
  { id: "r3", title: "Nike Air Jordan 1 Mid Red Men's Sneakers", price: 1800000, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80", location: "Jakarta Pusat", rating: 4.8 },
  { id: "r4", title: "Kamera Canon EOS M50 Mark II + Lensa Kit", price: 7500000, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80", location: "Yogyakarta", rating: 4.6 },
];
const allMockupProducts = [...dummyPromoted, ...dummyRecommendations];

export default function FavoritesPage() {
  const pathname = usePathname();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("current_user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let realFavorites: FavoriteItem[] = [];
      
      if (token) {
        // Tarik favorit asli via API
        const res = await fetch(`${BASE_URL}/my/favorites`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (json.success) {
          realFavorites = json.data.data || json.data;
        }
      }

      // Tarik mock favorit (dari localStorage buatan di Beranda)
      const mockStr = localStorage.getItem('mock_favorites');
      let mockFavoritesData: FavoriteItem[] = [];
      
      if (mockStr) {
        const mockArray = JSON.parse(mockStr) as string[];
        mockFavoritesData = mockArray.map(id => {
          const product = allMockupProducts.find(p => p.id === id);
          if (product) {
            return {
              id: id,
              product_id: id,
              product: product as unknown as ApiProduct
            };
          }
          return null;
        }).filter(Boolean) as FavoriteItem[];
      }

      setFavorites([...realFavorites, ...mockFavoritesData]);
      
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e: React.MouseEvent, productId: string | number) => {
    e.preventDefault();
    e.stopPropagation();

    // Hapus Optimistic dari sisi UI
    setFavorites(prev => prev.filter(fav => fav.product.id !== productId));

    // Jika produk merupakan mock ID (mengandung 'p' atau 'r'), simpan ke localStorage
    if (typeof productId === 'string' && (productId.startsWith('p') || productId.startsWith('r'))) {
      const mockStr = localStorage.getItem('mock_favorites');
      if (mockStr) {
        const mockArr = new Set(JSON.parse(mockStr));
        mockArr.delete(productId);
        localStorage.setItem('mock_favorites', JSON.stringify([...mockArr]));
      }
      return;
    }

    // Jika produk real dari API:
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${BASE_URL}/products/${productId}/favorite`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Gagal menghapus favorite asli via API", error);
    }
  };

  // helper untuk mengambil gambar yg mendukung mock dan api real
  const getImage = (product: ApiProduct) => {
    if (product.image) return product.image; // Untuk mock data
    if (product.images && product.images.length > 0) {
      return `http://127.0.0.1:8000/storage/${product.images[0].image_path}`;
    }
    return "/no-image.png";
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full bg-white font-sans">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r p-4 hidden md:flex flex-col justify-between fixed h-screen z-10">
          <div>
            <h1 className="text-2xl font-bold text-blue-500 tracking-wide">RatheR</h1>

            <nav className="mt-8 space-y-2">
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${pathname === item.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <span>{item.name}</span>

                  {item.badge && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <SidebarProfile user={user} />
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-64 p-6 lg:p-8 overflow-y-auto bg-gray-50 min-h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Barang Favorit</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola barang-barang yang telah Anda bookmark</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <HeartIconSolid className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum ada barang di favorit</h3>
              <p className="text-sm text-gray-500 max-w-sm">Anda belum menambahkan produk apapun. Yuk temukan barang-barang menarik di Beranda!</p>
              <Link 
                href="/"
                className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
              >
                Mulai Eksplorasi
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {favorites.map((fav) => {
                const p = fav.product;
                return (
                  <Link
                    key={fav.id}
                    href={`/product/${p.id}`}
                    className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImage(p)}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      <button
                        onClick={(e) => removeFavorite(e, p.id)}
                        className="absolute top-3 right-3 p-2 bg-white shadow-md rounded-full transition-transform hover:scale-110 z-10"
                        title="Hapus dari favorit"
                      >
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      </button>
                    </div>

                    <div className="p-4 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-lg font-bold text-blue-600 mt-2">
                          Rp {Number(p.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {p.location || p.seller?.profile?.city || "Unknown"}
                        </div>
                        {(p.rating || p.rating! > 0) && (
                          <div className="flex items-center text-xs font-semibold text-gray-700">
                             <StarIcon className="w-3.5 h-3.5 text-yellow-400 mr-1" />
                             {p.rating}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
