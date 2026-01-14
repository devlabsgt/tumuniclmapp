'use client';

import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronDown, 
  ChevronsUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search,
  Building2,
  Plus,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermisoEmpleado, PermisosPorOficina, UsuarioConJerarquia as UsuarioLocal } from './types';
import { obtenerPermisos, eliminarPermiso, obtenerPerfilUsuario, PerfilUsuario } from './acciones';
import Cargando from '@/components/ui/animations/Cargando';
import CrearEditarPermiso from './modals/CrearEditarPermiso';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function VerPermisos() {
  const [registrosRaw, setRegistrosRaw] = useState<PermisoEmpleado[]>([]);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  
  const { usuarios: usuariosHook } = useListaUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [oficinasAbiertas, setOficinasAbiertas] = useState<Record<string, boolean>>({});
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');
  
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [permisoParaEditar, setPermisoParaEditar] = useState<PermisoEmpleado | null>(null);

  const usuariosAdaptados = useMemo(() => {
    return (usuariosHook as unknown) as UsuarioLocal[];
  }, [usuariosHook]);

  const esAdmin = useMemo(() => {
    return ['SUPER', 'RRHH', 'SECRETARIO'].includes(perfilUsuario?.rol || '');
  }, [perfilUsuario]);

  useEffect(() => {
    const init = async () => {
      setLoadingPermisos(true);
      try {
        const [data, perfil] = await Promise.all([
          obtenerPermisos(mesSeleccionado, anioSeleccionado),
          obtenerPerfilUsuario()
        ]);
        setRegistrosRaw(data);
        setPerfilUsuario(perfil);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPermisos(false);
      }
    };
    init();
  }, [mesSeleccionado, anioSeleccionado]);

  const cargarDatos = async () => {
    try {
      const data = await obtenerPermisos(mesSeleccionado, anioSeleccionado);
      setRegistrosRaw(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNuevoPermiso = () => {
    setPermisoParaEditar(null);
    setModalAbierto(true);
  };

  const handleEditarPermiso = (e: React.MouseEvent, permiso: PermisoEmpleado) => {
    e.stopPropagation();
    setPermisoParaEditar(permiso);
    setModalAbierto(true);
  };

  const handleEliminarPermiso = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
      color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
    });

    if (result.isConfirmed) {
      try {
        await eliminarPermiso(id);
        await cargarDatos();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El permiso ha sido eliminado correctamente.',
          icon: 'success',
          background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
          color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el permiso.',
          icon: 'error',
          background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
          color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
        });
      }
    }
  };

  const registrosEnriquecidos = useMemo(() => {
    if (!usuariosAdaptados.length) return [];
    return registrosRaw.map(permiso => {
      const usuarioEncontrado = usuariosAdaptados.find(u => u.id === permiso.user_id);
      return {
        ...permiso,
        usuario: usuarioEncontrado
      };
    });
  }, [registrosRaw, usuariosAdaptados]);

  const { permisosVisibles, usuariosParaModal } = useMemo(() => {
    if (!perfilUsuario) return { permisosVisibles: [], usuariosParaModal: [] };

    let permisosFiltrados = [...registrosEnriquecidos];
    let usuariosFiltrados = [...usuariosAdaptados];
    
    if (!esAdmin) {
      if (perfilUsuario.esJefe) {
        permisosFiltrados = permisosFiltrados.filter(p => 
          p.usuario?.dependencia_id === perfilUsuario.dependenciaId
        );
        usuariosFiltrados = usuariosFiltrados.filter(u => 
          u.dependencia_id === perfilUsuario.dependenciaId || u.id === perfilUsuario.id
        );
      } else {
        permisosFiltrados = permisosFiltrados.filter(p => p.user_id === perfilUsuario.id);
        usuariosFiltrados = usuariosFiltrados.filter(u => u.id === perfilUsuario.id);
      }
    }

    return { 
      permisosVisibles: permisosFiltrados, 
      usuariosParaModal: usuariosFiltrados
    };
  }, [registrosEnriquecidos, usuariosAdaptados, perfilUsuario, esAdmin]);

  const registrosFinales = useMemo(() => {
    return permisosVisibles.filter(r => {
      const nombreEmpleado = r.usuario?.nombre?.toLowerCase() || '';
      const nombreOficina = r.usuario?.oficina_nombre?.toLowerCase() || '';
      const termino = searchTerm.toLowerCase();
      
      const matchBusqueda = nombreEmpleado.includes(termino) || nombreOficina.includes(termino);
      const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
      const existeUsuario = !!r.usuario;
      
      return matchBusqueda && matchEstado && existeUsuario;
    });
  }, [permisosVisibles, searchTerm, filtroEstado]);

  const datosAgrupados = useMemo(() => {
    const grupos: Record<string, PermisosPorOficina> = {};

    registrosFinales.forEach(r => {
      const nombreOficina = r.usuario?.oficina_nombre || 'Sin Oficina Asignada';
      const pathOrden = r.usuario?.oficina_path_orden || '9999';
      
      if (!grupos[nombreOficina]) {
        grupos[nombreOficina] = {
          oficina_nombre: nombreOficina,
          path_orden: pathOrden,
          permisos: []
        };
      }
      grupos[nombreOficina].permisos.push(r);
    });

    return Object.values(grupos).sort((a, b) => 
        a.path_orden.localeCompare(b.path_orden, undefined, { numeric: true })
    );
  }, [registrosFinales]);

  const estadisticas = useMemo(() => {
    let pendientes = 0; let aprobados = 0; let rechazados = 0;
    registrosFinales.forEach(r => {
      if (r.estado === 'pendiente') pendientes++;
      if (r.estado === 'aprobado') aprobados++;
      if (r.estado === 'rechazado') rechazados++;
    });
    return { pendientes, aprobados, rechazados };
  }, [registrosFinales]);

  const toggleOficina = (nombre: string) => {
    setOficinasAbiertas(prev => ({ ...prev, [nombre]: !prev[nombre] }));
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">Aprobado</span>;
      case 'rechazado':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">Rechazado</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">Pendiente</span>;
    }
  };

  const aniosDisponibles = useMemo(() => {
    const actual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => actual - 2 + i);
  }, []);

  const isLoading = loadingPermisos;

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4">
        <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-md w-full border border-gray-100 dark:border-neutral-800 transition-colors duration-200">
          
          <div className="flex flex-col gap-4 mb-6 p-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Gestión de Permisos</h2>
              
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded p-1">
                  <CalendarDays className="w-4 h-4 text-gray-500 ml-2" />
                  <select 
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                    className="bg-transparent text-xs font-medium focus:outline-none p-1.5 cursor-pointer dark:text-gray-200 dark:bg-neutral-900"
                  >
                    {MESES.map((mes, index) => (
                      <option key={index} value={index + 1}>{mes}</option>
                    ))}
                  </select>
                  <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700 mx-1"></div>
                  <select 
                    value={anioSeleccionado}
                    onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                    className="bg-transparent text-xs font-medium focus:outline-none p-1.5 cursor-pointer mr-1 dark:text-gray-200 dark:bg-neutral-900"
                  >
                    {aniosDisponibles.map((anio) => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>

                 <Button 
                   size="sm"
                   onClick={handleNuevoPermiso}
                   className="h-8 text-xs bg-black dark:bg-white text-white dark:text-black hover:opacity-90 ml-2"
                 >
                   <Plus className="w-3 h-3 mr-1.5" />
                   Nuevo Permiso
                 </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empleado u oficina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-200"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                 <Button
                    size="sm"
                    onClick={() => setFiltroEstado(prev => prev === 'pendiente' ? 'todos' : 'pendiente')}
                    className={`h-7 px-3 text-[10px] rounded-sm border transition-all ${
                      filtroEstado === 'pendiente'
                        ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                        : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30'
                    }`}
                 >
                   <Clock className="w-3 h-3 mr-1.5" />
                   Pendientes: {estadisticas.pendientes}
                 </Button>

                 <Button
                    size="sm"
                    onClick={() => setFiltroEstado(prev => prev === 'aprobado' ? 'todos' : 'aprobado')}
                    className={`h-7 px-3 text-[10px] rounded-sm border transition-all ${
                      filtroEstado === 'aprobado'
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                    }`}
                 >
                   <CheckCircle2 className="w-3 h-3 mr-1.5" />
                   Aprobados: {estadisticas.aprobados}
                 </Button>

                 <Button
                    size="sm"
                    onClick={() => setFiltroEstado(prev => prev === 'rechazado' ? 'todos' : 'rechazado')}
                    className={`h-7 px-3 text-[10px] rounded-sm border transition-all ${
                      filtroEstado === 'rechazado'
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                        : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                    }`}
                 >
                   <XCircle className="w-3 h-3 mr-1.5" />
                   Rechazados: {estadisticas.rechazados}
                 </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-neutral-800 pt-2 mt-2">
            {isLoading ? (
              <Cargando texto="Cargando permisos..." />
            ) : datosAgrupados.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-8">No hay permisos registrados en este mes.</p>
            ) : (
              <div className="w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full table-fixed text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-900 text-left border-b border-gray-100 dark:border-neutral-800">
                      <tr>
                        <th className="py-3 px-4 text-[10px] xl:text-xs w-[30%] font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[15%] text-center font-semibold text-slate-600 dark:text-slate-400">Tipo</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[10%] text-center font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[20%] text-center font-semibold text-slate-600 dark:text-slate-400">Duración</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[10%] text-center font-semibold text-slate-600 dark:text-slate-400">Estado</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[10%] text-center font-semibold text-slate-600 dark:text-slate-400">Remunerado</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[5%] text-center font-semibold text-slate-600 dark:text-slate-400"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosAgrupados.map((grupo) => {
                        const estaAbierta = oficinasAbiertas[grupo.oficina_nombre] || false;
                        
                        return (
                        <Fragment key={grupo.oficina_nombre}>
                          <tr className="border-b border-slate-100 dark:border-neutral-800">
                            <td colSpan={7} className="p-1">
                               <div 
                                  onClick={() => toggleOficina(grupo.oficina_nombre)}
                                  className="bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 cursor-pointer transition-colors py-2.5 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between rounded-sm"
                                >
                                  <div className="flex items-center gap-2">
                                     <Building2 className="w-4 h-4" />
                                     <span>{grupo.oficina_nombre} ({grupo.permisos.length})</span>
                                  </div>
                                  <motion.div
                                    initial={false}
                                    animate={{ rotate: estaAbierta ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </motion.div>
                                </div>
                            </td>
                          </tr>
                          
                          <AnimatePresence initial={false}>
                            {estaAbierta && (
                                <motion.tr
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  style={{ display: 'table-row' }} 
                                >
                                  <td colSpan={7} className="p-0 border-b border-slate-100 dark:border-neutral-800">
                                     <table className="w-full table-fixed">
                                        <tbody>
                                        {grupo.permisos.map((permiso) => (
                                            <tr 
                                              key={permiso.id} 
                                              onClick={(e) => handleEditarPermiso(e, permiso)}
                                              className="border-b border-slate-50 dark:border-neutral-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group"
                                            >
                                              <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[30%] truncate pl-8">
                                                <div className="flex flex-col">
                                                    <span className="font-medium truncate" title={permiso.usuario?.nombre}>{permiso.usuario?.nombre}</span>
                                                    <span className="text-[10px] text-gray-400 truncate" title={permiso.usuario?.puesto_nombre || ''}>{permiso.usuario?.puesto_nombre}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 capitalize w-[15%]">
                                                {permiso.tipo.replace('_', ' ')}
                                              </td>
                                              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 w-[10%] whitespace-nowrap">
                                                {format(parseISO(permiso.created_at), "d MMM yyyy", { locale: es })}
                                              </td>
                                              <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400 w-[20%] whitespace-nowrap">
                                                <div className="flex flex-col items-center">
                                                  <span>{format(parseISO(permiso.inicio), "d MMM h:mm a", { locale: es })}</span>
                                                  <span className="text-[9px] text-gray-400">a</span>
                                                  <span>{format(parseISO(permiso.fin), "d MMM h:mm a", { locale: es })}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 px-2 text-center w-[10%]">
                                                {getEstadoBadge(permiso.estado)}
                                              </td>
                                              <td className="py-3 px-2 text-center w-[10%]">
                                                {permiso.estado === 'aprobado' ? (
                                                    permiso.remunerado ? (
                                                        <span className="inline-flex items-center justify-center font-medium text-emerald-600 dark:text-emerald-400 text-[10px]">SÍ</span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center text-gray-400 text-[10px]">NO</span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600 text-[10px]">--</span>
                                                )}
                                              </td>
                                              <td className="py-3 px-2 text-center w-[5%]">
                                                <div className="flex items-center justify-center">
                                                  {esAdmin && permiso.estado === 'pendiente' && (
                                                    <button 
                                                      onClick={(e) => handleEliminarPermiso(e, permiso.id)}
                                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                      title="Eliminar"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                        ))}
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
        usuarios={usuariosParaModal} 
      />
    </>
  );
}