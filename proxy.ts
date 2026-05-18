import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value ||
    request.cookies.get("auth_token")?.value;

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/seller")) {
    return NextResponse.redirect(
      new URL(`http://localhost:5173${pathname}`)
    );
  }

  const publicPages = [
    "/",
    "/login",
    "/register",
    "/product",
  ];

  const isPublicPage = publicPages.some((page) => {
    if (page === "/product") {
      return pathname.startsWith("/product");
    }

    return pathname === page;
  });

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";

  const isTransactionPage = pathname.startsWith("/transactions");
  const isFavoritePage = pathname.startsWith("/favorites");
  const isNotificationPage = pathname.startsWith("/notifications");
  const isPurchasePage = pathname.startsWith("/purchases");
  const isProfilePage = pathname.startsWith("/profile");
  const isMessagesPage = pathname.startsWith("/messages");

  const protectedPages = [
    isTransactionPage,
    isFavoritePage,
    isNotificationPage,
    isPurchasePage,
    isProfilePage,
    isMessagesPage,
  ];

  if (!token && protectedPages.some((page) => page)) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

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