'use client';

import React, { Fragment, useEffect, useState } from 'react';
import useUserData from '@/hooks/useUserData';
import { cargarAgendas} from './lib/acciones';
import {type AgendaConcejo } from './lib/esquemas';

import AgendaForm from './forms/Sesion';
import { CalendarPlus, Pencil, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import { useRouter } from 'next/navigation';
import { getYear, setMonth, format, differenceInDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import BotonVolver from '@/components/ui/botones/BotonVolver';

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

export default function Ver() {
  const router = useRouter();
  const { rol, cargando: cargandoUsuario } = useUserData();
  const [agendas, setAgendas] = useState<AgendaConcejo[]>([]);
  const [agendasFiltradas, setAgendasFiltradas] = useState<AgendaConcejo[]>([]);
  const [cargandoAgendas, setCargandoAgendas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendaAEditar, setAgendaAEditar] = useState<AgendaConcejo | null>(null);
  const [filtroAnio, setFiltroAnio] = useState<string>(getYear(new Date()).toString());
  const [filtroMes, setFiltroMes] = useState<string | null>(null);

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

  useEffect(() => {
    const filtered = agendas.filter(agenda => {
      const agendaDate = new Date(agenda.fecha_reunion);
      const agendaYear = agendaDate.getFullYear().toString();
      const agendaMonth = agendaDate.getMonth().toString();
      
      const cumpleAnio = filtroAnio === '' || agendaYear === filtroAnio;
      const cumpleMes = filtroMes === null || agendaMonth === filtroMes;
      
      return cumpleAnio && cumpleMes;
    });

    setAgendasFiltradas(filtered);
  }, [agendas, filtroAnio, filtroMes]);

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
    router.push(`/protected/concejo/agenda/${id}`);
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
    <div className="container mx-auto p-4">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
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
        {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
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
      </header>
      
      <div className="w-full">
        {agendasFiltradas.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Aún no hay sesiones para estas fechas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {agendasFiltradas.map((agenda) => {
              let borderColorClass = 'border-gray-400';
              let textColorClass = 'text-gray-500';

              if (agenda.estado === 'En preparación') {
                borderColorClass = 'border-blue-500';
                textColorClass = 'text-blue-600';
              } else if (agenda.estado === 'En progreso') {
                borderColorClass = 'border-green-500';
                textColorClass = 'text-green-600';
              } else if (agenda.estado === 'Finalizada') {
                borderColorClass = 'border-gray-400';
                textColorClass = 'text-gray-500';
              }

              return (
                <Fragment key={agenda.id}>
                  <div
                    onClick={() => handleGoToAgenda(agenda.id)}
                    className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${borderColorClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer transition-colors hover:bg-gray-50`}
                  >
                    <div className="flex-grow pointer-events-none">
                      <div className="flex items-baseline gap-x-3 flex-wrap">
                        <p className="font-semibold text-gray-800 text-xs md:text-2xl">{agenda.titulo}</p>
                        <span className="text-gray-500 font-normal whitespace-nowrap text-xs md:text-2xl">
                          {format(new Date(agenda.fecha_reunion), "EEEE, d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}                   
                        </span>
                      </div>
                      <p className="text-xs md:text-2xl mt-2 text-gray-600 font-normal">{agenda.descripcion}</p>
                      <p className="text-xs md:text-xl  mt-2">
                        Estado: <span className={`font-bold ${textColorClass}`}>{agenda.estado}</span>
                      </p>
                      <p className="text-xs md:text-xl mt-1">
                        Días Restantes: <span className="font-semibold text-gray-700">{calcularDiasRestantes(agenda.fecha_reunion)}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-stretch gap-2 self-end sm:self-auto">
                      {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(agenda);
                          }}
                          variant="ghost"
                          className="text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToAgenda(agenda.id);
                        }}
                        variant="default"
                        className="text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="h-4 w-4" /> Entrar
                      </Button>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
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