'use client';

import React, { Fragment, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronDown, Search, Building2, Plus, Trash2, CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cargando from '@/components/ui/animations/Cargando';
import CrearEditarPermiso from './modals/CrearEditarPermiso';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermisos, TipoVistaPermisos } from '@/hooks/permisos/usePermisos';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface Props {
  tipoVista: TipoVistaPermisos;
}

export default function VerPermisos({ tipoVista }: Props) {
  const { state, actions } = usePermisos(tipoVista);
  const { 
    loadingPermisos, searchTerm, filtroEstado, mesSeleccionado, anioSeleccionado, 
    modalAbierto, permisoParaEditar, perfilUsuario, oficinasAbiertas, 
    datosAgrupados, estadisticas, usuariosParaModal 
  } = state;
  const { 
    setSearchTerm, setFiltroEstado, setMesSeleccionado, setAnioSeleccionado, 
    setModalAbierto, toggleOficina, cargarDatos, handleNuevoPermiso, 
    handleClickFila, handleEliminarPermiso 
  } = actions;

  // 1. FILTRO VISUAL: Ocultar acordeones vacíos (0 permisos)
  const gruposConDatos = useMemo(() => {
    return datosAgrupados.filter(grupo => grupo.permisos.length > 0);
  }, [datosAgrupados]);

  const aniosDisponibles = useMemo(() => {
    const actual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => actual - 2 + i);
  }, []);

  const tituloPagina = useMemo(() => {
     if (tipoVista === 'mis_permisos') return 'Mis Solicitudes';
     if (tipoVista === 'gestion_rrhh') return 'Administración RRHH';
     if (tipoVista === 'gestion_jefe') {
        const nombreJefe = perfilUsuario?.nombre || 'Jefatura';
        return `Aprobación de permisos (${nombreJefe})`;
     }
     return 'Permisos';
  }, [tipoVista, perfilUsuario]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado': 
        return <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 whitespace-nowrap">Aprobado por RRHH</span>;
      case 'aprobado_jefe': 
        return <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 whitespace-nowrap">Aprobado por jefe</span>;
      case 'rechazado_jefe':
        return <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 whitespace-nowrap">Rechazado por jefe</span>;
      case 'rechazado_rrhh':
        return <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 whitespace-nowrap">Rechazado por RRHH</span>;
      case 'rechazado': 
        return <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 whitespace-nowrap">Rechazado</span>;
      default: 
        return <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 whitespace-nowrap">Pendiente</span>;
    }
  };

  const esRRHH = tipoVista === 'gestion_rrhh';

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4">
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

                 {/* === CORRECCIÓN AQUÍ: Solo mostrar 'Nuevo Permiso' en la vista personal === */}
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
              
              {/* === FILTROS INTELIGENTES === */}
              <div className="flex flex-wrap gap-2">
                 
                 {/* BOTÓN 1: PENDIENTES DE APROBACIÓN (Contextual) */}
                 {esRRHH ? (
                    // Si es RRHH, sus pendientes son los 'aprobado_jefe'
                    estadisticas.avalados > 0 && (
                        <Button 
                            size="sm" 
                            onClick={() => setFiltroEstado(prev => prev === 'aprobado_jefe' ? 'todos' : 'aprobado_jefe')} 
                            className={`h-7 px-3 text-[10px] font-bold rounded-md border ${filtroEstado === 'aprobado_jefe' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}
                        >
                        Pendientes de aprobación: {estadisticas.avalados}
                        </Button>
                    )
                 ) : (
                    // Si es Jefe/User, sus pendientes son los 'pendiente'
                    estadisticas.pendientes > 0 && (
                        <Button 
                            size="sm" 
                            onClick={() => setFiltroEstado(prev => prev === 'pendiente' ? 'todos' : 'pendiente')} 
                            className={`h-7 px-3 text-[10px] font-bold rounded-md border ${filtroEstado === 'pendiente' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}
                        >
                        Pendientes de aprobación: {estadisticas.pendientes}
                        </Button>
                    )
                 )}

                 {/* BOTÓN 2: APROBADO POR JEFE (Historial intermedio, solo visible para Jefe/User) */}
                 {!esRRHH && estadisticas.avalados > 0 && (
                    <Button 
                        size="sm" 
                        onClick={() => setFiltroEstado(prev => prev === 'aprobado_jefe' ? 'todos' : 'aprobado_jefe')} 
                        className={`h-7 px-3 text-[10px] font-bold rounded-md border ${filtroEstado === 'aprobado_jefe' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'}`}
                    >
                      Aprobado por jefe: {estadisticas.avalados}
                    </Button>
                 )}

                 {/* BOTÓN 3: APROBADO FINAL (Visible para todos) */}
                 {estadisticas.aprobados > 0 && (
                    <Button 
                        size="sm" 
                        onClick={() => setFiltroEstado(prev => prev === 'aprobado' ? 'todos' : 'aprobado')} 
                        className={`h-7 px-3 text-[10px] font-bold rounded-md border ${filtroEstado === 'aprobado' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'}`}
                    >
                      Aprobado por RRHH: {estadisticas.aprobados}
                    </Button>
                 )}

                 {/* BOTÓN 4: RECHAZADOS (Visible para todos) */}
                 {estadisticas.rechazados > 0 && (
                    <Button 
                        size="sm" 
                        onClick={() => setFiltroEstado(prev => prev === 'rechazado' ? 'todos' : 'rechazado')} 
                        className={`h-7 px-3 text-[10px] font-bold rounded-md border ${filtroEstado === 'rechazado' ? 'bg-red-600 text-white border-red-600' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}
                    >
                      Rechazado: {estadisticas.rechazados}
                    </Button>
                 )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-neutral-800 pt-2 mt-2">
            {loadingPermisos ? (
              <Cargando texto="Cargando permisos..." />
            ) : gruposConDatos.length === 0 ? ( 
              <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-8">No hay información disponible.</p>
            ) : (
              <div className="w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full table-fixed text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-900 text-left border-b border-gray-100 dark:border-neutral-800">
                      <tr>
                        <th className="py-3 px-4 w-[25%] font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                        <th className="py-3 px-2 w-[12%] text-center font-semibold text-slate-600 dark:text-slate-400">Tipo</th>
                        <th className="py-3 px-2 w-[10%] text-center font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                        <th className="py-3 px-2 w-[20%] text-center font-semibold text-slate-600 dark:text-slate-400">Duración</th>
                        <th className="py-3 px-2 w-[18%] text-center font-semibold text-slate-600 dark:text-slate-400">Estado</th>
                        <th className="py-3 px-2 w-[10%] text-center font-semibold text-slate-600 dark:text-slate-400">Remunerado</th>
                        <th className="py-3 px-2 w-[5%] text-center font-semibold text-slate-600 dark:text-slate-400"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gruposConDatos.map((grupo) => {
                        const estaAbierta = oficinasAbiertas[grupo.oficina_nombre] || false;
                        
                        return (
                        <Fragment key={grupo.oficina_nombre}>
                          <tr className="border-b border-slate-100 dark:border-neutral-800">
                            <td colSpan={7} className="p-1">
                               <div onClick={() => toggleOficina(grupo.oficina_nombre)} className="bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 cursor-pointer transition-colors py-2.5 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between rounded-sm">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    <span>{grupo.oficina_nombre} ({grupo.permisos.length})</span>
                                  </div>
                                  <motion.div initial={false} animate={{ rotate: estaAbierta ? 180 : 0 }} transition={{ duration: 0.3 }}><ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" /></motion.div>
                                </div>
                            </td>
                          </tr>
                          <AnimatePresence initial={false}>
                            {estaAbierta && (
                                <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ display: 'table-row' }}>
                                  <td colSpan={7} className="p-0 border-b border-slate-100 dark:border-neutral-800">
                                     <table className="w-full table-fixed">
                                        <tbody>
                                        {grupo.permisos.map((permiso) => {
                                            const puedeEliminar = tipoVista === 'gestion_rrhh' || (tipoVista === 'mis_permisos' && permiso.estado === 'pendiente');

                                            return (
                                            <tr key={permiso.id} onClick={() => handleClickFila(permiso)} className="border-b border-slate-50 dark:border-neutral-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group">
                                              <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[25%] truncate pl-8">
                                                <div className="flex flex-col">
                                                    <span className="font-medium truncate" title={permiso.usuario?.nombre}>{permiso.usuario?.nombre}</span>
                                                    <span className="text-[10px] text-gray-400 truncate" title={permiso.usuario?.puesto_nombre || ''}>{permiso.usuario?.puesto_nombre}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 capitalize w-[12%]">{permiso.tipo.replace('_', ' ')}</td>
                                              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 w-[10%] whitespace-nowrap">{format(parseISO(permiso.created_at), "d MMM yyyy", { locale: es })}</td>
                                              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 w-[20%] whitespace-nowrap"><div className="flex flex-col items-center"><span>{format(parseISO(permiso.inicio), "d MMM h:mm a", { locale: es })}</span><span className="text-[9px] text-gray-400">a</span><span>{format(parseISO(permiso.fin), "d MMM h:mm a", { locale: es })}</span></div></td>
                                              <td className="py-3 px-2 text-center w-[18%]">{getEstadoBadge(permiso.estado)}</td>
                                              <td className="py-3 px-2 text-center w-[10%]">
                                                {permiso.estado === 'aprobado' && permiso.remunerado !== null ? (
                                                    permiso.remunerado ? (
                                                        <span className="inline-flex items-center justify-center font-medium text-emerald-600 dark:text-emerald-400 text-[10px]">SÍ</span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center font-medium text-gray-500 dark:text-gray-400 text-[10px]">NO</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600 text-[10px]">--</span>
                                                )}
                                              </td>
                                              <td className="py-3 px-2 text-center w-[5%]">
                                                <div className="flex items-center justify-center gap-1">
                                                  {puedeEliminar && <button onClick={(e) => handleEliminarPermiso(e, permiso.id)} className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>}
                                                </div>
                                              </td>
                                            </tr>
                                        )})}
                                        </tbody>
                                     </table>
                                  </td>
                                </motion.tr>
                            )}
                          </AnimatePresence>
                        </Fragment>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CrearEditarPermiso 
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        permisoAEditar={permisoParaEditar}
        onSuccess={cargarDatos}
        perfilUsuario={perfilUsuario}
        tipoVista={tipoVista} 
      />
    </>
  );
}