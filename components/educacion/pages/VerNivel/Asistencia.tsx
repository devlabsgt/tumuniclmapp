import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import useUserData from '@/hooks/sesion/useUserData';
import { toast } from 'react-toastify';
import type { Alumno } from '@/components/educacion/lib/esquemas';
import { Loader2 } from 'lucide-react';

interface Props {
  nivelId: string;
  alumnosDelNivel: Alumno[];
}

export default function Asistencia({ nivelId, alumnosDelNivel }: Props) {
  const getLocalTodayFormated = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const { userId } = useUserData();
  const [loading, setLoading] = useState(true);
  const [sesionId, setSesionId] = useState<number | null>(null);
  const [asistencias, setAsistencias] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string>(getLocalTodayFormated());

  const alumnosOrdenados = useMemo(() => {
    return [...alumnosDelNivel].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
  }, [alumnosDelNivel]);

  // Ref para evitar que múltiples clics creen la clase a la vez (evitar duplicados)
  const creationPromise = useRef<Promise<number> | null>(null);

  useEffect(() => {
    const fetchSesionFecha = async () => {
      setLoading(true);
      const supabase = createClient();

      // Limpiar datos previos
      setAsistencias({});
      setSesionId(null);
      creationPromise.current = null;

      // Buscar sesión para la fecha seleccionada
      const { data: sesionData, error: sesionError } = await supabase
        .from('sesiones_clase')
        .select('id')
        .eq('nivel_id', parseInt(nivelId))
        .eq('fecha', selectedDate)
        .maybeSingle();

      if (sesionData) {
        setSesionId(sesionData.id);
        const { data: astData, error: astError } = await supabase
          .from('asistencias')
          .select('alumno_id, estado')
          .eq('sesion_id', sesionData.id);

        if (astData) {
          const map: Record<string, string> = {};
          astData.forEach(a => {
             map[a.alumno_id] = a.estado;
          });
          setAsistencias(map);
        }
      }
      setLoading(false);
    };

    fetchSesionFecha();
  }, [nivelId, selectedDate]);

  const handleMarcar = async (alumnoId: string, estado: string) => {
    const supabase = createClient();
    
    // actualizamos UI optimista
    const previousState = asistencias[alumnoId];
    setAsistencias(prev => ({ ...prev, [alumnoId]: estado }));

    try {
      let activeSesionId = sesionId;

      // Si no hay sesión, la creamos al vuelo (evitando condición de carrera)
      if (!activeSesionId) {
         if (creationPromise.current) {
             activeSesionId = await creationPromise.current;
         } else {
             creationPromise.current = (async () => {
                 const { data: newSesion, error: insertError } = await supabase
                     .from('sesiones_clase')
                     .insert({ nivel_id: parseInt(nivelId), fecha: selectedDate, registrado_por: userId })
                     .select('id')
                     .maybeSingle(); // maybeSingle evitas throw directo si falla por unique
                 
                 // si hubo duplicado casi al mismo MS, intentamos traer el existente
                 if (insertError) {
                     const { data: existing } = await supabase
                         .from('sesiones_clase')
                         .select('id')
                         .eq('nivel_id', parseInt(nivelId))
                         .eq('fecha', selectedDate)
                         .maybeSingle();
                         
                     if (existing) return existing.id;
                     throw insertError;
                 }
                 return newSesion?.id;
             })();
             
             activeSesionId = await creationPromise.current;
             setSesionId(activeSesionId);
         }
      }

      // Upsert asistencia
      const { error: upsertError } = await supabase
         .from('asistencias')
         .upsert({
            sesion_id: activeSesionId,
            alumno_id: alumnoId,
            estado: estado
         }, { onConflict: 'sesion_id,alumno_id' });

      if (upsertError) throw upsertError;

    } catch (e: any) {
       console.error("Error marcando asistencia", e);
       toast.error("Error al registrar asistencia");
       // revert op
       setAsistencias(prev => ({ ...prev, [alumnoId]: previousState }));
    }
  };

  const getButtonClass = (alumnoId: string, tipo: string) => {
      const actual = asistencias[alumnoId];
      if (tipo === 'PRESENTE') {
          return actual === 'PRESENTE' ? 'bg-green-600 text-white shadow-inner font-bold' : 'bg-gray-100 text-gray-700 hover:bg-green-100 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-green-900/40 border dark:border-neutral-700';
      }
      if (tipo === 'AUSENTE') {
          return actual === 'AUSENTE' ? 'bg-red-600 text-white shadow-inner font-bold' : 'bg-gray-100 text-gray-700 hover:bg-red-100 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-red-900/40 border dark:border-neutral-700';
      }
      if (tipo === 'JUSTIFICADO') {
          return actual === 'JUSTIFICADO' ? 'bg-yellow-500 text-white shadow-inner font-bold' : 'bg-gray-100 text-gray-700 hover:bg-yellow-100 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-yellow-900/40 border dark:border-neutral-700';
      }
      return '';
  };

  if(loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8"/></div>

  if(alumnosDelNivel.length === 0) {
      return <div className="text-center py-10 text-gray-500">No hay alumnos inscritos en este nivel para tomar asistencia.</div>
  }

  const displayDateStr = () => {
      const d = new Date(selectedDate);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
      <div className="w-full">
         <div className="mb-4 pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 capitalize">Asistencia: <span className="font-normal text-gray-600 dark:text-gray-400">{displayDateStr()}</span></h3>
                <p className="text-sm text-gray-500">Seleccione el estado para cada alumno. Se guardará automáticamente.</p>
             </div>
             <div className="flex items-center gap-2">
                 <label htmlFor="fecha-asistencia" className="text-sm font-medium text-gray-700 dark:text-gray-300">Día:</label>
                 <input 
                     id="fecha-asistencia" 
                     type="date" 
                     value={selectedDate} 
                     max={getLocalTodayFormated()}
                     onChange={(e) => setSelectedDate(e.target.value)} 
                     className="rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200 dark:[color-scheme:dark]"
                 />
             </div>
         </div>
         <div className="flex flex-col gap-3">
             {alumnosOrdenados.map((alumno, index) => (
                 <div key={alumno.id} className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-3 lg:p-4 rounded-xl shadow-sm gap-4 transition-all hover:shadow-md">
                     <div className="flex-1 text-left w-full sm:w-auto">
                         <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">{index + 1}. {alumno.nombre_completo}</p>
                     </div>
                     <div className="flex gap-2 w-full sm:w-auto justify-center">
                         <button 
                            onClick={() => handleMarcar(alumno.id, 'PRESENTE')}
                            className={`flex flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg transition-all duration-200 text-sm lg:text-base cursor-pointer ${getButtonClass(alumno.id, 'PRESENTE')}`}
                         >
                            Presente
                         </button>
                         <button 
                            onClick={() => handleMarcar(alumno.id, 'AUSENTE')}
                            className={`flex flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg transition-all duration-200 text-sm lg:text-base cursor-pointer ${getButtonClass(alumno.id, 'AUSENTE')}`}
                         >
                            Ausente
                         </button>
                         <button 
                            onClick={() => handleMarcar(alumno.id, 'JUSTIFICADO')}
                            className={`flex flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg transition-all duration-200 text-sm lg:text-base cursor-pointer ${getButtonClass(alumno.id, 'JUSTIFICADO')}`}
                         >
                            Permiso
                         </button>
                     </div>
                 </div>
             ))}
         </div>
      </div>
  );
}
