"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { logout } from "@/services/authentication";
import api from "@/services/api";
import { usePathname } from "next/navigation";

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  date: string;
  unread: boolean;
}

const mapNotificationResponse = (item: any): NotificationItem => ({
  id: item.id,
  title: item.title || item.subject || "Notifikasi baru",
  description: item.description || item.message || "",
  date: item.date || item.created_at || item.createdAt || "",
  unread:
    typeof item.unread === "boolean"
      ? item.unread
      : item.is_read !== undefined
      ? !item.is_read
      : false,
});

export default function NotificationsPage() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        const payload = res.data?.data ?? res.data ?? [];
        const notificationsData = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.notifications)
          ? payload.notifications
          : [];

        setNotifications(notificationsData.map(mapNotificationResponse));
      } catch (err) {
        console.error("Gagal memuat notifikasi:", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unread: !item.unread } : item
      )
    );
  };

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
<div className="flex min-h-screen w-full bg-white font-sans">
<div className="w-64 bg-white border-r p-4 hidden md:flex flex-col justify-between fixed h-screen z-10">
<div>
<h1 className="text-2xl font-bold text-blue-500 tracking-wide">RatheR</h1>

<nav className="mt-8 space-y-2 pointer-events-auto">
          {[
            { name: "Beranda", href: "/" },
            { name: "Notifikasi", href: "/notifications", badge: unreadCount },
            { name: "Favorit", href: "/favorites" },
            { name: "Pembelian", href: "/purchases" },
            { name: "Pindah ke seller", href: "/seller" },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors pointer-events-auto
                ${pathname === item.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <span>{item.name}</span>

              {item.badge ? (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-3 pb-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm">
            U
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">Pembeli</p>
            <p className="text-xs text-blue-600 cursor-pointer mt-0.5 hover:underline">Lihat Profil</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 shadow-sm"
        >
          Logout
        </button>
      </div>
    </div>

    <div className="flex-1 md:ml-64 pt-4 pb-8 px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="md:hidden mb-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <nav className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {[
              { name: "Beranda", href: "/" },
              { name: "Notifikasi", href: "/notifications", badge: unreadCount },
              { name: "Favorit", href: "/favorites" },
              { name: "Pembelian", href: "/purchases" },
              { name: "Pindah ke seller", href: "/seller" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-2xl border px-3 py-2 text-sm font-medium transition-colors ${pathname === item.href ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
              >
                <span>{item.name}</span>
                {item.badge ? (
                  <span className="ml-2 inline-flex rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

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
              type="button"
              onClick={markAllRead}
              className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Tandai semua dibaca
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-lg font-semibold text-gray-900">Tidak ada notifikasi</p>
              <p className="mt-2 text-sm text-gray-600">Kunjungi beranda untuk menemukan produk terbaru.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-3xl border px-6 py-5 shadow-sm transition ${item.unread ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                      {item.unread ? (
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                          Baru
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{item.date}</span>
                    <button
                      type="button"
                      onClick={() => toggleRead(item.id)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {item.unread ? "Tandai dibaca" : "Tandai belum dibaca"}
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

);
}