"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/services/authentication";
import SidebarProfile from "@/components/sidebar-profile";
import { getAuthHeader } from "@/lib/auth-utils";
import { usePathname } from "next/navigation";

const BASE_URL = "http://127.0.0.1:8000/api/v1";

interface ProductImage {
  image_path: string;
}

interface Category {
  id: string | number;
  name: string;
}

interface ApiProduct {
  id: string | number;
  title: string;
  description: string;
  price: number | string;
  stock: number;
  condition: string;
  transaction_type: string;
  location_city: string;
  location_province: string;
  category_id: string | number;
  images?: ProductImage[];
  tags?: string[];
  status?: string;
  created_at?: string;
  category?: Category;
}

export default function SellerProducts() {
  const pathname = usePathname();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    condition: 'new',
    transaction_type: 'cod',
    location_city: '',
    location_province: '',
    category_id: '',
    images: [] as File[],
    tags: [] as string[],
  });
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleImageChange = (files: FileList | File[]) => {
    const newFiles = Array.from(files);
    const existingCount = existingImages.length + formData.images.length;
    const remainingSlots = Math.max(0, 5 - existingCount);
    const nextFiles = newFiles.slice(0, remainingSlots);
    if (nextFiles.length === 0) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...nextFiles],
    }));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => {
      const nextImages = [...prev];
      nextImages.splice(index, 1);
      return nextImages;
    });
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleImageChange(e.target.files);
    e.target.value = "";
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const nextImages = [...prev.images];
      nextImages.splice(index, 1);
      return { ...prev, images: nextImages };
    });
  };

  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem("current_user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      if (!authHeader) {
        alert('Anda harus login terlebih dahulu!');
        setLoading(false);
        return;
      }

      const [prodRes, catRes] = await Promise.all([
        fetch(`${BASE_URL}/my/products`, { headers: authHeader || {} }),
        fetch(`${BASE_URL}/categories`, { headers: authHeader || {} }),
      ]);

      if (!prodRes.ok) {
        console.error('Products fetch error:', prodRes.status);
        const text = await prodRes.text();
        console.error('Response:', text);
      }

      const prodJson = await prodRes.json();
      const catJson = await catRes.json();

      if (prodJson.success) {
        setProducts(prodJson.data.data || prodJson.data);
      }

      if (catJson.success) {
        setCategories(catJson.data);
      }
    } catch (error) {
      console.error("Error fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setExistingImages([]);
    setFormData({
      title: '',
      description: '',
      price: '',
      stock: '',
      condition: 'new',
      transaction_type: 'cod',
      location_city: '',
      location_province: '',
      category_id: '',
      images: [],
      tags: [],
    });
    setModalOpen(true);
  };

  const handleEditProduct = (product: ApiProduct) => {
    setEditingProduct(product);
    setExistingImages(product.images || []);
    setFormData({
      title: product.title,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      condition: product.condition,
      transaction_type: product.transaction_type,
      location_city: product.location_city,
      location_province: product.location_province,
      category_id: String(product.category_id),
      images: [],
      tags: product.tags || [],
    });
    setModalOpen(true);
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!confirm('Yakin hapus produk ini?')) return;

    try {
      const authHeader = getAuthHeader();

      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: authHeader || {},
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (json.success) {
        setProducts(products.filter(p => p.id !== id));
        alert('Produk berhasil dihapus');
      } else {
        alert('Error: ' + (json.message || JSON.stringify(json.errors)));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Gagal menghapus produk: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    if (!formData.title || !formData.description || !formData.price || !formData.stock || !formData.category_id || !formData.location_city || !formData.location_province) {
      alert('Semua field harus diisi!');
      setSubmitLoading(false);
      return;
    }

    if (!editingProduct && formData.images.length === 0) {
      alert('Minimal 1 gambar harus diupload untuk produk baru!');
      setSubmitLoading(false);
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    data.append('condition', formData.condition);
    data.append('transaction_type', formData.transaction_type);
    data.append('location_city', formData.location_city);
    data.append('location_province', formData.location_province);
    data.append('category_id', formData.category_id);

    formData.images.forEach((file, index) => {
      data.append(`images[${index}]`, file);
    });

    formData.tags.forEach((tag, index) => {
      data.append(`tags[${index}]`, tag);
    });

    try {
      const url = editingProduct ? `${BASE_URL}/products/${editingProduct.id}` : `${BASE_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const authHeader = getAuthHeader();

      console.log('Submitting to:', url, 'Method:', method);
      console.log('Auth Header:', authHeader ? 'Present' : 'Missing');

      const res = await fetch(url, {
        method,
        body: data,
        headers: authHeader || {},
      });

      console.log('Response status:', res.status);

      const contentType = res.headers.get('content-type');
      let json: any;

      if (contentType && contentType.includes('application/json')) {
        json = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`Server returned ${res.status}: ${text.substring(0, 200)}`);
      }

      console.log('Response data:', json);

      if (res.ok && json.success) {
        if (editingProduct) {
          setProducts(products.map(p => p.id === editingProduct.id ? json.data : p));
        } else {
          setProducts([json.data, ...products]);
        }
        setModalOpen(false);
        alert(json.message || 'Produk berhasil disimpan');
      } else {
        console.error('API Error:', json);
        alert('Error: ' + (json.message || JSON.stringify(json.errors || json)));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Gagal menyimpan produk: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSubmitLoading(false);
    }
  };

  const resolveImageUrl = (path: string) => {
    if (!path) return "/no-image.png";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const normalizedPath = path.replace(/^\//, "");
    if (normalizedPath.startsWith("storage/")) {
      return `http://127.0.0.1:8000/${normalizedPath}`;
    }
    return `http://127.0.0.1:8000/storage/${normalizedPath}`;
  };

  const getImage = (product: ApiProduct) => {
    if (product.images && product.images.length > 0) {
      return resolveImageUrl(product.images[0].image_path);
    }
    return "/no-image.png";
  };

  const sellerMenus = [
    { name: "Dashboard", href: "/seller" },
    { name: "Produk", href: "/seller/products" },
    { name: "Transaksi", href: "/seller/transactions" },
    { name: "Refunds", href: "/seller/refunds" },
    { name: "Wallet", href: "/seller/wallet" },
    { name: "Ads", href: "/seller/ads" },
    { name: "Notifikasi", href: "/seller/notifications" },
    { name: "Pindah ke halaman pembeli", href: "/" }
  ];

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-500"  style={{ letterSpacing: '2px' }}>Rather's</h1>
          <p className="text-sm text-gray-500 mb-4">Seller Dashboard</p>

          <nav className="mt-6 space-y-2">
            {sellerMenus.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition
                  ${pathname === item.href
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <SidebarProfile user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Kelola Produk</h1>
          <button
            onClick={handleAddProduct}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Tambah Produk
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-32 w-full rounded-lg bg-slate-200" />
                <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-200" />
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="h-9 w-24 rounded-full bg-slate-200" />
                  <div className="h-9 w-24 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-primary">Belum ada produk</p>
            <p className="mt-2 text-sm text-slate-500">Tambahkan produk pertama kamu dengan tombol Tambah Produk.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {products.map((p) => (
              <div key={p.id} className="flex h-[350px] w-full max-w-[300px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg">
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={getImage(p)}
                    fill
                    alt={p.title}
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-primary line-clamp-2">{p.title}</h3>
                    <p className="mt-2 text-blue-600 text-lg font-bold">Rp {Number(p.price).toLocaleString("id-ID")}</p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Stock: <span className="font-medium text-slate-900">{p.stock}</span></p>
                    <p>Status: <span className="font-medium text-slate-900">{p.status || 'active'}</span></p>
                  </div>
                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => handleEditProduct(p)}
                      className="flex-1 rounded-2xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="flex-1 rounded-2xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="relative bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>
              <h2 className="text-xl font-bold text-blue-500 mb-4">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary">Judul</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border rounded text-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded text-primary"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary">Harga</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full p-2 border rounded text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary">Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full p-2 border rounded text-primary"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary">Kondisi</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full p-2 border rounded text-primary"
                    >
                      <option value="new">Baru</option>
                      <option value="used">Bekas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary">Tipe Transaksi</label>
                    <select
                      value={formData.transaction_type}
                      onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                      className="w-full p-2 border rounded text-primary"
                    >
                      <option value="cod">COD</option>
                      <option value="rekber">Rekber</option>
                      <option value="both">Keduanya</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary">Kategori</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full p-2 border rounded text-primary"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary">Kota</label>
                    <input
                      type="text"
                      value={formData.location_city}
                      onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                      className="w-full p-2 border rounded text-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary">Provinsi</label>
                    <input
                      type="text"
                      value={formData.location_province}
                      onChange={(e) => setFormData({ ...formData, location_province: e.target.value })}
                      className="w-full p-2 border rounded text-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary">Gambar (max 5)</label>
                  <div
                    className={`mt-2 flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white text-center transition ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-300'}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleImageDrop}
                    onClick={() => document.getElementById('product-image-input')?.click()}
                  >
                    <input
                      id="product-image-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageInput}
                      className="hidden"
                    />
                    <div className="pointer-events-none">
                      <p className="text-sm font-medium text-primary">Tarik atau pilih gambar di sini</p>
                      <p className="text-xs text-slate-500">Bisa tambah satu per satu, maksimal 5 gambar</p>
                      <p className="text-xs text-slate-400">{formData.images.length} / 5</p>
                    </div>
                  </div>

                  {(existingImages.length > 0 || formData.images.length > 0) && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {existingImages.map((image, index) => (
                        <div key={`existing-${index}`} className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
                          <img
                            src={resolveImageUrl(image.image_path)}
                            alt={`existing-preview-${index}`}
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-red-600 shadow-sm hover:bg-red-50"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {formData.images.map((file, index) => (
                        <div key={`new-${index}`} className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`preview-${index}`}
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-red-600 shadow-sm hover:bg-red-50"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary">Tags (pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                    className="w-full p-2 border rounded text-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}