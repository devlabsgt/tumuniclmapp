'use client';

import { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Power, LogOut, RefreshCw } from 'lucide-react';
import useUserData from '@/hooks/sesion/useUserData';
import Swal from 'sweetalert2';
import { Typewriter } from 'react-simple-typewriter';
import { signOutAction } from "@/app/actions";

export default function AuthButton() {
  const { userId, nombre, email, rol, cargando } = useUserData();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const esAdmin = rol === 'SUPER' || rol === 'ADMINISTRADOR';
  const rutaInicio = esAdmin ? '/protected/admin' : '/protected/';
  const esInicio = pathname === '/protected/';

  const linkStyles = "inline-flex items-center justify-end text-xs lg:text-lg transition-colors hover:underline focus-visible:outline-none";

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (cargando) {
    return <div className="w-40 mr-10" />;
  }

  return userId ? (
    <div className="flex flex-col items-end gap-6 mr-2 md:mr-10">
      <div className="text-right">
        <span className="text-xs font-bold block">
          <Typewriter
            words={[
              '¡Hoy! Concepción Avanza',
              nombre || ''
            ]}
            loop={1}
            cursor
            cursorStyle="|"
            typeSpeed={50}
            deleteSpeed={50}
            delaySpeed={1000}
          />
        </span>
        <div className="text-[#06c] text-xs font-medium mt-1">
          {email}
        </div>
      </div>

      <div className="flex flex-row items-center gap-4 mt-auto">
        
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleSignOut}
            className={`${linkStyles} text-red-500 hover:text-red-600`}
          >
            Cerrar Sesión
            <Power className="h-4 w-4 ml-2" />
          </button>
          
          {!esInicio && (
            <Link href={rutaInicio} className={`${linkStyles} text-blue-600 hover:text-blue-700`}>
              Volver a Inicio
              <LogOut className="h-4 w-4 ml-2 rotate-180" />
            </Link>
          )}
        </div>

        <div className="border-l border-gray-300 pl-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex flex-col items-center justify-center text-xs lg:text-lg text-gray-500 hover:text-black transition-colors gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

      </div>
    </div>
  ) : null;
}