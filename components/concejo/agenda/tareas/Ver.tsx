'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import useUserData from '@/hooks/sesion/useUserData';
import { fetchTareasDeAgenda, fetchAgendaConcejoPorId, actualizarEstadoAgenda } from '../lib/acciones';
import { Tarea, AgendaConcejo } from '../lib/esquemas';
import TareaForm from './forms/tareas/Tarea';
import NotaSeguimiento from './forms/NotaSeguimiento';
import { CalendarPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import Tabla from './Tabla';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

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
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchDatos = async () => {
    if (!agendaId) return;
    setCargandoTareas(true);
    try {
      const [dataTareas, dataAgenda] = await Promise.all([
        fetchTareasDeAgenda(agendaId),
        fetchAgendaConcejoPorId(agendaId)
      ]);
      setTareas(dataTareas);
      setAgenda(dataAgenda);
    } catch (e: any) {
      setError('Ocurrió un error al cargar los datos.');
    } finally {
      setCargandoTareas(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [agendaId]);


  const generatePdf = async () => {
      setIsPrinting(true);
      const element = printRef.current;
      const isMobile = window.innerWidth < 768;

      if (!element) {
          toast.error('No se pudo encontrar el elemento para imprimir.');
          setIsPrinting(false);
          return;
      }

      try {
          const dataUrl = await htmlToImage.toJpeg(element, {
              quality: 0.7,
              backgroundColor: '#ffffff'
          });

          const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'in',
              format: [8.5, 13]
          });

          const margin = { top: 0.5, right: 0.5, bottom: 0.2, left: 0.5 };
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const usableWidth = pdfWidth - margin.left - margin.right;
          const usableHeight = pdfHeight - margin.top - margin.bottom;

          const img = new Image();
          img.src = dataUrl;

          img.onload = () => {
              const imgWidth = img.width;
              const imgHeight = img.height;
              
              let newWidth = imgWidth;
              let newHeight = imgHeight;

              // Escalar la imagen para que se ajuste a una sola página
              const widthRatio = usableWidth / imgWidth;
              const heightRatio = usableHeight / imgHeight;
              const scale = Math.min(widthRatio, heightRatio);

              newWidth = imgWidth * scale;
              newHeight = imgHeight * scale;

              pdf.addImage(img, 'JPEG', (pdfWidth - newWidth) / 2, margin.top, newWidth, newHeight);

              if (isMobile) {
                  const filename = `agenda-${format(new Date(), 'yyyyMMdd')}.pdf`;
                  pdf.save(filename);
                  toast.success('PDF descargado.');
              } else {
                  const blobUrl = pdf.output('bloburl');
                  window.open(blobUrl, '_blank');
                  toast.success('PDF abierto en una nueva pestaña.');
              }
              
              setIsPrinting(false);
          };
      } catch (err) {
          toast.error('Hubo un error al generar el PDF.');
          console.error(err);
          setIsPrinting(false);
      }
  };


  useEffect(() => {
    if (isPrinting) {
      setTimeout(generatePdf, 300);
    }
  }, [isPrinting]);

  const handleGeneratePdf = () => {
    setIsPrinting(true);
  };

  const isAgendaFinalizada = agenda?.estado === 'Finalizada';

  const handleOpenEditModal = (tarea: Tarea) => {
    if (isAgendaFinalizada) {
      toast.info('No se pueden editar puntos de una agenda finalizada.');
    } else {
      setTareaSeleccionada(tarea);
      setIsFormModalOpen(true);
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
    if (hasChanged) fetchDatos();
  };

  const handleActualizarEstadoAgenda = async () => {
    if (!agenda || isAgendaFinalizada) return;

    let nuevoEstado = '';
    let mensaje = '';

    if (agenda.estado === 'En preparación') {
      nuevoEstado = 'En progreso';
      mensaje = '¿Está todo listo para aperturar la sesión?';
    } else if (agenda.estado === 'En progreso') {
      nuevoEstado = 'Finalizada';
      mensaje = '¿Está seguro de que deseas cerrar la sesión? ya no podrás agregar o editar puntos de la agenda.';
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Confirmar', text: mensaje, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Continuar', cancelButtonText: 'Cancelar',
    });

    if (isConfirmed) {
      try {
        await actualizarEstadoAgenda(agenda.id, nuevoEstado);
        fetchDatos();
      } catch (error) {
        toast.error('Error al actualizar el estado de la agenda.');
      }
    }
  };

  const resumenDeEstados = calcularResumenDeEstados(tareas);
  const estadoOrden = ['En progreso', 'En espera', 'No aprobado', 'Aprobado', 'En comisión', 'No iniciado', 'Realizado'];

  const getEstadoAgendaStyle = (estado: string) => {
    if (estado === 'En preparación') return 'bg-green-500 text-white hover:bg-green-600';
    if (estado === 'En progreso') return 'bg-blue-500 text-white hover:bg-blue-600';
    if (estado === 'Finalizada') return 'bg-gray-400 text-gray-800 cursor-not-allowed';
    return '';
  };

  const getEstadoAgendaText = (estado: string) => {
    if (estado === 'En preparación') return 'Se apertura la sesión';
    if (estado === 'En progreso') return 'Se cierra la sesión';
    if (estado === 'Finalizada') return 'Sesión Finalizada';
    return estado;
  };

  const toggleFiltro = (estado: string) => {
    setFiltrosActivos(prev => prev.includes(estado) ? prev.filter(f => f !== estado) : [...prev, estado]);
  };

  const tareasFiltradas = filtrosActivos.length > 0 ? tareas.filter(tarea => filtrosActivos.includes(tarea.estado)) : tareas;

  if (cargandoUsuario || cargandoTareas) {
    return <CargandoAnimacion texto="Cargando agenda..." />;
  }
  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div ref={printRef}>
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {!isPrinting && (
            <div>
              <BotonVolver ruta="/protected/concejo/agenda" />
            </div>
          )}
          
          {agenda && (
            <div className="flex-grow flex items-start text-left">
              <div className="w-3/5 flex flex-col gap-1">
                <h1 className="text-lg font-bold text-black">
                  <span className="text-gray-500">Agenda del Concejo Municipal:</span> {agenda.titulo}
                </h1>
                <p className="text-lg font-bold text-black">
                  <span className="text-gray-500">Información:</span> {agenda.descripcion}
                </p>
              </div>
              <div className="w-2/5 flex flex-col items-start gap-1">
                <p className="text-lg font-bold text-black">
                  <span className="text-gray-500">Fecha:</span> <span>{format(new Date(agenda.fecha_reunion), 'PPPP', { locale: es })}</span>
                </p>
                <p className="text-lg font-bold text-black">
                  <span className="text-gray-500">Hora:</span> {format(new Date(agenda.fecha_reunion), 'h:mm a', { locale: es })}
                </p>
              </div>
            </div>
          )}
          
          <div className={`flex items-center gap-2 flex-wrap justify-end`}>
            {(rol === 'SUPER' || rol === 'SECRETARIO') && agenda && (
              <>
                <Button onClick={handleActualizarEstadoAgenda} disabled={isAgendaFinalizada} className={`px-5 py-6 rounded-lg shadow-sm transition-colors flex items-center space-x-2 ${getEstadoAgendaStyle(agenda.estado)}`}>
                  <span>{getEstadoAgendaText(agenda.estado)}</span>
                </Button>

                {!isPrinting && (
                  <>
                    {isAgendaFinalizada && (
                      <Button onClick={handleGeneratePdf} disabled={isPrinting} className="px-5 py-6 rounded-lg shadow-sm transition-colors flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700">
                        <FileText size={20} />
                        <span>{isPrinting ? 'Generando...' : 'Generar PDF'}</span>
                      </Button>
                    )}

                    {!isAgendaFinalizada && (
                      <Button onClick={() => { setTareaSeleccionada(null); setIsFormModalOpen(true); }} className="px-5 py-6 rounded-lg shadow-sm transition-colors flex items-center space-x-2 bg-purple-500 text-white hover:bg-purple-600">
                        <CalendarPlus size={20} />
                        <span>Nuevo Punto <br /> a tratar</span>
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </header>

        <div className="mb-4 grid grid-cols-3 gap-2 md:flex md:flex-wrap md:justify-start">
          {estadoOrden.map(estado => (
            <motion.button key={estado} onClick={() => toggleFiltro(estado)} className={`px-3 py-2 rounded-md shadow-sm text-center ${getStatusClasses(estado)} text-xs md:text-xs ${filtrosActivos.includes(estado) ? 'border-t-4 border-blue-500' : ''}`} whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}>
              <span className="font-semibold">{estado}:</span>
              <span className="text-sm font-bold ml-1">{resumenDeEstados[estado] || 0}</span>
            </motion.button>
          ))}
          <AnimatePresence>
            {filtrosActivos.length > 0 && (
              <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onClick={() => setFiltrosActivos([])} className="px-3 py-2 rounded-md shadow-sm text-center bg-gray-400 text-white text-xs md:text-xs">
                Quitar filtros
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <Tabla tareas={tareasFiltradas} handleOpenEditModal={handleOpenEditModal} handleOpenNotasModal={handleOpenNotasModal} handleOpenSeguimientoModal={handleOpenSeguimientoModal} estadoAgenda={agenda?.estado || ''} />
      </div>

      <AnimatePresence>
        {isFormModalOpen && (
          <TareaForm isOpen={isFormModalOpen} onClose={handleCloseFormModal} onSave={async () => { await fetchDatos(); handleCloseFormModal(); }} agendaConcejoId={agendaId} tareaAEditar={tareaSeleccionada} />
        )}
        {isNotaSeguimientoModalOpen && tareaSeleccionada && modalType && (
          <NotaSeguimiento isOpen={isNotaSeguimientoModalOpen} onClose={handleCloseNotaSeguimientoModal} tarea={tareaSeleccionada} estadoAgenda={agenda?.estado || ''} tipo={modalType} />
        )}
      </AnimatePresence>
    </div>
  );
}