'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Maestro, Programa } from '../lib/esquemas'; // Ruta corregida
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  nivel: Programa | null;
  maestros: Maestro[];
}

export default function AsignarMaestro({ isOpen, onClose, onSave, nivel, maestros }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Maestro[]>([]);
  const [selectedMaestro, setSelectedMaestro] = useState<Maestro | null>(null);

  const { handleSubmit, formState: { isSubmitting }, reset } = useForm();

  useEffect(() => {
    if (isOpen) {
      const maestroActual = maestros.find(m => m.id === nivel?.maestro_id);
      if (maestroActual) {
        setSelectedMaestro(maestroActual);
        setSearchTerm(maestroActual.nombre);
      } else {
        reset();
        setSearchTerm('');
        setSelectedMaestro(null);
      }
    }
  }, [isOpen, nivel, maestros, reset]);

  useEffect(() => {
    if (searchTerm && !selectedMaestro) {
      const filtered = maestros.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, maestros, selectedMaestro]);

  const handleSelectMaestro = (maestro: Maestro) => {
    setSelectedMaestro(maestro);
    setSearchTerm(maestro.nombre);
    setSearchResults([]);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (selectedMaestro) {
      setSelectedMaestro(null);
    }
  };

  const onSubmit = async () => {
    if (!nivel) return;
    const supabase = createClient();
    let maestroIdToAssign: number;

    try {
      if (selectedMaestro) {
        maestroIdToAssign = selectedMaestro.id;
      } else {
        const { data: nuevoMaestro, error: createError } = await supabase
          .from('maestros_municipales')
          .insert({ nombre: searchTerm })
          .select('id')
          .single();
        
        if (createError) throw new Error(`Error al crear maestro: ${createError.message}`);
        maestroIdToAssign = nuevoMaestro.id;
        toast.success(`Maestro "${searchTerm}" creado.`);
      }

      const { error: assignError } = await supabase
        .from('programas_educativos')
        .update({ maestro_id: maestroIdToAssign })
        .eq('id', nivel.id);

      if (assignError) throw new Error(`Error al asignar maestro: ${assignError.message}`);
      
      toast.success(`Maestro asignado al nivel "${nivel.nombre}".`);
      onSave();

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <motion.div
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg p-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Asignar Maestro</h2>
            <p className="text-sm text-gray-500">Para el nivel: <span className="font-semibold">{nivel?.nombre}</span></p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full -mt-2 -mr-2">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="p-6 bg-white rounded-lg border">
            <div className="relative">
              <label htmlFor="maestro" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Maestro</label>
              <Input 
                id="maestro" 
                value={searchTerm}
                onChange={handleNameChange}
                placeholder="Buscar o crear maestro..." 
                autoComplete="off"
              />
              {searchResults.length > 0 && (
                <div className="absolute w-full bg-white border rounded-md mt-1 z-10 max-h-40 overflow-y-auto shadow-lg">
                    {searchResults.map(maestro => (
                        <button
                            type="button"
                            key={maestro.id}
                            className="w-full text-left p-2 hover:bg-blue-600 hover:text-white"
                            onClick={() => handleSelectMaestro(maestro)}
                        >
                            {maestro.nombre}
                        </button>
                    ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !searchTerm} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Guardando...' : (selectedMaestro ? 'Asignar' : 'Crear y Asignar')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
