// next.config.ts (Modificado para la prueba de diagnóstico)

import type { NextConfig } from "next";
// import withPWAInit from "next-pwa"; // Se comenta la importación

/*
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});
*/

const nextConfig: NextConfig = {
  /* config options here */
};

// Se exporta la configuración directamente, sin el envoltorio de PWA
export default nextConfig;