"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logout, getCurrentUser } from "@/services/authentication";
import Image from "next/image";

interface SidebarProfileProps {
  user?: any;
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export default function SidebarProfile({ user }: SidebarProfileProps) {
  const [currentUser, setCurrentUser] = useState<any>(user || null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      return;
    }

    const storedUser = getCurrentUser();
    setCurrentUser(storedUser);
  }, [user]);

  return (
    <div className="space-y-3 pb-4">
      {currentUser ? (
        <>
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
              {currentUser?.avatar ? (
                <Image
                  src={currentUser.avatar}
                  alt={currentUser.name || "User"}
                  width={80}
                  height={80}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-blue-600">
                  {currentUser?.name?.substring(0, 2).toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {currentUser.name || "User"}
              </p>
              <Link href="/profile" className="text-xs text-blue-600 cursor-pointer mt-0.5 hover:underline">
                Lihat Profil
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 shadow-sm"
          >
            Logout
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="w-full rounded-xl bg-blue-600 text-white px-3 py-2.5 text-sm font-semibold transition hover:bg-blue-700 shadow-md text-center block"
        >
          Login
        </Link>
      )}
    </div>
  );
}
