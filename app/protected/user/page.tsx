'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const opcionesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ✅ Obtener usuario al cargar
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  // ✅ Cerrar si se hace clic fuera
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
      {/* Botón Volver + Título alineado */}
      <div className="relative mb-8">
        <Button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded text-xl px-4"
        >
          Volver
        </Button>
        <h1 className="text-4xl font-bold text-center">Dashboard de Usuario</h1>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <div className="relative" ref={opcionesRef}>
          <Button
            onClick={() => {
              if (userId) {
                router.push(`/protected/user/me?id=${userId}`);
              }
            }}
            disabled={!userId}
          >
            Mi Perfil
          </Button>
        </div>
      </div>

      <p className="text-center text-muted-foreground text-lg mb-8">
        Desde aquí podrá gestionar su perfil de la municipalidad.
      </p>
    </section>
  );
}
