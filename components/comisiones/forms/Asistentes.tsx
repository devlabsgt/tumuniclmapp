'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Usuario } from '@/lib/usuarios/esquemas';
import { ComisionFormData } from '@/lib/comisiones/esquemas';

interface AsistentesProps {
  usuarios: Usuario[];
}

export default function Asistentes({ usuarios }: AsistentesProps) {
  const { setValue, watch, formState: { errors } } = useFormContext<ComisionFormData>();
  const [busquedaEncargado, setBusquedaEncargado] = useState('');
  const [busquedaAsistente, setBusquedaAsistente] = useState('');
  const [resultadosBusquedaEncargado, setResultadosBusquedaEncargado] = useState<Usuario[]>([]);
  const [resultadosBusquedaAsistente, setResultadosBusquedaAsistente] = useState<Usuario[]>([]);

  const encargadoId = watch('encargadoId') || '';
  const userIds = watch('userIds') || [];

  const encargadoSeleccionado = useMemo(() => {
    return usuarios.find(u => u.id === encargadoId) || null;
  }, [usuarios, encargadoId]);

  const asistentesAsignados = useMemo(() => {
    return usuarios.filter(u => userIds?.includes(u.id));
  }, [usuarios, userIds]);

  useEffect(() => {
    const idsAsignados = [encargadoId, ...(userIds || [])].filter(Boolean) as string[];
    
    if (busquedaEncargado.length > 1 && !encargadoSeleccionado) {
      const filtrados = usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(busquedaEncargado.toLowerCase()) &&
        !idsAsignados.includes(u.id)
      );
      setResultadosBusquedaEncargado(filtrados);
    } else {
      setResultadosBusquedaEncargado([]);
    }
  }, [busquedaEncargado, usuarios, encargadoSeleccionado, userIds, encargadoId]);

  useEffect(() => {
    const idsAsignados = [encargadoId, ...(userIds || [])].filter(Boolean) as string[];
    
    if (busquedaAsistente.length > 1 && encargadoSeleccionado) {
      const filtrados = usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(busquedaAsistente.toLowerCase()) &&
        !idsAsignados.includes(u.id)
      );
      setResultadosBusquedaAsistente(filtrados);
    } else {
      setResultadosBusquedaAsistente([]);
    }
  }, [busquedaAsistente, usuarios, encargadoSeleccionado, userIds, encargadoId]);

  const handleSeleccionEncargado = (user: Usuario) => {
    setValue('encargadoId', user.id, { shouldValidate: true });
    setBusquedaEncargado('');
    setResultadosBusquedaEncargado([]);
  };

  const handleSeleccionAsistente = (user: Usuario) => {
    setValue('userIds', [...(userIds || []), user.id], { shouldValidate: true });
    setBusquedaAsistente('');
    setResultadosBusquedaAsistente([]);
  };

  const handleQuitarAsistente = (userId: string) => {
    setValue('userIds', userIds?.filter(id => id !== userId), { shouldValidate: true });
  };
  
  const handleQuitarEncargado = () => {
    setValue('encargadoId', '', { shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-6 flex-grow">
      <div className="flex flex-col gap-2">
        <h4 className="sr-only">Encargado:</h4>
        {!encargadoSeleccionado && (
          <div className="relative">
            <Input
              id="encargado-input"
              value={busquedaEncargado}
              onChange={(e) => setBusquedaEncargado(e.target.value)}
              onBlur={() => setTimeout(() => setResultadosBusquedaEncargado([]), 150)}
              placeholder="Buscar y añadir encargado..."
              className={!encargadoSeleccionado && errors.encargadoId ? 'border-red-500' : ''}
            />
            {resultadosBusquedaEncargado.length > 0 && (
              <div className="absolute w-full bg-white border rounded-md mt-1 z-20 max-h-40 overflow-y-auto shadow-lg">
                {resultadosBusquedaEncargado.map((user: Usuario) => (
                  <button
                    type="button"
                    key={user.id}
                    className="w-full text-left p-3 text-sm hover:bg-blue-500 hover:text-white transition-colors duration-150"
                    onClick={() => handleSeleccionEncargado(user)}
                  >
                    {user.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {encargadoSeleccionado && (
          <ul className="p-3 bg-white border rounded-md">
            <li key={encargadoSeleccionado.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
              <span className="text-sm text-gray-800 font-semibold">
                {encargadoSeleccionado.nombre}
              </span>
              <button type="button" onClick={handleQuitarEncargado} className="p-1 text-red-500 hover:text-red-700 rounded-sm hover:bg-red-100"><X size={14} /></button>
            </li>
          </ul>
        )}
        {errors.encargadoId && <p className="text-sm text-red-500 mt-1">{errors.encargadoId.message}</p>}
      </div>
      <div className="flex flex-col gap-2 flex-grow">
        <h4 className="sr-only">Asistentes:</h4>
        <div className="relative">
          <Input
            id="asistente-input"
            value={busquedaAsistente}
            onChange={(e) => setBusquedaAsistente(e.target.value)}
            onBlur={() => setTimeout(() => setResultadosBusquedaAsistente([]), 150)}
            placeholder="Buscar y añadir asistentes..."
          />
          {resultadosBusquedaAsistente.length > 0 && (
              <div className="absolute w-full bg-white border rounded-md mt-1 z-20 max-h-40 overflow-y-auto shadow-lg">
                  {resultadosBusquedaAsistente.map((user: Usuario) => (
                    <button
                      type="button"
                      key={user.id}
                      className="w-full text-left p-3 text-sm hover:bg-blue-500 hover:text-white transition-colors duration-150"
                      onClick={() => handleSeleccionAsistente(user)}
                    >
                      {user.nombre}
                    </button>
                  ))}
              </div>
          )}
        </div>
        {asistentesAsignados.length > 0 && (
          <ul className="p-3 bg-white border rounded-md flex-grow overflow-y-auto mt-2">
            {asistentesAsignados.map((user: Usuario) => (
              <li key={user.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                <span className="text-sm text-gray-800">
                  {user.nombre}
                </span>
                <button type="button" onClick={() => handleQuitarAsistente(user.id)} className="p-1 text-red-500 hover:text-red-700 rounded-sm hover:bg-red-100"><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}