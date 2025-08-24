'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, Fragment } from 'react';
import useUserData from '@/hooks/useUserData';
import { fetchTareasDeAgenda, Tarea, eliminarTarea } from './lib/acciones';
import TareaForm from './forms/Tarea';
import { CalendarPlus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import Swal from 'sweetalert2';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';


const statusStyles: Record<string, string> = {
  'Aprobado': 'bg-green-100 text-green-800',
  'No aprobado': 'bg-red-100 text-red-800',
  'En Progreso': 'bg-blue-100 text-blue-800',
  'En Comisión': 'bg-gray-500 text-white',
  'En Espera': 'bg-yellow-100 text-yellow-800',
  'No iniciado': 'bg-gray-200 text-gray-700',
  'Realizado': 'bg-indigo-100 text-indigo-800',
};

const getStatusClasses = (status: string) => statusStyles[status] || 'bg-gray-100 text-gray-800';

const calcularDiasRestantes = (fechaVencimiento: string | null): string => {
  if (!fechaVencimiento) return '-';
  const dias = differenceInDays(parseISO(fechaVencimiento), new Date());
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'Hoy';
  return `${dias + 1} días`;
};


export default function Ver() {
  const router = useRouter();
  const params = useParams();
  const agendaId = params.id as string;
  const { rol, cargando: cargandoUsuario } = useUserData();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [tareaAEditar, setTareaAEditar] = useState<Tarea | null>(null);
  const [selectedTaskForActions, setSelectedTaskForActions] = useState<Tarea | null>(null);


  const fetchTareas = async () => {
    setCargandoTareas(true);
    try {
      const data = await fetchTareasDeAgenda(agendaId);
      setTareas(data);
    } catch (e: any) {
      console.error('Error al cargar las tareas:', e);
      setError('Ocurrió un error al cargar las tareas.');
    } finally {
      setCargandoTareas(false);
    }
  };

  useEffect(() => {
    if (agendaId) {
      fetchTareas();
    }
  }, [agendaId]);

  useEffect(() => {
    const isAnyModalOpen = isFormModalOpen || !!selectedTaskForActions;
    if (isAnyModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isFormModalOpen, selectedTaskForActions]);

  const handleOpenNewModal = () => {
    setTareaAEditar(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (tarea: Tarea) => {
    setTareaAEditar(tarea);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setTareaAEditar(null);
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
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <BotonVolver ruta="/protected/concejo/agenda" />
        <div className="flex w-full sm:w-auto items-center justify-end gap-2">
          <Button
            onClick={handleOpenNewModal}
            className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <CalendarPlus size={20} />
            <span>Nueva Tarea</span>
          </Button>
        </div>
      </header>
      
      <div className="w-full overflow-x-auto">
        {tareas.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Aún no hay tareas creadas para esta agenda.</p>
          </div>
        ) : (
          <table className="min-w-full bg-white divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punto a Tratar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Restantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tareas.map((tarea, index) => (
                <tr key={tarea.id} onClick={() => setSelectedTaskForActions(tarea)} className="hover:bg-gray-100 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{tarea.titulo_item}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tarea.categoria?.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(tarea.estado)}`}>
                      {tarea.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tarea.fecha_vencimiento ? format(parseISO(tarea.fecha_vencimiento), 'd MMM, yyyy', { locale: es }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calcularDiasRestantes(tarea.fecha_vencimiento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {isFormModalOpen && (
          <TareaForm
            isOpen={isFormModalOpen}
            onClose={handleCloseFormModal}
            onSave={async () => {
              await fetchTareas();
              handleCloseFormModal();
            }}
            agendaConcejoId={agendaId}
            tareaAEditar={tareaAEditar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTaskForActions && (
          <Dialog open={!!selectedTaskForActions} onClose={() => setSelectedTaskForActions(null)} className="relative z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel as={motion.div} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <DialogTitle className="text-lg font-bold text-gray-800 flex justify-between items-center">
                  Acciones para la Tarea
                  <button onClick={() => setSelectedTaskForActions(null)}><X className="h-5 w-5 text-gray-400 hover:text-gray-700" /></button>
                </DialogTitle>
                <p className="mt-1 text-sm text-gray-600 truncate">"{selectedTaskForActions.titulo_item}"</p>
                <div className="mt-6 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      handleOpenEditModal(selectedTaskForActions);
                      setSelectedTaskForActions(null);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar Tarea
                  </Button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}