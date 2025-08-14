import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import type { Programa, Alumno, Maestro } from '@/components/educacion/lib/esquemas';

export function useNivelData(nivelId: string | number) {
    const [nivel, setNivel] = useState<Programa | null>(null);
    const [alumnosDelNivel, setAlumnosDelNivel] = useState<Alumno[]>([]);
    const [maestros, setMaestros] = useState<Maestro[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        
        const nivelRes = await supabase
            .from('programas_educativos')
            .select('*')
            .eq('id', nivelId)
            .single();

        if (nivelRes.error) {
            toast.error('Error al cargar el nivel.');
            setLoading(false);
            return;
        }

        const nivelData = nivelRes.data as Programa;
        setNivel(nivelData);

        const alumnosInscripcionesRes = await supabase
            .from('alumnos_inscripciones')
            .select('*, alumnos(*)')
            .eq('programa_id', nivelData.id);

        if (alumnosInscripcionesRes.error) {
            toast.error('Error al cargar los alumnos del nivel.');
            setLoading(false);
            return;
        }

        const alumnosData = alumnosInscripcionesRes.data.map(inscripcion => ({
            ...inscripcion.alumnos,
            programa_id: inscripcion.programa_id
        })) as Alumno[];
        setAlumnosDelNivel(alumnosData);
        
        const maestrosRes = await supabase
            .from('maestros_municipales')
            .select('*');
        
        if (maestrosRes.error) {
            toast.error('Error al cargar los maestros.');
            setLoading(false);
            return;
        }

        setMaestros((maestrosRes.data as Maestro[]) || []);

        setLoading(false);
    }, [nivelId]);

    useEffect(() => {
        if (nivelId) {
            fetchData();
        }
    }, [nivelId, fetchData]);

    return { nivel, alumnosDelNivel, maestros, loading, fetchData };
}