import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type AsistenciaEnriquecida = any; 

interface AsistenciaHookData {
  registros: AsistenciaEnriquecida[];
  loading: boolean;
}

export default function useAsistenciasOficina(
    oficinaId: string | null, 
    fechaInicio: string | null, 
    fechaFinal: string | null   
): AsistenciaHookData {
    const [registros, setRegistros] = useState<AsistenciaEnriquecida[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAsistencias = async () => {


            setLoading(true);
            const supabase = createClient();
            
            const p_fecha_inicio = (fechaInicio && fechaInicio !== '') ? fechaInicio : null;
            const p_fecha_final = (fechaFinal && fechaFinal !== '') ? fechaFinal : null;
            
            const { data, error } = await supabase.rpc('asistencias_oficinas', {
                p_oficina_id: oficinaId, 
                p_fecha_inicio: p_fecha_inicio,
                p_fecha_final: p_fecha_final
            });


            if (error) {
                console.error("Error fetching asistencias_oficinas:", error);
                setRegistros([]);
            } else {
                setRegistros(data || []);
            }
            
            setLoading(false);
        };

        fetchAsistencias();

    }, [oficinaId, fechaInicio, fechaFinal]);

    return { registros, loading };
}