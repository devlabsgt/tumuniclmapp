// middleware.ts (en la raíz del proyecto)

// --- ESTA ES LA LÍNEA QUE SOLUCIONA TODO ---
export const runtime = 'nodejs';
// -----------------------------------------

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/protected');

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (user && isProtectedRoute) {
      const { data: relacion, error: errorRol } = await supabase
        .from("usuarios_roles")
        .select("roles(nombre)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (errorRol) {
        console.error("Error al obtener el rol:", errorRol.message);
        return response;
      }
      
      const rolNombre = (relacion?.roles as any)?.nombre ?? null;

      if (
        request.nextUrl.pathname.startsWith("/protected/admin/configs") &&
        rolNombre !== "SUPER"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (
        request.nextUrl.pathname.startsWith("/protected/admin") &&
        rolNombre !== "SUPER" &&
        rolNombre !== "ADMINISTRADOR" &&
        rolNombre !== "SECRETARIO" &&
        rolNombre !== "RRHH"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
  }
  
  if (user && request.nextUrl.pathname === "/") {
      const { data: relacion } = await supabase
        .from("usuarios_roles")
        .select('roles(nombre)')
        .eq("user_id", user.id)
        .maybeSingle();
        
      const rolNombre = (relacion?.roles as any)?.nombre ?? null;

      const destino =
        rolNombre === "ADMINISTRADOR" || rolNombre === "SUPER" || rolNombre === "SECRETRARIO" || rolNombre === "RRHH"
          ? "/protected/admin"
          : "/protected/user";
      return NextResponse.redirect(new URL(destino, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}