import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      global: {
        fetch: async (url, options) => {
          const response = await fetch(url, options);
          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("text/html")) {
            throw new Error("Supabase_Infrastructure_Down");
          }

          if (!response.ok && response.status >= 500) {
            throw new Error("Supabase_Infrastructure_Down");
          }

          return response;
        },
      },
    },
  );
