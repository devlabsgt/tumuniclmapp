'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import useUserData from '@/hooks/sesion/useUserData';
import { fetchTareasDeAgenda, fetchAgendaConcejoPorId, actualizarEstadoAgenda, obtenerPuestoUsuario } from '@/components/concejo/agenda/lib/acciones';
import { Tarea, AgendaConcejo } from '@/components/concejo/agenda/lib/esquemas';
import TareaForm from './forms/tareas/Tarea';
import NotaSeguimiento from './forms/NotaSeguimiento';
import AsistenciaAgenda from '@/components/concejo/AsistenciaAgenda';
import { CalendarPlus, FileText, Info } from 'lucide-react';
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
  const { rol, userId, nombre, cargando: cargandoUsuario } = useUserData();

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
  const [nombrePuesto, setNombrePuesto] = useState<string>(''); 
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

  useEffect(() => {
    const getPuesto = async () => {
      if (userId) {
        const nombrePuesto = await obtenerPuestoUsuario(userId);
        setNombrePuesto(nombrePuesto);
      }
    };
    getPuesto();
  }, [userId]);

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

          const margin = { top: 0.7, right: 0.5, bottom: 0.2, left: 0.5 };
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
    if (rol === 'INVITADO') {
      toast.info('No tiene permisos para editar.');
      return;
    }
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
    return <div className="text-xs lg:text-base"><CargandoAnimacion texto="Cargando agenda..." /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500 text-xs lg:text-base">{error}</div>;
  }

  return (
    <div className="px-2 mt-2 md:px-8 text-xs lg:text-base">
      <div ref={printRef}>
        {agenda && agenda.estado === 'En progreso' && userId && (
            <div className="mb-6">
                <AsistenciaAgenda 
                    agenda={agenda} 
                    userId={userId} 
                    nombreUsuario={nombre || 'Usuario'} 
                    puesto={nombrePuesto}
                />
            </div>
        )}

        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 mx-auto w-full">
          {!isPrinting && (
            <div>
              <BotonVolver ruta="/protected/concejo/agenda" />
            </div>
          )}
          
          {agenda && (
            <div className="flex-grow flex items-start text-left w-full">
              <div className="w-3/5 flex flex-col gap-2 pr-2">
                <h1 className="text-xs lg:text-lg font-bold text-black">
                  <span className="text-blue-400 block md:inline md:mr-1">
                    Agenda del Concejo Municipal:
                  </span> 
                  {agenda.titulo}
                </h1>
                <p className="text-xs lg:text-lg font-bold text-black">
                  <span className="text-blue-400 block md:inline md:mr-1">
                    Información:
                  </span> 
                  {agenda.descripcion}
                </p>
              </div>
              
              <div className="w-2/5 flex flex-col items-start gap-2 pl-1">
                <p className="text-xs lg:text-lg font-bold text-black">
                  <span className="text-blue-400 block md:inline md:mr-1">
                    Fecha:
                  </span> 
                  <span className="md:hidden capitalize">
                    {format(new Date(agenda.fecha_reunion), "EEE d 'de' MMM, yyyy", { locale: es })}
                  </span>
                  <span className="hidden md:inline">
                    {format(new Date(agenda.fecha_reunion), 'PPPP', { locale: es })}
                  </span>
                </p>
                <p className="text-xs lg:text-lg font-bold text-black">
                  <span className="text-blue-400 block md:inline md:mr-1">
                    Hora:
                  </span> 
                  {format(new Date(agenda.fecha_reunion), 'h:mm a', { locale: es })}
                </p>
              </div>
            </div>
          )}
          
          <div className={`flex items-center gap-2 flex-wrap justify-end w-full md:w-auto mt-2 md:mt-0`}>
            {(rol === 'SUPER' || rol === 'SECRETARIO' || rol === 'SEC-TECNICO') && agenda && (
              <>
                {!isPrinting && isAgendaFinalizada && (
                  <Button onClick={handleGeneratePdf} disabled={isPrinting} className="px-5 py-6 rounded-lg shadow-sm transition-colors flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700 w-full md:w-auto">
                    <FileText size={20} />
                    <span className="text-xs lg:text-base">{isPrinting ? 'Generando...' : 'Generar PDF'}</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </header>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between my-10 gap-4 w-full">
            <div className="w-full lg:w-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-4">
              {agenda && (
                <>
                   {(rol === 'SUPER' || rol === 'SECRETARIO') && agenda && (
                    <Button 
                        onClick={handleActualizarEstadoAgenda} 
                        disabled={isAgendaFinalizada} 
                        className={` px-5 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto ${getEstadoAgendaStyle(agenda.estado)}`}
                    >
                        <span className="text-lg md:text-base">{getEstadoAgendaText(agenda.estado)}</span>
                    </Button>
                   )}

                   {(rol === 'SUPER' || rol === 'SECRETARIO' || rol === 'SEC-TECNICO') && !isPrinting && !isAgendaFinalizada && (
                      <Button onClick={() => { setTareaSeleccionada(null); setIsFormModalOpen(true); }} className="px-5 rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2 bg-purple-500 text-white hover:bg-purple-600 w-full sm:w-auto">
                        <span className="text-lg md:text-base">Nuevo Punto a tratar</span>                      
                      </Button>
                    )}

                  {agenda.estado === 'En preparación' && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 px-3 rounded shadow-sm flex items-center justify-center md:justify-start w-full md:w-auto h-14">
                        <Info className="w-5 h-5 mr-2 flex-shrink-0" />
                        <p className="font-bold text-xs">La asistencia se podrá marcar cuando inicie la sesión</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 w-full md:flex md:flex-wrap md:items-center md:justify-end md:flex-grow md:w-auto">
                {estadoOrden.map(estado => (
                    <motion.button 
                        key={estado} 
                        onClick={() => toggleFiltro(estado)} 
                        className={`
                            px-1 md:px-3 py-2 rounded-md shadow-sm text-center flex items-center justify-center 
                            ${getStatusClasses(estado)} 
                            ${filtrosActivos.includes(estado) ? 'border-t-4 border-blue-500' : ''}
                        `} 
                        whileHover={{ y: -5 }} 
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="font-semibold text-[10px] sm:text-xs">{estado}:</span>
                        <span className="text-[10px] sm:text-sm font-bold ml-1">{resumenDeEstados[estado] || 0}</span>
                    </motion.button>
                ))}
                <AnimatePresence>
                    {filtrosActivos.length > 0 && (
                    <motion.button 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 20 }} 
                        onClick={() => setFiltrosActivos([])} 
                        className="col-span-3 md:col-span-auto px-3 py-2 rounded-md shadow-sm text-center bg-gray-400 text-white text-xs lg:text-xs w-full md:w-auto"
                    >
                        Quitar filtros
                    </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>

        <Tabla rol={rol} tareas={tareasFiltradas} handleOpenEditModal={handleOpenEditModal} handleOpenNotasModal={handleOpenNotasModal} handleOpenSeguimientoModal={handleOpenSeguimientoModal} estadoAgenda={agenda?.estado || ''} />
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