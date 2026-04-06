import Image from "next/image";
import Link from "next/link";
import { products, recommendations, Product } from "@/lib/products";

const allProducts = [...products, ...recommendations];

function getProduct(id: string): Product | undefined {
  return allProducts.find((product) => product.id === id);
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = getProduct(params.id);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">
            Produk tidak ditemukan
          </p>
          <p className="mt-3 text-slate-600">
            Silakan kembali ke beranda untuk memilih produk lain.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          <span className="text-xl">←</span>
          Kembali
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] bg-white p-6 shadow-sm">
            <Image
              src={product.image}
              width={900}
              height={540}
              alt={product.name}
              className="h-[420px] w-full rounded-3xl object-cover"
            />
            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-blue-600">
                {product.condition}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                {product.name}
              </h1>
              <p className="mt-3 text-2xl font-semibold text-blue-600">
                {product.price}
              </p>
              <p className="mt-2 text-sm text-slate-500">{product.location}</p>
              <div className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
                <p>{product.description}</p>
                <p>
                  Barang tersedia dan siap dikirim. Hubungi penjual untuk
                  menanyakan detail final, nego harga, atau opsi barter.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <div className="space-y-5">
                <div>
                  <p className="text-sm uppercase tracking-[.18em] text-slate-500">
                    Detail Penawaran
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {product.price}
                  </p>
                </div>
                <div className="grid gap-3">
                  <button className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
                    Beli Sekarang
                  </button>
                  <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Hubungi Penjual
                  </button>
                  <button className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Barter / Tukar Tambah
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-xl font-semibold text-white">
                  {product.seller
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {product.seller}
                  </p>
                  <p className="text-sm text-slate-500">Online 2 jam lalu</p>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span>Rating</span>
                  <span className="font-semibold text-slate-900">
                    {product.rating}.0
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span>Pengikut</span>
                  <span className="font-semibold text-slate-900">
                    {product.followers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Produk</span>
                  <span className="font-semibold text-slate-900">
                    {product.products}
                  </span>
                </div>
              </div>
              <button className="mt-6 w-full rounded-2xl border border-blue-600 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
                Kunjungi Toko
              </button>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Ulasan Seller
              </h2>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="space-y-2 rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Rina Wati</p>
                  <p>Penjual ramah dan responsif. Barang sesuai deskripsi!</p>
                </div>
                <div className="space-y-2 rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Joko Widodo</p>
                  <p>Pengiriman cepat, packaging rapi. Recommended!</p>
                </div>
                <div className="space-y-2 rounded-3xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Linda Hartono</p>
                  <p>Barang original dan kondisi sangat bagus. Terima kasih!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
