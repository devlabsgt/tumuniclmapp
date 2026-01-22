'use client';

import React, { Fragment, useMemo } from 'react';
import { format, parseISO, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronDown, Search, Building2, Plus, Trash2, CalendarDays, 
  Clock, FileText, User, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cargando from '@/components/ui/animations/Cargando';
import CrearEditarPermiso from './modals/CrearEditarPermiso';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermisos, TipoVistaPermisos } from '@/hooks/permisos/usePermisos';
import { cn } from "@/lib/utils";

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface Props {
  tipoVista: TipoVistaPermisos;
}

export default function VerPermisos({ tipoVista }: Props) {
  const { state, actions } = usePermisos(tipoVista);
  const { 
    loadingPermisos, searchTerm, filtroEstado, mesSeleccionado, anioSeleccionado, 
    modalAbierto, permisoParaEditar, perfilUsuario, oficinasAbiertas, 
    datosAgrupados, estadisticas 
  } = state;
  const { 
    setSearchTerm, setFiltroEstado, setMesSeleccionado, setAnioSeleccionado, 
    setModalAbierto, toggleOficina, cargarDatos, handleNuevoPermiso, 
    handleClickFila, handleEliminarPermiso 
  } = actions;

  // FILTRO VISUAL
  const gruposConDatos = useMemo(() => {
    return datosAgrupados.filter(grupo => grupo.permisos.length > 0);
  }, [datosAgrupados]);

  const aniosDisponibles = useMemo(() => {
    const actual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => actual - 2 + i);
  }, []);

  const tituloPagina = useMemo(() => {
     if (tipoVista === 'mis_permisos') return 'Mis Solicitudes';
     if (tipoVista === 'gestion_rrhh') return 'Administración de Permisos (RRHH)';
     if (tipoVista === 'gestion_jefe') return 'Administración de Permisos (JEFE)';
     return 'Permisos';
  }, [tipoVista]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">Aprobado RRHH</span>;
      case 'aprobado_jefe': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">Preaprobado Jefe</span>;
      case 'rechazado_jefe':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Rechazado Jefe</span>;
      case 'rechazado_rrhh':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Rechazado RRHH</span>;
      case 'rechazado': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Rechazado</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Pendiente Jefe</span>;
    }
  };

  const getLeftBorderClass = (estado: string) => {
    if (estado === 'aprobado') return "border-l-4 border-l-emerald-500";
    if (estado === 'aprobado_jefe') return "border-l-4 border-l-blue-500";
    if (estado.includes('rechazado')) return "border-l-4 border-l-red-500";
    return "border-l-4 border-l-amber-500";
  };

  const esRRHH = tipoVista === 'gestion_rrhh';

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4 pb-10">
        <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-md w-full border border-gray-100 dark:border-neutral-800 transition-colors duration-200">
          
          <div className="flex flex-col gap-4 mb-6 p-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate max-w-2xl" title={tituloPagina}>
                  {tituloPagina}
              </h2>
              
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded p-1">
                  <CalendarDays className="w-4 h-4 text-gray-500 ml-2" />
                  <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="bg-transparent text-xs font-medium focus:outline-none p-1.5 cursor-pointer dark:text-gray-200 dark:bg-neutral-900">
                    {MESES.map((mes, index) => <option key={index} value={index + 1}>{mes}</option>)}
                  </select>
                  <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700 mx-1"></div>
                  <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="bg-transparent text-xs font-medium focus:outline-none p-1.5 cursor-pointer mr-1 dark:text-gray-200 dark:bg-neutral-900">
                    {aniosDisponibles.map((anio) => <option key={anio} value={anio}>{anio}</option>)}
                  </select>
                </div>

                 {tipoVista === 'mis_permisos' && (
                    <Button size="sm" onClick={handleNuevoPermiso} className="h-8 text-xs bg-black dark:bg-white text-white dark:text-black hover:opacity-90 ml-2">
                    <Plus className="w-3 h-3 mr-1.5" /> Nuevo Permiso
                    </Button>
                 )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-200" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                 
                 {/* 1. Pendientes Jefe (Para todos) */}
                 {estadisticas.pendientes > 0 && (
                    <Button 
                        size="sm" 
                        onClick={() => setFiltroEstado(prev => prev === 'pendiente' ? 'todos' : 'pendiente')} 
                        className={cn(
                            "h-7 px-3 text-[10px] font-bold rounded-md border",
                            filtroEstado === 'pendiente'
                                ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-500" 
                                : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
                        )}
                    >
                        Pendientes Jefe: {estadisticas.pendientes}
                    </Button>
                 )}

                 {/* 2. Pendientes RRHH (Preaprobado Jefe) */}
                 {estadisticas.avalados > 0 && (
                    <Button 
                        size="sm" 
                        onClick={() => setFiltroEstado(prev => prev === 'aprobado_jefe' ? 'todos' : 'aprobado_jefe')} 
                        className={cn(
                            "h-7 px-3 text-[10px] font-bold rounded-md border",
                            filtroEstado === 'aprobado_jefe'
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600"
                                : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                        )}
                    >
                      {esRRHH ? `Pendientes RRHH: ${estadisticas.avalados}` : `Preaprobado Jefe: ${estadisticas.avalados}`}
                    </Button>
                 )}

                 {/* 3. Aprobados Finales */}
                 {estadisticas.aprobados > 0 && (
                    <Button 
                        size="sm" 
                        onClick={() => setFiltroEstado(prev => prev === 'aprobado' ? 'todos' : 'aprobado')} 
                        className={cn(
                            "h-7 px-3 text-[10px] font-bold rounded-md border",
                            filtroEstado === 'aprobado'
                                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-600"
                                : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                        )}
                    >
                      Aprobado RRHH: {estadisticas.aprobados}
                    </Button>
                 )}

                 {/* 4. Rechazados */}
                 {estadisticas.rechazados > 0 && (
                    <Button 
                        size="sm" 
                        onClick={() => setFiltroEstado(prev => prev === 'rechazado' ? 'todos' : 'rechazado')} 
                        className={cn(
                            "h-7 px-3 text-[10px] font-bold rounded-md border",
                            filtroEstado === 'rechazado'
                                ? "bg-red-600 text-white border-red-600 hover:bg-red-600"
                                : "bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                        )}
                    >
                      Rechazados: {estadisticas.rechazados}
                    </Button>
                 )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-neutral-800 pt-4">
            {loadingPermisos ? (
              <Cargando texto="Cargando permisos..." />
            ) : gruposConDatos.length === 0 ? ( 
              <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-8">No hay información disponible.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {gruposConDatos.map((grupo) => {
                  const estaAbierta = oficinasAbiertas[grupo.oficina_nombre] || false;
                  return (
                  <div key={grupo.oficina_nombre} className="border border-gray-100 dark:border-neutral-800 rounded-lg overflow-hidden">
                    <div onClick={() => toggleOficina(grupo.oficina_nombre)} className="bg-slate-50 dark:bg-neutral-800/50 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors py-3 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{grupo.oficina_nombre} <span className="text-gray-400 text-xs ml-1 font-normal">({grupo.permisos.length})</span></span>
                        </div>
                        <motion.div initial={false} animate={{ rotate: estaAbierta ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </motion.div>
                    </div>
                    <AnimatePresence initial={false}>
                      {estaAbierta && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-neutral-900">
                             <div className="p-3 flex flex-col gap-3">
                                {grupo.permisos.map((permiso) => {
                                    const puedeEliminar = tipoVista === 'gestion_rrhh' || (tipoVista === 'mis_permisos' && permiso.estado === 'pendiente');
                                    const fechaInicio = parseISO(permiso.inicio);
                                    const fechaFin = parseISO(permiso.fin);
                                    const esMismoDia = isSameDay(fechaInicio, fechaFin);
                                    const esMismoMes = isSameMonth(fechaInicio, fechaFin);
                                    let textoFecha = '';
                                    if (esMismoDia) { textoFecha = format(fechaInicio, "d 'de' MMMM", { locale: es }); } 
                                    else if (esMismoMes) { textoFecha = `Del ${format(fechaInicio, 'd')} al ${format(fechaFin, "d 'de' MMMM", { locale: es })}`; } 
                                    else { textoFecha = `Del ${format(fechaInicio, "d 'de' MMM", { locale: es })} al ${format(fechaFin, "d 'de' MMM", { locale: es })}`; }
                                    const textoHora = `${format(fechaInicio, "h:mm a", { locale: es })} - ${format(fechaFin, "h:mm a", { locale: es })}`;
                                    const leftBorderClass = getLeftBorderClass(permiso.estado);

                                    return (
                                        <div key={permiso.id} onClick={() => handleClickFila(permiso)}
                                            className={cn("group relative flex flex-col justify-between bg-white dark:bg-neutral-900 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer w-full border border-gray-100 dark:border-neutral-800", leftBorderClass)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200 font-bold text-sm mb-0.5">
                                                        <User className="w-4 h-4 text-blue-500" />
                                                        <span title={permiso.usuario?.nombre}>{permiso.usuario?.nombre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500 dark:text-gray-500 text-xs ml-0.5">
                                                        <Briefcase className="w-3.5 h-3.5" />
                                                        <span title={permiso.usuario?.puesto_nombre || ''}>{permiso.usuario?.puesto_nombre || 'Sin puesto'}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded-md font-medium">
                                                    Solicitado: {format(parseISO(permiso.created_at), "d MMM", { locale: es })}
                                                </span>
                                            </div>
                                            <div className="space-y-3 mb-4">
                                                <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-md">
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize mb-2">{permiso.tipo.replace('_', ' ')}</p>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-blue-500/70" /><span className="font-medium capitalize">{textoFecha}</span></div>
                                                        <span className="text-gray-300 dark:text-neutral-600 hidden sm:inline">•</span>
                                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-500/70" /><span>{textoHora}</span></div>
                                                    </div>
                                                </div>
                                                {permiso.descripcion && (
                                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-2.5 rounded-md">
                                                        <div className="flex items-start gap-2"><FileText className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /><p className="text-xs text-gray-600 dark:text-gray-400 italic">{permiso.descripcion}</p></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-neutral-800">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {getEstadoBadge(permiso.estado)}
                                                    {permiso.estado === 'aprobado' && permiso.remunerado !== null && (
                                                        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-md border inline-flex items-center", permiso.remunerado ? "text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800" : "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-neutral-800 dark:border-neutral-700")}>{permiso.remunerado ? 'REMUNERADO' : 'NO REMUNERADO'}</span>
                                                    )}
                                                </div>
                                                {puedeEliminar && <button onClick={(e) => handleEliminarPermiso(e, permiso.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Eliminar solicitud"><Trash2 className="w-4 h-4" /></button>}
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <CrearEditarPermiso isOpen={modalAbierto} onClose={() => setModalAbierto(false)} permisoAEditar={permisoParaEditar} onSuccess={cargarDatos} perfilUsuario={perfilUsuario} tipoVista={tipoVista} />
    </>
  );
}