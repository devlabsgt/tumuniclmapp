'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useUserData from '@/hooks/sesion/useUserData';
import { fetchTareasDeAgenda, fetchAgendaConcejoPorId, actualizarEstadoAgenda } from '../lib/acciones';
import { Tarea, AgendaConcejo, AgendaFormData } from '../lib/esquemas';
import TareaForm from './forms/tareas/Tarea';
import NotaSeguimiento from './forms/NotaSeguimiento';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatePresence, motion } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import Tabla from './Tabla';
import { format, differenceInDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

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
export default function VerTareas() {
  const params = useParams();
  const agendaId = params.id as string;
  const { rol, cargando: cargandoUsuario } = useUserData();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [agenda, setAgenda] = useState<AgendaConcejo | null>(null);
  const [filtrosActivos, setFiltrosActivos] = useState<string[]>([]);

  const [isNotaSeguimientoModalOpen, setIsNotaSeguimientoModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'notas' | 'seguimiento' | null>(null);

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

  const isAgendaFinalizada = agenda?.estado === 'Finalizada';

  // 💡 Se actualizó la función para verificar si la agenda está finalizada antes de abrir el modal
  const handleOpenEditModal = (tarea: Tarea) => {
    if (!isAgendaFinalizada) {
      setTareaSeleccionada(tarea);
      setIsFormModalOpen(true);
    } else {
      toast.info('No se pueden editar puntos de una agenda finalizada.');
    }
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setTareaSeleccionada(null);
  };

  const handleOpenNotasModal = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setModalType('notas');
    setIsNotaSeguimientoModalOpen(true);
  };

  const handleOpenSeguimientoModal = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setModalType('seguimiento');
    setIsNotaSeguimientoModalOpen(true);
  };

  const handleCloseNotaSeguimientoModal = (hasChanged: boolean) => {
    setIsNotaSeguimientoModalOpen(false);
    setTareaSeleccionada(null);
    setModalType(null);
    if (hasChanged) {
      fetchDatos();
    }
  };

  const handleActualizarEstadoAgenda = async () => {
    if (!agenda) return;

    let nuevoEstado = '';
    let mensaje = '';

    if (agenda.estado === 'En preparación') {
      nuevoEstado = 'En progreso';
      mensaje = '¿Está todo listo para aperturar la sesión?';
    } else if (agenda.estado === 'En progreso') {
      nuevoEstado = 'Finalizada';
      mensaje = '¿Está seguro de que deseas cerrar la sesión? ya no podrás agregar o editar puntos de la agenda.';
    } else {
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Confirmar',
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
    });

    if (isConfirmed) {
      try {
        await actualizarEstadoAgenda(agenda.id, nuevoEstado);
        fetchDatos();
      } catch (error) {
        toast.error('Error al actualizar el estado de la agenda.');
        console.error('Error al actualizar el estado de la agenda:', error);
      }
    }
  };

  const resumenDeEstados = calcularResumenDeEstados(tareas);

  const estadoOrden = ['En progreso', 'En espera', 'No aprobado', 'Aprobado', 'En comisión', 'No iniciado', 'Realizado'];

  const getEstadoAgendaStyle = (estado: string) => {
    if (estado === 'En preparación') {
      return 'bg-green-500 text-white hover:bg-green-600';
    } else if (estado === 'En progreso') {
      return 'bg-blue-500 text-white hover:bg-blue-600';
    } else if (estado === 'Finalizada') {
      return 'bg-gray-300 text-gray-700 cursor-not-allowed';
    }
    return '';
  };
  
  const getEstadoAgendaText = (estado: string) => {
    if (estado === 'En preparación') {
        return 'Se apertura la sesión';
    } else if (estado === 'En progreso') {
        return 'Se cierra la sesión';
    }
    return estado;
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
    return <CargandoAnimacion texto="Cargando agenda..." />;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <BotonVolver ruta="/protected/concejo/agenda" />
        {agenda && (
          <div className="flex-grow flex flex-col items-center text-center">
            <h1 className="text-xl font-bold text-gray-800"> Agenda del Concejo Municipal </h1>
            <h2 className={`text-lg font-bold text-gray-600`}>
              {agenda.titulo}
            </h2>
            <p className="text-sm text-gray-500">
              {`${format(new Date(agenda.fecha_reunion), 'PPPP', { locale: es })} • ${agenda.descripcion}`}
            </p>
          </div>
        )}
        {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {agenda && (
              <Button
                onClick={handleActualizarEstadoAgenda}
                disabled={isAgendaFinalizada}
                className={`px-5 py-6 rounded-lg shadow-sm transition-colors flex items-center space-x-2 ${getEstadoAgendaStyle(agenda.estado)}`}
              >
                <span>
                  {getEstadoAgendaText(agenda.estado)}
                </span>
              </Button>
            )}
            {!isAgendaFinalizada && (
              <Button
                onClick={() => {
                  setTareaSeleccionada(null);
                  setIsFormModalOpen(true);
                }}
                className={`px-5 py-6 rounded-lg shadow-sm transition-colors flex items-center space-x-2 bg-purple-500 text-white hover:bg-purple-600`}
              >
                <CalendarPlus size={20} />
                <span>Nuevo Punto <br /> a tratar</span>
              </Button>
              
            )}
          </div>
        )}
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
        estadoAgenda={agenda?.estado || ''}
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
     {isNotaSeguimientoModalOpen && tareaSeleccionada && modalType && (
        <NotaSeguimiento
          isOpen={isNotaSeguimientoModalOpen}
          onClose={handleCloseNotaSeguimientoModal}
          tarea={tareaSeleccionada}
          estadoAgenda={agenda?.estado || ''}
          tipo={modalType}
        />
      )}
      </AnimatePresence>
    </div>
  );
}