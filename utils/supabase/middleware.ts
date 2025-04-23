// utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const user = await supabase.auth.getUser();

    // 🚫 Redirección si intenta entrar a /protected sin sesión
    if (request.nextUrl.pathname.startsWith("/protected") && user.error) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // 🔐 Si intenta entrar a /protected/admin y no es admin
    if (
      request.nextUrl.pathname.startsWith("/protected/admin") &&
      user.data?.user?.user_metadata?.rol !== "Admin"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // ✅ Redirige desde / según el rol
    if (request.nextUrl.pathname === "/") {
      if (user.error) return response;

      const rol = user.data?.user?.user_metadata?.rol;
      const destino = rol === "Admin" ? "/protected/admin" : "/protected";
      return NextResponse.redirect(new URL(destino, request.url));
    }

    return response;
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
