"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isSeller } from "@/services/authentication";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "buyer" | "seller" | "both";
  fallback?: React.ReactNode;
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Redirects to home if don't have required role
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/seller")) {
    return NextResponse.redirect("http://localhost:5173/");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*"],
};
export function ProtectedRoute({
  children,
  requiredRole = "buyer",
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setIsAuthorized(false);
      router.replace("/login");
      return;
    }

    if (requiredRole === "seller" && !isSeller()) {
      setIsAuthorized(false);
      router.replace("/");
      return;
    }

    setIsAuthorized(true);
  }, [router, requiredRole]);

  if (isAuthorized === null) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (isAuthorized === false) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user is authenticated
 */
export function useAuth() {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isSeller: false,
    user: null as any,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setAuth({
        isAuthenticated: authenticated,
        isSeller: authenticated ? isSeller() : false,
        user: authenticated
          ? typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("current_user") || "{}")
            : null
          : null,
      });
      setLoading(false);
    };

    checkAuth();
  }, []);

  return { ...auth, loading };
}
