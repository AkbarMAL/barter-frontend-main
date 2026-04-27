"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/services/api";
import SidebarProfile from "@/components/sidebar-profile";
import { ProtectedRoute } from "@/components/protected-route";

/** Format ISO date string into a human-readable relative time (Indonesian) */
const formatRelativeDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  date: string;
  unread: boolean;
  actionUrl?: string;
  type?: string;
}

const mapNotificationResponse = (item: any): NotificationItem => {
  const data = item.data ?? {};
  const rawDate = item.created_at || item.createdAt || "";

  return {
    id: item.id,
    title: data.title || "Notifikasi baru",
    description: data.message || "",
    date: formatRelativeDate(rawDate),
    unread: item.read_at === null,
    actionUrl: data.action_url,
    type: data.type,
  };
};

export default function NotificationsPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("current_user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch { }
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");

        // Laravel response: { success: true, data: { data: [...], ... } }
        // res.data = axios wrapper, .data = success wrapper, .data = paginated items
        const payload = res.data?.data?.data ?? res.data?.data ?? [];
        const notificationsData = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.notifications)
            ? payload.notifications
            : [];
        setNotifications(
          notificationsData.map(mapNotificationResponse)
        );
      } catch (err) {
        console.error("Gagal memuat notifikasi:", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, unread: false }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRead = async (id: number) => {
    const target = notifications.find((item) => item.id === id);
    if (!target) return;

    if (target.unread) {
      try {
        await api.put(`/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, unread: false } : item
          )
        );
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await api.put(`/notifications/${id}/unread`);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, unread: true } : item
          )
        );
      } catch (err) {
        console.error(err);
      }
    }
  };


  const handleClickNotification = (item: NotificationItem) => {
    if (item.unread) {
      toggleRead(item.id);
    }

    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full bg-white font-sans">

        {/* Sidebar */}
        <div className="w-64 bg-white border-r p-4 hidden md:flex flex-col justify-between fixed h-screen z-10">
          <div>
            <h1 className="text-2xl font-bold text-blue-500 tracking-wide">RatheR</h1>

            <nav className="mt-8 space-y-2">
              {[
                { name: "Beranda", href: "/" },
                { name: "Notifikasi", href: "/notifications" },
                { name: "Favorit", href: "/favorites" },
                { name: "Pembelian", href: "/purchases" },
                { name: "Pindah ke seller", href: "/seller" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition
                    ${pathname === item.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <span>{item.name}</span>
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
                <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Semua pemberitahuan terbaru untuk akun pembeli Anda.
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
                  <p className="text-lg font-semibold">Tidak ada notifikasi</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Kunjungi beranda untuk menemukan produk terbaru.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleClickNotification(item)}
                    className={`cursor-pointer rounded-3xl border px-6 py-5 shadow-sm transition ${item.unread
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg text-blue-500 font-semibold">
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
                          className="rounded-full  bg-green-500 text-white border px-3 py-2 text-sm"
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