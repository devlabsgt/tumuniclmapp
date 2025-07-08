import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server"; // ✅ Este es el correcto para server

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rolNombre = "";

  if (user) {
    const { data: relacion, error } = await supabase
      .from("usuarios_roles")
      .select("roles(nombre)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && relacion && 'roles' in relacion && relacion.roles && 'nombre' in relacion.roles) {
      rolNombre = (relacion.roles as { nombre: string }).nombre;
    }
  }

  // ✅ Obtener fecha y hora formateada con zona horaria de Guatemala
  const fecha = new Date();

  const fechaFormatter = new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const horaFormatter = new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const fechaFormateada = fechaFormatter.format(fecha);
  const horaFormateada = horaFormatter.format(fecha);

  return user ? (
    <div className="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-4">
      <div className="flex flex-col items-end">
        <span className="text-xs inline lg:text-lg font-bold">
          {user.email}
        </span>
        {rolNombre && (
          <div className="text-[#06c] text-xs font-medium mt-1 lg:mt-0">
            Rol: <strong><span className="underline">{rolNombre}</span></strong>
          </div>
        )}
        {/* ✅ Fecha y hora en dos líneas */}
        <div className="text-xs text-gray-500 mt-1 text-right leading-tight">
          <div>{fechaFormateada}</div>
          <div>{horaFormateada}</div>
        </div>
      </div>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Cerrar Sesión
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex flex-col gap-1 items-center text-center">
      <Button asChild size="sm" variant="outline">
        <Link href="/sign-in">Iniciar Sesión</Link>
      </Button>
      {/* Fecha y hora también para no autenticado */}
      <div className="text-gray-500 mt-1 leading-tight">
        <div className="text-xs">{fechaFormateada}</div>
        <div className="text-sm">{horaFormateada}</div>
      </div>
    </div>
  );
}
