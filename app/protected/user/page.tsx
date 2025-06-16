'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Leaf, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const opcionesRef = useRef<HTMLDivElement>(null);

  const [rol, setRol] = useState('');
  const [permisos, setPermisos] = useState<string[]>([]);
  const [modulos, setModulos] = useState<string[]>([]); // ← nuevo estado

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const res = await fetch('/api/getuser');
        const data = await res.json();
        console.log('ROL:', data.rol);
        console.log('PERMISOS:', data.permisos);
        console.log('MODULOS:', data.modulos);
        setRol(data.rol || '');
        setPermisos(data.permisos || []);
        setModulos(data.modulos || []); // ← asignamos modulos
      } catch (err) {
        console.error('Error al obtener datos del usuario:', err);
      }
    };

    obtenerUsuario();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (opcionesRef.current && !opcionesRef.current.contains(event.target as Node)) {
        setMostrarOpciones(false);
      }
    }

    if (mostrarOpciones) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarOpciones]);

  return (
    <>
      {/* Contenido principal */}
      <section className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-8">

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold">
            Bienvenido al sistema interno de gestión municipal
          </h1>
        </div>

        <p className="text-center border-b pb-10 text-muted-foreground text-lg mb-10">
          Seleccione un módulo para comenzar a gestionar los recursos y servicios disponibles.
        </p>

        {/* ✅ Solo mostrar si el módulo está permitido */}
        {modulos.includes('FERTILIZANTE') && (
          <div
            onClick={() => router.push('/protected/fertilizante/beneficiarios')}
            className="cursor-pointer bg-white hover:shadow-lg transition-shadow border rounded-xl p-6 flex items-center gap-4 mb-16"
          >
            <Leaf size={36} className="text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Fertilizante</h2>
              <p className="text-gray-500">Gestionar beneficiarios y entregas de fertilizante.</p>
            </div>
          </div>
        )}
      </section>
    </>
  );

}
