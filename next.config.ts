// next.config.ts

import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// 1. Definir la configuración de la PWA
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// 2. Su configuración existente de Next.js
const nextConfig: NextConfig = {
  /* config options here */
};

// 3. Envolver su configuración con la de PWA y exportar
export default withPWA(nextConfig);