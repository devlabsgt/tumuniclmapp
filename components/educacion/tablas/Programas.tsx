'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Programa, Alumno, Maestro } from '../esquemas';
import { Pencil, PlusCircle, UserPlus, Search } from 'lucide-react';
import TablaAlumnos from './Alumnos';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  programasPrincipales: Programa[];
  todosLosProgramas: Programa[];
  alumnos: Alumno[];
  maestros: Maestro[]; // <-- Prop para recibir la lista de maestros
  onEditarPrograma: (programa: Programa) => void;
  onCrearNivel: (padreId: number) => void;
  onInscribirAlumno: (nivelId: number) => void;
  onEditarAlumno: (alumno: Alumno) => void;
  onDataChange: () => void;
}

export default function Programas({ 
    programasPrincipales, 
    todosLosProgramas, 
    alumnos, 
    maestros, // <-- Recibir maestros
    onEditarPrograma, 
    onCrearNivel, 
    onInscribirAlumno, 
    onEditarAlumno, 
    onDataChange 
}: Props) {
  const [openProgramaId, setOpenProgramaId] = useState<number | null>(null);
  const [openNivelId, setOpenNivelId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleProgramaToggle = (programaId: number) => {
    setOpenProgramaId(prev => (prev === programaId ? null : programaId));
    setOpenNivelId(null);
    setSearchTerm('');
  };

  const handleNivelToggle = (nivelId: number) => {
    setOpenNivelId(prev => (prev === nivelId ? null : nivelId));
  };

  if (programasPrincipales.length === 0) {
    return (
        <div className="text-center text-gray-500 mt-8 p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold">No hay programas registrados</h3>
            <p className="text-sm">Cree un nuevo programa para empezar.</p>
        </div>
    );
  }

  const programasParaMostrar = openProgramaId === null
    ? programasPrincipales
    : programasPrincipales.filter(p => p.id === openProgramaId);

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {programasParaMostrar.map(programa => {
          const nivelesDelPrograma = todosLosProgramas
            .filter(p => p.parent_id === programa.id)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));

          const filteredNiveles = nivelesDelPrograma.filter(nivel => 
              nivel.nombre.toLowerCase().includes(searchTerm.toLowerCase())
          );
          const isProgramaOpen = openProgramaId === programa.id;
          
          const nivelesParaMostrar = openNivelId === null
              ? filteredNiveles
              : filteredNiveles.filter(n => n.id === openNivelId);

          return (
            <motion.div 
              key={programa.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden"
            >
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleProgramaToggle(programa.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex-grow text-lg font-semibold text-gray-800 truncate">{programa.nombre}</h3>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <Button size="sm" variant="outline" className="text-xs p-2 h-auto" onClick={(e) => { e.stopPropagation(); onEditarPrograma(programa); }}>
                      <Pencil className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button size="sm" className="text-xs p-2 h-auto" onClick={(e) => { e.stopPropagation(); onCrearNivel(programa.id); }}>
                      <PlusCircle className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Nivel</span>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{programa.descripcion || 'Sin descripción'}</p>
              </div>

              <AnimatePresence>
                {isProgramaOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-50 border-t border-gray-200"
                  >
                    <div className="p-4 space-y-4">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                              placeholder="Filtrar niveles por nombre..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-9"
                          />
                      </div>
                      
                      <div className="space-y-2">
                        <AnimatePresence>
                          {nivelesParaMostrar.map(nivel => {
                            const isNivelOpen = openNivelId === nivel.id;
                            // Encontrar el nombre del maestro
                            const maestroAsignado = maestros.find(m => m.id === nivel.maestro_id);
                            return (
                              <motion.div 
                                layout 
                                key={nivel.id} 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="border bg-white rounded-lg overflow-hidden"
                              >
                                <div 
                                  className="p-3 cursor-pointer hover:bg-gray-50"
                                  onClick={() => handleNivelToggle(nivel.id)}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="flex-grow font-semibold text-gray-800 truncate">{nivel.nombre}</h4>
                                        <div className="flex-shrink-0 flex items-center gap-1">
                                            <Button size="sm" variant="outline" className="text-xs p-2 h-auto" onClick={(e) => { e.stopPropagation(); onEditarPrograma(nivel); }}>
                                                <Pencil className="h-4 w-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Editar</span>
                                            </Button>
                                            <Button size="sm" className="text-xs p-2 h-auto" onClick={(e) => { e.stopPropagation(); onInscribirAlumno(nivel.id); }}>
                                                <UserPlus className="h-4 w-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Inscribir</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{nivel.descripcion || 'Sin descripción'}</p>
                                    {maestroAsignado && (
                                        <p className="text-xs font-medium text-gray-600 mt-1">Maestro: {maestroAsignado.nombre}</p>
                                    )}
                                </div>
                                <AnimatePresence>
                                  {isNivelOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                    >
                                      <TablaAlumnos 
                                          alumnos={alumnos.filter(a => a.programa_id === nivel.id)} 
                                          nivel={nivel}
                                          onEditar={onEditarAlumno}
                                          onDataChange={onDataChange}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        {nivelesParaMostrar.length === 0 && (
                          <div className="text-center text-sm text-gray-500 py-8 px-4 bg-white rounded-lg">
                              No se encontraron niveles con ese nombre.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
