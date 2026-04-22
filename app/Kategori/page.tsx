import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

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

type CategoryResponse = {
  success: boolean;
  data: Category[];
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

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${BASE_URL}/categories`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Gagal mengambil kategori");
    }

    const json: CategoryResponse = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Kategori</p>
            <h1 className="text-2xl font-bold text-slate-900">Pilih kategori barang</h1>
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
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Kategori belum tersedia</h2>
            <p className="text-sm text-gray-500 mt-2">
              Data kategori belum berhasil dimuat dari server.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/Kategori/${category.slug}`}
                className="group rounded-3xl border border-gray-200 bg-white p-5 text-center hover:shadow-lg transition shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl transition group-hover:bg-blue-100">
                  {getCategoryIcon(category)}
                </div>
                <h2 className="text-base font-semibold text-slate-900">{category.name}</h2>
                <p className="text-sm text-gray-500 mt-2">Lihat semua produk kategori ini</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}