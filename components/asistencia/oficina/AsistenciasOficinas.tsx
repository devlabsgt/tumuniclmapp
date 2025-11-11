'use client';

import React, { useState, Fragment, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import Mapa from '@/components/ui/modals/Mapa';
import { format, endOfDay, parseISO, startOfWeek, endOfWeek, addWeeks, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import Cargando from '@/components/ui/animations/Cargando';
import { AsistenciaEnriquecida } from '@/hooks/asistencia/useObtenerAsistencias';
import { List, Search, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import useUserData from '@/hooks/sesion/useUserData';
import useAsistenciasOficina from '@/hooks/asistencia/useAsistenciasOficina';
import ListaAsistencias from './ListaAsistencias';
import { RegistrosAgrupadosPorUsuario, AsistenciaDiaria, RegistrosAgrupadosDiarios } from './types';

const getWeekLabel = (startDate: Date) => {
    const end = endOfWeek(startDate, { weekStartsOn: 1 });
    return `Del ${format(startDate, 'd')} al ${format(end, 'd \'de\' MMM')}`;
};

export default function AsistenciasOficina() {
    const { rol, esjefe, dependencia_id, cargando: cargandoUsuario } = useUserData();
    const { dependencias, loading: loadingDependencias } = useDependencias();
    
    const [fechaInicialRango, setFechaInicialRango] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    const [fechaFinalRango, setFechaFinalRango] = useState(() => format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    
    const [oficinaIdFiltro, setOficinaIdFiltro] = useState<string | null>(null);
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState<string | null>(null);
    const [fechaFinalFiltro, setFechaFinalFiltro] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
    
    const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null, multiple?: AsistenciaEnriquecida[] }>({ entrada: null, salida: null });
    const [nombreUsuarioModal, setNombreUsuarioModal] = useState<string>('');

    const [nivel2Id, setNivel2Id] = useState<string | null>(null);
    const [nivel3Id, setNivel3Id] = useState<string | null>(null);

    const [vistaAgrupada, setVistaAgrupada] = useState<'nombre' | 'fecha'>('nombre');
    const [weekLabel, setWeekLabel] = useState(() => getWeekLabel(startOfWeek(new Date(), { weekStartsOn: 1 })));
    const [isNextWeekFuture, setIsNextWeekFuture] = useState(true); 

    const rolSinFiltrosExternos = useMemo(() => {
        if (!rol) return false;
        const upperRol = rol.toUpperCase();
        return esjefe || upperRol.includes('RRHH') || upperRol.includes('SUPER') || upperRol.includes('SECRETARIO');
    }, [rol, esjefe]);

    const { registros, loading: loadingAsistencias } = useAsistenciasOficina(
        oficinaIdFiltro, 
        fechaInicioFiltro, 
        fechaFinalFiltro
    );

    const loadingTotal = cargandoUsuario || loadingAsistencias;

    const nombreDependenciaActual = useMemo(() => {
        if (!dependencia_id || loadingDependencias) return "Cargando...";
        const dependencia = dependencias.find(d => d.id === dependencia_id);
        return dependencia ? dependencia.nombre : "Dependencia no encontrada";
    }, [dependencia_id, dependencias, loadingDependencias]);

    useEffect(() => {
        if (!cargandoUsuario) {
            if (rolSinFiltrosExternos && dependencia_id) {
                setOficinaIdFiltro(dependencia_id);
            }
            
            if (!fechaInicioFiltro && !fechaFinalFiltro) {
                const [y_start, m_start, d_start] = fechaInicialRango.split('-').map(Number);
                const fechaInicioLocal = new Date(y_start, m_start - 1, d_start, 0, 0, 0);

                const [y_end, m_end, d_end] = fechaFinalRango.split('-').map(Number);
                const fechaFinLocal = endOfDay(new Date(y_end, m_end - 1, d_end));

                setFechaInicioFiltro(fechaInicioLocal.toISOString());
                setFechaFinalFiltro(fechaFinLocal.toISOString());

                updateWeekLabel(fechaInicioLocal);
            }
        } else if (!cargandoUsuario && !rolSinFiltrosExternos) {
            setOficinaIdFiltro(null); 
        }
    }, [cargandoUsuario, rolSinFiltrosExternos, dependencia_id]);


    useEffect(() => {
        if (modalMapaAbierto) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [modalMapaAbierto]);

    const registrosAgrupadosDiarios = useMemo(() => {
        const registrosTemp: Record<string, RegistrosAgrupadosDiarios> = {};
        const registrosOrdenadosPorDia: AsistenciaEnriquecida[] = [...registros].sort((a, b) => b.created_at.localeCompare(a.created_at));

        registrosOrdenadosPorDia.forEach(registro => {
            const diaString = format(parseISO(registro.created_at), 'yyyy-MM-dd');
            const userId = registro.user_id;
            const claveUnica = `${diaString}-${userId}`;
            const oficinaNombre = registro.oficina_nombre || 'Sin Oficina';
            const oficinaPath = registro.oficina_path_orden || '0';

            if (!registrosTemp[claveUnica]) {
                registrosTemp[claveUnica] = {
                    entrada: null,
                    salida: null,
                    multiple: [],
                    nombre: registro.nombre || 'N/A',
                    puesto_nombre: registro.puesto_nombre || 'N/A',
                    oficina_nombre: oficinaNombre,
                    oficina_path_orden: oficinaPath,
                    userId: userId,
                    diaString: diaString,
                };
            }

            const tipoStr = registro.tipo_registro as string;
            if (tipoStr === 'Multiple' || tipoStr === 'Marca') {
                registrosTemp[claveUnica].multiple.push(registro);
            } else if (registro.tipo_registro === 'Entrada' && !registrosTemp[claveUnica].entrada) {
                registrosTemp[claveUnica].entrada = registro;
            } else if (registro.tipo_registro === 'Salida' && !registrosTemp[claveUnica].salida) {
                registrosTemp[claveUnica].salida = registro;
            }
        });
        return Object.values(registrosTemp).sort((a, b) => b.diaString.localeCompare(a.diaString) || a.nombre.localeCompare(b.nombre));
    }, [registros]);
    
    const registrosAgrupadosPorUsuario = useMemo(() => {
        const registrosDiariosTemp: Record<string, any> = {};
        const registrosOrdenados: AsistenciaEnriquecida[] = [...registros].sort((a, b) => b.created_at.localeCompare(a.created_at));

        registrosOrdenados.forEach(registro => {
            const diaString = format(parseISO(registro.created_at), 'yyyy-MM-dd');
            const userId = registro.user_id;
            const claveUnica = `${diaString}-${userId}`;

            if (!registrosDiariosTemp[claveUnica]) {
                registrosDiariosTemp[claveUnica] = {
                    entrada: null,
                    salida: null,
                    multiple: [],
                    nombre: registro.nombre || 'N/A',
                    puesto_nombre: registro.puesto_nombre || 'N/A',
                    oficina_nombre: registro.oficina_nombre || 'Sin Oficina',
                    oficina_path_orden: registro.oficina_path_orden || '0',
                    userId: userId,
                    diaString: diaString,
                };
            }

            const tipoStr = registro.tipo_registro as string;
            if (tipoStr === 'Multiple' || tipoStr === 'Marca') {
                registrosDiariosTemp[claveUnica].multiple.push(registro);
            } else if (registro.tipo_registro === 'Entrada' && !registrosDiariosTemp[claveUnica].entrada) {
                registrosDiariosTemp[claveUnica].entrada = registro;
            } else if (registro.tipo_registro === 'Salida' && !registrosDiariosTemp[claveUnica].salida) {
                registrosDiariosTemp[claveUnica].salida = registro;
            }
        });

        const registrosPorUsuarioTemp: Record<string, RegistrosAgrupadosPorUsuario> = {};
        const registrosDiariosArray = Object.values(registrosDiariosTemp);

        registrosDiariosArray.forEach(registroDiario => {
            const userId = registroDiario.userId;
            if (!registrosPorUsuarioTemp[userId]) {
                registrosPorUsuarioTemp[userId] = {
                    userId: userId,
                    nombre: registroDiario.nombre,
                    puesto_nombre: registroDiario.puesto_nombre,
                    oficina_nombre: registroDiario.oficina_nombre,
                    oficina_path_orden: registroDiario.oficina_path_orden,
                    asistencias: [],
                };
            }

            registrosPorUsuarioTemp[userId].asistencias.push({
                entrada: registroDiario.entrada,
                salida: registroDiario.salida,
                multiple: registroDiario.multiple,
                diaString: registroDiario.diaString,
            });
        });

        return Object.values(registrosPorUsuarioTemp)
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map(usuario => {
                usuario.asistencias.sort((a, b) => b.diaString.localeCompare(a.diaString));
                return usuario;
            });

    }, [registros]);
    
    
    const registrosFiltradosPorUsuario = useMemo(() => {
        if (!searchTerm) return registrosAgrupadosPorUsuario;
        const lowerTerm = searchTerm.toLowerCase();
        return registrosAgrupadosPorUsuario.filter(registro =>
            (registro.nombre && registro.nombre.toLowerCase().includes(lowerTerm)) ||
            (registro.oficina_nombre && registro.oficina_nombre.toLowerCase().includes(lowerTerm))
        );
    }, [registrosAgrupadosPorUsuario, searchTerm]);

    const registrosFiltradosPorFecha = useMemo(() => {
        if (!searchTerm) return registrosAgrupadosDiarios;
        const lowerTerm = searchTerm.toLowerCase();
        return registrosAgrupadosDiarios.filter(registro =>
            (registro.nombre && registro.nombre.toLowerCase().includes(lowerTerm)) ||
            (registro.oficina_nombre && registro.oficina_nombre.toLowerCase().includes(lowerTerm))
        );
    }, [registrosAgrupadosDiarios, searchTerm]);
    
    const oficinasNivel2 = useMemo(() => {
        const rootIds = new Set(dependencias.filter(d => d.parent_id === null).map(d => d.id));
        return dependencias
            .filter(d => !d.es_puesto && d.parent_id !== null && rootIds.has(d.parent_id))
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }, [dependencias]);

    const oficinasNivel3 = useMemo(() => {
        if (!nivel2Id) return [];
        return dependencias
            .filter(d => !d.es_puesto && d.parent_id === nivel2Id)
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }, [dependencias, nivel2Id]);
    
    const handleNivel2Change = (value: string) => {
        const newId = value === 'todos' ? null : value;
        setNivel2Id(newId);
        setNivel3Id(null);
    };

    const handleNivel3Change = (value: string) => {
        const newId = value === 'todos' ? null : value;
        setNivel3Id(newId);
    };
    

    const checkNextWeekDisabled = (startDate: Date) => {
        const nextWeekStart = addWeeks(startDate, 1);
        const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
        setIsNextWeekFuture(nextWeekStart > startOfThisWeek);
    };

    const updateWeekLabel = (startDate: Date) => {
        setWeekLabel(getWeekLabel(startDate));
        checkNextWeekDisabled(startDate);
    };

    const handleFiltrarFecha = (
        startDate: string | null = fechaInicialRango,
        endDate: string | null = fechaFinalRango
    ) => {
        const oficinaAFiltrar = rolSinFiltrosExternos ? dependencia_id : (nivel3Id || nivel2Id || null);
        setOficinaIdFiltro(oficinaAFiltrar);

        if (startDate) {
            const [y, m, d] = startDate.split('-').map(Number);
            const fechaInicioLocal = new Date(y, m - 1, d, 0, 0, 0);
            setFechaInicioFiltro(fechaInicioLocal.toISOString());
        } else {
            setFechaInicioFiltro(null);
        }

        if (endDate) {
            const [y, m, d] = endDate.split('-').map(Number);
            const fechaFinLocal = endOfDay(new Date(y, m - 1, d));
            setFechaFinalFiltro(fechaFinLocal.toISOString());
        } else {
            setFechaFinalFiltro(null);
        }
    };

    const jumpToCurrentWeek = () => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        
        const startString = format(start, 'yyyy-MM-dd');
        const endString = format(end, 'yyyy-MM-dd');
        
        setFechaInicialRango(startString);
        setFechaFinalRango(endString);
        setWeekLabel(getWeekLabel(start));
        handleFiltrarFecha(startString, endString);
        checkNextWeekDisabled(start);
    };

    const handleWeekChange = (direction: 'prev' | 'next') => {
        let currentStart = parseISO(fechaInicialRango);


        if (isNaN(currentStart.getTime())) {
 
            jumpToCurrentWeek();
            return;
        }

        if (direction === 'next') {
            const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
            const nextWeekStartCheck = addWeeks(currentStart, 1);
            if (nextWeekStartCheck > startOfThisWeek) {
                return; 
            }
        }
        
        const newStart = addWeeks(currentStart, direction === 'prev' ? -1 : 1);
        const newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
        
        const newStartDateString = format(newStart, 'yyyy-MM-dd');
        const newEndDateString = format(newEnd, 'yyyy-MM-dd');

        setFechaInicialRango(newStartDateString);
        setFechaFinalRango(newEndDateString);
        updateWeekLabel(newStart);
        handleFiltrarFecha(newStartDateString, newEndDateString);
    };

    const handleAplicarFechaManual = () => {
        const today = new Date();
        let start = parseISO(fechaInicialRango);
        if (start > today) {
            start = startOfWeek(today, { weekStartsOn: 1 });
            setFechaInicialRango(format(start, 'yyyy-MM-dd'));
        }
        
        updateWeekLabel(start);
        handleFiltrarFecha(format(start, 'yyyy-MM-dd'), fechaFinalRango);
    };
    
    const handleBorrarFiltro = () => {
        setFechaInicialRango(''); 
        setFechaFinalRango('');
        setFechaInicioFiltro(null);
        setFechaFinalFiltro(null);
        setSearchTerm(''); 
        setOficinaIdFiltro(rolSinFiltrosExternos ? dependencia_id : null);
        setWeekLabel("Mostrando Todos");
        setIsNextWeekFuture(false); 
    };
    
    const handleAbrirModalMapa = (
        asistencia: { entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null, multiple?: AsistenciaEnriquecida[] },
        nombreUsuario: string
    ) => {
        setRegistrosSeleccionadosParaMapa(asistencia);
        setNombreUsuarioModal(nombreUsuario);
        setModalMapaAbierto(true);
    };


    if (cargandoUsuario) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando datos de usuario...</div>;
    }

    if (rolSinFiltrosExternos && !dependencia_id) {
        return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Error: Tu rol requiere una dependencia asignada.</div>;
    }

    const noHayDatos = vistaAgrupada === 'nombre' 
        ? registrosFiltradosPorUsuario.length === 0 
        : registrosFiltradosPorFecha.length === 0;

    return (
        <>
            <div className="w-full xl:w-4/5 mx-auto md:px-4">
                <div className="p-2 bg-white rounded-lg shadow-md w-full">
                    
                    {rolSinFiltrosExternos && (
                        <h2 className="text-lg font-semibold text-gray-800 text-center mb-3">
                            Reporte de Asistencia <br/><span className="text-blue-600">{nombreDependenciaActual}</span>
                        </h2>
                    )}

                    <div className="bg-gray-100 rounded-md p-3 space-y-3 pb-3">
                        <div className="flex flex-col lg:flex-row justify-center items-center gap-2">
                            {!rolSinFiltrosExternos ? (
                                <div className='w-full lg:w-1/3 flex flex-col sm:flex-row lg:flex-col gap-2'>
                                    <select onChange={(e) => handleNivel2Change(e.target.value)} value={nivel2Id || 'todos'} className="w-full text-xs rounded-sm p-2">
                                        <option value="todos">Todas las dependencias/políticas</option>
                                        {oficinasNivel2.map(oficina => (
                                            <option key={oficina.id} value={oficina.id}>{oficina.nombre}</option>
                                        ))}
                                    </select>
                                    <select onChange={(e) => handleNivel3Change(e.target.value)} value={nivel3Id || 'todos'} disabled={!nivel2Id} className="w-full text-xs rounded-sm p-2">
                                        <option value="todos">Todas las oficinas</option>
                                        {oficinasNivel3.map(oficina => (
                                            <option key={oficina.id} value={oficina.id}>{oficina.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            <div className="flex flex-col sm:flex-row w-full gap-2">
                                <div className="flex w-full sm:flex-1">
                                    <Button onClick={() => handleWeekChange('prev')} variant="outline" className="rounded-r-none px-3 bg-white">
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <Button onClick={jumpToCurrentWeek} variant="outline" className="rounded-none flex-1 text-xs px-2 bg-white">
                                        {weekLabel}
                                    </Button>
                                    <Button onClick={() => handleWeekChange('next')} variant="outline" className="rounded-l-none px-3 bg-white" disabled={isNextWeekFuture}>
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>

                                <Input
                                    type="date"
                                    value={fechaInicialRango}
                                    onChange={(e) => setFechaInicialRango(e.target.value)}
                                    className="w-full sm:flex-1 sm:min-w-[120px] text-xs rounded-sm"
                                    aria-label="Fecha inicial del rango"
                                />
                                <Input
                                    type="date"
                                    value={fechaFinalRango}
                                    onChange={(e) => setFechaFinalRango(e.target.value)}
                                    className="w-full sm:flex-1 sm:min-w-[120px] text-xs rounded-sm"
                                    aria-label="Fecha final del rango"
                                />
                                
                                <Button onClick={handleAplicarFechaManual} className="w-full sm:flex-1 text-xs rounded-sm">
                                    Aplicar Fecha
                                </Button>

                                <Button 
                                    onClick={handleBorrarFiltro} 
                                    className="w-full sm:flex-1 text-xs rounded-sm bg-green-500 hover:bg-green-600 text-white" 
                                >
                                    Mostrar Todos
                                </Button>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-3 flex flex-col md:flex-row items-center justify-between gap-3">
                            <div className="flex rounded-md border p-1 bg-gray-200 w-full md:w-auto">
                                <Button 
                                    size="sm" 
                                    onClick={() => setVistaAgrupada('nombre')}
                                    className={`flex-1 rounded-md text-xs gap-2 ${vistaAgrupada === 'nombre' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}
                                >
                                    <User size={14} /> Agrupar por Nombre
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={() => setVistaAgrupada('fecha')}
                                    className={`flex-1 rounded-md text-xs gap-2 ${vistaAgrupada === 'fecha' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}
                                >
                                    <Calendar size={14} /> Agrupar por Fecha
                                </Button>
                            </div>

                            <div className="relative w-full md:flex-1">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 bg-white text-xs w-full rounded-sm"
                                    placeholder="Buscar por nombre o dependencia..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        {loadingTotal || loadingDependencias ? (
                            <Cargando texto="Cargando asistencias..." />
                        ) : noHayDatos ? (
                            <p className="text-center text-gray-500 text-xs">No hay registros disponibles para el rango seleccionado.</p>
                        ) : (
                            <ListaAsistencias
                                vista={vistaAgrupada}
                                registrosPorUsuario={registrosFiltradosPorUsuario}
                                registrosPorFecha={registrosFiltradosPorFecha}
                                onAbrirModal={handleAbrirModalMapa}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {modalMapaAbierto && (
                    <Mapa
                        isOpen={modalMapaAbierto}
                        onClose={() => setModalMapaAbierto(false)}
                        registros={registrosSeleccionadosParaMapa}
                        nombreUsuario={nombreUsuarioModal}
                    />
                )}
            </AnimatePresence>
        </>
    );
}