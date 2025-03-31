'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const opcionesRef = useRef<HTMLDivElement>(null);

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
    <section className="w-full max-w-5xl mx-auto py-8 px-4 md:px-8 relative">
      {/* Barra de acciones */}
      <div className="flex flex-wrap justify-center gap-4 mb-12 relative">
        <div className="relative" ref={opcionesRef}>
          <Button onClick={() => setMostrarOpciones(!mostrarOpciones)}>
            Mi Perfil
          </Button>
          {mostrarOpciones && (
            <div className="absolute top-12 left-0 z-10 w-48 bg-white dark:bg-gray-900 shadow-lg rounded border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2">
              <Link href="sign-up">
                <Button variant="ghost" className="w-full justify-start">
                  Ver Mis datos de usuario
                </Button>
              </Link>
              <Link href="users">
                <Button variant="ghost" className="w-full justify-start">
                  Ver mis datos de empleado
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Otros botones de ejemplo */}
        <Button variant="outline">Mi equipo</Button>
        <Button variant="outline">Mis Proyectos</Button>
        <Button variant="outline">Configuración</Button>
      </div>
      <h1 className="text-4xl font-bold text-center text-foreground mb-8">
        Bienvenido al Dashboard de Usuario
      </h1>
      <p className="text-center text-muted-foreground text-lg mb-8">
        Desde aquí podrá gestionar su perfil de la municipalidad.
      </p>

    </section>
  );
}
