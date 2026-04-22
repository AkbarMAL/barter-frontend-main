"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid, StarIcon } from "@heroicons/react/24/solid";
import { logout, isAuthenticated, getCurrentUser } from "@/services/authentication";
import SidebarProfile from "@/components/sidebar-profile";

const PRODUCT_API_BASE = "http://127.0.0.1:8000/api/v1";

type Category = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  image_url?: string | null;
  children?: Category[];
};

const fallbackIcons: Record<string, string> = {
  elektronik: "💻",
  fashion: "👕",
  kendaraan: "🚗",
  furnitur: "🛋️",
  gadget: "📱",
  buku: "📖",
  olahraga: "🚲",
  lainnya: "📦",
};

function getCategoryIcon(category: Category) {
  if (category.icon && category.icon.trim() !== "") return category.icon;
  return fallbackIcons[String(category.slug || "").toLowerCase()] || "📦";
}

function normalizeProduct(item: any) {
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
}

export default function Dashboard() {
  const pathname = usePathname();
  const router = useRouter();

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mockStr = localStorage.getItem("mock_favorites");
    if (mockStr) {
      setFavorites(new Set(JSON.parse(mockStr)));
    }

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
          setProducts(rawProducts.map(normalizeProduct));
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${PRODUCT_API_BASE}/categories`, {
          headers: {
            Accept: "application/json",
          },
        });

        const json = await res.json();
        if (json.success) {
          setCategories(Array.isArray(json.data) ? json.data : []);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${PRODUCT_API_BASE}/products?search=${encodeURIComponent(value.trim())}`
        );
        const json = await res.json();
        if (json.success) {
          const raw = json.data?.data || json.data || [];
          setSearchResults(raw.map(normalizeProduct));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (e.key === "Escape") {
      setIsSearching(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const recommendedProducts = [...products]
    .sort(() => 0.5 - Math.random())
    .slice(0, 8);
  const homepageCategories = categories.slice(0, 8);

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    productId: string | number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      typeof productId === "string" &&
      (productId.startsWith("p") || productId.startsWith("r"))
    ) {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        localStorage.setItem("mock_favorites", JSON.stringify([...next]));
        return next;
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Silakan login terlebih dahulu untuk menambahkan ke favorit");
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/products/${productId}/favorite`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = await res.json();
      if (json.success) {
        setFavorites((prev) => {
          const next = new Set(prev);
          if (json.is_favorite) next.add(productId.toString());
          else next.delete(productId.toString());
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const ProductCard = ({
    p,
    showPromoBadge = false,
  }: {
    p: any;
    showPromoBadge?: boolean;
  }) => (
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
        {showPromoBadge && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md z-10 tracking-wide">
            Promoted
          </div>
        )}
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
            <svg
              className="w-3.5 h-3.5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
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
  );

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
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

      <div className="flex-1 md:ml-64 p-6 lg:p-8 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari barang bekas..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {isSearching ? (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {searchLoading
                  ? "Mencari..."
                  : `Hasil pencarian untuk "${searchQuery}" (${searchResults.length} produk)`}
              </h2>
              <button
                onClick={clearSearch}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Kembali ke Beranda
              </button>
            </div>

            {searchLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900">Produk tidak ditemukan</h3>
                <p className="text-gray-500 text-sm mt-2">
                  Coba kata kunci lain atau periksa ejaan Anda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {searchResults.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-10">
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-gray-900">Kategori</h2>
                <Link
                  href="/Kategori"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>

              {categoriesLoading ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
                      <div className="w-12 h-3 mt-3 rounded bg-gray-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : homepageCategories.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  Kategori belum tersedia.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {homepageCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/Kategori/${cat.slug}`}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors shadow-sm border border-blue-100/50">
                        {getCategoryIcon(cat)}
                      </div>
                      <span className="text-xs font-medium mt-3 text-gray-600 group-hover:text-blue-600 transition-colors text-center">
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Rekomendasi Untukmu</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {!recommendedProducts || recommendedProducts.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-10 text-center">
                    <h1 className="text-base font-semibold text-gray-700">
                      Saat ini belum ada rekomendasi untukmu
                    </h1>
                  </div>
                ) : (
                  recommendedProducts.map((r) => <ProductCard key={r.id} p={r} />)
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}