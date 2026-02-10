'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useSolicitudes } from './lib/hooks'; 
import { SolicitudEntrega } from './lib/schemas';
import { EntregaItem } from './EntregaItem';
import AprobacionSolicitud from './modals/AprobacionSolicitud'; 
import InformeMensualModal from './modals/InformeMensual';
import ValidarLiquidacion from './modals/ValidarLiquidacion';

import { Search, Calendar as CalendarIcon, SearchX, CalendarDays, FileDown, Loader2 } from 'lucide-react'; 
import { getDatosReporteMensual } from './lib/actions';
import Swal from 'sweetalert2';

const MESES = [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ];
const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - 1 + i);

const formatearFechaCorta = (fecha: Date) => {
  return `${fecha.getDate()} ${MESES_ABREV[fecha.getMonth()]}`;
};

const formatearEncabezadoGrupo = (fechaStr: string) => {
    if (!fechaStr) return 'FECHA DESCONOCIDA';
    const fecha = new Date(fechaStr);
    const diaNombre = fecha.toLocaleDateString('es-GT', { weekday: 'long' });
    const diaNumero = fecha.getDate();
    return `${diaNombre} ${diaNumero}`.toUpperCase();
};

const obtenerSemanas = (mes: number, anio: number) => {
  const primerDiaMes = new Date(anio, mes, 1);
  const diaSemana = primerDiaMes.getDay();
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioPrimerSemana = new Date(anio, mes, 1 - offset);

  return Array.from({ length: 5 }, (_, i) => {
    const inicio = new Date(inicioPrimerSemana.getFullYear(), inicioPrimerSemana.getMonth(), inicioPrimerSemana.getDate() + (i * 7));
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
    return { id: i, label: `${formatearFechaCorta(inicio)} - ${formatearFechaCorta(fin)}`, inicio, fin };
  });
};

