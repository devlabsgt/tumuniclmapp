import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import type { Programa, Alumno, Maestro } from '@/components/educacion/lib/esquemas';

export function useEducacionData() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [maestros, setMaestros] = useState<Maestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    const [programasRes, alumnosInscripcionesRes, maestrosRes, aniosRes] = await Promise.all([
        supabase.from('programas_educativos').select('*').order('nombre'),
        supabase.from('alumnos_inscripciones').select('*, alumnos(*)'),
        supabase.from('maestros_municipales').select('*'),
        supabase.rpc('obtener_anios_programas')
    ]);
    
    if (programasRes.error) {
        toast.error('Error al cargar los programas.');
    } else {
        setProgramas((programasRes.data as Programa[]) || []);
    }

    if (alumnosInscripcionesRes.error) {
      toast.error('Error al cargar los alumnos inscritos.');
    } else {
      const alumnosData = alumnosInscripcionesRes.data?.map(inscripcion => ({
        ...inscripcion.alumnos,
        programa_id: inscripcion.programa_id
      })) || [];
      setAlumnos(alumnosData);
    }
    
    if (maestrosRes.error) {
        toast.error('Error al cargar los maestros.');
    } else {
        setMaestros((maestrosRes.data as Maestro[]) || []);
    }
    
    if (aniosRes.data) {
        const anioActual = new Date().getFullYear();
        setAniosDisponibles([...new Set([anioActual, ...aniosRes.data])].sort((a, b) => b - a));
    } else {
        setAniosDisponibles([new Date().getFullYear()]);
    }

    setLoading(false);
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { programas, alumnos, maestros, loading, fetchData, aniosDisponibles };
}