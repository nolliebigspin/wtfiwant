import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  transpilePackages: ["@wtfiwant/api", "@wtfiwant/shared"],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
