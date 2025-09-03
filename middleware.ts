// middleware.ts
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
      
      // LA LÍNEA CORREGIDA PARA FORZAR LA SOLUCIÓN
      const rolNombre = (relacion?.roles as any)?.nombre ?? null;

      // El resto de su lógica de roles
      if (
        request.nextUrl.pathname.startsWith("/protected/admin/configs") &&
        rolNombre !== "SUPER"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (
        request.nextUrl.pathname.startsWith("/protected/admin") &&
        rolNombre !== "ADMINISTRADOR" &&
        rolNombre !== "SUPER"
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
        rolNombre === "ADMINISTRADOR" || rolNombre === "SUPER"
          ? "/protected/admin"
          : "/protected/user";
      return NextResponse.redirect(new URL(destino, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}