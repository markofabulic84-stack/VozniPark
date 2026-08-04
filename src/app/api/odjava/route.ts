import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteSession } from "@/lib/session";

// Cookie se smije brisati samo unutar Server Actiona ili Route Handlera,
// pa DAL ovamo preusmjeri kad sesija referencira korisnika koji više ne
// postoji u bazi (spriječava petlju preusmjeravanja s proxy.ts).
export async function GET(request: NextRequest) {
  await deleteSession();
  return NextResponse.redirect(new URL("/prijava", request.url));
}
