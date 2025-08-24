'use client';

import { useState, useEffect } from 'react';
import useUserData from '@/hooks/useUserData';
import { cargarAgendas, type AgendaConcejo } from './lib/acciones';
import AgendaForm from './forms/Sesion';
import { CalendarPlus, Pencil, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import { useRouter } from 'next/navigation';
import { getYear, setMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import BotonVolver from '@/components/ui/botones/BotonVolver';

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
              const isEnProgreso = agenda.estado === 'En Progreso';
              const borderColorClass = isEnProgreso ? 'border-green-500' : 'border-gray-400';
              const textColorClass = isEnProgreso ? 'text-green-600' : 'text-gray-500';

              return (
                // ========= INICIO DE LA SECCIÓN CORREGIDA =========
                <div key={agenda.id} className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${borderColorClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
                  
                  <div className="flex-grow">
                    <div className="flex items-baseline gap-x-3 flex-wrap">
                      <p className="text-base font-semibold text-gray-800">{agenda.titulo}</p>
                      <span className="text-sm text-gray-500 font-normal whitespace-nowrap">{format(new Date(agenda.fecha_reunion), "PPP", { locale: es })}</span>
                      <span className="text-sm text-gray-600 font-normal">{agenda.descripcion}</span>
                    </div>

                    <p className="text-sm mt-2">
                      Estado: <span className={`font-bold ${textColorClass}`}>{agenda.estado}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                      <button
                        onClick={() => handleOpenEditModal(agenda)}
                        className="px-3 py-2 text-sm text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </button>
                    )}
                    <button
                      onClick={() => handleGoToAgenda(agenda.id)}
                      className="px-3 py-2 text-sm text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowRight className="h-4 w-4" /> Entrar
                    </button>
                  </div>
                </div>
                // ========= FIN DE LA SECCIÓN CORREGIDA =========
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