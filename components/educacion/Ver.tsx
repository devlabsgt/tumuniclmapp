'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useUserData from '@/hooks/useUserData';
import type { Programa } from './lib/esquemas';
import FormPrograma from './forms/Programa';
import FormMaestro from './forms/Maestro';
import AsignarProgramaModal from './lib/AsignarPrograma';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import { Plus, Search, Pencil, GraduationCap, Link } from 'lucide-react';
import { useEducacionData } from '@/hooks/educacion/useEducacionData';
import { AnimatePresence } from 'framer-motion';

export default function Ver() {
    const router = useRouter();
    const { rol, cargando: cargandoUsuario, programas: programasAsignados } = useUserData();
    const { programas, loading: cargandoData, fetchData, aniosDisponibles } = useEducacionData();
    
    const [filtroAnio, setFiltroAnio] = useState<string>(new Date().getFullYear().toString());
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormProgramaOpen, setIsFormProgramaOpen] = useState(false);
    const [isFormMaestroOpen, setIsFormMaestroOpen] = useState(false);
    const [isAsignarProgramasOpen, setIsAsignarProgramasOpen] = useState(false);
    const [programaParaEditar, setProgramaParaEditar] = useState<Programa | null>(null);

    useEffect(() => {
        if (!aniosDisponibles.includes(parseInt(filtroAnio))) {
            if (aniosDisponibles.length > 0) {
                setFiltroAnio(aniosDisponibles[0].toString());
            } else {
                setFiltroAnio(new Date().getFullYear().toString());
            }
        }
    }, [aniosDisponibles, filtroAnio]);

    // Hook para controlar el desplazamiento del body
    useEffect(() => {
      if (isFormProgramaOpen || isFormMaestroOpen || isAsignarProgramasOpen) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      };
  
      return () => {
        document.body.classList.remove('overflow-hidden');
      };
    }, [isFormProgramaOpen, isFormMaestroOpen, isAsignarProgramasOpen]);

    const handleOpenCrearPrograma = () => {
        setProgramaParaEditar(null);
        setIsFormProgramaOpen(true);
    };

    const handleOpenCrearMaestro = () => {
        setIsFormMaestroOpen(true);
    };

    const handleOpenAsignarProgramas = () => {
        setIsAsignarProgramasOpen(true);
    };

    const handleCloseAsignarProgramas = () => {
        setIsAsignarProgramasOpen(false);
    };

    const handleOpenEditarPrograma = (programa: Programa) => {
        setProgramaParaEditar(programa);
        setIsFormProgramaOpen(true);
    };

    const handleCloseAndRefreshPrograma = () => {
        setIsFormProgramaOpen(false);
        fetchData();
    };

    const handleCloseAndRefreshMaestro = () => {
      setIsFormMaestroOpen(false);
    };

    // Filtra los programas según el rol. Si es SUPER o ADMINISTRADOR, ve todos, si no, solo los asignados.
    const programasFiltrados = useMemo(() => {
        if (rol === 'SUPER' || rol === 'ADMINISTRADOR') {
            return programas
                .filter(p => p.parent_id === null && p.anio?.toString() === filtroAnio && p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
        } else {
            // Filtra por los programas asignados al usuario y por el año y término de búsqueda
            return programas
                .filter(p => p.parent_id === null && programasAsignados.includes(p.nombre) && p.anio?.toString() === filtroAnio && p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
        }
    }, [programas, programasAsignados, filtroAnio, searchTerm, rol]);
    
    // Si los datos del hook o del usuario están cargando, muestra un loading genérico
    if (cargandoData || cargandoUsuario) {
        return <div className="text-center py-10">Cargando Módulo...</div>;
    }

    // Si el usuario no tiene rol ni programas asignados, muestra un mensaje
    if (!rol && (programasAsignados || []).length === 0) {
      return (
        <div className="mx-auto w-full lg:w-4/5 max-w-7xl p-4 lg:p-6 text-center">
            <p className="text-gray-500">No tiene programas asignados para ver.</p>
        </div>
    );
    }
    
    return (
        <>
            <div className="mx-auto w-full lg:w-4/5 max-w-7xl p-4 lg:p-6">
                <header className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row lg:flex-row lg:justify-between items-start lg:items-center gap-4">
                        <BotonVolver ruta="/" />
                        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                           {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                            <>
                                <Button onClick={handleOpenAsignarProgramas} variant="outline" className="w-full sm:w-auto gap-2 whitespace-nowrap bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200">
                                    <Link className="h-4 w-4"/>
                                    Asignar Programas
                                </Button>
                                <Button onClick={handleOpenCrearMaestro} className="w-full sm:w-auto gap-2 whitespace-nowrap">
                                    <GraduationCap className="h-4 w-4"/>
                                    Nuevo Maestro
                                </Button>
                                <Button onClick={handleOpenCrearPrograma} className="w-full sm:w-auto gap-2 whitespace-nowrap">
                                    <Plus className="h-4 w-4"/>
                                    Nuevo Programa
                                </Button>
                            </>
                             )}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Gestión Educativa</h1>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full items-center gap-4">
                        <div className="flex items-center w-full sm:w-auto">
                            <label htmlFor="filtro-anio" className="text-sm font-medium mr-3 text-gray-600">Año:</label>
                            <select
                                id="filtro-anio"
                                value={filtroAnio}
                                onChange={(e) => setFiltroAnio(e.target.value)}
                                className="w-full sm:w-auto flex-grow h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                {aniosDisponibles.map(anio => (<option key={anio} value={anio}>{anio}</option>))}
                            </select>
                        </div>
                        <div className="relative w-full flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar programa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full"
                            />
                        </div>
                    </div>
                </header>

                <main className="space-y-4">
                    {programasFiltrados.length > 0 ? (
                        programasFiltrados.map(programa => (
                            <div
                                key={programa.id}
                                onClick={() => router.push(`/protected/educacion/programa/${programa.id}`)}
                                className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/protected/educacion/programa/${programa.id}`); }}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-grow">
                                        <h5 className="text-base lg:text-lg font-bold text-gray-800">{programa.nombre}</h5>
                                        <p className="text-sm lg:text-base text-gray-600 mt-1">
                                            {programa.descripcion || 'Este programa no tiene una descripción.'}
                                        </p>
                                    </div>
                                    {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-shrink-0 z-10 relative gap-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEditarPrograma(programa);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" /> Editar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No se encontraron programas para los filtros seleccionados.</p>
                        </div>
                    )}
                </main>
            </div>
            <AnimatePresence>
                {isFormProgramaOpen && (
                    <FormPrograma
                        isOpen={isFormProgramaOpen}
                        onClose={() => setIsFormProgramaOpen(false)}
                        onSave={handleCloseAndRefreshPrograma}
                        programaAEditar={programaParaEditar}
                        programaPadreId={null}
                    />
                )}
                {isFormMaestroOpen && (
                    <FormMaestro
                        isOpen={isFormMaestroOpen}
                        onClose={() => setIsFormMaestroOpen(false)}
                        onSave={handleCloseAndRefreshMaestro}
                        maestroAEditar={null}
                    />
                )}
                {isAsignarProgramasOpen && (
                    <AsignarProgramaModal
                        isOpen={isAsignarProgramasOpen}
                        onClose={handleCloseAsignarProgramas}
                    />
                )}
            </AnimatePresence>
        </>
    );
}