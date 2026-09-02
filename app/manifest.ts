import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rayid Ali · RAYID.EXE", short_name: "RAYID.EXE", description: "AI engineer in New York. Builds things with AI, ships them.",
    start_url: "/", display: "standalone", background_color: "#070c22", theme_color: "#070c22",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
