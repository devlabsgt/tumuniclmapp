'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Leaf, Settings, FileText } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog'; // ⬅️ importar función

export default function AdminDashboard() {
  const router = useRouter();
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const opcionesRef = useRef<HTMLDivElement>(null);

  const [rol, setRol] = useState('');
  const [permisos, setPermisos] = useState<string[]>([]);
  const [modulos, setModulos] = useState<string[]>([]);

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const res = await fetch('/api/getuser');
        const data = await res.json();
        setRol(data.rol || '');
        setPermisos(data.permisos || []);
        setModulos(data.modulos || []);
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

  const irAUsuarios = async () => {
    await registrarLog({
      accion: 'INGRESO_MODULO',
      descripcion: 'Accedió al módulo de usuarios',
      nombreModulo: 'USUARIOS',
    });
    router.push('/protected/admin/users');
  };

  const irAFertilizante = async () => {
    await registrarLog({
      accion: 'INGRESO_MODULO',
      descripcion: 'Accedió al módulo de fertilizante',
      nombreModulo: 'FERTILIZANTE',
    });
    router.push('/protected/fertilizante/beneficiarios');
  };

  return (
    <>
      <div className="w-full px-4 sm:px-6 py-4 bg-white border-b shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Button onClick={irAUsuarios} className="gap-2 text-xl">
            <Users size={20} />
            Ver Usuarios
          </Button>
        </div>

        {permisos.includes('CONFIGURACION') && (
          <div className="relative" ref={opcionesRef}>
            <Button
              onClick={() => setMostrarOpciones(!mostrarOpciones)}
              className="gap-2 text-xl"
            >
              <Settings size={24} />
              Configuraciones
            </Button>

            {mostrarOpciones && (
              <div className="absolute top-12 right-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="w-full text-xl justify-end gap-2 hover:underline"
                  onClick={() => router.push('/protected/admin/configs/roles')}
                >
                  <Users size={24} /> Roles
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xl justify-end gap-2 hover:underline"
                  onClick={() => router.push('/protected/admin/configs/modulos')}
                >
                  <Settings size={24} /> Módulos
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xl justify-end gap-2 hover:underline"
                  onClick={() => router.push('/protected/admin/logs')}
                >
                  <FileText size={24} /> Logs
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <section className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold">
            Dashboard de Administrador
          </h1>
        </div>

        <p className="text-center text-muted-foreground text-lg mb-10">
          Desde aquí podrá gestionar el sistema interno de la municipalidad.
        </p>

        {modulos.includes('FERTILIZANTE') && (
          <div
            onClick={irAFertilizante}
            className="cursor-pointer bg-white hover:shadow-lg transition-shadow border rounded-xl p-6 flex items-center gap-4 mb-16"
          >
            <Leaf size={36} className="text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Fertilizante</h2>
              <p className="text-gray-500">Gestionar beneficiarios y entregas.</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
