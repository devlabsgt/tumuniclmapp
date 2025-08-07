'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Programas from './tablas/Programas';
import FormPrograma from './forms/Programa';
import FormAlumno from './forms/Alumno';
import FormMaestro from './forms/Maestro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import type { Programa, Alumno, Maestro } from './lib/esquemas';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import { Plus, Search } from 'lucide-react'; 
import useUserData from '@/hooks/useUserData';

export default function Ver() {
    const { rol, programas: programasAsignados } = useUserData();
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [alumnos, setAlumnos] = useState<Alumno[]>([]);
    const [todosLosAlumnos, setTodosLosAlumnos] = useState<Alumno[]>([]);
    const [maestros, setMaestros] = useState<Maestro[]>([]);
    const [loading, setLoading] = useState(true);
    const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);
    const [filtroAnio, setFiltroAnio] = useState<string>(new Date().getFullYear().toString());
    const [programaSearchTerm, setProgramaSearchTerm] = useState('');
    
    const [formProgramaOpen, setFormProgramaOpen] = useState(false);
    const [formAlumnoOpen, setFormAlumnoOpen] = useState(false);
    const [formMaestroOpen, setFormMaestroOpen] = useState(false);

    const [programaParaEditar, setProgramaParaEditar] = useState<Programa | null>(null);
    const [programaPadreId, setProgramaPadreId] = useState<number | null>(null);
    const [alumnoParaEditar, setAlumnoParaEditar] = useState<Alumno | null>(null);
    const [nivelIdParaAlumno, setNivelIdParaAlumno] = useState<number | null>(null);
    const [maestroParaEditar, setMaestroParaEditar] = useState<Maestro | null>(null);

    const fetchData = useCallback(async (anio: string) => {
        setLoading(true);
        const supabase = createClient();
        
        const [programasRes, alumnosInscripcionesRes, todosAlumnosRes, maestrosRes] = await Promise.all([
            supabase.from('programas_educativos').select('*').eq('anio', anio),
            supabase.from('alumnos_inscripciones').select('programa_id, alumnos(*)'),
            supabase.from('alumnos').select('*'),
            supabase.from('maestros_municipales').select('id, nombre, ctd_alumnos')
        ]);

        if (programasRes.error) toast.error('Error al cargar los programas.');
        else setProgramas(programasRes.data || []);

        if (alumnosInscripcionesRes.error) {
            toast.error('Error al cargar los alumnos inscritos.');
            setAlumnos([]);
        } else {
            const alumnosInscritos = alumnosInscripcionesRes.data.reduce<Alumno[]>((acc, inscripcion) => {
                if (inscripcion.alumnos && typeof inscripcion.alumnos === 'object' && !Array.isArray(inscripcion.alumnos)) {
                    acc.push({ ...(inscripcion.alumnos as Alumno), programa_id: inscripcion.programa_id });
                }
                return acc;
            }, []);
            setAlumnos(alumnosInscritos);
        }

        if (todosAlumnosRes.error) toast.error('Error al cargar la lista completa de alumnos.');
        else setTodosLosAlumnos(todosAlumnosRes.data || []);

        if (maestrosRes.error) toast.error('Error al cargar los maestros.');
        else setMaestros(maestrosRes.data || []);

        setLoading(false);
    }, []);

    useEffect(() => {
        const obtenerAnios = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.rpc('obtener_anios_programas');
            if (data) {
                const anioActual = new Date().getFullYear();
                const anios = [...new Set([anioActual, ...data])].sort((a, b) => b - a);
                setAniosDisponibles(anios);
            }
        };
        obtenerAnios();
    }, []);

    useEffect(() => {
        if (filtroAnio) {
            fetchData(filtroAnio);
        }
    }, [filtroAnio, fetchData]);

    const handleCloseAllModals = () => {
        setFormProgramaOpen(false);
        setFormAlumnoOpen(false);
        setFormMaestroOpen(false);
        setProgramaParaEditar(null);
        setAlumnoParaEditar(null);
        setProgramaPadreId(null);
        setNivelIdParaAlumno(null);
        setMaestroParaEditar(null);
    };

    const handleOpenCrearPrograma = () => {
        handleCloseAllModals();
        setFormProgramaOpen(true);
    };
    
    const handleOpenCrearNivel = (padreId: number) => {
        setProgramaPadreId(padreId);
        setFormProgramaOpen(true);
    };

    const handleOpenInscribirAlumno = (nivelId: number) => {
        setNivelIdParaAlumno(nivelId);
        setFormAlumnoOpen(true);
    };
    
    const handleOpenEditarAlumno = (alumno: Alumno) => {
        setAlumnoParaEditar(alumno);
        setNivelIdParaAlumno(alumno.programa_id!);
        setFormAlumnoOpen(true);
    };

    const handleOpenEditarPrograma = (programa: Programa) => {
        setProgramaParaEditar(programa);
        setFormProgramaOpen(true);
    };

    const handleOpenCrearMaestro = () => {
        setMaestroParaEditar(null);
        setFormMaestroOpen(true);
    };

    const handleOpenEditarMaestro = (maestro: Maestro) => {
        setMaestroParaEditar(maestro);
        setFormMaestroOpen(true);
    };

    const handleSaveAndClose = async () => {
        handleCloseAllModals();
        await fetchData(filtroAnio);
    };

    if (loading) { return <div className="text-center py-10">Cargando datos...</div>; }

    const programasPrincipales = programas
        .filter(p => p.parent_id === null)
        .filter(p => {
            if (rol === 'SUPER' || (programasAsignados && programasAsignados.includes('TODOS'))) {
                return true;
            }
            return programasAsignados && programasAsignados.includes(p.nombre);
        })
        .filter(p => p.nombre.toLowerCase().includes(programaSearchTerm.toLowerCase()))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return (
        <>
            <div className="p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <BotonVolver ruta="/" />
                            <h1 className="text-xl md:text-3xl font-bold text-gray-800">Gestión Educativa</h1>
                        </div>
                        {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button onClick={handleOpenCrearPrograma} className="w-full md:w-auto gap-2 whitespace-nowrap">
                                    <Plus className="h-4 w-4"/>
                                    Nuevo Programa
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row w-full items-center gap-4">
                        <div className="flex items-center w-full sm:w-auto">
                            <label htmlFor="filtro-anio" className="text-sm font-medium mr-3 text-gray-600">Año:</label>
                            <select
                                id="filtro-anio"
                                value={filtroAnio}
                                onChange={(e) => setFiltroAnio(e.target.value)}
                                className="flex-grow h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {aniosDisponibles.map(anio => (<option key={anio} value={anio}>{anio}</option>))}
                            </select>
                        </div>
                        <div className="relative w-full flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar programa..."
                                value={programaSearchTerm}
                                onChange={(e) => setProgramaSearchTerm(e.target.value)}
                                className="pl-9 w-full"
                            />
                        </div>
                    </div>
                </div>
                
                <Programas
                    programasPrincipales={programasPrincipales}
                    todosLosProgramas={programas}
                    alumnos={alumnos}
                    maestros={maestros}
                    onEditarPrograma={handleOpenEditarPrograma}
                    onCrearNivel={handleOpenCrearNivel}
                    onInscribirAlumno={handleOpenInscribirAlumno}
                    onEditarAlumno={handleOpenEditarAlumno}
                    onCrearMaestro={handleOpenCrearMaestro}
                    onEditarMaestro={handleOpenEditarMaestro}
                    onDataChange={() => fetchData(filtroAnio)}
                />
            </div>

            <FormPrograma
                isOpen={formProgramaOpen}
                onClose={handleCloseAllModals}
                onSave={handleSaveAndClose}
                programaAEditar={programaParaEditar}
                programaPadreId={programaPadreId}
            />
            
            <FormMaestro
                isOpen={formMaestroOpen}
                onClose={handleCloseAllModals}
                onSave={handleSaveAndClose}
                maestroAEditar={maestroParaEditar}
            />
            
            {nivelIdParaAlumno && (
                <FormAlumno
                    isOpen={formAlumnoOpen}
                    onClose={handleCloseAllModals}
                    onSave={handleSaveAndClose}
                    alumnoAEditar={alumnoParaEditar}
                    nivelId={nivelIdParaAlumno}
                    todosLosAlumnos={todosLosAlumnos}
                    alumnosInscritos={alumnos}
                />
            )}
        </>
    );
}
