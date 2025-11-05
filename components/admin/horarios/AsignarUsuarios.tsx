'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import Cargando from '@/components/ui/animations/Cargando';
import { fetchUsuariosConHorario, asignarHorarioUsuario } from './actions';
import type { Horario, UsuarioConHorario } from './actions';
import { Search, X, Loader2, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

interface AsignarUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  horario: Horario;
}

// Componente para una sola fila de usuario en el modal
function FilaUsuario({ 
  usuario, 
  horarioQueSeAsigna, 
  onUsuarioAsignado 
}: { 
  usuario: UsuarioConHorario; 
  horarioQueSeAsigna: Horario;
  onUsuarioAsignado: (userId: string, newHorarioId: string | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  
  const tieneEsteHorario = usuario.horario_id === horarioQueSeAsigna.id;
  const tieneOtroHorario = usuario.horario_id && usuario.horario_id !== horarioQueSeAsigna.id;
  const esHorarioNormal = horarioQueSeAsigna.nombre === 'Normal' && usuario.horario_id === null;

  const handleAsignar = async () => {
    setIsSaving(true);
    
    // Si el usuario ya tiene este horario, la acción es "Quitar" (asignar a Normal/null)
    if (tieneEsteHorario) {
      const success = await asignarHorarioUsuario(usuario.user_id, null);
      if (success) {
        toast.success(`Horario quitado a ${usuario.nombre}. (Vuelve a Normal)`);
        onUsuarioAsignado(usuario.user_id, null);
      }
      setIsSaving(false);
      return;
    }

    // Si tiene otro horario, pedir confirmación
    if (tieneOtroHorario) {
      const { isConfirmed } = await Swal.fire({
        title: 'Confirmar reasignación',
        html: `Este usuario ya tiene el horario <b>${usuario.horario_nombre || 'desconocido'}</b>.<br/>¿Desea cambiarlo a <b>${horarioQueSeAsigna.nombre}</b>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      });

      if (!isConfirmed) {
        setIsSaving(false);
        return;
      }
    }

    // Asignar el nuevo horario
    const success = await asignarHorarioUsuario(usuario.user_id, horarioQueSeAsigna.id);
    if (success) {
      toast.success(`Horario asignado a ${usuario.nombre}.`);
      onUsuarioAsignado(usuario.user_id, horarioQueSeAsigna.id);
    }
    
    setIsSaving(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 hover:bg-gray-50">
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-800">{usuario.nombre}</span>
        {/* Mostramos el estado actual */}
        {(tieneEsteHorario || esHorarioNormal) && (
          <span className="text-xs text-green-600 font-semibold">
            Asignado: {horarioQueSeAsigna.nombre}
          </span>
        )}
        {tieneOtroHorario && (
          <span className="text-xs text-amber-600 font-semibold">
            Asignado a: {usuario.horario_nombre}
          </span>
        )}
      </div>
      
      <Button
        size="sm"
        onClick={handleAsignar}
        disabled={isSaving}
        className={`text-xs px-2 py-1 h-auto ${
          (tieneEsteHorario || esHorarioNormal) 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSaving 
          ? <Loader2 className="h-4 w-4 animate-spin" /> 
          : (tieneEsteHorario || esHorarioNormal) 
            ? 'Quitar' 
            : 'Asignar'}
      </Button>
    </div>
  );
}

// Componente principal del Modal
export default function AsignarUsuario({ isOpen, onClose, horario }: AsignarUsuarioProps) {
  const [usuarios, setUsuarios] = useState<UsuarioConHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const dataUsuarios = await fetchUsuariosConHorario();
    setUsuarios(dataUsuarios);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const { usuariosAsignados, usuariosFiltrados } = useMemo(() => {
    const asignados = usuarios.filter(u => 
      u.horario_id === horario.id || (horario.nombre === 'Normal' && u.horario_id === null)
    );
    
    let filtrados: UsuarioConHorario[] = [];
    if (searchTerm) {
      filtrados = usuarios.filter(u => 
        u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        u.horario_id !== horario.id &&
        !(horario.nombre === 'Normal' && u.horario_id === null)
      );
    }
    
    return { usuariosAsignados: asignados, usuariosFiltrados: filtrados };
  }, [usuarios, searchTerm, horario]);
  
  const handleUsuarioAsignado = (userId: string, newHorarioId: string | null) => {
    // Actualiza la lista localmente
    setUsuarios(prevUsuarios => 
      prevUsuarios.map(u => 
        u.user_id === userId 
        ? { ...u, horario_id: newHorarioId, horario_nombre: newHorarioId === null ? 'Normal' : horario.nombre } 
        : u
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-800">Asignar Horario</h2>
                <p className="text-xs font-semibold text-blue-600">{horario.nombre}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuario para asignar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full text-xs"
                />
              </div>
            </div>

            <div className="flex-grow p-4 pt-0 overflow-y-auto space-y-2">
              {loading ? (
                <Cargando texto="Cargando usuarios..." />
              ) : (
                <>
                  {/* Lista de usuarios encontrados por el buscador */}
                  {searchTerm && usuariosFiltrados.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-500 mt-2">Resultados de búsqueda:</h4>
                      {usuariosFiltrados.map(usuario => (
                        <FilaUsuario 
                          key={usuario.user_id}
                          usuario={usuario}
                          horarioQueSeAsigna={horario}
                          onUsuarioAsignado={handleUsuarioAsignado}
                        />
                      ))}
                      <hr className="my-4" />
                    </div>
                  )}

                  {/* Lista de usuarios ya asignados a este horario */}
                  <h4 className="text-xs font-semibold text-gray-500">
                    Usuarios ya asignados a este horario ({usuariosAsignados.length}):
                  </h4>
                  {usuariosAsignados.length === 0 ? (
                    <p className="text-center text-xs text-gray-500 py-4">Aún no hay usuarios asignados a este horario.</p>
                  ) : (
                    usuariosAsignados.map(usuario => (
                      <FilaUsuario 
                        key={usuario.user_id}
                        usuario={usuario}
                        horarioQueSeAsigna={horario}
                        onUsuarioAsignado={handleUsuarioAsignado}
                      />
                    ))
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <Button variant="outline" onClick={onClose} className="text-xs">
                Cerrar
              </Button>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}