'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
    <section className="w-full max-w-5xl mx-auto py-8 px-4 md:px-8 relative">
      {/* Barra de acciones */}
      <div className="flex flex-wrap justify-center gap-4 mb-12 relative">
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

      <h1 className="text-4xl font-bold text-center text-foreground mb-8">
        Bienvenido al Dashboard de Usuario
      </h1>
      <p className="text-center text-muted-foreground text-lg mb-8">
        Desde aquí podrá gestionar su perfil de la municipalidad.
      </p>
    </section>
  );
}
