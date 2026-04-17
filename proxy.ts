import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value || request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // ❗ skip next internal
  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Halaman yang bisa diakses tanpa login (PUBLIC)
  const publicPages = [
    "/",
    "/login",
    "/register",
    "/product", // termasuk /product/[id]
  ];

  const isPublicPage = publicPages.some(page => {
    if (page === "/product") {
      return pathname.startsWith("/product");
    }
    return pathname === page;
  });

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isSellerPage = pathname.startsWith("/seller");
  const isTransactionPage = pathname.startsWith("/transactions");
  const isFavoritePage = pathname.startsWith("/favorites");
  const isNotificationPage = pathname.startsWith("/notifications");
  const isPurchasePage = pathname.startsWith("/purchases");
  const isProfilePage = pathname.startsWith("/profile");
  const isMessagesPage = pathname.startsWith("/messages");

  // Redirect ke login jika akses halaman protected tanpa token
  const protectedPages = [isSellerPage, isTransactionPage, isFavoritePage, isNotificationPage, isPurchasePage, isProfilePage, isMessagesPage];
  
  if (!token && protectedPages.some(page => page)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login dan mencoba akses login/register, redirect ke home
  if (token && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};