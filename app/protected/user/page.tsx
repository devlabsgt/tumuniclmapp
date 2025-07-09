'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
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

  const irAUsuario = async () => {
    await registrarLog({
      accion: 'INGRESO_MODULO',
      descripcion: 'Accedió a ver su perfil',
      nombreModulo: 'USUARIOS',
    });
    router.push('/protected/user/me');
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
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        {/* Botón Ver Usuarios */}
        <div className="w-full sm:w-auto">
          <Button onClick={irAUsuario} className="w-full sm:w-auto gap-2 text-xl">
            <Users size={20} />
            Ver mi perfil
          </Button>
        </div>
         <h1 className="text-2xl md:text-4xl font-bold">Dashboard de Usuario</h1>


      </motion.div>


      <section className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-8">

        <motion.p
          className="text-center text-muted-foreground text-lg mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: 0.1 }}
        >
          Desde aquí podrá gestionar el sistema interno de la municipalidad.
        </motion.p>

      {modulos.includes('FERTILIZANTE') && (
        <motion.div
          onClick={irAFertilizante}
          className="cursor-pointer bg-white hover:shadow-lg transition-shadow border rounded-xl p-6 flex justify-between items-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
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
