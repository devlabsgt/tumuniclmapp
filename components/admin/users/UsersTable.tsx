'use client';

import React, { useState, useMemo, Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import UsuarioForm from './forms/UsuarioForm';
import Swal from 'sweetalert2';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import Cargando from '@/components/ui/animations/Cargando';
import { User, Clock, LogOut, Trash2, Search, ChevronDown, ChevronsDown, ChevronsUp } from 'lucide-react';

type UsuarioConJerarquia = Usuario & {
  puesto_nombre: string | null;
  oficina_nombre: string | null;
  oficina_path_orden: string | null;
};

type Props = {
  usuarios: UsuarioConJerarquia[];
  rolActual: string | null;
};

export default function UsersTable({ usuarios, rolActual }: Props) {
  const router = useRouter();

  const [listaUsuarios, setListaUsuarios] = useState<UsuarioConJerarquia[]>(usuarios);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [usuarioIdSeleccionado, setUsuarioIdSeleccionado] = useState<string | null>(null);
  const [modoModal, setModoModal] = useState<'editar'>('editar');
  const [eliminando, setEliminando] = useState(false);

  const [nivel2Id, setNivel2Id] = useState<string | null>(null);
  const [nivel3Id, setNivel3Id] = useState<string | null>(null);
  
  const { dependencias, loading: cargandoDependencias } = useDependencias();

  const [oficinasAbiertas, setOficinasAbiertas] = useState<Record<string, boolean>>({});
  const [todosAbiertos, setTodosAbiertos] = useState(false);

  const hasCreatePermission = rolActual === 'SUPER' || rolActual === 'RRHH' || rolActual === 'SECRETARIO';
  const canOpenModal = rolActual === 'SUPER' || rolActual === 'RRHH' || rolActual === 'SECRETARIO';

  useEffect(() => {
    setListaUsuarios(usuarios);
  }, [usuarios]);

  const oficinasNivel2 = useMemo(() => {
    const rootIds = new Set(dependencias.filter(d => d.parent_id === null).map(d => d.id));
    return dependencias
      .filter(d => !d.es_puesto && d.parent_id !== null && rootIds.has(d.parent_id))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [dependencias]);

  const oficinasNivel3 = useMemo(() => {
    if (!nivel2Id) {
      return [];
    }
    return dependencias
      .filter(d => !d.es_puesto && d.parent_id === nivel2Id)
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [dependencias, nivel2Id]);

  const usuariosAgrupados = useMemo(() => {
    let usuariosFiltrados = [...listaUsuarios];
    
    let oficinasPermitidas: Set<string | null> | null = null;

    if (nivel3Id) {
      const oficina = dependencias.find(d => d.id === nivel3Id);
      if (oficina) {
        oficinasPermitidas = new Set([oficina.nombre]);
      }
    } else if (nivel2Id) {
      oficinasPermitidas = new Set(
        dependencias
          .filter(d => d.parent_id === nivel2Id && !d.es_puesto)
          .map(d => d.nombre)
      );
    }
    
    usuariosFiltrados = usuariosFiltrados.filter(usuario => {
      const lowerTermino = terminoBusqueda.toLowerCase();
      const busquedaCoincide = terminoBusqueda === '' ||
        (usuario.nombre?.toLowerCase() || '').includes(lowerTermino) ||
        (usuario.email?.toLowerCase() || '').includes(lowerTermino) ||
        (usuario.puesto_nombre?.toLowerCase() || '').includes(lowerTermino) ||
        (usuario.oficina_nombre?.toLowerCase() || '').includes(lowerTermino);

      const oficinaCoincide = !oficinasPermitidas || (oficinasPermitidas.has(usuario.oficina_nombre));

      return busquedaCoincide && oficinaCoincide;
    });


    const grupos: Record<string, { path_orden: string, usuarios: UsuarioConJerarquia[] }> = {};

    for (const usuario of usuariosFiltrados) {
      const oficina = usuario.oficina_nombre || 'Sin Oficina Asignada';
      const path = usuario.oficina_path_orden || '9999';

      if (!grupos[oficina]) {
        grupos[oficina] = { path_orden: path, usuarios: [] };
      }
      grupos[oficina].usuarios.push(usuario);
    }

    return Object.entries(grupos)
      .map(([oficina_nombre, data]) => ({
        oficina_nombre,
        path_orden: data.path_orden,
        usuarios: data.usuarios.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')),
      }))
      .sort((a, b) => a.path_orden.localeCompare(b.path_orden, undefined, { numeric: true }));

  }, [listaUsuarios, terminoBusqueda, nivel2Id, nivel3Id, dependencias]);

  const handleVerUsuario = (id: string) => {
    if (!canOpenModal) return;
    setUsuarioIdSeleccionado(id);
    setModoModal('editar');
  };

  const handleCerrarModal = () => {
    setUsuarioIdSeleccionado(null);
    setModoModal('editar');
  };
  
  const handleSuccess = () => {
    router.refresh();
  };

  const handleCancel = () => {
    handleCerrarModal();
  };

  const handleEliminarUsuario = async () => {
    if (!usuarioIdSeleccionado) return;
  
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer.',
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
      setEliminando(true);
  
      try {
        const res = await fetch(`/api/users?id=${usuarioIdSeleccionado}`, {
          method: 'DELETE',
        });
  
        if (!res.ok) {
          const json = await res.json();
          return Swal.fire({
            title: 'Error',
            text: json.error || 'No se pudo eliminar el usuario.',
            icon: 'error',
            background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
          });
        }
        
        const idEliminado = usuarioIdSeleccionado;
        setListaUsuarios(prevUsuarios => prevUsuarios.filter(u => u.id !== idEliminado));
        
        handleCerrarModal();
        Swal.fire({
            title: '¡Eliminado!',
            text: 'El usuario ha sido eliminado correctamente.',
            icon: 'success',
            background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
        });
        
      } catch (error) {
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al intentar eliminar el usuario.',
            icon: 'error',
            background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
        });
      } finally {
        setEliminando(false);
      }
    }
  };

  const handleNivel2Change = (value: string) => {
    const newId = value === 'todos' ? null : value;
    setNivel2Id(newId);
    setNivel3Id(null); 
    setOficinasAbiertas({});
    setTodosAbiertos(false);
  };
  
  const handleNivel3Change = (value: string) => {
    const newId = value === 'todos' ? null : value;
    setNivel3Id(newId);
    setOficinasAbiertas({});
    setTodosAbiertos(false);
  };

  const toggleOficina = (nombreOficina: string) => {
    setOficinasAbiertas(prev => ({
      ...prev,
      [nombreOficina]: !prev[nombreOficina]
    }));
  };

  const toggleTodos = () => {
    const nuevoEstado = !todosAbiertos;
    setTodosAbiertos(nuevoEstado);
    const nuevasOficinasAbiertas: Record<string, boolean> = {};
    usuariosAgrupados.forEach(grupo => {
      nuevasOficinasAbiertas[grupo.oficina_nombre] = nuevoEstado;
    });
    setOficinasAbiertas(nuevasOficinasAbiertas);
  };

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4">
        <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-gray-100 dark:border-neutral-800 space-y-4 w-full transition-colors duration-200">
          
          <div className="flex flex-col xl:flex-row gap-2 w-full items-center p-2 bg-slate-50 dark:bg-neutral-900 rounded-lg">
            
            <div className="flex shrink-0">
               <Button
                variant="outline"
                size="icon"
                onClick={toggleTodos}
                className="h-9 w-9 bg-white dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-700 dark:hover:bg-neutral-700"
                title={todosAbiertos ? 'Cerrar todas las oficinas' : 'Abrir todas las oficinas'}
              >
                {todosAbiertos ? <ChevronsUp className="h-4 w-4" /> : <ChevronsDown className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto shrink-0">
              {cargandoDependencias ? (
                  <Cargando texto="Cargando..." />
              ) : (
                <>
                  <Select onValueChange={handleNivel2Change} value={nivel2Id || 'todos'}>
                    <SelectTrigger className="bg-white dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 text-xs w-full sm:w-[200px] h-9">
                      <SelectValue placeholder="Dependencia" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
                      <SelectItem value="todos" className="dark:text-gray-200 dark:focus:bg-neutral-700">Todas</SelectItem>
                      {oficinasNivel2.map(oficina => (
                        <SelectItem key={oficina.id} value={oficina.id} className="dark:text-gray-200 dark:focus:bg-neutral-700">{oficina.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={handleNivel3Change} value={nivel3Id || 'todos'} disabled={!nivel2Id}>
                    <SelectTrigger className="bg-white dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 text-xs w-full sm:w-[200px] h-9">
                      <SelectValue placeholder="Oficina" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
                      <SelectItem value="todos" className="dark:text-gray-200 dark:focus:bg-neutral-700">Todas</SelectItem>
                      {oficinasNivel3.map(oficina => (
                        <SelectItem key={oficina.id} value={oficina.id} className="dark:text-gray-200 dark:focus:bg-neutral-700">{oficina.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className="relative w-full flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Buscar por Nombre..."
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                    className="w-full text-xs pl-8 bg-white dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 h-9"
                />
            </div>

            <div className="flex gap-2 shrink-0 w-full xl:w-auto">
                {hasCreatePermission && (
                    <>
                    <Button
                        onClick={() => router.push("/protected/admin/horarios")}
                        className="flex-1 xl:flex-none px-3 py-2 text-white bg-blue-600 dark:bg-blue-700 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs flex items-center justify-center gap-1 h-9"
                        title="Horarios"
                    >
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs hidden sm:inline">Horarios</span>
                    </Button>
                    <Button
                        onClick={() => router.push("/protected/admin/sign-up")}
                        className="flex-1 xl:flex-none px-3 py-2 text-white bg-green-600 dark:bg-green-700 rounded-lg font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 text-xs flex items-center justify-center gap-1 h-9"
                        title="Nuevo Usuario"
                    >
                        <User className="h-3.5 w-3.5" />
                        <span className="text-xs hidden sm:inline">Crear</span>
                    </Button>
                    </>
                )}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-neutral-800 pt-2 mt-2">
            {cargandoDependencias ? (
              <Cargando texto="Cargando usuarios..." />
            ) : usuariosAgrupados.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
                No se encontraron usuarios con los filtros seleccionados.
              </p>
            ) : (
              <div className="w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full table-fixed text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-900 text-left border-b border-gray-100 dark:border-neutral-800">
                      <tr>
                        <th className="py-3 px-4 text-[10px] xl:text-xs w-[35%] font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[35%] font-semibold text-slate-600 dark:text-slate-400 pl-4">Usuario</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] font-semibold text-slate-600 dark:text-slate-400 pl-4">Puesto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosAgrupados.map((grupo) => {
                         const estaAbierta = oficinasAbiertas[grupo.oficina_nombre] || false;

                         return (
                          <Fragment key={grupo.path_orden}>
                            <tr className="border-b border-slate-100 dark:border-neutral-800">
                              <td colSpan={3} className="p-1">
                                <div 
                                  onClick={() => toggleOficina(grupo.oficina_nombre)}
                                  className="bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 cursor-pointer transition-colors py-2.5 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between rounded-sm"
                                >
                                  <span>{grupo.oficina_nombre} ({grupo.usuarios.length})</span>
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
                                  style={{ overflow: 'hidden' }}
                                >
                                  <td colSpan={3} className="p-0">
                                    <table className="w-full">
                                      <tbody>
                                        {grupo.usuarios.map((usuario) => (
                                          <tr
                                            key={usuario.id}
                                            onClick={() => handleVerUsuario(usuario.id)}
                                            className={`border-b border-slate-100 dark:border-neutral-800 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 group ${canOpenModal ? 'cursor-pointer' : 'cursor-default'}`}
                                          >
                                            <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[35%] truncate">
                                              {usuario.nombre || '—'}
                                            </td>
                                            <td className="py-3 px-2 text-[11px] xl:text-xs text-slate-600 dark:text-slate-400 w-[35%] truncate pl-4">
                                              {usuario.email || '—'}
                                            </td>
                                            <td className="py-3 px-2 text-[11px] xl:text-xs text-slate-600 dark:text-slate-400 w-[30%] truncate pl-4">
                                              {usuario.puesto_nombre || '—'}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Transition show={!!usuarioIdSeleccionado} as={Fragment}>
        <Dialog onClose={() => {}} className="relative z-50">
          <TransitionChild as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="bg-white dark:bg-neutral-900 rounded-lg w-full max-w-lg min-h-[600px] p-6 shadow-xl border dark:border-neutral-800">
              
              <div className="flex justify-between items-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleCerrarModal} 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4 rotate-180" />
                  Salir
                </Button>

                {(rolActual === 'SUPER') && (
                  <Button
                    variant="ghost"
                    onClick={handleEliminarUsuario}
                    disabled={eliminando}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {eliminando ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {usuarioIdSeleccionado && (
                  <motion.div
                    key="editar"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <UsuarioForm 
                      id={usuarioIdSeleccionado} 
                      onSuccess={handleSuccess} 
                      onCancel={handleCancel} 
                      rolUsuarioActual={rolActual || ''}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}