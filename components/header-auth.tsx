'use client';

import { signOutAction } from "@/app/actions";
import Link from "next/link";
import EmailAnimado from './ui/Typeanimation';
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut } from 'lucide-react';
import useUserData from '@/hooks/useUserData';
import Swal from 'sweetalert2';

export default function AuthButton() {
  const { userId, email, rol, cargando } = useUserData();
  const pathname = usePathname();
  
  const esAdmin = rol === 'SUPER' || rol === 'ADMINISTRADOR';
  const rutaInicio = esAdmin ? '/protected/admin' : '/protected/user';
  const esInicio = pathname === '/protected/';

  const linkStyles = "inline-flex items-center text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const handleSignOut = async () => {
    Swal.fire({
      title: '¿Está seguro?',
      text: "Se cerrará su sesión actual.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      color: '#333'
    }).then((result) => {
      if (result.isConfirmed) {
        signOutAction();
      }
    });
  };

  if (cargando) {
    return <div className="w-48 mr-10" />;
  }

  return userId ? (
    <div className="flex flex-col items-end gap-8 mr-10">
      <div className="text-right">
        <span className="text-sm font-bold">
          <EmailAnimado
            textos={[
              '¡Hoy! Concepción Avanza',
              'Bienvenido al sistema apptumuniclm',
              email || ''
            ]}
          />
        </span>
        {rol && (
          <div className="text-[#06c] text-xs font-medium">
            Rol: <strong><span className="mt-2 underline">{rol}</span></strong>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row-reverse lg:items-center lg:gap-4">
        <button
          type="button"
          onClick={handleSignOut}
          className={`${linkStyles} justify-end mt-2 text-blue-500`}
        >
          Cerrar Sesión
          <LogOut className="h-4 w-4 ml-2" />
        </button>
        
        {!esInicio && (
          <Link href={rutaInicio} className={`${linkStyles} justify-end mt-2 text-blue-600`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Inicio
          </Link>
        )}
      </div>
    </div>
  ) : null;
}