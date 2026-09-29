import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /**
   * Hosted websites live at /sites/{slug}/ — the trailing slash matters because
   * user HTML references assets relatively ("assets/style.css"). Next's default
   * trailing-slash normalization would break them, so it is disabled here.
   * The sites route handler issues its own canonical redirect for the root.
   */
  skipTrailingSlashRedirect: true,

  /**
   * Exclude heavy directories from output file tracing.
   * Without this, Turbopack's dynamic path.join() analysis causes the entire
   * project tree — including src-tauri/target (GBs of Rust build artifacts) —
   * to be bundled into .next/standalone.
   */
  outputFileTracingExcludes: {
    "**": [
      "src-tauri/**",
      ".next/cache/**",
      "node_modules/.cache/**",
      "localdock/**",
      "*.log",
    ],
  },
};

export default nextConfig;
