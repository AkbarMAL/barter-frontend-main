"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/services/api";
import { ProtectedRoute } from "@/components/protected-route";
import SidebarProfile from "@/components/sidebar-profile";

interface NotificationItem {
  id: number | string;
  title: string;
  description: string;
  date: string;
  unread: boolean;
  actionUrl?: string;
  type?: string;
}

const mapNotificationResponse = (item: any): NotificationItem => {
  const data = item.data ?? {};

  const createdAt =
    item.created_at ||
    item.createdAt ||
    item.updated_at ||
    item.updatedAt ||
    "";

  return {
    id: item.id ?? data.id ?? "",
    title: data.title || "Notifikasi baru",
    description: data.message || "",
    date: createdAt,
    unread: item.read_at === null, // standar Laravel
    actionUrl: data.action_url,
    type: data.type,
  };
};

const sellerMenus = [
  { name: "Dashboard", href: "/seller" },
  { name: "Produk", href: "/seller/products" },
  { name: "Transaksi", href: "/seller/transactions" },
  { name: "Refunds", href: "/seller/refunds" },
  { name: "Wallet", href: "/seller/wallet" },
  { name: "Notifikasi", href: "/seller/notifications" },
  { name: "Pindah ke halaman pembeli", href: "/" },
];

export default function SellerNotificationPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("current_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");

        const payload = res.data?.data ?? res.data ?? [];
        const notificationsData = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.notifications)
          ? payload.notifications
          : [];

        setNotifications(
          notificationsData.map(mapNotificationResponse),
        );
      } catch (error: any) {
        console.error("Gagal memuat notifikasi:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, unread: false })),
    );

    // TODO: nanti bisa sambungkan ke API
    // await api.post("/notifications/mark-all-read");
  };

  const toggleRead = (id: number | string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unread: !item.unread } : item,
      ),
    );

    // TODO: API
    // await api.post(`/notifications/${id}/toggle-read`);
  };

  const handleClickNotification = (item: NotificationItem) => {
    // tandai sudah dibaca
    if (item.unread) {
      toggleRead(item.id);
    }

    // redirect kalau ada action_url
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const isActive = (href: string) => {
    if (href === "/seller/notifications") {
      return pathname === "/seller/notifications";
    }
    return pathname === href;
  };

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <ProtectedRoute requiredRole="seller">
      <div className="flex min-h-screen w-full bg-white font-sans">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r p-4 hidden md:flex flex-col justify-between fixed h-screen z-10">
          <div>
            <h1 className="text-2xl font-bold text-blue-500 tracking-wide">
              RatheR
            </h1>

            <nav className="mt-8 space-y-2">
              {sellerMenus.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{item.name}</span>

                  {item.name === "Notifikasi" && unreadCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <SidebarProfile user={user} />
        </div>

        {/* Content */}
        <div className="flex-1 md:ml-64 pt-4 pb-8 px-6 lg:px-8 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notifikasi Penjual
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Semua notifikasi terbaru untuk akun penjual Anda.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {unreadCount} belum dibaca
                </div>

                <button
                  onClick={markAllRead}
                  className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  Tandai semua dibaca
                </button>
              </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
              {loading ? (
                <div className="rounded-3xl border p-8 text-center text-gray-500">
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-3xl border border-dashed p-10 text-center">
                  <p className="text-lg font-semibold">
                    Tidak ada notifikasi
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Periksa kembali nanti.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleClickNotification(item)}
                    className={`cursor-pointer rounded-3xl border px-6 py-5 shadow-sm transition ${
                      item.unread
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold">
                            {item.title}
                          </h2>

                          {item.unread && (
                            <span className="bg-orange-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                              Baru
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{item.date}</span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRead(item.id);
                          }}
                          className="rounded-full border px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          {item.unread
                            ? "Tandai dibaca"
                            : "Tandai belum dibaca"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}