import type { NextConfig } from "next";

// Browser-side protections sent with every response. The CSP is deliberately
// narrow (framing, base tags, plugins, form targets) so it can't break the
// app's own scripts, fonts or map tiles.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Signed-in pages and API answers are personal: never cache them in
        // shared caches or the browser's back/forward store.
        source: "/(dashboard|api)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
