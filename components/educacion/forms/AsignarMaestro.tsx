'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Maestro, Programa } from '../lib/esquemas';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  nivelId: number;
}

export default function AsignarMaestro({ isOpen, onClose, onSave, nivelId }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Maestro[]>([]);
  const [selectedMaestro, setSelectedMaestro] = useState<Maestro | null>(null);
  const [maestroActual, setMaestroActual] = useState<Maestro | null>(null);
  const [nivel, setNivel] = useState<Programa | null>(null);
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [loading, setLoading] = useState(true);

  const { handleSubmit, formState: { isSubmitting }, reset } = useForm();

  useEffect(() => {
    if (isOpen) {
      const fetchMaestrosAndNivel = async () => {
        setLoading(true);
        const supabase = createClient();
        
        const [maestrosRes, nivelRes] = await Promise.all([
          supabase.from('maestros_municipales').select('*'),
          supabase.from('programas_educativos').select('*').eq('id', nivelId).single(),
        ]);
        
        if (maestrosRes.error) {
          toast.error('Error al cargar la lista de maestros.');
        } else {
          setMaestros(maestrosRes.data as Maestro[] || []);
        }

        if (nivelRes.error) {
          toast.error('Error al cargar la información del nivel.');
        } else {
          setNivel(nivelRes.data as Programa || null);
          const maestro = maestrosRes.data?.find(m => m.id === nivelRes.data?.maestro_id);
          setMaestroActual(maestro || null);
          if (maestro) {
            setSelectedMaestro(maestro);
            setSearchTerm(maestro.nombre);
          } else {
            reset();
            setSearchTerm('');
            setSelectedMaestro(null);
          }
        }
        
        setLoading(false);
      };

      fetchMaestrosAndNivel();
    }
  }, [isOpen, nivelId, reset]);

  useEffect(() => {
    if (searchTerm && !selectedMaestro && maestros.length > 0) {
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

  const handleDesasignar = async () => {
    if (!nivel) return;
    const supabase = createClient();
    try {
      const { error: assignError } = await supabase
        .from('programas_educativos')
        .update({ maestro_id: null })
        .eq('id', nivel.id);

      if (assignError) throw new Error(`Error al desasignar maestro: ${assignError.message}`);
      
      toast.success(`Maestro desasignado del nivel "${nivel.nombre}".`);
      onSave();
      onClose();

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onSubmit = async () => {
    if (!nivel) return;
    const supabase = createClient();
    let maestroIdToAssign: number;
    let toastMessage = '';

    try {
      if (selectedMaestro) {
        maestroIdToAssign = selectedMaestro.id;
        toastMessage = `Maestro asignado al nivel "${nivel.nombre}".`;
      } else {
        const { data: nuevoMaestro, error: createError } = await supabase
          .from('maestros_municipales')
          .insert({ nombre: searchTerm })
          .select('id')
          .single();
        
        if (createError) throw new Error(`Error al crear maestro: ${createError.message}`);
        maestroIdToAssign = nuevoMaestro.id;
        toast.success(`Maestro "${searchTerm}" creado.`);
        toastMessage = `Maestro asignado al nivel "${nivel.nombre}".`;
      }

      const { error: assignError } = await supabase
        .from('programas_educativos')
        .update({ maestro_id: maestroIdToAssign })
        .eq('id', nivel.id);

      if (assignError) throw new Error(`Error al asignar maestro: ${assignError.message}`);
      
      toast.success(toastMessage);
      onSave();
      onClose();

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
        <div className="text-center text-white">Cargando maestros...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
>
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
              <label htmlFor="maestro" className="block text-sm font-medium text-gray-700 mb-1">
                {maestroActual ? 'Maestro Asignado' : 'Asignar Maestro'}
              </label>
              <Input 
                id="maestro" 
                value={searchTerm}
                onChange={handleNameChange}
                placeholder="Buscar o crear maestro..." 
                autoComplete="off"
                readOnly={!!maestroActual}
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
            {maestroActual ? (
              <Button type="button" variant="outline" className="text-red-500 border-red-500 hover:bg-red-50" onClick={handleDesasignar} disabled={isSubmitting}>
                Desasignar Maestro
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || !searchTerm} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Guardando...' : (selectedMaestro ? 'Asignar' : 'Crear y Asignar')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
