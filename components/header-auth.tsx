'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut } from 'lucide-react';
import useUserData from '@/hooks/sesion/useUserData';
import Swal from 'sweetalert2';
import { Typewriter } from 'react-simple-typewriter';
import { signOutAction } from "@/app/actions";

export default function AuthButton() {
  const { userId, email, rol, cargando } = useUserData();
  const pathname = usePathname();
  
  const esAdmin = rol === 'SUPER' || rol === 'ADMINISTRADOR';
  const rutaInicio = esAdmin ? '/protected/admin' : '/protected/';
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
          <Typewriter
            words={[
              '¡Hoy! Concepción Avanza',
              'Bienvenido al sistema apptumuniclm',
              email || ''
            ]}
            loop={1}
            cursor
            cursorStyle="|"
            typeSpeed={50}
            deleteSpeed={50}
            delaySpeed={1000}
          />
        </span>
        {rol && (
          <div className="text-[#06c] text-xs font-medium">
            Rol: <strong><span className="mt-2 underline">{rol}</span></strong>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <button
          type="button"
          onClick={handleSignOut}
          className={`${linkStyles} justify-end text-red-500 hover:text-red-600`}
        >
          Cerrar Sesión
          <LogOut className="h-4 w-4 ml-2" />
        </button>
        
        {!esInicio && (
          <Link href={rutaInicio} className={`${linkStyles} justify-end text-blue-600`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Inicio
          </Link>
        )}
      </div>
    </div>
  ) : null;
}