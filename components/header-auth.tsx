import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

return user ? (
  <div className="flex items-center gap-4">
    <span className=" text-xl hidden lg:inline ">Hola, <strong>{user.email}</strong>!</span>
    <form action={signOutAction}>
      <Button type="submit" variant={"outline"}>
        Cerrar Sesión
      </Button>
    </form>
  </div>
) : (
  <div className="flex gap-2">
    <Button asChild size="sm" variant={"outline"}>
      <Link href="/sign-in">Iniciar Sesión</Link>
    </Button>
  </div>
);


}