const TAB_STYLES: Record<string, { active: string, inactive: string, badge: string }> = {
  'pendiente': { active: 'bg-amber-500 text-white', inactive: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700' },
  'aprobado': { active: 'bg-emerald-600 text-white', inactive: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  'rechazado': { active: 'bg-red-600 text-white', inactive: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', badge: 'bg-red-100 text-red-700' }
};

interface Props {
  initialData: SolicitudEntrega[];
}

export default function ListSolicitud({ initialData }: Props) {
  const { solicitudes, loading, refresh, updateLocalSolicitud } = useSolicitudes(initialData);
  const [isMounted, setIsMounted] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEntrega | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [validarSolicitud, setValidarSolicitud] = useState<SolicitudEntrega | null>(null);

  const [datosReporte, setDatosReporte] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [filtroEstado, setFiltroEstado] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(0); 
  const [anioSeleccionado, setAnioSeleccionado] = useState(ANIO_ACTUAL);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(-1);

  useEffect(() => {
    const hoy = new Date();
    setMesSeleccionado(hoy.getMonth());
    setAnioSeleccionado(hoy.getFullYear());
    setIsMounted(true);
  }, []);

  const semanasDisponibles = useMemo(() => {
    return obtenerSemanas(mesSeleccionado, anioSeleccionado);
  }, [mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    setSemanaSeleccionada(-1);
  }, [mesSeleccionado, anioSeleccionado]);

  const handleToggle = (id: number) => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };

  const handlePrevisualizarReporte = async () => {
    try {
        setReportLoading(true);
        const datos = await getDatosReporteMensual(mesSeleccionado, anioSeleccionado);
        
        if (Object.keys(datos).length === 0) {
            Swal.fire('Sin registros', 'No hay solicitudes aprobadas para las oficinas en este periodo.', 'info');
            return;
        }

        setDatosReporte(datos);
        setIsReportModalOpen(true);
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo cargar la previsualización del reporte.', 'error');
    } finally {
        setReportLoading(false);
    }
  };

  const baseFilteredSolicitudes = useMemo(() => {
    if (!isMounted) return [];
    return solicitudes.filter(s => {
        if (!s.created_at) return false;
        const sDate = new Date(s.created_at);
        let coincideFecha = false;
        if (semanaSeleccionada !== -1) {
            const sem = semanasDisponibles[semanaSeleccionada];
            const inicio = new Date(sem.inicio); inicio.setHours(0,0,0,0);
            const fin = new Date(sem.fin); fin.setHours(23,59,59,999);
            coincideFecha = sDate >= inicio && sDate <= fin;
        } else {
            coincideFecha = sDate.getMonth() === mesSeleccionado && sDate.getFullYear() === anioSeleccionado;
        }
        
        const lowerTerm = searchTerm.toLowerCase();
        
        return coincideFecha && (
            s.placa.toLowerCase().includes(lowerTerm) ||
            s.municipio_destino.toLowerCase().includes(lowerTerm) ||
            (s.usuario?.nombre || '').toLowerCase().includes(lowerTerm) ||
            (s.correlativo ? s.correlativo.toString().includes(lowerTerm) : false)
        );
    });
  }, [solicitudes, mesSeleccionado, anioSeleccionado, semanaSeleccionada, semanasDisponibles, searchTerm, isMounted]);

  const conteos = useMemo(() => ({
      'pendiente': baseFilteredSolicitudes.filter(s => s.estado === 'pendiente').length,
      'aprobado': baseFilteredSolicitudes.filter(s => s.estado === 'aprobado').length,
      'rechazado': baseFilteredSolicitudes.filter(s => s.estado === 'rechazado').length,
  }), [baseFilteredSolicitudes]);

  const pestañas = ['pendiente', 'aprobado', 'rechazado'];
  
  const listaVisual = useMemo(() => {
      return baseFilteredSolicitudes.filter(s => filtroEstado === '' ? true : s.estado === filtroEstado);
  }, [baseFilteredSolicitudes, filtroEstado]);

  const groupedSolicitudes = useMemo(() => {
      const groups: Record<string, SolicitudEntrega[]> = {};
      listaVisual.forEach(sol => {
          if (!sol.created_at) return;
          const key = new Date(sol.created_at).toLocaleDateString('en-CA'); 
          if (!groups[key]) groups[key] = [];
          groups[key].push(sol);
      });
      return Object.entries(groups)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
          .map(([date, items]) => ({
              date,
              displayDate: formatearEncabezadoGrupo(date + 'T00:00:00'),
              items: items.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          }));
  }, [listaVisual]);

  const handleCloseModal = (nuevoEstado?: 'aprobado' | 'rechazado') => {
    if (nuevoEstado && selectedSolicitud) {
        updateLocalSolicitud(selectedSolicitud.id, { estado: nuevoEstado });
        refresh();
    }
    setSelectedSolicitud(null);
  };

  if (!isMounted) return <div className="w-full h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6 w-[91%] mx-auto animate-in fade-in duration-500 mt-7">
      
      <div className="flex flex-col gap-6 mb-2">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestión de Cupones de Combustible</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                    Gestione las solicitudes aprobadas para la asignación de combustible.
                </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 mt-2">
                <div className="overflow-x-auto pb-1 xl:pb-0">
                    <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm min-w-max">
                        {pestañas.map((tab) => {
                            const styles = TAB_STYLES[tab];
                            const isActive = filtroEstado === tab;
                            return (
                                <button key={tab} onClick={() => setFiltroEstado(isActive ? '' : tab)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase ${isActive ? styles.active : styles.inactive}`}>
                                    {tab}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[18px] text-center ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>
                                        {conteos[tab as keyof typeof conteos]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar placa, destino, correlativo..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200" 
                        />
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                        <button 
                            onClick={handlePrevisualizarReporte}
                            disabled={reportLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-sm"
                            title="Previsualizar informe mensual por oficinas"
                        >
                            {reportLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} className="text-blue-500" />}
                            <span className="hidden md:inline">INFORME MENSUAL</span>
                        </button>

                        <div className="relative">
                            <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="pl-4 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 appearance-none">
                                {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        
                        <div className="relative min-w-[110px]">
                            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 appearance-none">
                                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative min-w-[140px]">
                            <select value={semanaSeleccionada} onChange={(e) => setSemanaSeleccionada(Number(e.target.value))} className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 appearance-none">
                                <option value={-1}>Todo el mes</option>
                                {semanasDisponibles.map(sem => <option key={sem.id} value={sem.id}>{sem.label}</option>)}
                            </select>
                        </div>
                        
                        <button 
                            onClick={() => refresh()} 
                            disabled={loading}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 p-2.5 rounded-xl transition-colors disabled:opacity-50"
                            title="Actualizar lista"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                </div>
            </div>
      </div>

      <div className="flex flex-col pb-20">
        <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold ml-1 mb-4">
            Total mostradas: {listaVisual.length} solicitudes
        </div>

        {groupedSolicitudes.length > 0 ? (
            groupedSolicitudes.map((group) => (
                <div key={group.date} className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-[#1e1e1e] text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm select-none">
                        <CalendarDays size={14} className="text-slate-400 dark:text-slate-500" />
                        {group.displayDate}
                    </div>
                    <div className="flex flex-col gap-4">
                        {group.items.map((sol) => (
                            <EntregaItem 
                                key={sol.id} 
                                sol={sol} 
                                isOpen={expandedId === sol.id} 
                                onToggle={() => handleToggle(sol.id)} 
                                onClick={(item) => setSelectedSolicitud(item)}
                                onValidar={(item) => setValidarSolicitud(item)}
                            />
                        ))}
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-16 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800">
                <SearchX size={32} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-slate-900 dark:text-white font-bold">No se encontraron solicitudes</h3>
                <p className="text-slate-500 text-sm mt-1">Intente cambiar los filtros de fecha o estado.</p>
            </div>
        )}
      </div>

      {selectedSolicitud && (
        <AprobacionSolicitud 
            isOpen={!!selectedSolicitud}
            solicitud={selectedSolicitud}
            onClose={() => handleCloseModal()} 
            onSuccess={(estado) => handleCloseModal(estado)} 
        />
      )}

      {validarSolicitud && (
          <ValidarLiquidacion
              isOpen={!!validarSolicitud}
              solicitud={validarSolicitud}
              onClose={() => setValidarSolicitud(null)}
              onSuccess={() => {
                  updateLocalSolicitud(validarSolicitud.id, { solvente: true }); 
                  refresh(); 
                  setValidarSolicitud(null);
              }}
          />
      )}

      {datosReporte && (
          <InformeMensualModal 
              isOpen={isReportModalOpen}
              onClose={() => {
                  setIsReportModalOpen(false);
                  setDatosReporte(null);
              }}
              datos={datosReporte}
              mesNombre={MESES[mesSeleccionado]}
          />
      )}
    </div>
  );
}