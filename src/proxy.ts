import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const AUTH_STRANICE = ["/prijava", "/registracija"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;
  const session = await decrypt(token);

  const zasticeno =
    pathname.startsWith("/app") || pathname.startsWith("/pretplata");
  if (zasticeno && !session) {
    return NextResponse.redirect(new URL("/prijava", request.url));
  }

  if (AUTH_STRANICE.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/pretplata", "/prijava", "/registracija"],
};
