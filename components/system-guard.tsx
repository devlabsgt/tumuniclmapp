import React from "react";
import MaintenanceScreen from "./maintenance-screen";

export default async function SystemGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
      {
        method: "GET",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        signal: controller.signal,
        cache: "no-store",
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return <MaintenanceScreen error={`STATUS_${response.status}`} />;
    }

    return <>{children}</>;
  } catch (e: any) {
    const isTimeout = e.name === "AbortError";
    const errorCode = isTimeout ? "TIMEOUT_ERROR" : "INFRASTRUCTURE_ERROR";

    return <MaintenanceScreen error={errorCode} />;
  }
}
