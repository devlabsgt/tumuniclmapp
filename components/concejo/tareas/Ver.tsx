'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useUserData from '@/hooks/useUserData';
import { fetchTareasDeAgenda, Tarea, eliminarTarea } from './lib/acciones';
import TareaForm from './forms/Tarea'; // <-- Importación corregida
import { CalendarPlus, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Ver() {
  const router = useRouter();
  const params = useParams();
  const agendaId = params.id as string;
  const { rol, cargando: cargandoUsuario } = useUserData();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tareaAEditar, setTareaAEditar] = useState<Tarea | null>(null);

  const fetchTareas = async () => {
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
    fetchTareas();
  }, [agendaId]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    };
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isModalOpen]);

  const handleOpenNewModal = () => {
    setTareaAEditar(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tarea: Tarea) => {
    setTareaAEditar(tarea);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTareaAEditar(null);
  };

  const handleDeleteTarea = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      const exito = await eliminarTarea(id);
      if (exito) {
        await fetchTareas();
      }
    }
  };

  const handleGoToTarea = (tareaId: string) => {
    router.push(`/protected/concejo/${agendaId}/tareas/${tareaId}`);
  };

  if (cargandoUsuario || cargandoTareas) {
    return (
      <CargandoAnimacion texto="Cargando Tareas..." />
    );
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
        <BotonVolver ruta="/protected/concejo" />
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full">
          {tareas.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">Aún no hay tareas creadas para esta agenda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tareas.map(tarea => (
                <div
                  key={tarea.id}
                  className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500"
                >
                  <h2 className="text-xl font-semibold">{tarea.titulo_item}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Categoría: <span className="font-bold">{tarea.categoria?.nombre}</span>
                  </p>
                  <p className="text-sm mt-2">
                    Estado: <span className="font-bold text-blue-600">{tarea.estado}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteTarea(tarea.id)}
                        className="px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => handleOpenEditModal(tarea)}
                      className="px-3 py-2 text-sm text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button
                      onClick={() => handleGoToTarea(tarea.id)}
                      className="px-3 py-2 bg-blue-100 text-sm text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                    >
                      <ArrowRight className="h-4 w-4" /> Entrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <TareaForm
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={() => {
              fetchTareas();
              handleCloseModal();
            }}
            agendaConcejoId={agendaId}
            tareaAEditar={tareaAEditar}
          />
        )}
      </AnimatePresence>
    </div>
  );
}