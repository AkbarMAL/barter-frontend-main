import Link from "next/link";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const APP_URL = BASE_URL.replace("/api/v1", "");

type Category = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  image_url?: string | null;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
  children?: Category[];
};

type SellerProfile = {
  city?: string | null;
};

type Seller = {
  id: number;
  name: string;
  sellerProfile?: SellerProfile | null;
  seller_profile?: SellerProfile | null;
};

type ProductImage = {
  id?: number;
  image_path: string;
};

type Product = {
  id: number;
  title: string;
  price: number;
  condition?: string | null;
  description?: string | null;
  location_city?: string | null;
  is_promoted?: boolean;
  created_at?: string;
  seller?: Seller | null;
  images?: ProductImage[];
};

type CategoryResponse = {
  success: boolean;
  data: Category[];
};

type CategoryProductsResponse = {
  success: boolean;
  category: Category;
  data: {
    current_page: number;
    data: Product[];
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
  };
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
  return fallbackIcons[category.slug?.toLowerCase()] || "📦";
}

function getImageUrl(path?: string | null) {
  if (!path) return "/no-image.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  if (cleanPath.startsWith("storage/")) {
    return `${APP_URL}/${cleanPath}`;
  }

  return `${APP_URL}/storage/${cleanPath}`;
}

function getProductImage(product: Product) {
  return getImageUrl(product.images?.[0]?.image_path);
}

function getProductLocation(product: Product) {
  return (
    product.location_city ||
    product.seller?.sellerProfile?.city ||
    product.seller?.seller_profile?.city ||
    "Lokasi tidak diketahui"
  );
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${BASE_URL}/categories`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("Gagal mengambil kategori");

    const json: CategoryResponse = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

async function getCategoryProducts(categoryId: number, page: number) {
  try {
    const res = await fetch(
      `${BASE_URL}/categories/${categoryId}/products?per_page=12&page=${page}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) throw new Error("Gagal mengambil produk kategori");

    const json: CategoryProductsResponse = await res.json();
    return json;
  } catch (error) {
    console.error("Failed to fetch category products:", error);
    return null;
  }
}

function ProductCard({ item }: { item: Product }) {
  return (
    <Link
      href={`/product/${item.id}`}
      className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProductImage(item)}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {item.is_promoted ? (
          <span className="absolute top-3 right-3 z-10 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            Promoted
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
        <p className="mt-3 text-lg font-bold text-blue-600">
          Rp {Number(item.price).toLocaleString("id-ID")}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 gap-3">
          <span className="truncate">{getProductLocation(item)}</span>
          <span className="shrink-0">{item.condition || "Bekas"}</span>
        </div>
      </div>
    </Link>
  );
}

function Pagination({
  slug,
  currentPage,
  lastPage,
}: {
  slug: string;
  currentPage: number;
  lastPage: number;
}) {
  if (lastPage <= 1) return null;

  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
      {pages.map((page) => {
        const active = page === currentPage;

        return (
          <Link
            key={page}
            href={`/Kategori/${slug}?page=${page}`}
            className={`min-w-[42px] rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-blue-600 text-white"
                : "border border-gray-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {page}
          </Link>
        );
      })}
    </div>
  );
}

export default async function CategorySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const page = Number(resolvedSearchParams?.page || 1);

  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const productsResponse = await getCategoryProducts(category.id, page);
  const products = productsResponse?.data?.data || [];
  const pagination = productsResponse?.data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/Kategori"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Kembali
            </Link>
            <div>
              <p className="text-sm text-gray-500">Kategori</p>
              <h1 className="text-2xl font-bold text-slate-900">
                {getCategoryIcon(category)} {category.name}
              </h1>
            </div>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-500">Menampilkan produk</p>
            <h2 className="text-lg font-bold text-slate-900">
              {pagination?.total || 0} produk ditemukan
            </h2>
          </div>

          {pagination ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-slate-600">
              Halaman {pagination.current_page} dari {pagination.last_page}
            </div>
          ) : null}
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Belum ada produk di kategori ini
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Produk akan muncul di sini setelah tersedia dari backend.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>

            {pagination ? (
              <Pagination
                slug={slug}
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}