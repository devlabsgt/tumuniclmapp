import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

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

  return user ? (
    <div className="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-4">
    <div className="flex flex-col items-end">
      <span className="text-xs inline lg:text-lg font-bold ">
      {user.email}
      </span>
      {rolNombre && (
        <div className="text-[#06c] text-xs font-medium mt-1 lg:mt-0">
        Rol:  <strong><span className="underline">{rolNombre}</span></strong> 
        </div>
      )}
    </div>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Cerrar Sesión
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/sign-in">Iniciar Sesión</Link>
      </Button>
    </div>
  );
}
