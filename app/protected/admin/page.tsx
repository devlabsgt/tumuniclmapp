'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const opcionesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cerrar si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (opcionesRef.current && !opcionesRef.current.contains(event.target as Node)) {
        setMostrarOpciones(false);
      }
    }

    if (mostrarOpciones) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarOpciones]);

  return (
    <section className="w-full max-w-5xl mx-auto pt-12 px-4 md:px-8 relative">
      {/* Botón Volver */}
      <div className="relative mb-6">
        <Button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded text-xl px-4"
        >
          Volver
        </Button>
        <h1 className="text-4xl font-bold text-center">Dashboard de Administrador</h1>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <div className="relative" ref={opcionesRef}>
          <Link href="/protected/admin/users">
            <Button>Ver Usuarios</Button>
          </Link>
          {mostrarOpciones && (
            <div className="absolute top-12 left-0 z-10 w-48 bg-white dark:bg-gray-900 shadow-lg rounded border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2">
              <Link href="/protected/admin/sign-up">
                <Button variant="ghost" className="w-full justify-start">
                  Crear Usuario
                </Button>
              </Link>
              <Link href="/protected/admin/users">
                <Button variant="ghost" className="w-full justify-start">
                  Ver Usuarios
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Otros botones */}
        <Link href="/protected/fertilizante/beneficiarios">
          <Button variant="outline" className="w-full justify-start">
            Entrega de Fertilizante
          </Button>
        </Link>
        <Button variant="outline">Reportes</Button>
        <Button variant="outline">Configuraciones</Button>
      </div>

      <p className="text-center text-muted-foreground text-lg mb-8">
        Desde aquí podrá gestionar el sistema interno de la municipalidad.
      </p>
    </section>
  );
}
