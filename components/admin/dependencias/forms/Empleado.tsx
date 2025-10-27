'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UserCheck } from 'lucide-react';
import { Usuario } from '@/lib/usuarios/esquemas';
import { DependenciaNode } from '../DependenciaItem';
import Swal from 'sweetalert2'; 

interface Dependencia {
    id: string;
    no: number | null;
    nombre: string;
    descripcion: string | null;
    parent_id: string | null;
    es_puesto: boolean | null;
}

interface Asignacion {
    userId: string;
    puestoNombre: string;
    puestoId: string;
}

interface EmpleadoFormProps {
  isOpen: boolean;
  onClose: () => void;
  dependencia: DependenciaNode | null;
  usuarios: Usuario[];
  empleadosAsignados: Asignacion[]; 
  todasLasDependencias: Dependencia[]; 
  onSave: (userId: string, dependenciaId: string) => void;
}

export default function EmpleadoForm({ isOpen, onClose, dependencia, usuarios, empleadosAsignados, todasLasDependencias, onSave }: EmpleadoFormProps) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Usuario[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setBusqueda('');
        setResultados([]);
        setEmpleadoSeleccionado(null);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (busqueda.length > 1 && !empleadoSeleccionado) {
      const filtrados = usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
      );
      setResultados(filtrados);
    } else {
      setResultados([]);
    }
  }, [busqueda, usuarios, empleadoSeleccionado]);

  const handleSeleccion = (user: Usuario) => {
    setEmpleadoSeleccionado(user);
    setBusqueda('');
    setResultados([]);
  };

  const handleQuitarSeleccion = () => {
    setEmpleadoSeleccionado(null);
  };
  
  const handleGuardar = () => {
    if (!empleadoSeleccionado || !dependencia) return;

    const asignacionExistente = empleadosAsignados.find(a => a.userId === empleadoSeleccionado.id);

    if (asignacionExistente && asignacionExistente.puestoId !== dependencia.id) {
        
        const puestoActual = todasLasDependencias.find(d => d.id === asignacionExistente.puestoId);
        const padreActual = puestoActual?.parent_id ? todasLasDependencias.find(d => d.id === puestoActual.parent_id) : null;
        
        const infoPadre = padreActual ? ` en <strong>${padreActual.nombre}</strong>` : '';

        Swal.fire({
            icon: 'warning',
            title: '¡Empleado ya asignado!',
            html: `
                El empleado: <strong>${empleadoSeleccionado.nombre}</strong>, 
                ya está asignado al puesto: <strong>${asignacionExistente.puestoNombre}</strong>${infoPadre}.
                <br/><br/>
                Favor desasignelo antes y vuelva a asignarlo.
            `,
            confirmButtonText: 'Entendido',
            customClass: {
                popup: 'text-sm',
                title: 'text-base'
            }
        });
        return;
    }

    onSave(empleadoSeleccionado.id, dependencia.id);
  };

  if (!isOpen || !dependencia) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="relative w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Añadir Empleado</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Añadiendo empleado a: <span className="font-medium">{dependencia.nombre}</span>
          </p>
        </div>

        <div className="py-4 space-y-4">
          {!empleadoSeleccionado ? (
            <div className="relative">
              <Input id="empleado-search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar empleado por nombre..." autoComplete="off" />
              {resultados.length > 0 && (
                <div className="absolute w-full bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md mt-1 z-50 max-h-48 overflow-y-auto shadow-lg">
                  {resultados.map((user) => (
                    <button type="button" key={user.id} className="w-full text-left p-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSeleccion(user)}>
                      {user.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 border rounded-lg">
                <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">{empleadoSeleccionado.nombre}</span>
                </div>
                <button type="button" onClick={handleQuitarSeleccion} className="p-1 text-red-500 hover:text-red-700 rounded-sm hover:bg-red-100 dark:hover:bg-red-900/50">
                    <X size={16} />
                </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleGuardar} disabled={!empleadoSeleccionado}>
            Guardar Empleado
          </Button>
        </div>
      </div>
    </div>
  );
}