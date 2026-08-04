"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // Samo u produkciji — u razvoju bi service worker keširao stare buildove
    // i ometao Fast Refresh.
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
