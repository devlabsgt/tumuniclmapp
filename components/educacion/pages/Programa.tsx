'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import EstadisticasNiveles from '../charts/Niveles';
import EstadisticasLugares from '../charts/Lugares';
import FormPrograma from '../forms/Programa';
import { useProgramaData } from '@/hooks/educacion/useProgramaData';
import { AnimatePresence } from 'framer-motion';
import Maestros from '../charts/Maestros';

export default function Programa() {
  const router = useRouter();
  const params = useParams();
  const programaId = params.id as string;
  
  const { programa, nivelesDelPrograma, alumnosDelPrograma, maestrosDelPrograma, loading, fetchData } = useProgramaData(programaId);
  const [isFormNivelOpen, setIsFormNivelOpen] = useState(false);
  const [isMaestrosModalOpen, setIsMaestrosModalOpen] = useState(false);

  // Hook para controlar el desplazamiento del body
  useEffect(() => {
    if (isFormNivelOpen || isMaestrosModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Limpieza al desmontar el componente
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isFormNivelOpen, isMaestrosModalOpen]);

  const handleCloseAndRefresh = () => {
    setIsFormNivelOpen(false);
    fetchData();
  };
  
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const nivelId = data.activePayload[0].payload.id;
      router.push(`/protected/educacion/programa/${programaId}/nivel/${nivelId}`);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Cargando Programa...</div>;
  }
  
  if (!programa) {
    return (
      <div className="mx-auto w-full lg:w-4/5 max-w-7xl p-4 lg:p-6 text-center text-red-600 font-bold">
        Error: No se encontró el programa con el ID '{programaId}'.
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full lg:w-4/5 max-w-7xl p-4 lg:p-6">
        <header className="flex flex-col gap-4 mb-6">
            <div className="grid grid-cols-2 lg:flex lg:justify-between items-center gap-4">
                <Button onClick={() => router.back()} variant="outline" className="w-full lg:w-auto gap-2">
                    <ArrowLeft className="h-4 w-4"/>
                    Volver
                </Button>
                <div className="flex justify-end gap-2 w-full lg:w-auto">
                    <Button 
                        onClick={() => setIsMaestrosModalOpen(true)} 
                        className="gap-2 whitespace-nowrap bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                        variant="outline"
                    >
                        <GraduationCap className="h-4 w-4"/>
                        Maestros
                    </Button>
                    <Button onClick={() => setIsFormNivelOpen(true)} className="gap-2 whitespace-nowrap">
                        Nuevo Nivel
                    </Button>
                </div>
            </div>
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">{programa.nombre}</h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1">{programa.descripcion || 'Este programa no tiene una descripción.'}</p>
            </div>
        </header>
        
        <main className="space-y-4">
          <div className="border rounded-lg bg-white shadow-sm overflow-x-hidden p-4">
            {nivelesDelPrograma && alumnosDelPrograma ? (
              <div className="space-y-6">
                <EstadisticasNiveles
                  niveles={nivelesDelPrograma}
                  alumnos={alumnosDelPrograma}
                  onBarClick={handleBarClick}
                />
                <EstadisticasLugares
                  alumnos={alumnosDelPrograma}
                />
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No hay datos para mostrar.
              </div>
            )}
          </div>
        </main>
      </div>
      
      <AnimatePresence>
        {isFormNivelOpen && (
            <FormPrograma
                isOpen={isFormNivelOpen}
                onClose={() => setIsFormNivelOpen(false)}
                onSave={handleCloseAndRefresh}
                programaAEditar={null}
                programaPadreId={programa.id}
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMaestrosModalOpen && (
            <Maestros
                isOpen={isMaestrosModalOpen}
                onClose={() => setIsMaestrosModalOpen(false)}
                maestros={maestrosDelPrograma}
            />
        )}
      </AnimatePresence>
    </>
  );
}