"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { HeartIcon as HeartOutline, ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid, StarIcon } from "@heroicons/react/24/solid";

const categoryMap: Record<string, any[]> = {
  elektronik: [
    { id: "e1", title: "TV LED Samsung 32 Inch", price: 2000000, image: "https://images.unsplash.com/photo-1646861039459-fd9e3aabf3fb?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bekasi", rating: 4.8 },
    { id: "e2", title: "Radio Portable Sony ICF 306", price: 400000, image: "https://images.unsplash.com/photo-1633434304749-856d9afd0853?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bandung", rating: 4.5 },
    { id: "e3", title: "Kipas Angin Xiaomi Solove F5", price: 250000, image: "https://images.unsplash.com/photo-1665298455913-dd43714f5ad1?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Surabaya", rating: 4.6 },
    { id: "e4", title: "Kulkas Smeg FAB30", price: 45000000, image: "https://images.unsplash.com/photo-1721563927724-74b1a0ddef33?q=80&w=700&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.7 },
  ],
  fashion: [
    { id: "f1", title: "Blazer H&M", price: 350000, image: "https://unsplash.com/photos/a-red-jacket-hanging-on-a-clothes-line-L7MBmE1VbVghttps://plus.unsplash.com/premium_photo-1675186049563-000f7ac02c44?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bandung", rating: 4.7 },
    { id: "f2", title: "Hoodie Putih", price: 150000, image: "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=1072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.8 },
    { id: "f3", title: "Jaket Coklat", price: 200000, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.8 },
    { id: "f4", title: "Kemeja", price: 120000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.6 },
  ],
  kendaraan: [
    { id: "k1", title: "Ducati Supersport 950 S", price: 650000000, image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Surabaya", rating: 4.9 },
    { id: "k2", title: "Honda CB400 Café Racer", price: 70000000, image: "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.7 },
    { id: "k3", title: "Honda CR-V 2007 2400 cc", price: 90000000, image: "https://images.unsplash.com/photo-1623597780975-38ccd5030c83?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Kalimantan", rating: 4.6 },
    { id: "k4", title: "Audi RS 7 Sportback", price: 8000000, image: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bekasi", rating: 4.6 },
  ],
  furnitur: [
    { id: "fu1", title: "Meja Kayu Hitam + Laci 240cm x 75cm", price: 5000000, image: "https://images.unsplash.com/photo-1667892702969-a9f23a35cb54?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jepara", rating: 4.9 },
    { id: "fu2", title: "Lemari Kayu", price: 3000000, image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bekasi", rating: 4.7 },
    { id: "fu3", title: "Meja Lemari Kayu", price: 2500000, image: "https://plus.unsplash.com/premium_photo-1683141318297-75a3d8e86476?q=80&w=782&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bandung", rating: 4.8 },
    { id: "fu4", title: "Kursi Kuning", price: 2500000, image: "https://plus.unsplash.com/premium_photo-1705169612592-32610774a5d0?q=80&w=1140&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.9 },
  ],
  gadget: [
    { id: "g1", title: "Apple Watch Gen 1", price: 750000, image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.8 },
    { id: "g2", title: "Anker Soundcore Space One Pro Headphones", price: 2600000, image: "https://images.unsplash.com/photo-1765279327575-bc9e453514dd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bogor", rating: 4.7 },
    { id: "g3", title: "Iphone 11 Ori Ibox", price: 2600000, image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Bekasi", rating: 4.8 },
    { id: "g4", title: "Laptop Asus W202M", price: 400000, image: "https://images.unsplash.com/photo-1693206816304-642a705045a1?q=80&w=1073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.8 },
  ],
  buku: [
    { id: "b1", title: "Novel Tapak Jejak oleh Fiersa Besari", price: 45000, image: "https://images.unsplash.com/photo-1635197326380-16b30ab9666b?q=80&w=626&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jogja", rating: 4.7 },
    { id: "b2", title: "On Writing oleh Stephen King", price: 120000, image: "https://images.unsplash.com/photo-1596667980201-40d82a8a3ba3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Jakarta", rating: 4.8 },
    { id: "b3", title: "Thinking, Fast and Slow oleh ", price: 80000, image: "https://images.unsplash.com/photo-1593340010859-83edd3d6d13f?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", location: "Surabaya", rating: 4.7 },
    { id: "b4", title: "Novel Best Seller", price: 80000, image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80", location: "Jogja", rating: 4.7 },
  ],
  olahraga: [
    { id: "o1", title: "Sepeda Gunung", price: 2500000, image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=800&q=80", location: "Bandung", rating: 4.8 },
    { id: "o1", title: "Sepeda Gunung", price: 2500000, image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=800&q=80", location: "Bandung", rating: 4.8 },
    { id: "o1", title: "Sepeda Gunung", price: 2500000, image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=800&q=80", location: "Bandung", rating: 4.8 },
    { id: "o1", title: "Sepeda Gunung", price: 2500000, image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=800&q=80", location: "Bandung", rating: 4.8 },
  ],
  lainnya: [
    { id: "l1", title: "Barang Random", price: 50000, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", location: "Jakarta", rating: 4.2 },
    { id: "l1", title: "Barang Random", price: 50000, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", location: "Jakarta", rating: 4.2 },
    { id: "l1", title: "Barang Random", price: 50000, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", location: "Jakarta", rating: 4.2 },
    { id: "l1", title: "Barang Random", price: 50000, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", location: "Jakarta", rating: 4.2 },
  ],
};

const rekomendasi = [
  { id: "r1", title: "Laptop ASUS", price: 7000000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80", location: "Bandung", rating: 4.9 },
  { id: "r2", title: "iPhone 13", price: 12000000, image: "https://images.unsplash.com/photo-1512499617640-c2f9991182e4?auto=format&fit=crop&w=800&q=80", location: "Jakarta", rating: 4.8 },
  { id: "r3", title: "Jam Tangan Digital", price: 500000, image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80", location: "Surabaya", rating: 4.6 },
  { id: "r4", title: "Headphone Sony", price: 3000000, image: "https://images.unsplash.com/photo-1505740106531-4243f3831f2b?auto=format&fit=crop&w=800&q=80", location: "Depok", rating: 4.7 },
];

function ProductCard({ item }: { item: any }) {
  const [fav, setFav] = useState(false);

  return (
    <Link
      href={`/product/${item.id}`}
      className="group block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 z-10 rounded-full bg-white p-2 shadow-sm"
        >
          {fav ? (
            <HeartSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartOutline className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
        <p className="mt-3 text-lg font-bold text-blue-600">Rp {item.price.toLocaleString("id-ID")}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{item.location}</span>
          <span className="inline-flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            {item.rating}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const products = categoryMap[slug as string] || [];
  const categoryName = Array.isArray(slug) ? slug.join(" ") : slug?.replace(/-/g, " ") || "Kategori";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/Kategori" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
            <ArrowLongLeftIcon className="w-5 h-5" />
            Kembali ke Kategori
          </Link>
          <div className="text-center">
            <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Kategori</p>
            <h1 className="text-2xl font-bold capitalize">{categoryName}</h1>
          </div>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 capitalize">Produk {categoryName}</h2>
              <p className="mt-2 text-sm text-gray-500">Menampilkan {products.length} produk di kategori ini.</p>
            </div>
            <Link href="/" className="inline-flex items-center rounded-2xl border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition">
              Lihat Semua Produk
            </Link>
          </div>
        </div>

        <section className="mt-8">
          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
              <p className="text-lg font-semibold text-slate-900">Belum ada produk untuk kategori ini.</p>
              <p className="mt-2">Silakan pilih kategori lain atau kembali ke halaman utama.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {products.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">Rekomendasi</p>
              <h2 className="text-2xl font-bold text-slate-900">Rekomendasi untukmu</h2>
            </div>
            <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Lihat Semua
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {rekomendasi.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
