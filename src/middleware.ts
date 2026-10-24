import { NextRequest, NextResponse } from "next/server";
import { oturumCoz, sahaIzinli } from "@/lib/auth-cookie";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/oturum"
  ) {
    return NextResponse.next();
  }

  const oturum = await oturumCoz(req.cookies.get("ik_oturum")?.value);
  if (!oturum) {
    const url = req.nextUrl.clone();
    url.pathname = "/oturum";
    url.searchParams.set("sonra", pathname);
    return NextResponse.redirect(url);
  }

  if (oturum.rol === "SAHA" && !sahaIzinli(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/puantaj";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
