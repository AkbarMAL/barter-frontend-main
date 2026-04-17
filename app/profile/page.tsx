"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAuthenticated, getAuthToken } from "@/services/authentication";
import { PencilIcon, ArrowLeftIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ProtectedRoute } from "@/components/protected-route";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  type SocialMediaItem = {
    name: string;
    url: string;
  };
  const getAvatarSrc = (avatar?: string) => {
    if (!avatar) return "";
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }
    return `http://127.0.0.1:8000/storage/${avatar}`;
  };
  type ProfileFormData = {
    name: string;
    wa_number: string;
    bio: string;
    address: string;
    city: string;
    province: string;
    social_media: SocialMediaItem[];
  };

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    wa_number: "",
    bio: "",
    address: "",
    city: "",
    province: "",
    social_media: [{ name: "", url: "" }],
  });


  // Check auth dan fetch user data
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = getAuthToken();
      const currentUser = getCurrentUser();

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/v1/me", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (json.success) {
        setUser(json.data);
        setFormData({
          name: String(json.data.name ?? ""),
          wa_number: String(json.data.wa_number ?? ""),
          bio: String(json.data.profile?.bio ?? ""),
          address: String(json.data.profile?.address ?? ""),
          city: String(json.data.profile?.city ?? ""),
          province: String(json.data.profile?.province ?? ""),
          social_media: Array.isArray(json.data.profile?.social_media) &&
            json.data.profile.social_media.length > 0
            ? json.data.profile.social_media
            : [{ name: "", url: "" }],
        });
      } else {
        setError("Gagal memuat data profil");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialChange = (
    index: number,
    field: "name" | "url",
    value: string
  ) => {
    setFormData((prev) => {
      const nextSocial = [...prev.social_media];
      nextSocial[index] = { ...nextSocial[index], [field]: value };
      return { ...prev, social_media: nextSocial };
    });
  };

  const handleAddSocialMedia = () => {
    setFormData((prev) => ({
      ...prev,
      social_media: [...prev.social_media, { name: "", url: "" }],
    }));
  };

  const handleRemoveSocialMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      social_media: prev.social_media.filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();

      const filteredSocialMedia = formData.social_media
        .filter((social) => social.name?.trim() && social.url?.trim())
        .filter((social) => {
          try {
            new URL(social.url);
            return true;
          } catch {
            return false;
          }
        });

      if (!String(formData.name || "").trim()) {
        setError("Nama lengkap tidak boleh kosong");
        setIsSaving(false);
        return;
      }

      const dataToSend: Record<string, any> = {
        name: formData.name.trim(),
      };

      if (formData.wa_number?.trim()) dataToSend.wa_number = formData.wa_number.trim();
      if (formData.bio?.trim()) dataToSend.bio = formData.bio.trim();
      if (formData.address?.trim()) dataToSend.address = formData.address.trim();
      if (formData.city?.trim()) dataToSend.city = formData.city.trim();
      if (formData.province?.trim()) dataToSend.province = formData.province.trim();
      if (filteredSocialMedia.length > 0) dataToSend.social_media = filteredSocialMedia;

      console.log("FINAL PAYLOAD:", dataToSend);

      const response = await fetch("http://127.0.0.1:8000/api/v1/me", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const json = await response.json();
      console.log("RESPONSE:", json);

      if (!response.ok) {
        if (json.errors) {
          const errorMessages = Object.values(json.errors).flat().join(", ");
          setError(errorMessages);
        } else {
          setError(json.message || "Terjadi kesalahan");
        }
        return;
      }

      setUser(json.data);
      setSuccess("Profil berhasil diperbarui!");
      setIsEditing(false);

      localStorage.setItem("current_user", JSON.stringify(json.data));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menyimpan profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    // Reset form ke data user
    if (user) {
      setFormData({
        name: user.name || "",
        wa_number: user.wa_number || "",
        bio: user.profile?.bio || "",
        address: user.profile?.address || "",
        city: user.profile?.city || "",
        province: user.profile?.province || "",
        social_media: user.profile?.social_media?.length
          ? user.profile.social_media
          : [{ name: "", url: "" }],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Data profil tidak ditemukan</p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <XMarkIcon className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Card Header with Avatar */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 flex items-end gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || "User"}
                    width={80}
                    height={80}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-blue-600">
                    {user.name?.substring(0, 2).toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="flex-1 text-white pb-2">
                <h2 className="text-2xl font-bold">{user.name || "User"}</h2>
                <p className="text-blue-100 text-sm">Akun Barter Platform</p>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-8">
              {!isEditing ? (
                // View Mode
                <div className="space-y-6">
                  {/* Informasi Dasar */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Informasi Akun
                    </h3>
                    <div className="space-y-4">
                      {/* Email */}
                      <div className="flex items-start gap-3">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Email
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Email tidak dapat diubah
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Nomor Telepon
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{user.phone}</p>
                          <p className="text-xs text-gray-500 mt-1">Nomor verifikasi</p>
                        </div>
                      </div>

                      {/* WhatsApp Number */}
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Nomor WhatsApp
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">
                            {user.wa_number || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Social Media */}
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Sosial Media
                          </label>
                        </div>
                        <div className="flex-1 space-y-3">
                          {user.profile?.social_media?.length > 0 ? (
                            user.profile.social_media.map((social: any, index: number) => (
                              <div key={index} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                <p className="text-gray-900 font-medium">{social.name}</p>
                                <a
                                  href={social.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {social.url}
                                </a>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-900">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informasi Profil */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Informasi Profil
                    </h3>
                    <div className="space-y-4">
                      {/* Bio */}
                      <div className="flex items-start gap-3">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Bio
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {user.profile?.bio || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Alamat */}
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Alamat
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {user.profile?.address || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Kota */}
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Kota
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {user.profile?.city || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Provinsi */}
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                        <div className="min-w-32">
                          <label className="text-sm font-medium text-gray-600">
                            Provinsi
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {user.profile?.province || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Status Akun
                    </h3>
                    <div className="space-y-2 flex gap-2">
                      <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                        Pembeli
                      </span>
                      {user.is_seller && (
                        <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                          Penjual
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <PencilIcon className="w-5 h-5" />
                      Edit Akun
                    </button>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Informasi Profil
                  </h3>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="text"
                      name="wa_number"
                      value={formData.wa_number}
                      onChange={handleInputChange}
                      className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Contoh: 62812345678"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Ceritakan tentang diri Anda"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Jalan, No. rumah, RT, RW"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kota
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan kota"
                    />
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provinsi
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan provinsi"
                    />
                  </div>

                  {/* Social Media Inputs */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Sosial Media</h3>
                        <p className="text-sm text-gray-500">Tambahkan akun sosial media yang ingin ditampilkan</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {formData.social_media.map((social, index) => (
                        <div key={index} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Sosial Media
                              </label>
                              <input
                                type="text"
                                value={social.name}
                                onChange={(e) => handleSocialChange(index, "name", e.target.value)}
                                className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Contoh: Instagram, Facebook"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Link Sosial Media
                              </label>
                              <input
                                type="url"
                                value={social.url}
                                onChange={(e) => handleSocialChange(index, "url", e.target.value)}
                                className="w-full text-primary px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://"
                              />
                            </div>
                          </div>
                          {formData.social_media.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialMedia(index)}
                              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Hapus sosial media ini
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSocialMedia}
                      className="mt-4 inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
                    >
                      Tambahkan sosial media lain
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Other Options */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/profile"
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition text-center"
            >
              <p className="font-semibold text-gray-900">Ubah Password</p>
              <p className="text-xs text-gray-500 mt-1">Perbarui kata sandi akun Anda</p>
            </Link>
            <Link
              href="/profile"
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition text-center"
            >
              <p className="font-semibold text-gray-900">Pengaturan Akun</p>
              <p className="text-xs text-gray-500 mt-1">Kelola pengaturan privasi dan keamanan</p>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
