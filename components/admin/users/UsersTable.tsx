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

type Props = {
  usuarios: Usuario[];
  rolActual: string | null;
};

export default function UsersTable({ usuarios, rolActual }: Props) {
  const router = useRouter();

  const [listaUsuarios, setListaUsuarios] = useState(usuarios);
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [usuarioIdSeleccionado, setUsuarioIdSeleccionado] = useState<string | null>(null);
  const [modoModal, setModoModal] = useState<'informacion' | 'editar'>('informacion');
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    setListaUsuarios(usuarios);
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    let usuariosOrdenados = [...listaUsuarios].sort((a, b) =>
      (a.nombre || '').localeCompare(b.nombre || '')
    );

    if (terminoBusqueda) {
      const termino = terminoBusqueda.toLowerCase();
      usuariosOrdenados = usuariosOrdenados.filter(
        (usuario) =>
          (usuario.nombre?.toLowerCase() || '').includes(termino) ||
          (usuario.email?.toLowerCase() || '').includes(termino) ||
          (usuario.rol?.toLowerCase() || '').includes(termino)
      );
    }
    return usuariosOrdenados;
  }, [listaUsuarios, terminoBusqueda]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const inicio = (paginaActual - 1) * usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(inicio, inicio + usuariosPorPagina);

  const usuariosAgrupados = useMemo(() => {
    return usuariosPaginados.reduce((acc, usuario) => {
      const primeraLetra = (usuario.nombre || '#').charAt(0).toUpperCase();
      if (!acc[primeraLetra]) {
        acc[primeraLetra] = [];
      }
      acc[primeraLetra].push(usuario);
      return acc;
    }, {} as Record<string, Usuario[]>);
  }, [usuariosPaginados]);

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

  return (
    <div className="w-full mx-auto md:px-4">
      <div className="flex justify-between items-center mb-4 gap-4">
        <Input
          type="text"
          placeholder="Buscar por nombre, correo o rol..."
          value={terminoBusqueda}
          onChange={(e) => {
            setTerminoBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          className="flex-grow"
        />
          <Button
            onClick={() => router.push("/protected/admin/sign-up")}
            className="px-4 py-2 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex-shrink-0"
          >
            Nuevo Usuario
          </Button>
      </div>

      <div className="w-full overflow-x-auto border-[2.5px] border-gray-400">
        <table className="w-full border-collapse border-[2.5px] border-gray-300 text-xs sm:text-sm table-fixed">
          <thead>
            <tr className="text-left text-xs sm:text-sm font-semibold bg-gray-200 border-b-[2.5px] border-gray-400">
              <th className="p-2 border-[1.5px] border-gray-300 text-center w-[40px]">No.</th>
              <th className="p-2 border-[1.5px] border-gray-300 text-center w-[250px]">Nombre</th>
              <th className="p-2 border-[1.5px] border-gray-300 text-center w-[250px]">Correo</th>
              <th className="p-2 border-[1.5px] border-gray-300 text-center w-[150px]">Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-muted-foreground border-[1.5px] border-gray-300">
                  No hay resultados
                </td>
              </tr>
            ) : (
              Object.keys(usuariosAgrupados).sort().map((letra) => (
                <Fragment key={letra}>
                  <tr className="bg-slate-100">
                    <td colSpan={4} className="px-2 py-1 font-bold text-slate-700 text-xs sm:text-base text-center">
                      {letra}
                    </td>
                  </tr>
                  {usuariosAgrupados[letra].map((usuario) => (
                    <tr
                      key={usuario.id}
                      onClick={() => handleVerUsuario(usuario.id)}
                      className="hover:bg-gray-50 border-[1.5px] border-gray-300 cursor-pointer"
                    >
                      <td className="p-2 border-[1.5px] border-gray-300 text-center">
                        {usuariosFiltrados.findIndex(u => u.id === usuario.id) + 1}
                      </td>
                      <td className="p-2 border-[1.5px] border-gray-300 truncate">{usuario.nombre || '—'}</td>
                      <td className="p-2 border-[1.5px] border-gray-300 truncate">{usuario.email}</td>
                      <td className="p-2 border-[1.5px] border-gray-300 truncate">{usuario.rol || '—'}</td>
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6 mb-4 gap-2 flex-wrap items-center text-sm">
        <span className="font-medium">Ver por:</span>
        <select
          value={usuariosPorPagina}
          onChange={(e) => {
            setUsuariosPorPagina(parseInt(e.target.value));
            setPaginaActual(1);
          }}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex justify-center mt-2 mb-6 gap-2 flex-wrap">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
          className={`px-3 py-2 rounded border ${
            paginaActual === 1 ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-blue-50'
          }`}
        >
          ←
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPaginaActual(n)}
            className={`px-4 py-2 rounded border font-medium ${
              paginaActual === n ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={paginaActual === totalPaginas}
          className={`px-3 py-2 rounded border ${
            paginaActual === totalPaginas ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-blue-50'
          }`}
        >
          →
        </button>
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
    </div>
  );
}