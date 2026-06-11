import type { MetadataRoute } from "next";

// PWA manifest (spec §2.7). Icons are added in the PWA-polish milestone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Playbook",
    short_name: "Playbook",
    description: "The financial hub for college athletes earning NIL income.",
    start_url: "/home",
    display: "standalone",
    background_color: "#070a0d",
    theme_color: "#070a0d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
