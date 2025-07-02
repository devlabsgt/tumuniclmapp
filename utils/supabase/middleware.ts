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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      if (request.nextUrl.pathname.startsWith("/protected")) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
      return response;
    }

    const { data: relacion } = await supabase
      .from("usuarios_roles")
      .select("roles(nombre)")
      .eq("user_id", user.id)
      .maybeSingle();

    const rolNombre =
      relacion?.roles && "nombre" in relacion.roles
        ? (relacion.roles as { nombre: string }).nombre
        : null;

    // 🔐 Si intenta entrar a /protected/admin/configs/* y no es SUPER
    if (
      request.nextUrl.pathname.startsWith("/protected/admin/configs") &&
      rolNombre !== "SUPER"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    

    // 🔐 Si intenta entrar a /protected/admin y no es ADMINISTRADOR o SUPER
    if (
      request.nextUrl.pathname.startsWith("/protected/admin") &&
      rolNombre !== "ADMINISTRADOR" &&
      rolNombre !== "SUPER"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // ✅ Redirección inicial desde /
    if (request.nextUrl.pathname === "/") {
      const destino =
        rolNombre === "ADMINISTRADOR" || rolNombre === "SUPER"
          ? "/protected/admin"
          : "/protected/user";
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
