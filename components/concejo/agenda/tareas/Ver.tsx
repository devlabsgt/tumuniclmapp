'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useUserData from '@/hooks/useUserData';
import { fetchTareasDeAgenda, Tarea, fetchAgendaConcejoPorId, AgendaConcejo } from '../lib/acciones';
import TareaForm from './forms/Tarea';
import Notas from './forms/Notas';
import Seguimiento from './forms/Seguimiento';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import Tabla from './Tabla';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusStyles: Record<string, string> = {
  'Aprobado': 'bg-green-200 text-green-800',
  'No aprobado': 'bg-red-200 text-red-800',
  'En progreso': 'bg-blue-200 text-blue-800',
  'En comisión': 'bg-gray-300 text-gray-700',
  'En espera': 'bg-yellow-200 text-yellow-800',
  'No iniciado': 'bg-gray-200 text-gray-700',
  'Realizado': 'bg-indigo-200 text-indigo-800',
};

const getStatusClasses = (status: string) => statusStyles[status] || 'bg-gray-200 text-gray-700';

const calcularResumenDeEstados = (tareas: Tarea[]) => {
  const resumen: Record<string, number> = {};
  tareas.forEach(tarea => {
    const estado = tarea.estado;
    resumen[estado] = (resumen[estado] || 0) + 1;
  });
  return resumen;
};

export default function Ver() {
  const params = useParams();
  const agendaId = params.id as string;
  const { rol, cargando: cargandoUsuario } = useUserData();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isNotasModalOpen, setIsNotasModalOpen] = useState(false);
  const [isSeguimientoModalOpen, setIsSeguimientoModalOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [agenda, setAgenda] = useState<AgendaConcejo | null>(null);
  const [filtrosActivos, setFiltrosActivos] = useState<string[]>([]);

  const fetchDatos = async () => {
    setCargandoTareas(true);
    try {
      const [dataTareas, dataAgenda] = await Promise.all([
        fetchTareasDeAgenda(agendaId),
        fetchAgendaConcejoPorId(agendaId)
      ]);
      setTareas(dataTareas);
      setAgenda(dataAgenda);
    } catch (e: any) {
      console.error('Error al cargar los datos:', e);
      setError('Ocurrió un error al cargar los datos.');
    } finally {
      setCargandoTareas(false);
    }
  };

  useEffect(() => {
    if (agendaId) {
      fetchDatos();
    }
  }, [agendaId]);

  const handleOpenEditModal = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setTareaSeleccionada(null);
  };

  const handleOpenNotasModal = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setIsNotasModalOpen(true);
  };

  const handleCloseNotasModal = (hasChanged: boolean) => {
    setIsNotasModalOpen(false);
    setTareaSeleccionada(null);
    if (hasChanged) {
      fetchDatos();
    }
  };

  const handleOpenSeguimientoModal = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setIsSeguimientoModalOpen(true);
  };

  const handleCloseSeguimientoModal = (hasChanged: boolean) => {
    setIsSeguimientoModalOpen(false);
    setTareaSeleccionada(null);
    if (hasChanged) {
      fetchDatos();
    }
  };

  const resumenDeEstados = calcularResumenDeEstados(tareas);

  const estadoOrden = ['En progreso', 'En espera', 'No aprobado', 'Aprobado', 'En comisión', 'No iniciado', 'Realizado'];

  const getTipoSesionStyle = (estado: string) => {
    if (estado === 'Ordinaria') return 'text-green-600';
    if (estado === 'Extraordinaria') return 'text-orange-600';
    return 'text-gray-600';
  };

  const toggleFiltro = (estado: string) => {
    setFiltrosActivos(prevFiltros =>
      prevFiltros.includes(estado)
        ? prevFiltros.filter(f => f !== estado)
        : [...prevFiltros, estado]
    );
  };

  const tareasFiltradas = filtrosActivos.length > 0
    ? tareas.filter(tarea => filtrosActivos.includes(tarea.estado))
    : tareas;

  const getFiltroStyle = (estado: string) => {
    const classes = getStatusClasses(estado);
    const activeClass = filtrosActivos.includes(estado) ? 'border-t-4 border-blue-500' : '';

    let colorComision = '';
    if (estado === 'En comisión' && filtrosActivos.includes(estado)) {
      colorComision = 'border-t-4 border-slate-300';
    }

    return `${classes} ${activeClass} ${colorComision} cursor-pointer hover:opacity-80 transition-opacity`;
  };

  const handleClearFilters = () => {
    setFiltrosActivos([]);
  };

  if (cargandoUsuario || cargandoTareas) {
    return <CargandoAnimacion texto="Cargando Tareas..." />;
  };

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error}</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <BotonVolver ruta="/protected/concejo/agenda" />
        {agenda && (
          <div className="flex-grow flex flex-col items-center text-center">
            <h1 className="text-xl font-bold text-gray-800">Agenda del Concejo Municipal</h1>
            <h2 className={`text-lg font-bold ${getTipoSesionStyle(agenda.estado)}`}>
              {agenda.titulo}
            </h2>
            <p className="text-sm text-gray-500">
              {`${format(new Date(agenda.fecha_reunion), 'PPPP', { locale: es })} • ${agenda.descripcion}`}
            </p>
          </div>
        )}
        <Button
          onClick={() => {
            setTareaSeleccionada(null);
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <CalendarPlus size={20} />
          <span>Nueva Tarea</span>
        </Button>
      </header>

      <div className="mb-4 grid grid-cols-3 gap-2 md:flex md:flex-wrap md:justify-start">
        {estadoOrden.map(estado => (
          <motion.button
            key={estado}
            onClick={() => toggleFiltro(estado)}
            className={`px-3 py-2 rounded-md shadow-sm text-center ${getStatusClasses(estado)} text-xs md:text-xs ${filtrosActivos.includes(estado) ? 'border-t-4 border-blue-500' : ''}`}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="font-semibold">{estado}:</span>
            <span className="text-sm font-bold ml-1">{resumenDeEstados[estado] || 0}</span>
          </motion.button>
        ))}
        <AnimatePresence>
          {filtrosActivos.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-md shadow-sm text-center bg-gray-400 text-white text-xs md:text-xs"
            >
              Quitar filtros
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <Tabla
        tareas={tareasFiltradas}
        handleOpenEditModal={handleOpenEditModal}
        handleOpenNotasModal={handleOpenNotasModal}
        handleOpenSeguimientoModal={handleOpenSeguimientoModal}
      />

      <AnimatePresence>
        {isFormModalOpen && (
          <TareaForm
            isOpen={isFormModalOpen}
            onClose={handleCloseFormModal}
            onSave={async () => {
              await fetchDatos();
              handleCloseFormModal();
            }}
            agendaConcejoId={agendaId}
            tareaAEditar={tareaSeleccionada}
          />
        )}
        {isNotasModalOpen && tareaSeleccionada && (
          <Notas
            isOpen={isNotasModalOpen}
            onClose={handleCloseNotasModal}
            tarea={tareaSeleccionada}
          />
        )}
        {isSeguimientoModalOpen && tareaSeleccionada && (
          <Seguimiento
            isOpen={isSeguimientoModalOpen}
            onClose={handleCloseSeguimientoModal}
            tarea={tareaSeleccionada}
          />
        )}
      </AnimatePresence>
    </div>
  );
}