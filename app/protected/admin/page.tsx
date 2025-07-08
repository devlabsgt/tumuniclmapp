'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Settings, FileText } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
      <motion.div
        className="w-full flex flex-col sm:flex-row sm:justify-between gap-4 items-stretch sm:items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Botón Ver Usuarios */}
        <div className="w-full sm:w-auto">
          <Button onClick={irAUsuarios} className="w-full sm:w-auto gap-2 text-xl">
            <Users size={20} />
            Ver Usuarios
          </Button>
        </div>

        {/* Botón Configuraciones con menú */}
        {permisos.includes('CONFIGURACION') && (
          <div className="relative w-full sm:w-auto" ref={opcionesRef}>
            <Button
              onClick={() => setMostrarOpciones(!mostrarOpciones)}
              className="w-full sm:w-auto gap-2 text-xl"
            >
              <Settings size={24} />
              Configuraciones
            </Button>

            {mostrarOpciones && (
              <motion.div
                className="absolute top-12 right-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            )}
          </div>
        )}
      </motion.div>


      <section className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-8">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1 className="text-2xl md:text-4xl font-bold">Dashboard de Administrador</h1>
        </motion.div>

        <motion.p
          className="text-center text-muted-foreground text-lg mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Desde aquí podrá gestionar el sistema interno de la municipalidad.
        </motion.p>

      {modulos.includes('FERTILIZANTE') && (
        <motion.div
          onClick={irAFertilizante}
          className="cursor-pointer bg-white hover:shadow-lg transition-shadow border rounded-xl p-6 flex justify-between items-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-[#06c]">Fertilizante</h2>
            <p className="text-lg text-gray-600">Gestionar beneficiarios, entregas y estadísticas.</p>
          </div>
          <Image
            src="/svg/fertilizante.svg"
            alt="Ícono Fertilizante"
            width={250}
            height={250}
            className="shrink-0"
          />
        </motion.div>
      )}

      </section>
    </>
  );
}
