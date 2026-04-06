export interface Product {
  id: string;
  name: string;
  price: string;
  location: string;
  image: string;
  condition: string;
  seller: string;
  rating: number;
  followers: number;
  products: number;
  description: string;
}

export const products: Product[] = [
  {
    id: "iphone-13-pro-max-256gb",
    name: "iPhone 13 Pro Max 256GB",
    price: "Rp 12.500.000",
    location: "Jakarta Selatan",
    image: "/iphone.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      "iPhone 13 Pro Max kondisi sangat baik, tanpa goresan signifikan, normal semua fitur. Cocok untuk pengguna yang butuh performa tinggi dan kamera terbaik.",
  },
  {
    id: "sony-wh-1000xm4-headphones",
    name: "Sony WH-1000XM4 Headphones",
    price: "Rp 3.500.000",
    location: "Jakarta Barat",
    image: "/headphone.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      "Headphone noise-cancelling premium dalam kondisi sempurna, sangat terawat tanpa cacat dan berfungsi normal. Kualitas suara jernih dengan fitur peredam bising yang optimal.",
  },
  {
    id: "canon-eos-m50-kamera",
    name: "Kamera Canon EOS M50",
    price: "Rp 7.500.000",
    location: "Yogyakarta",
    image: "/camera.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      "Kamera mirrorless Canon EOS M50 siap pakai, dilengkapi lensa kit dan baterai ekstra. Ideal untuk konten creator dan fotografi travel.",
  },
  {
    id: "macbook-pro-14-m1-pro",
    name: 'MacBook Pro 14" M1 Pro',
    price: "Rp 25.000.000",
    location: "Bandung",
    image: "/macbook.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      'MacBook Pro 14" M1 Pro, performa tinggi untuk editing dan kerja kreatif. Kondisi sangat baik, baterai sehat, dan charger original lengkap.',
  },
  {
    id: "meja-kayu-minimalis",
    name: "Meja Kayu Minimalis",
    price: "Rp 1.500.000",
    location: "Surabaya",
    image: "/desk.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      "Meja kayu minimalis dengan desain modern, cocok untuk ruang kerja atau kamar. Kayu berkualitas, kuat, dan rapi.",
  },
  {
    id: "nike-air-jordan-1-mid",
    name: "Nike Air Jordan 1 Mid",
    price: "Rp 1.800.000",
    location: "Jakarta Pusat",
    image: "/shoes.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      "Sepatu Nike Air Jordan 1 Mid dalam kondisi sangat baik, cocok untuk koleksi atau dipakai sehari-hari. Nyaman dan bergaya.",
  },
];

export const recommendations: Product[] = [
  {
    id: "macbook-pro-14-m1-pro-reco",
    name: 'MacBook Pro 14" M1 Pro',
    price: "Rp 25.000.000",
    location: "Bandung",
    image: "/macbook.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      'MacBook Pro 14" M1 Pro, performa tinggi untuk editing dan kerja kreatif. Kondisi sangat baik, baterai sehat, dan charger original lengkap.',
  },
  {
    id: "meja-kayu-minimalis-reco",
    name: "Meja Kayu Minimalis",
    price: "Rp 1.500.000",
    location: "Surabaya",
    image: "/desk.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      "Meja kayu minimalis dengan desain modern, cocok untuk ruang kerja atau kamar. Kayu berkualitas, kuat, dan rapi.",
  },
  {
    id: "nike-air-jordan-1-mid-reco",
    name: "Nike Air Jordan 1 Mid",
    price: "Rp 1.800.000",
    location: "Jakarta Pusat",
    image: "/shoes.jpg",
    condition: "Bekas - Seperti Baru",
    seller: "Budi Santoso",
    rating: 4.7,
    followers: 189,
    products: 1,
    description:
      "Sepatu Nike Air Jordan 1 Mid dalam kondisi sangat baik, cocok untuk koleksi atau dipakai sehari-hari. Nyaman dan bergaya.",
  },
];
