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
import { User, Clock, LogOut, Trash2, Search, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';

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
    });
  
    if (result.isConfirmed) {
      setEliminando(true);
  
      try {
        const res = await fetch(`/api/users?id=${usuarioIdSeleccionado}`, {
          method: 'DELETE',
        });
  
        if (!res.ok) {
          const json = await res.json();
          return Swal.fire('Error', json.error || 'No se pudo eliminar el usuario.', 'error');
        }
        
        const idEliminado = usuarioIdSeleccionado;
        setListaUsuarios(prevUsuarios => prevUsuarios.filter(u => u.id !== idEliminado));
        
        handleCerrarModal();
        Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado correctamente.', 'success');
        
      } catch (error) {
        Swal.fire('Error', 'Ocurrió un error al intentar eliminar el usuario.', 'error');
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
        <div className="p-2 bg-white rounded-lg shadow-md space-y-4 w-full">
          
          <div className="flex flex-col gap-3 p-2 bg-slate-50 rounded-lg">
            
            {/* Fila 1: Selects de Dependencias (50% ancho en md+) */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-1/2">
              {cargandoDependencias ? (
                  <Cargando texto="Cargando filtros..." />
              ) : (
                <>
                  <Select onValueChange={handleNivel2Change} value={nivel2Id || 'todos'}>
                    <SelectTrigger className="bg-white text-xs w-full">
                      <SelectValue placeholder="Dependencias/Políticas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las dependencias/políticas</SelectItem>
                      {oficinasNivel2.map(oficina => (
                        <SelectItem key={oficina.id} value={oficina.id}>{oficina.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={handleNivel3Change} value={nivel3Id || 'todos'} disabled={!nivel2Id}>
                    <SelectTrigger className="bg-white text-xs w-full">
                      <SelectValue placeholder="Oficina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las oficinas</SelectItem>
                      {oficinasNivel3.map(oficina => (
                        <SelectItem key={oficina.id} value={oficina.id}>{oficina.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full items-center">
                <div className="relative w-full md:w-3/4  mt-4">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Buscar por Nombre, Dependencia o Puesto..."
                        value={terminoBusqueda}
                        onChange={(e) => setTerminoBusqueda(e.target.value)}
                        className="w-full text-xs pl-8 bg-white h-9"
                    />
                </div>
                <div className="flex w-full md:w-1/4 gap-2 mt-4">
                    {hasCreatePermission && (
                        <>
                        <Button
                            onClick={() => router.push("/protected/admin/horarios")}
                            className="flex-1 px-2 py-2 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 text-xs flex items-center justify-center gap-1 h-9"
                            title="Asignación de Horarios"
                        >
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">Horarios</span>
                        </Button>
                        <Button
                            onClick={() => router.push("/protected/admin/sign-up")}
                            className="flex-1 px-2 py-2 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 text-xs flex items-center justify-center gap-1 h-9"
                            title="Nuevo Usuario"
                        >
                            <User className="h-4 w-4" />
                            <span className="text-xs">Crear Usuario</span>
                        </Button>
                        </>
                    )}
                </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            {cargandoDependencias ? (
              <Cargando texto="Cargando usuarios..." />
            ) : usuariosAgrupados.length === 0 ? (
              <p className="text-center text-gray-500 text-xs">
                No se encontraron usuarios con los filtros seleccionados.
              </p>
            ) : (
              <div className="w-full">
                <div className="flex flex-col md:flex-row md:justify-center mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTodos}
                    className="w-full md:w-auto text-xs flex items-center justify-center gap-2 h-9 px-4 rounded-sm"
                  >
                    {todosAbiertos ? <ChevronsUp className="h-3.5 w-3.5" /> : <ChevronsDown className="h-3.5 w-3.5" />}
                    {todosAbiertos ? 'Cerrar todas las oficinas' : 'Abrir todas las oficinas'}
                  </Button>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full table-fixed text-xs">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="py-3 px-4 text-[10px] xl:text-xs w-[45%] font-semibold text-slate-600">Nombre</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[55%] font-semibold text-slate-600 pl-4">Puesto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosAgrupados.map((grupo) => {
                         const estaAbierta = oficinasAbiertas[grupo.oficina_nombre] || false;

                         return (
                          <Fragment key={grupo.path_orden}>
                            <tr className="border-b border-slate-100">
                              <td colSpan={2} className="p-1">
                                <div 
                                  onClick={() => toggleOficina(grupo.oficina_nombre)}
                                  className="bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors py-2.5 px-4 text-sm font-semibold text-blue-600 flex items-center justify-between rounded-sm"
                                >
                                  <span>{grupo.oficina_nombre} ({grupo.usuarios.length})</span>
                                  <motion.div
                                    initial={false}
                                    animate={{ rotate: estaAbierta ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <ChevronDown className="h-4 w-4 text-gray-600" />
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
                                  <td colSpan={2} className="p-0">
                                    <table className="w-full">
                                      <tbody>
                                        {grupo.usuarios.map((usuario) => (
                                          <tr
                                            key={usuario.id}
                                            onClick={() => handleVerUsuario(usuario.id)}
                                            className={`border-b border-slate-100 transition-colors hover:bg-blue-50 group ${canOpenModal ? 'cursor-pointer' : 'cursor-default'}`}
                                          >
                                            <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 w-[45%] truncate">
                                              {usuario.nombre || '—'}
                                            </td>
                                            <td className="py-3 px-2 text-[11px] xl:text-xs text-slate-600 w-[55%] truncate pl-4">
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
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="bg-white rounded-lg w-full max-w-lg min-h-[600px] p-6 shadow-xl">
              
              <div className="flex justify-between items-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleCerrarModal} 
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4 rotate-180" />
                  Salir
                </Button>

                {(rolActual === 'SUPER') && (
                  <Button
                    variant="ghost"
                    onClick={handleEliminarUsuario}
                    disabled={eliminando}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
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