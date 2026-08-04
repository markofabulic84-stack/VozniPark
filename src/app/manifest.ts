import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VozniPark",
    short_name: "VozniPark",
    description:
      "Praćenje voznog parka — potrošnja, servisi i troškovi po vozilu.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
