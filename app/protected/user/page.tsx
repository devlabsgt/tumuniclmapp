'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, BookOpen, Leaf, User } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog';
import { motion } from 'framer-motion';
import useUserData from '@/hooks/useUserData';

// --- Definición de Módulos ---
const TODOS_LOS_MODULOS = [
  {
    nombre: 'EDUCACION',
    titulo: 'Educación',
    descripcion: 'Administre programas, niveles, maestros y alumnos.',
    ruta: '/protected/educacion',
    icono: <BookOpen className="h-8 w-8 text-blue-500" />,
  },
  {
    nombre: 'FERTILIZANTE',
    titulo: 'Fertilizante',
    descripcion: 'Gestione beneficiarios, entregas y estadísticas.',
    ruta: '/protected/fertilizante/beneficiarios',
    icono: <Leaf className="h-8 w-8 text-teal-500" />,
  },
];

export default function UserDashboard() {
  const router = useRouter();
  const { modulos } = useUserData();
  const [busqueda, setBusqueda] = useState('');

  const irA = async (nombreModulo: string, ruta: string) => {
    await registrarLog({
      accion: 'INGRESO_MODULO',
      descripcion: `Accedió al módulo de ${nombreModulo.toLowerCase()}`,
      nombreModulo: nombreModulo,
    });
    router.push(ruta);
  };

  const irAMiPerfil = () => {
    router.push('/protected/user/me');
  };

  const modulosDisponibles = useMemo(() => {
    return TODOS_LOS_MODULOS
      .filter(modulo => modulos.includes(modulo.nombre))
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [modulos]);

  const modulosFiltrados = modulosDisponibles.filter(modulo =>
    modulo.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    modulo.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-8">
        {/* --- BOTÓN DE PERFIL --- */}
        <motion.div
          className="w-full flex justify-end mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button onClick={irAMiPerfil} className="gap-2">
            <User size={20} />
            Mi Perfil
          </Button>
        </motion.div>

        {/* --- TÍTULO Y BUSCADOR --- */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard Principal</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Seleccione un módulo para comenzar.
          </p>
        </motion.div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Input
            type="text"
            placeholder="Buscar módulo..."
            className="w-full max-w-lg mx-auto text-lg p-6"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </motion.div>

        {/* --- LISTA DE MÓDULOS --- */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {modulosFiltrados.map((modulo, index) => (
            <motion.div
              key={modulo.nombre}
              className="bg-white border rounded-xl p-6 flex flex-col justify-between h-full hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <div>
                <div className="flex items-center gap-4 mb-3">
                  {modulo.icono}
                  <h2 className="text-xl font-bold text-gray-800">{modulo.titulo}</h2>
                </div>
                <p className="text-gray-600 mb-6">{modulo.descripcion}</p>
              </div>
              <Button onClick={() => irA(modulo.nombre, modulo.ruta)} className="w-full mt-auto">
                Entrar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  );
}