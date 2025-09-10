'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { Pencil, PlusCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { editar, crearYAsignarPolitica } from './Acciones';
import { motion } from 'framer-motion';

// --- Tipos ---
type Organo = { id: number; nombre: string; "No": number; };
type Politica = { id: number; nombre: string; "No": number; };
type Asignacion = { organo_id: number; politica_id: number; anio: number; politicas: { nombre: string | null }; };

interface Props {
  organos: Organo[];
  politicas: Politica[];
  asignaciones: Asignacion[];
  filtroAnio: string;
  onDataChange: () => void;
}

export default function TablaOrganos({ organos, politicas, asignaciones, filtroAnio, onDataChange }: Props) {
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!organos || organos.length === 0) {
    return <div className="text-center text-gray-500 mt-8 p-4 border rounded-lg">No hay órganos registrados.</div>;
  }

  return (
    <div className="overflow-x-auto border border-gray-300 rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">No.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[60%]">Descripción</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {organos.map((organo, index) => {
            const politicasAsignadas = asignaciones.filter(a => a.organo_id === organo.id);
            const organoKey = `organo-${organo.id}`;
            const isLast = index >= organos.length - 1;

            return (
              <Fragment key={organo.id}>
                <tr className="bg-slate-50">
                  <td className="px-6 py-3 font-bold">{organo.No}</td>
                  <td className="px-6 py-3 font-bold">{organo.nombre}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="relative inline-block text-left" ref={menuAbierto === organoKey ? menuRef : null}>
                      <Button size="sm" onClick={() => setMenuAbierto(menuAbierto === organoKey ? null : organoKey)}>
                        <MoreHorizontal className="h-4 w-10" />
                      </Button>
                      {menuAbierto === organoKey && (
                        <motion.div
                          className={`absolute right-0 z-20 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-1 ${
                            isLast ? 'bottom-full mb-2 origin-bottom-right' : 'mt-2 origin-top-right'
                          }`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <Button variant="ghost" className="w-full justify-start text-blue-600" onClick={() => { crearYAsignarPolitica(organo, filtroAnio, onDataChange); setMenuAbierto(null); }}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Crear Política
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => { editar('organo', organo, onDataChange); setMenuAbierto(null); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar Órgano
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </td>
                </tr>

                {politicasAsignadas.length > 0 ? (
                  politicasAsignadas.map((asig, policyIndex) => {
                    const politicaKey = `politica-${asig.organo_id}-${asig.politica_id}`;
                    const politicaCompleta = politicas.find(p => p.id === asig.politica_id);

                    return (
                      <tr key={politicaKey} className="hover:bg-gray-50">
                        <td className="px-6 py-2 text-right pr-4 font-mono text-sm text-gray-500">{organo.No}.{policyIndex + 1}</td>
                        <td className="px-6 py-2">{asig.politicas.nombre}</td>
                        <td className="px-6 py-2 text-right">
                          <div className="relative inline-block text-left" ref={menuAbierto === politicaKey ? menuRef : null}>
                            <Button size="sm" variant="ghost" onClick={() => setMenuAbierto(menuAbierto === politicaKey ? null : politicaKey)}>
                                <MoreHorizontal className="h-4 w-10" />
                            </Button>
                            {menuAbierto === politicaKey && (
                                <motion.div
                                    className={`absolute right-0 z-20 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-1 ${
                                      isLast && policyIndex >= politicasAsignadas.length - 2 ? 'bottom-full mb-2 origin-bottom-right' : 'mt-2 origin-top-right'
                                    }`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <Button variant="ghost" className="w-full justify-start" 
                                    onClick={() => { 
                                        if (politicaCompleta) {
                                            editar('politica', politicaCompleta, onDataChange); 
                                        }
                                        setMenuAbierto(null); 
                                    }}
                                    disabled={!politicaCompleta}>
                                        <Pencil className="h-4 w-4 mr-2" /> Editar Política
                                    </Button>
                                </motion.div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td></td>
                    <td colSpan={2} className="px-6 py-2 text-sm text-gray-400 italic">
                      No hay políticas asignadas para el año {filtroAnio}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}