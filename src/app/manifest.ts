import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cosmogov — Big ideas. Local magic.",
    short_name: "Cosmogov",
    description:
      "A shared space for civic participation, community decisions, and visible progress",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf7",
    theme_color: "#6741d9",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["government", "social", "productivity"],
    screenshots: [],
  };
}
