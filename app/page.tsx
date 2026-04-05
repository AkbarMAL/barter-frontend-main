'use client'

import Image from 'next/image'
import { HeartIcon } from '@heroicons/react/24/outline'

const categories = [
  'Elektronik', 'Fashion', 'Kendaraan', 'Furnitur', 'Gadget', 'Buku', 'Olahraga', 'Lainnya'
]

const products = [
  {
    name: 'iPhone 13 Pro Max 256GB',
    price: 'Rp 12.500.000',
    location: 'Jakarta Selatan',
    image: '/iphone.jpg'
  },
  {
    name: 'Sony WH-1000XM4',
    price: 'Rp 3.500.000',
    location: 'Jakarta Barat',
    image: '/headphone.jpg'
  },
  {
    name: 'Kamera Canon EOS M50',
    price: 'Rp 7.500.000',
    location: 'Yogyakarta',
    image: '/camera.jpg'
  },
  {
    name: 'iPhone 13 Pro Max 256GB',
    price: 'Rp 12.500.000',
    location: 'Jakarta Selatan',
    image: '/iphone.jpg'
  },
  {
    name: 'Sony WH-1000XM4',
    price: 'Rp 3.500.000',
    location: 'Jakarta Barat',
    image: '/headphone.jpg'
  },
  {
    name: 'Kamera Canon EOS M50',
    price: 'Rp 7.500.000',
    location: 'Yogyakarta',
    image: '/camera.jpg'
  }
]

const recommendations = [
  {
    name: 'MacBook Pro 14" M1 Pro',
    price: 'Rp 25.000.000',
    location: 'Bandung',
    image: '/macbook.jpg'
  },
  {
    name: 'Meja Kayu Minimalis',
    price: 'Rp 1.500.000',
    location: 'Surabaya',
    image: '/desk.jpg'
  },
  {
    name: 'Nike Air Jordan 1 Mid',
    price: 'Rp 1.800.000',
    location: 'Jakarta Pusat',
    image: '/shoes.jpg'
  },
  {
    name: 'MacBook Pro 14" M1 Pro',
    price: 'Rp 25.000.000',
    location: 'Bandung',
    image: '/macbook.jpg'
  },
  {
    name: 'Meja Kayu Minimalis',
    price: 'Rp 1.500.000',
    location: 'Surabaya',
    image: '/desk.jpg'
  },
  {
    name: 'Nike Air Jordan 1 Mid',
    price: 'Rp 1.800.000',
    location: 'Jakarta Pusat',
    image: '/shoes.jpg'
  }
]

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full bg-white">

      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-4 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold text-blue-500">Swaply</h1>

          <nav className="mt-6 space-y-2">
            {[
              { name: 'Beranda' },
              { name: 'Jual Barang' },
              { name: 'Notifikasi', badge: 3 },
              { name: 'Favorit' },
              { name: 'Iklan Saya' },
              { name: 'Pembelian' },
              { name: 'Profil' }
            ].map((item, i) => (
              <button
                key={item.name}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition
                ${i === 0
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <span>{item.name}</span>

                {item.badge && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
            AS
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Ahmad Saputra</p>
            <p className="text-xs text-blue-600 cursor-pointer">Lihat Profil</p>
          </div>
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
            <div key={cat} className="flex flex-col items-center min-w-[60px]">
              <div className="w-14 h-14 bg-blue-100 rounded-full" />
              <span className="text-xs mt-2 text-center text-primary">{cat}</span>
            </div>
          ))}
        </div>

        {/* Promo */}
        <h2 className="font-semibold mb-3 text-primary">Iklan Promosi</h2>
        <div className="flex gap-4 overflow-x-auto mb-8">
          {products.map((p) => (
            <div key={p.name} className="min-w-[240px] bg-white rounded-lg shadow p-2">

              <div className="relative">
                <Image
                  src={p.image}
                  width={240}
                  height={160}
                  alt={p.name}
                  className="rounded-lg object-cover"
                />

                <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  Promoted
                </span>

                <HeartIcon className="w-5 h-5 absolute top-2 right-2 text-white" />
              </div>

              <p className="text-sm mt-2 text-primary">{p.name}</p>
              <p className="text-blue-600 font-semibold">{p.price}</p>
              <p className="text-xs text-gray-500">{p.location}</p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <h2 className="font-semibold mb-3 text-primary">Rekomendasi Untukmu</h2>
        <div className="flex gap-4 overflow-x-auto">
          {recommendations.map((r) => (
            <div key={r.name} className="min-w-[240px] bg-white rounded-lg shadow p-2">

              <div className="relative">
                <Image
                  src={r.image}
                  width={240}
                  height={160}
                  alt={r.name}
                  className="rounded-lg object-cover"
                />

                <HeartIcon className="w-5 h-5 absolute top-2 right-2 text-red-500" />
              </div>

              <p className="text-sm mt-2 text-primary">{r.name}</p>
              <p className="text-blue-600 font-semibold">{r.price}</p>
              <p className="text-xs text-gray-500">{r.location}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}