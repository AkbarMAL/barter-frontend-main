import Link from "next/link";

const categories = [
  { name: "Elektronik", slug: "elektronik", icon: "💻" },
  { name: "Fashion", slug: "fashion", icon: "👕" },
  { name: "Kendaraan", slug: "kendaraan", icon: "🚗" },
  { name: "Furnitur", slug: "furnitur", icon: "🛋️" },
  { name: "Gadget", slug: "gadget", icon: "📱" },
  { name: "Buku", slug: "buku", icon: "📖" },
  { name: "Olahraga", slug: "olahraga", icon: "🚲" },
  { name: "Lainnya", slug: "lainnya", icon: "📦" },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Kategori</p>
            <h1 className="text-2xl font-bold text-slate-900">Pilih kategori barang</h1>
          </div>
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Kembali ke Beranda
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/Kategori/${category.slug}`}
              className="group rounded-3xl border border-gray-200 bg-white p-5 text-center hover:shadow-lg transition shadow-sm"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl transition group-hover:bg-blue-100">
                {category.icon}
              </div>
              <h2 className="text-base font-semibold text-slate-900">{category.name}</h2>
              <p className="text-sm text-gray-500 mt-2">Lihat semua produk kategori ini</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}