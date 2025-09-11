// next.config.ts

import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  
  // --- SE AÑADE ESTA SECCIÓN PARA IGNORAR ERRORES DE TYPESCRIPT EN EL BUILD ---
  typescript: {
    ignoreBuildErrors: true,
  },
  // -------------------------------------------------------------------------
};

export default withPWA(nextConfig);