'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Programa, Alumno, Maestro } from '../lib/esquemas';
import { Pencil, PlusCircle, UserPlus, Search, Users, BookCopy, UserCheck } from 'lucide-react';
import TablaAlumnos from './Alumnos';
import TablaMaestros from './Maestros';
import AsignarMaestro from '../forms/AsignarMaestro';
import { motion, AnimatePresence } from 'framer-motion';
import useUserData from '@/hooks/useUserData';

interface Props {
  programasPrincipales: Programa[];
  todosLosProgramas: Programa[];
  alumnos: Alumno[];
  maestros: Maestro[];
  onEditarPrograma: (programa: Programa) => void;
  onCrearNivel: (padreId: number) => void;
  onInscribirAlumno: (nivelId: number) => void;
  onEditarAlumno: (alumno: Alumno) => void;
  onCrearMaestro: () => void;
  onEditarMaestro: (maestro: Maestro) => void;
  onDataChange: () => void;
}

export default function Programas({ 
    programasPrincipales, 
    todosLosProgramas, 
    alumnos, 
    maestros,
    onEditarPrograma, 
    onCrearNivel, 
    onInscribirAlumno, 
    onEditarAlumno,
    onCrearMaestro,
    onEditarMaestro,
    onDataChange 
}: Props) {
  const { rol } = useUserData();
  const [openProgramaId, setOpenProgramaId] = useState<number | null>(null);
  const [openNivelId, setOpenNivelId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'niveles' | 'maestros'>('niveles');
  const [searchTerm, setSearchTerm] = useState('');
  const [openNivelMenuId, setOpenNivelMenuId] = useState<number | null>(null);
  
  const [asignarMaestroOpen, setAsignarMaestroOpen] = useState(false);
  const [nivelParaAsignar, setNivelParaAsignar] = useState<Programa | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenNivelMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProgramaToggle = (programaId: number) => {
    setOpenProgramaId(prev => (prev === programaId ? null : programaId));
    setOpenNivelId(null);
    setSearchTerm('');
    setActiveTab('niveles');
  };

  const handleNivelToggle = (nivelId: number) => {
    setOpenNivelId(prev => (prev === nivelId ? null : nivelId));
  };

  const handleOpenAsignarMaestro = (nivel: Programa) => {
    setNivelParaAsignar(nivel);
    setAsignarMaestroOpen(true);
  };
  
  const handleCloseAsignarMaestro = () => {
    setAsignarMaestroOpen(false);
    setNivelParaAsignar(null);
  };

  const handleSaveAsignarMaestro = () => {
    handleCloseAsignarMaestro();
    onDataChange();
  };

  if (programasPrincipales.length === 0) {
    return (
        <div className="text-center text-gray-500 mt-8 p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold">No hay programas registrados</h3>
        </div>
    );
  }

  const programasParaMostrar = openProgramaId === null
    ? programasPrincipales
    : programasPrincipales.filter(p => p.id === openProgramaId);

  return (
    <>
      <div className="space-y-3">
        {programasParaMostrar.map(programa => {
          const isProgramaOpen = openProgramaId === programa.id;
          const nivelesDelPrograma = todosLosProgramas.filter(p => p.parent_id === programa.id).sort((a, b) => a.nombre.localeCompare(b.nombre));
          const filteredNiveles = nivelesDelPrograma.filter(nivel => nivel.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const maestroIdsEnPrograma = [...new Set(nivelesDelPrograma.map(n => n.maestro_id).filter(id => id != null))];
          const maestrosDelPrograma = maestros.filter(m => maestroIdsEnPrograma.includes(m.id));

          return (
            <motion.div 
              key={programa.id} 
              layout 
              className={`border rounded-lg bg-white shadow-sm ${openNivelMenuId === null ? 'overflow-hidden' : ''}`}
            >
              <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleProgramaToggle(programa.id)}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex-grow text-lg font-semibold text-gray-800 truncate">{programa.nombre}</h3>
                  {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <Button size="sm" variant="outline" className="text-xs p-2 h-auto" onClick={(e) => { e.stopPropagation(); onEditarPrograma(programa); }}>
                        <Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button size="sm" className="text-xs p-2 h-auto" onClick={(e) => { e.stopPropagation(); onCrearNivel(programa.id); }}>
                        <PlusCircle className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Nivel</span>
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{programa.descripcion || 'Sin descripción'}</p>
              </div>

              <AnimatePresence>
                {isProgramaOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-slate-50 border-t">
                    <div className="p-4">
                      <div className="border-b flex mb-4">
                        <button onClick={() => setActiveTab('niveles')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold ${activeTab === 'niveles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                          <BookCopy className="h-4 w-4" /> Niveles
                        </button>
                        <button onClick={() => setActiveTab('maestros')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold ${activeTab === 'maestros' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                          <Users className="h-4 w-4" /> Maestros
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {activeTab === 'niveles' && (
                            <div className="space-y-4">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Filtrar niveles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                              </div>
                              <div className="space-y-2">
                                <AnimatePresence>
                                  {filteredNiveles.map(nivel => {
                                    const isNivelOpen = openNivelId === nivel.id;
                                    const alumnosEnNivel = alumnos.filter(a => a.programa_id === nivel.id).length;
                                    if (openNivelId !== null && openNivelId !== nivel.id) {
                                      return null;
                                    }
                                    return (
                                      <motion.div 
                                        layout 
                                        key={nivel.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`border bg-white rounded-lg ${openNivelMenuId !== nivel.id ? 'overflow-hidden' : ''}`}
                                      >
                                        <div className="p-3 cursor-pointer hover:bg-gray-50" onClick={() => handleNivelToggle(nivel.id)}>
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                              <div className="flex-grow">
                                                  <h4 className="font-semibold text-gray-800">{nivel.nombre}</h4>
                                                  <p className="text-sm text-gray-500 mt-1 mb-5">{nivel.descripcion || 'Sin descripción'}</p>
                                                  <p className="text-xs text-gray-500"><span className='font-bold'>Maestro:</span> {maestros.find(m => m.id === nivel.maestro_id)?.nombre || 'Sin asignar'}</p>
                                                  <p className="text-xs text-gray-500 mt-1"><span className='font-bold'>Alumnos Inscritos:</span> {alumnosEnNivel}</p>
                                              </div>
                                            <div className="relative w-full sm:w-auto" ref={openNivelMenuId === nivel.id ? menuRef : null}>
                                                <Button size="sm" variant="ghost" className="w-full sm:w-auto p-2 h-auto flex items-center justify-center gap-2" onClick={(e) => { e.stopPropagation(); setOpenNivelMenuId(prev => prev === nivel.id ? null : nivel.id); }}>
                                                    Acciones
                                                </Button>
                                                <AnimatePresence>
                                                {openNivelMenuId === nivel.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute top-full right-0 mt-2 w-full sm:w-56 bg-white border rounded-md shadow-lg z-20 p-1"
                                                    >
                                                        <Button variant="ghost" className="w-full justify-start gap-2" onClick={(e) => { e.stopPropagation(); onInscribirAlumno(nivel.id); setOpenNivelMenuId(null); }}>
                                                            <UserPlus className="h-4 w-4" /> Inscribir Alumno
                                                        </Button>
                                                        {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                                                            <>
                                                                <Button variant="ghost" className="w-full justify-start gap-2" onClick={(e) => { e.stopPropagation(); handleOpenAsignarMaestro(nivel); setOpenNivelMenuId(null); }}>
                                                                    <UserCheck className="h-4 w-4" /> Asignar Maestro
                                                                </Button>
                                                                <Button variant="ghost" className="w-full justify-start gap-2" onClick={(e) => { e.stopPropagation(); onEditarPrograma(nivel); setOpenNivelMenuId(null); }}>
                                                                    <Pencil className="h-4 w-4" /> Editar Nivel
                                                                </Button>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>
                                            </div>
                                          </div>
                                        </div>
                                        <AnimatePresence>
                                          {isNivelOpen && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
                                              <TablaAlumnos alumnos={alumnos.filter(a => a.programa_id === nivel.id)} nivel={nivel} onEditar={onEditarAlumno} onDataChange={onDataChange} />
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </motion.div>
                                    );
                                  })}
                                </AnimatePresence>
                              </div>
                            </div>
                          )}

                          {activeTab === 'maestros' && (
                            <div className="space-y-4">
                              {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                                <div className="flex justify-end">
                                    <Button size="sm" className="text-xs" onClick={onCrearMaestro}><PlusCircle className="h-4 w-4 mr-2" /> Agregar Maestro</Button>
                                </div>
                              )}
                              <TablaMaestros 
                                  maestrosDelPrograma={maestrosDelPrograma} 
                                  nivelesDelPrograma={nivelesDelPrograma}
                                  onEditarMaestro={onEditarMaestro}
                              />
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AsignarMaestro
        isOpen={asignarMaestroOpen}
        onClose={handleCloseAsignarMaestro}
        onSave={handleSaveAsignarMaestro}
        nivel={nivelParaAsignar}
        maestros={maestros}
      />
    </>
  );
}
