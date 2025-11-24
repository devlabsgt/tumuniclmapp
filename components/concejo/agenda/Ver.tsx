'use client';

import React, { useEffect, useState, useMemo } from 'react';
import useUserData from '@/hooks/sesion/useUserData';
import { cargarAgendas, eliminarAgenda } from './lib/acciones';
import { type AgendaConcejo } from './lib/esquemas';
import AgendaForm from './forms/Sesion';
import { CalendarPlus, Pencil, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import { useRouter } from 'next/navigation';
import { getYear, setMonth, format, differenceInDays, isToday, isFuture, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import Swal from 'sweetalert2';

const calcularDiasRestantes = (fechaReunion: string): string => {
  const fecha = new Date(fechaReunion);
  if (isToday(fecha)) {
    return 'Hoy';
  }
  const dias = differenceInDays(fecha, new Date());
  if (dias < 0) {
    return 'Vencido';
  }
  return `${dias + 1} días`;
};

const getButtonClasses = (estado: string) => {
  if (estado === 'En preparación') {
    return {
      default: 'bg-blue-500 hover:bg-blue-600 text-white',
      ghost: 'text-blue-600 hover:bg-blue-200',
    };
  }
  if (estado === 'En progreso') {
    return {
      default: 'bg-green-500 hover:bg-green-600 text-white',
      ghost: 'text-green-600 hover:bg-green-200',
    };
  }
  return {
    default: 'bg-gray-400 hover:bg-gray-500 text-white',
    ghost: 'text-gray-500 hover:bg-gray-200',
  };
};

type TabType = 'HOY' | 'PROXIMAS' | 'TERMINADAS';

export default function Ver() {
  const router = useRouter();
  const { permisos, cargando: cargandoUsuario } = useUserData();
  const [agendas, setAgendas] = useState<AgendaConcejo[]>([]);
  const [cargandoAgendas, setCargandoAgendas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendaAEditar, setAgendaAEditar] = useState<AgendaConcejo | null>(null);
  const [filtroAnio, setFiltroAnio] = useState<string>(getYear(new Date()).toString());
  const [filtroMes, setFiltroMes] = useState<string | null>(null);
  const [loadingAgendaId, setLoadingAgendaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType | null>(null);

  const anios = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 5 + i);
  const meses = Array.from({ length: 12 }, (_, i) => ({
    numero: i.toString(),
    nombre: format(setMonth(new Date(), i), 'LLLL', { locale: es }),
  }));

  const fetchAgendas = async () => {
    setCargandoAgendas(true);
    try {
      const data = await cargarAgendas();
      setAgendas(data);
    } catch (e: any) {
      console.error("Error al cargar las agendas:", e);
      setError("Ocurrió un error al cargar las agendas.");
    } finally {
      setCargandoAgendas(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  const agendasFiltradasBase = useMemo(() => {
    return agendas.filter(agenda => {
      const agendaDate = new Date(agenda.fecha_reunion);
      const agendaYear = agendaDate.getFullYear().toString();
      const agendaMonth = agendaDate.getMonth().toString();

      const cumpleAnio = filtroAnio === '' || agendaYear === filtroAnio;
      const cumpleMes = filtroMes === null || agendaMonth === filtroMes;

      return cumpleAnio && cumpleMes;
    });
  }, [agendas, filtroAnio, filtroMes]);

  const { agendasHoy, agendasProximas, agendasTerminadas } = useMemo(() => {
    return {
      agendasHoy: agendasFiltradasBase.filter(a => isToday(new Date(a.fecha_reunion))),
      agendasProximas: agendasFiltradasBase.filter(a => isFuture(new Date(a.fecha_reunion)) && !isToday(new Date(a.fecha_reunion))),
      agendasTerminadas: agendasFiltradasBase.filter(a => isPast(new Date(a.fecha_reunion)) && !isToday(new Date(a.fecha_reunion)))
    };
  }, [agendasFiltradasBase]);

  useEffect(() => {
    if (activeTab === null) {
      if (agendasHoy.length > 0) setActiveTab('HOY');
      else if (agendasProximas.length > 0) setActiveTab('PROXIMAS');
      else if (agendasTerminadas.length > 0) setActiveTab('TERMINADAS');
    } else {
      if (activeTab === 'HOY' && agendasHoy.length === 0) {
        if (agendasProximas.length > 0) setActiveTab('PROXIMAS');
        else if (agendasTerminadas.length > 0) setActiveTab('TERMINADAS');
        else setActiveTab(null);
      }
    }
  }, [agendasHoy, agendasProximas, agendasTerminadas, activeTab]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isModalOpen]);

  const handleOpenEditModal = (agenda: AgendaConcejo) => {
    setAgendaAEditar(agenda);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAgendaAEditar(null);
  };

  const handleGoToAgenda = (id: string) => {
    setLoadingAgendaId(id);
    setTimeout(() => {
      router.push(`/protected/concejo/agenda/${id}`);
    }, 1000);
  };

  const handleDeleteAgenda = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const exito = await eliminarAgenda(id);
      if (exito) {
        fetchAgendas();
      }
    }
  };

  const cardVariants = {
    loading: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 10px 15px -3px rgba(107, 114, 128, 0.1)",
        "0 20px 25px -5px rgba(107, 114, 128, 0.25)",
        "0 10px 15px -3px rgba(107, 114, 128, 0.1)",
      ],
    },
    idle: {
      scale: 1,
      boxShadow: "0 0px 0px 0px rgba(0,0,0,0)",
    }
  };

  const hoverEffect = {
    scale: 1.01,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  };

  const renderAgendaCard = (agenda: AgendaConcejo) => {
    let borderColorClass = 'border-l-blue-500';
    let textColorClass = 'text-gray-500';

    if (agenda.estado === 'En preparación') {
      borderColorClass = 'border-l-blue-500';
      textColorClass = 'text-blue-600';
    } else if (agenda.estado === 'En progreso') {
      borderColorClass = 'border-l-green-500';
      textColorClass = 'text-green-600';
    } else if (agenda.estado === 'Finalizada') {
      borderColorClass = 'border-l-gray-400';
      textColorClass = 'text-gray-500';
    }

    const buttonClasses = getButtonClasses(agenda.estado);
    const isLoadingThisAgenda = loadingAgendaId === agenda.id;

    return (
      <motion.div
        key={agenda.id}
        variants={cardVariants}
        animate={isLoadingThisAgenda ? 'loading' : 'idle'}
        whileHover={!loadingAgendaId ? hoverEffect : {}}
        transition={isLoadingThisAgenda ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        onClick={loadingAgendaId ? undefined : () => handleGoToAgenda(agenda.id)}
        className={`
          group relative bg-white rounded-lg border border-gray-200 shadow-sm 
          dark:border-gray-700 border-l-4 ${borderColorClass} 
          flex flex-col md:flex-row md:items-start md:justify-between gap-4 
          cursor-pointer 
          ${loadingAgendaId && !isLoadingThisAgenda ? 'opacity-25 pointer-events-none' : ''}
        `}
      >
        <div className="flex-1 p-4 pb-16 md:pb-4">
          <div className="flex items-baseline gap-x-3 flex-wrap">
            <p className="font-semibold text-gray-800 text-sm md:text-2xl">{agenda.titulo}</p>
            <span className="text-gray-500 font-normal whitespace-nowrap text-sm md:text-2xl">
              {format(new Date(agenda.fecha_reunion), "EEEE, d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}
            </span>
          </div>
          <p className="text-sm md:text-xl mt-2 text-gray-600 font-normal">{agenda.descripcion}</p>
          <p className="text-sm md:text-xl mt-2">
            <span className={`font-bold ${textColorClass}`}>{agenda.estado}</span>,
            {' '}
            <span className="font-semibold text-gray-700">
              {calcularDiasRestantes(agenda.fecha_reunion)}
              {calcularDiasRestantes(agenda.fecha_reunion).includes('días') && ' restantes'}
            </span>
          </p>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-row gap-2 items-center">
          {(permisos.includes('EDITAR') || permisos.includes('TODO')) && agenda.estado !== 'Finalizada' && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(agenda);
              }}
              variant="ghost"
              className={`w-auto px-3 ${buttonClasses.ghost} transition-colors flex items-center justify-center gap-1 z-10`}
            >
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}

          {(permisos.includes('EDITAR') || permisos.includes('TODO')) && agenda.estado === 'En preparación' && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAgenda(agenda.id);
              }}
              variant="ghost"
              className="w-auto px-3 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center gap-1 z-10"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          )}

          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (!loadingAgendaId) handleGoToAgenda(agenda.id);
            }}
            variant="default"
            className={`
              ${buttonClasses.default} 
              h-10 p-0 flex items-center justify-center rounded-full
              w-10 group-hover:w-24 
              transition-all duration-300 ease-in-out overflow-hidden cursor-pointer
            `}
            aria-label={`Entrar a la agenda ${agenda.titulo}`}
          >
            <span className="flex items-center px-2">
              <ArrowRight className="h-4 w-4 flex-shrink-0 transition-all duration-300 group-hover:text-white" />
              <span className="ml-1 text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all delay-150 duration-200">
                Entrar
              </span>
            </span>
          </Button>
        </div>
      </motion.div>
    );
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'HOY': return agendasHoy;
      case 'PROXIMAS': return agendasProximas;
      case 'TERMINADAS': return agendasTerminadas;
      default: return [];
    }
  };

  if (cargandoUsuario || cargandoAgendas) {
    return <CargandoAnimacion texto="Cargando Agenda..." />;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <header className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4">
            <BotonVolver ruta="/protected/" />
            <div className="flex gap-2">
              <select
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {anios.map(anio => <option key={anio} value={anio}>{anio}</option>)}
              </select>
              <select
                value={filtroMes !== null ? filtroMes : ''}
                onChange={(e) => setFiltroMes(e.target.value === '' ? null : e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Todos los meses</option>
                {meses.map(mes => <option key={mes.numero} value={mes.numero}>{mes.nombre.charAt(0).toUpperCase() + mes.nombre.slice(1)}</option>)}
              </select>
            </div>
          </div>
          {(permisos.includes('EDITAR') || permisos.includes('TODO')) && (
            <Button
              onClick={() => {
                setAgendaAEditar(null);
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <CalendarPlus size={20} />
              <span>Nueva Sesión</span>
            </Button>
          )}
        </div>

        {(agendasHoy.length > 0 || agendasProximas.length > 0 || agendasTerminadas.length > 0) && (
          <div className="flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 w-full md:w-3/4 lg:w-1/2 mx-auto">
            {agendasHoy.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('HOY')}
                className={`flex-1 rounded-md transition-all duration-200 ${activeTab === 'HOY' ? 'bg-blue-100 text-blue-600 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
              >
                Hoy ({agendasHoy.length})
              </button>
            )}
            {agendasProximas.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('PROXIMAS')}
                className={`flex-1 rounded-md transition-all duration-200 ${activeTab === 'PROXIMAS' ? 'bg-purple-100 text-purple-600 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
              >
                Próximas ({agendasProximas.length})
              </button>
            )}
            {agendasTerminadas.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('TERMINADAS')}
                className={`flex-1 rounded-md transition-all duration-200 ${activeTab === 'TERMINADAS' ? 'bg-gray-200 text-gray-700 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
              >
                Terminadas ({agendasTerminadas.length})
              </button>
            )}
          </div>
        )}
      </header>

      <div className="w-full">
        {agendasFiltradasBase.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Aún no hay sesiones para estas fechas.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab || 'empty'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-4"
            >
              {getActiveList().map(agenda => renderAgendaCard(agenda))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AgendaForm
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={() => {
              fetchAgendas();
            }}
            agendaAEditar={agendaAEditar}
          />
        )}
      </AnimatePresence>
    </div>
  );
}