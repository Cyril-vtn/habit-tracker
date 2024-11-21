import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  i18n: {
    locales: ["en-US", "fr", "ch-nz"],
    defaultLocale: "fr",
  },
};

export default nextConfig;
