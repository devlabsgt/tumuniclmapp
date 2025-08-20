'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { FileText, MapPin, Calendar, Clock, Edit, CheckCircle, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Mapa from '@/components/asistencia/modal/Mapa';

// Tipos
interface Sesion {
  id: string;
  nombre: string;
  fecha: string;
  asistencia: boolean;
  ubicacion: { lat: number; lng: number } | null;
  temas: string[];
  acuerdos: string[];
  acta_url: string | null;
  created_at: string;
}

const fetchSesion = async (id: string) => {
  const res = await fetch('/api/concejo/verSesion', {
    method: 'POST',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!res.ok || !json?.sesion) {
    console.error('Respuesta del backend:', json);
    throw new Error(json.error || 'Error al obtener sesión');
  }
  return json.sesion;
};

export default function Ver() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);

  const { data: sesion, error, isLoading } = useSWR(
    id ? ['sesion', id] : null,
    () => fetchSesion(id!)
  );

  const handleVerMapa = () => {
    if (sesion?.ubicacion) {
      setModalMapaAbierto(true);
    }
  };

  if (!id) return <p className="text-center">No se proporcionó un ID de sesión.</p>;
  if (isLoading) return <p className="text-center py-10">Cargando sesión...</p>;
  if (error) {
    console.error(error);
    return <p className="text-center text-red-500">Error al cargar la sesión. Intente de nuevo.</p>;
  }
  if (!sesion) return <p className="text-center">No se encontró la sesión.</p>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 md:p-6 border rounded-xl shadow-lg bg-background text-foreground">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="w-full">
            <Button variant="outline" onClick={() => router.back()} className="text-blue-600">
              Volver
            </Button>
          </div>
          <div className="w-full md:w-auto text-center md:text-right mt-4 md:mt-0">
            <h1 className="text-xl md:text-3xl font-bold">{sesion.nombre}</h1>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="sesion-informe"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta de Fecha */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4">
                <Calendar className="h-8 w-8 md:h-10 md:w-10 text-blue-600"/>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Fecha de Sesión</p>
                  <h3 className="text-sm md:text-xl font-semibold text-gray-800">
                    {format(new Date(sesion.fecha), 'EEEE, d MMMM yyyy', { locale: es })}
                  </h3>
                </div>
              </div>

              {/* Tarjeta de Creado */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4">
                <Clock className="h-8 w-8 md:h-10 md:w-10 text-indigo-600"/>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Creado el</p>
                  <h3 className="text-sm md:text-xl font-semibold text-gray-800">
                    {format(new Date(sesion.created_at), 'd/MM/yyyy HH:mm', { locale: es })}
                  </h3>
                </div>
              </div>

              {/* Tarjeta de Asistencia */}
              <div className={`p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4 ${sesion.asistencia ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
                {sesion.asistencia ? (
                  <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-green-600"/>
                ) : (
                  <XCircle className="h-8 w-8 md:h-10 md:w-10 text-red-600"/>
                )}
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Estado de Asistencia</p>
                  <h3 className={`text-sm md:text-xl font-semibold ${sesion.asistencia ? 'text-green-800' : 'text-red-800'}`}>
                    {sesion.asistencia ? 'Completada' : 'No Completada'}
                  </h3>
                </div>
              </div>

              {/* Tarjeta de Ubicación */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl shadow-md flex flex-col justify-between items-start gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <MapPin className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Ubicación</p>
                    <h3 className="text-sm md:text-xl font-semibold text-gray-800">
                      {sesion.ubicacion ? 'Registrada' : 'No disponible'}
                    </h3>
                  </div>
                </div>
                {sesion.ubicacion && (
                  <Button variant="default" onClick={handleVerMapa} className="w-full text-sm md:text-lg">
                    Ver en Mapa
                  </Button>
                )}
              </div>

              {/* Tarjeta de Temas */}
              <div className="md:col-span-2 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 md:p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-2 md:gap-4 mb-4">
                  <Info className="h-8 w-8 md:h-10 md:w-10 text-yellow-600" />
                  <h3 className="text-sm md:text-xl font-semibold text-gray-800">Temas de la Sesión</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sesion.temas?.length > 0 ? (
                    sesion.temas.map((tema: string, index: number) => (
                      <span key={index} className="bg-yellow-200 text-yellow-800 text-xs md:text-sm px-3 py-1 rounded-sm border border-yellow-300">
                        {tema}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No se registraron temas.</p>
                  )}
                </div>
              </div>

              {/* Tarjeta de Acuerdos */}
              <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-2 md:gap-4 mb-4">
                  <Info className="h-8 w-8 md:h-10 md:w-10 text-orange-600" />
                  <h3 className="text-sm md:text-xl font-semibold text-gray-800">Acuerdos</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sesion.acuerdos?.length > 0 ? (
                    sesion.acuerdos.map((acuerdo: string, index: number) => (
                      <span key={index} className="bg-orange-200 text-orange-800 text-xs md:text-sm px-3 py-1 rounded-sm border border-orange-300">
                        {acuerdo}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No se registraron acuerdos.</p>
                  )}
                </div>
              </div>

              {/* Botón de Acta */}
              {sesion.acta_url && (
                <div className="md:col-span-2">
                  <Button onClick={() => window.open(sesion.acta_url!, '_blank')} className="w-full text-sm md:text-lg gap-2">
                    <FileText size={20} /> Ver Acta
                  </Button>
                </div>
              )}
              
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal para Mapa */}
      <AnimatePresence>
        {modalMapaAbierto && sesion?.ubicacion && (
          <Mapa
            isOpen={modalMapaAbierto}
            onClose={() => setModalMapaAbierto(false)}
            registro={{ ubicacion: sesion.ubicacion, created_at: sesion.created_at, tipo_registro: sesion.nombre }}
            nombreUsuario="Sesión de Concejo"
          />
        )}
      </AnimatePresence>
    </>
  );
}