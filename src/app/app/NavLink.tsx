"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-md text-sm font-medium transition-colors"
      style={{
        color: active ? "var(--text)" : "var(--muted)",
        background: active ? "var(--panel-2)" : "transparent",
      }}
    >
      {children}
    </Link>
  );
}
