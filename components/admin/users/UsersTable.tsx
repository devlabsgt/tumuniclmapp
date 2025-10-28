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
import UsuarioPage from './ver/UsuarioPage';
import UsuarioForm from './forms/UsuarioForm';
import Swal from 'sweetalert2';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import Cargando from '@/components/ui/animations/Cargando';
import { CircleAlert } from 'lucide-react';

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
  const [modoModal, setModoModal] = useState<'informacion' | 'editar'>('informacion');
  const [eliminando, setEliminando] = useState(false);

  const [nivel2Id, setNivel2Id] = useState<string | null>(null);
  const [nivel3Id, setNivel3Id] = useState<string | null>(null);
  
  const { dependencias, loading: cargandoDependencias } = useDependencias();

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
      const busquedaCoincide = terminoBusqueda === '' ||
        (usuario.nombre?.toLowerCase() || '').includes(terminoBusqueda.toLowerCase()) ||
        (usuario.email?.toLowerCase() || '').includes(terminoBusqueda.toLowerCase()) ||
        (usuario.puesto_nombre?.toLowerCase() || '').includes(terminoBusqueda.toLowerCase()) ||
        (usuario.oficina_nombre?.toLowerCase() || '').includes(terminoBusqueda.toLowerCase());

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
    setUsuarioIdSeleccionado(id);
    setModoModal('informacion');
  };

  const handleCerrarModal = () => {
    setUsuarioIdSeleccionado(null);
    setModoModal('informacion');
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
  };
  
  const handleNivel3Change = (value: string) => {
    const newId = value === 'todos' ? null : value;
    setNivel3Id(newId);
  };

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4">
        <div className="p-2 bg-white rounded-lg shadow-md space-y-4 w-full">
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 p-2 bg-slate-50 rounded-lg">
            
            <div className="w-full md:w-1/3">
              <Input
                type="text"
                placeholder="Buscar por nombre, usuario, puesto..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            {cargandoDependencias ? (
              <div className="w-full md:w-1/3">
                <Cargando texto="Cargando filtros..." />
              </div>
            ) : (
              <div className='w-full md:w-1/3 flex flex-col gap-2'>
                <Select onValueChange={handleNivel2Change} value={nivel2Id || 'todos'}>
                  <SelectTrigger className="bg-white text-xs">
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
                  <SelectTrigger className="bg-white text-xs">
                    <SelectValue placeholder="Oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las oficinas</SelectItem>
                    {oficinasNivel3.map(oficina => (
                      <SelectItem key={oficina.id} value={oficina.id}>{oficina.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-full md:w-1/3 flex justify-end">
              <Button
                onClick={() => router.push("/protected/admin/sign-up")}
                className="px-4 py-2 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex-shrink-0 text-xs w-full md:w-auto"
              >
                Nuevo Usuario
              </Button>
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
              <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed text-xs">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="py-2 px-2 text-[10px] xl:text-xs w-[30%]">Nombre</th>
                      <th className="py-2 px-2 text-[10px] xl:text-xs w-[30%]">Usuario (Email)</th>
                      <th className="py-2 px-2 text-[10px] xl:text-xs w-[40%]">Puesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosAgrupados.map((grupo) => (
                      <Fragment key={grupo.path_orden}>
                        <tr>
                          <td colSpan={3} className="bg-gray-200 text-center py-1 px-2 text-sm font-semibold text-blue-500">
                            {grupo.oficina_nombre}
                          </td>
                        </tr>
                        {grupo.usuarios.map((usuario) => (
                          <tr
                            key={usuario.id}
                            onClick={() => handleVerUsuario(usuario.id)}
                            className="border-b transition-colors hover:bg-gray-100 group cursor-pointer"
                          >
                            <td className="py-2 px-2 text-[10px] xl:text-xs text-gray-800 truncate">
                              {usuario.nombre || '—'}
                            </td>
                            <td className="py-2 px-2 text-[10px] xl:text-xs text-gray-600 truncate">
                              {usuario.email}
                            </td>
                            <td className="py-2 px-2 text-[10px] xl:text-xs text-gray-600 truncate">
                              {usuario.puesto_nombre || '—'}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Transition show={!!usuarioIdSeleccionado} as={Fragment}>
        <Dialog onClose={handleCerrarModal} className="relative z-50">
          <TransitionChild as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="bg-white rounded-lg w-full max-w-lg min-h-[600px] p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                  <Button variant="link" onClick={handleCerrarModal} className="text-blue-600 text-base underline flex-shrink-0">
                    Salir
                  </Button>
                  {(rolActual === 'SUPER') && (
                    <Button
                      variant="link"
                      onClick={handleEliminarUsuario}
                      disabled={eliminando}
                      className="text-red-600 hover:text-red-700 underline flex-shrink-0"
                    >
                      {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex rounded-md border p-1 bg-gray-50 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setModoModal('informacion')}
                      className={`flex-1 rounded-md py-2 px-4 text-sm font-semibold transition-colors duration-200 ${
                        modoModal === 'informacion' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Información
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoModal('editar')}
                      className={`flex-1 rounded-md py-2 px-4 text-sm font-semibold transition-colors duration-200 ${
                        modoModal === 'editar' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {modoModal === 'informacion' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <UsuarioPage id={usuarioIdSeleccionado} onClose={handleCerrarModal} />
                  </motion.div>
                )}
                {modoModal === 'editar' && usuarioIdSeleccionado && (
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