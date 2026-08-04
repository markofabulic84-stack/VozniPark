"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <Link href="/app" className="mono text-sm" style={{ color: "var(--blue)" }}>
          &lt;/&gt; VozniPark
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Otvori izbornik"
          className="btn btn-ghost"
          style={{ padding: "8px 12px" }}
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Zatvori izbornik"
            onClick={() => setOpen(false)}
            className="flex-1"
            style={{ background: "rgba(0,0,0,0.6)", border: "none" }}
          />
          <div
            className="w-72 max-w-[85vw] h-full p-4 flex flex-col justify-between overflow-y-auto"
            style={{ background: "var(--panel)", borderLeft: "1px solid var(--border)" }}
          >
            <div
              className="flex flex-col gap-1"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="mono text-sm" style={{ color: "var(--blue)" }}>
                  &lt;/&gt; VozniPark
                </span>
                <button
                  aria-label="Zatvori"
                  className="btn btn-ghost"
                  style={{ padding: "6px 10px" }}
                >
                  ✕
                </button>
              </div>
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
