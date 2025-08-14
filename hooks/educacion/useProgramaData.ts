import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import type { Programa, Alumno } from '@/components/educacion/lib/esquemas';

interface MaestroAlumnos {
  nombre: string;
  ctd_alumnos: number;
}

export function useProgramaData(programaId: string | number) {
    const [programa, setPrograma] = useState<Programa | null>(null);
    const [nivelesDelPrograma, setNivelesDelPrograma] = useState<Programa[]>([]);
    const [alumnosDelPrograma, setAlumnosDelPrograma] = useState<Alumno[]>([]);
    const [maestrosDelPrograma, setMaestrosDelPrograma] = useState<MaestroAlumnos[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        
        try {
            // Cargar el programa principal
            const { data: programaRes, error: programaError } = await supabase
                .from('programas_educativos')
                .select('*')
                .eq('id', programaId)
                .single();

            if (programaError) throw programaError;
            
            const programaData = programaRes as Programa;
            setPrograma(programaData);

            // Cargar los niveles del programa
            const { data: nivelesRes, error: nivelesError } = await supabase
                .from('programas_educativos')
                .select('*')
                .eq('parent_id', programaData.id);
            
            if (nivelesError) throw nivelesError;

            const nivelesData = nivelesRes as Programa[];
            setNivelesDelPrograma(nivelesData);
            
            // Cargar los alumnos del programa
            const { data: alumnosInscripcionesRes, error: alumnosError } = await supabase
                .from('alumnos_inscripciones')
                .select('*, alumnos(*)')
                .in('programa_id', nivelesData.map(nivel => nivel.id));
            
            if (alumnosError) throw alumnosError;

            const alumnosData = alumnosInscripcionesRes.map(inscripcion => ({
                ...(inscripcion.alumnos as Alumno),
                programa_id: inscripcion.programa_id
            })) as Alumno[];
            setAlumnosDelPrograma(alumnosData);
            
            // Lógica para cargar y contar los maestros asignados a los niveles
            const maestrosIds = [...new Set(nivelesData.map(nivel => nivel.maestro_id).filter(id => id !== null))] as number[];

            if (maestrosIds.length > 0) {
              const { data: maestrosDataRes, error: maestrosDataError } = await supabase
                  .from('maestros_municipales')
                  .select('nombre, ctd_alumnos')
                  .in('id', maestrosIds);

              if (maestrosDataError) throw maestrosDataError;
              
              const maestrosFormatted: MaestroAlumnos[] = (maestrosDataRes || []).map(maestro => ({
                  nombre: maestro.nombre,
                  ctd_alumnos: maestro.ctd_alumnos,
              })).sort((a, b) => b.ctd_alumnos - a.ctd_alumnos);

              setMaestrosDelPrograma(maestrosFormatted);
            } else {
              setMaestrosDelPrograma([]);
            }

        } catch (error) {
            console.error('Error fetching program data:', error);
            toast.error('Error al cargar los datos del programa.');
        } finally {
            setLoading(false);
        }
    }, [programaId]);

    useEffect(() => {
        if (programaId) {
            fetchData();
        }
    }, [programaId, fetchData]);

    return { programa, nivelesDelPrograma, alumnosDelPrograma, maestrosDelPrograma, loading, fetchData };
}