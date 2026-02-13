import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

type AsistenciaEnriquecida = any; 

interface AsistenciaHookData {
  registros: AsistenciaEnriquecida[];
  loading: boolean;
}

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  asistenciasOficina: (oficinaId: string | null, inicio: string | null, final: string | null) => 
    ['asistencias-oficina', oficinaId, inicio, final],
};

export default function useAsistenciasOficina(
    oficinaId: string | null, 
    fechaInicio: string | null, 
    fechaFinal: string | null   
): AsistenciaHookData {

    const { data, isLoading } = useQuery({
        queryKey: KEYS.asistenciasOficina(oficinaId, fechaInicio, fechaFinal),
        
        queryFn: async () => {
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
                return [];
            }

            return data || [];
        },
        
        staleTime: FIVE_MINUTES, 
    });

    return { 
        registros: data || [], 
        loading: isLoading 
    };
}