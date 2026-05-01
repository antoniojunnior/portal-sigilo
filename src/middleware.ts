import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page through
  if (pathname === "/app/login") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/app/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
