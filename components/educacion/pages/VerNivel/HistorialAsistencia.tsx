import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import type { Alumno } from '@/components/educacion/lib/esquemas';
import { Loader2, ChevronRight, ChevronDown, Calendar as CalendarIcon, Search } from 'lucide-react';

interface Props {
  nivelId: string;
  alumnosDelNivel: Alumno[];
}

const MESES = [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ];
const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - 1 + i);

const DIAS_SEMANA = [
    { value: -1, label: 'Día (Todos)' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' }
];

const formatearFechaCorta = (fecha: Date) => {
  return `${fecha.getDate()} ${MESES_ABREV[fecha.getMonth()]}`;
};

const obtenerSemanas = (mes: number, anio: number) => {
  const primerDiaMes = new Date(anio, mes, 1);
  const diaSemana = primerDiaMes.getDay();
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioPrimerSemana = new Date(anio, mes, 1 - offset);

  return Array.from({ length: 5 }, (_, i) => {
    const inicio = new Date(inicioPrimerSemana.getFullYear(), inicioPrimerSemana.getMonth(), inicioPrimerSemana.getDate() + (i * 7));
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
    return { id: i, label: `${formatearFechaCorta(inicio)} - ${formatearFechaCorta(fin)}`, inicio, fin };
  });
};

export default function HistorialAsistencia({ nivelId, alumnosDelNivel }: Props) {
    const [sesiones, setSesiones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
    const [anioSeleccionado, setAnioSeleccionado] = useState(ANIO_ACTUAL);
    
    const [semanaSeleccionada, setSemanaSeleccionada] = useState(() => {
        const hoy = new Date();
        const semanas = obtenerSemanas(hoy.getMonth(), hoy.getFullYear());
        const hoyMs = hoy.setHours(0,0,0,0);
        const index = semanas.findIndex(sem => hoyMs >= sem.inicio.getTime() && hoyMs <= sem.fin.getTime());
        return index !== -1 ? index : -1;
    });
    
    const [busqueda, setBusqueda] = useState('');
    const [diaSemanaSeleccionado, setDiaSemanaSeleccionado] = useState(new Date().getDay());

    const alumnosOrdenados = useMemo(() => {
        return [...alumnosDelNivel].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
    }, [alumnosDelNivel]);

    const initialMes = useRef(new Date().getMonth());
    const initialAnio = useRef(ANIO_ACTUAL);

    useEffect(() => {
        const fetchSesiones = async () => {
            const supabase = createClient();
            
            // fetch sesiones con sus asistencias
            const { data: sData, error: sError } = await supabase
                .from('sesiones_clase')
                .select(`
                    id, 
                    fecha, 
                    created_at,
                    asistencias(estado, alumno_id)
                `)
                .eq('nivel_id', parseInt(nivelId))
                .order('fecha', { ascending: false });

            if(sError) {
                toast.error("Error al cargar el historial de asitencias.");
                setLoading(false);
                return;
            }

            setSesiones(sData || []);
            setLoading(false);
        };

        fetchSesiones();
    }, [nivelId]);

    const semanasDisponibles = useMemo(() => {
        return obtenerSemanas(mesSeleccionado, anioSeleccionado);
    }, [mesSeleccionado, anioSeleccionado]);

    useEffect(() => {
        // En Strict Mode, los efectos corren dos veces. isFirstMount falla.
        // Mejor verificamos si realmente cambió el mes/año inicial.
        if (mesSeleccionado === initialMes.current && anioSeleccionado === initialAnio.current) {
            return;
        }
        setSemanaSeleccionada(-1);
    }, [mesSeleccionado, anioSeleccionado]);

    const sesionesFiltradas = useMemo(() => {
        return sesiones.filter(sesion => {
            const [tYear, tMonth, tDay] = sesion.fecha.split('-').map(Number);
            const tDate = new Date(tYear, tMonth - 1, tDay);

            let coincideFecha = false;
            
            if (semanaSeleccionada !== -1) {
                const sem = semanasDisponibles[semanaSeleccionada];
                sem.inicio.setHours(0,0,0,0);
                sem.fin.setHours(23,59,59,999);
                coincideFecha = tDate >= sem.inicio && tDate <= sem.fin;
            } else {
                coincideFecha = (tMonth - 1) === mesSeleccionado && tYear === anioSeleccionado;
            }

            if (coincideFecha && diaSemanaSeleccionado !== -1) {
                if (tDate.getDay() !== diaSemanaSeleccionado) {
                    coincideFecha = false;
                }
            }

            const fechaObj = new Date(sesion.fecha);
            fechaObj.setTime(fechaObj.getTime() + fechaObj.getTimezoneOffset() * 60000);
            const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            const termino = busqueda.toLowerCase();
            const coincideTexto = busqueda === '' || 
                                 fechaStr.toLowerCase().includes(termino) || 
                                 sesion.fecha.includes(termino) ||
                                 alumnosOrdenados.some(a => a.nombre_completo.toLowerCase().includes(termino));

            return coincideFecha && coincideTexto;
        });
    }, [sesiones, mesSeleccionado, anioSeleccionado, semanaSeleccionada, busqueda, semanasDisponibles, diaSemanaSeleccionado, alumnosOrdenados]);

    if(loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8"/></div>

    if(sesiones.length === 0) {
        return <div className="text-center py-10 px-4 mt-4 bg-gray-50 dark:bg-neutral-900 border dark:border-neutral-800 rounded-lg text-gray-500 dark:text-gray-400">No hay sesiones de asistencia registradas en el historial para este nivel.</div>
    }

    return (
        <div className="w-full mt-2">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input type="text" placeholder="Buscar por nombre o día..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200" />
                </div>
                <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-2 shrink-0">
                    <div className="relative">
                        <select value={diaSemanaSeleccionado} onChange={(e) => setDiaSemanaSeleccionado(Number(e.target.value))} className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 h-full">
                            {DIAS_SEMANA.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="w-full pl-4 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 h-full">
                            {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="w-full pl-4 pr-14 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200">
                            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <CalendarIcon size={16} className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={semanaSeleccionada} onChange={(e) => setSemanaSeleccionada(Number(e.target.value))} className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200">
                            <option value={-1}>Todas las semanas</option>
                            {semanasDisponibles.map(sem => <option key={sem.id} value={sem.id}>{sem.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {sesionesFiltradas.length === 0 ? (
                <div className="text-center py-10 px-4 mt-2 bg-gray-50 dark:bg-neutral-900/50 border border-dashed border-gray-200 dark:border-neutral-800 rounded-lg text-gray-500 dark:text-gray-400">
                    No se encontraron sesiones para los filtros aplicados.
                </div>
            ) : (
                <div className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-x-auto bg-white dark:bg-[#1a1a1a] no-scrollbar">
                    <div className="min-w-[450px]">
                        {sesionesFiltradas.map((sesion, idx) => {
                            const fechaObj = new Date(sesion.fecha);
                            fechaObj.setTime(fechaObj.getTime() + fechaObj.getTimezoneOffset() * 60000);
                            const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            
                            return (
                                <div key={sesion.id} className="flex flex-col">
                                    <div className={`py-2 px-4 bg-gray-100 dark:bg-[#202020] ${idx !== 0 ? 'border-t' : ''} border-b border-gray-200 dark:border-[#2a2a2a] font-bold text-gray-800 dark:text-gray-100 capitalize text-sm sticky left-0`}>
                                        {fechaStr}
                                    </div>
                                    {alumnosOrdenados
                                        .filter(a => busqueda === '' || 
                                                     a.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || 
                                                     fechaStr.toLowerCase().includes(busqueda.toLowerCase())
                                        )
                                        .map((alumno, aIdx) => {
                                         const asists = sesion.asistencias || [];
                                         const asistencia = asists.find((a: any) => a.alumno_id === alumno.id);
                                         const estado = asistencia ? asistencia.estado : null;
                                         
                                         let badgeClass = 'text-gray-500 border-gray-200 dark:text-gray-400 dark:border-[#3a3a3a] bg-gray-50 dark:bg-transparent';
                                         let dotColor = 'bg-gray-400';
                                         let label = 'Sin marcar';

                                         if (estado === 'PRESENTE') { 
                                             badgeClass = 'text-green-600 border-green-200 dark:text-[#3fb950] dark:border-[#234e2c] bg-green-50/50 dark:bg-transparent'; 
                                             dotColor = 'bg-green-500 dark:bg-[#3fb950]';
                                             label='Presente'; 
                                         }
                                         else if (estado === 'AUSENTE') { 
                                             badgeClass = 'text-red-600 border-red-200 dark:text-[#f85149] dark:border-[#6a2123] bg-red-50/50 dark:bg-transparent'; 
                                             dotColor = 'bg-red-500 dark:bg-[#f85149]';
                                             label='Ausente'; 
                                         }
                                         else if (estado === 'JUSTIFICADO') { 
                                             badgeClass = 'text-blue-600 border-blue-200 dark:text-[#58a6ff] dark:border-[#1e3a5f] bg-blue-50/50 dark:bg-transparent'; 
                                             dotColor = 'bg-blue-500 dark:bg-[#58a6ff]';
                                             label='Permiso'; 
                                         }

                                         return (
                                             <div key={`${sesion.id}-${alumno.id}`} className="flex flex-row items-center py-2.5 px-4 border-b border-gray-100 dark:border-[#2a2a2a] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                                                <div className="w-10 shrink-0 text-gray-400 dark:text-neutral-500 text-xs font-mono">
                                                    {String(aIdx + 1).padStart(2, '0')}
                                                </div>
                                                <div className="flex-1 min-w-[200px] text-gray-700 dark:text-gray-300 font-medium truncate text-sm">
                                                    {alumno.nombre_completo}
                                                </div>
                                                <div className="flex justify-end items-center shrink-0 ml-4">
                                                    <div className={`flex justify-center items-center px-3 py-1 rounded border min-w-[110px] ${badgeClass}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${dotColor}`}></div>
                                                        <span className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase">{label}</span>
                                                    </div>
                                                </div>
                                             </div>
                                         )
                                     })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
