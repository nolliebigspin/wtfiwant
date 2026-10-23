import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/[[...route]]": ["../../packages/api/src/report/fonts/*"],
  },
  reactCompiler: true,
  transpilePackages: ["@wtfiwant/api", "@wtfiwant/shared"],
  // Tracing defaults to the app directory, which would omit the workspace
  // packages and their dependencies (postgres, openai) from the standalone
  // build. The monorepo root is the real dependency boundary.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  async headers() {
    return [
      {
        source: "/:locale/reflection/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/:locale/result/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
