'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pencil, UserPlus, GraduationCap, ChevronDown } from 'lucide-react';
import type { Alumno, Maestro } from '@/components/educacion/lib/esquemas';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.css';

import { useNivelData } from '@/hooks/educacion/useNivelData';
import useUserData from '@/hooks/sesion/useUserData';
import { createClient } from '@/utils/supabase/client';

import { Button } from '@/components/ui/button';
import FormAlumno from '../../forms/Alumno';
import AsignarMaestro from '../../forms/AsignarMaestro';
import FormPrograma from '../../forms/Programa';

import Lista from './Lista';
import Estadistica from './Estadistica';
import OpcionesAlumno from './modals/OpcionesAlumno';
import AlumnoCard from '../../forms/AlumnoCard';

export default function Nivel() {
  const router = useRouter();
  const params = useParams();
  const nivelId = params.nivelId as string;
  const { rol } = useUserData();
  const { nivel, alumnosDelNivel, maestros, loading, fetchData } = useNivelData(nivelId);

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(null);
  const [alumnoParaEditar, setAlumnoParaEditar] = useState<Alumno | null>(null);
  const [isFormAlumnoOpen, setIsFormAlumnoOpen] = useState(false);
  const [isAsignarMaestroOpen, setIsAsignarMaestroOpen] = useState(false);
  const [isFormNivelOpen, setIsFormNivelOpen] = useState(false);
  const [accionesAbiertas, setAccionesAbiertas] = useState<Alumno | null>(null);
  const [todosLosAlumnos, setTodosLosAlumnos] = useState<Alumno[]>([]);

  useEffect(() => {
    const fetchAllAlumnos = async () => {
        const supabase = createClient();
        const { data, error } = await supabase.from('alumnos').select('*');
        if (data) {
            setTodosLosAlumnos(data);
        } else {
            console.error('Error fetching all students:', error);
        }
    };
    fetchAllAlumnos();
  }, []);
  
  useEffect(() => {
    const isModalOpen = isFormAlumnoOpen || alumnoSeleccionado || isAsignarMaestroOpen || isFormNivelOpen || accionesAbiertas;
    if (isModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isFormAlumnoOpen, alumnoSeleccionado, isAsignarMaestroOpen, isFormNivelOpen, accionesAbiertas]);

  const handleOpenFormAlumno = () => {
    setAlumnoParaEditar(null);
    setIsFormAlumnoOpen(true);
  };
  
  const handleOpenEditarAlumno = (alumno: Alumno) => {
    setAlumnoParaEditar(alumno);
    setIsFormAlumnoOpen(true);
    setAccionesAbiertas(null);
  };

  const handleCancelFormAlumno = () => {
    setIsFormAlumnoOpen(false);
    setAlumnoParaEditar(null);
  };

  const handleSaveAndCloseFormAlumno = () => {
    setIsFormAlumnoOpen(false);
    setAlumnoParaEditar(null);
    fetchData();
  };
  
  const handleDesinscribir = async (alumno: Alumno) => {
    if (!nivel) {
        toast.error('Error: No se pudo obtener la información del nivel.');
        return;
    }

    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea desasignar a "${alumno.nombre_completo}" de este nivel?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const supabase = createClient();
        const { error } = await supabase
          .from('alumnos_inscripciones')
          .delete()
          .match({ alumno_id: alumno.id, programa_id: nivel.id });

        if (error) {
          toast.error('No se pudo quitar la inscripción.');
        } else {
          toast.success(`"${alumno.nombre_completo}" ha sido desasignado de este nivel.`);
          fetchData();
        }
      }
      setAccionesAbiertas(null);
    });
  };

  const maestroAsignado: Maestro | null = useMemo(() => {
    if (!nivel || !nivel.maestro_id || !maestros || maestros.length === 0) return null;
    return maestros.find(m => m.id === nivel.maestro_id) || null;
  }, [nivel, maestros]);
  
  if (loading || !nivel) {
    return <div className="text-center py-10">Cargando Nivel...</div>;
  }

  return (
    <>
      <div className="mx-auto w-full lg:w-4/5 max-w-7xl p-4 lg:p-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex-shrink-0">
            <Button
              variant="link"
              className="gap-2 text-blue-600 justify-start p-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4"/>
              Volver
            </Button>
          </div>
            <div className='w-full sm:w-auto flex flex-col items-end'>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  className="w-full sm:w-auto gap-2 whitespace-nowrap bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                  variant="link"
                >
                  <h3 className="text-xl">
                    {nivel.nombre}
                  </h3>
                  <ChevronDown className="h-4 w-4 text-blue-700" />
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="mt-2 rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  sideOffset={5}
                  align="center"
                >
                  <div className="w-full px-2 py-1 text-xs font-semibold text-gray-500 whitespace-normal">
                    {nivel.descripcion || 'Sin descripción'}
                  </div>
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  <DropdownMenu.Item asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-start gap-2 text-blue-600 hover:bg-blue-50"
                      onClick={() => setIsFormNivelOpen(true)}
                    >
                      <Pencil className="h-4 w-4" /> Editar Nivel
                    </Button>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-start gap-2 text-blue-600 hover:bg-blue-50"
                      onClick={handleOpenFormAlumno}
                    >
                      <UserPlus className="h-4 w-4" /> Inscribir Alumno
                    </Button>
                  </DropdownMenu.Item>
                  {(rol === 'SUPER' || rol === 'ADMINISTRADOR' || rol === 'DIGITADOR') && (
                    <DropdownMenu.Item asChild>
                      <Button
                        variant="ghost"
                        className="w-full flex justify-start gap-2 text-blue-600 hover:bg-blue-50"
                        onClick={() => setIsAsignarMaestroOpen(true)}
                      >
                        <GraduationCap className="h-4 w-4" /> Asignar Maestro
                      </Button>
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>
              
        <div className="flex flex-col gap-4">
          {/* Este div ya no es necesario, el menú desplegable lo reemplaza. */}
        </div>

        <div className="flex flex-col gap-6 mt-4">
          <Lista
            alumnosDelNivel={alumnosDelNivel}
            maestroAsignado={maestroAsignado}
            setAccionesAbiertas={setAccionesAbiertas}
          />
          <Estadistica alumnosDelNivel={alumnosDelNivel} />
        </div>
      </div>

      <AnimatePresence>
        {accionesAbiertas && (
          <OpcionesAlumno
            alumno={accionesAbiertas}
            onClose={() => setAccionesAbiertas(null)}
            onView={() => setAlumnoSeleccionado(accionesAbiertas)}
            onEdit={handleOpenEditarAlumno}
            onDesinscribir={() => handleDesinscribir(accionesAbiertas)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alumnoSeleccionado && (
          <AlumnoCard 
            isOpen={!!alumnoSeleccionado} 
            onClose={() => setAlumnoSeleccionado(null)} 
            alumno={alumnoSeleccionado} 
            key={alumnoSeleccionado.id}
          />
        )}
      </AnimatePresence>
      <FormAlumno
        isOpen={isFormAlumnoOpen}
        onClose={handleCancelFormAlumno}
        onSave={handleSaveAndCloseFormAlumno}
        nivelId={nivel?.id}
        todosLosAlumnos={todosLosAlumnos}
        alumnosInscritos={alumnosDelNivel}
        alumnoAEditar={alumnoParaEditar}
      />
      <AsignarMaestro
        isOpen={isAsignarMaestroOpen}
        onClose={() => setIsAsignarMaestroOpen(false)}
        onSave={() => { setIsAsignarMaestroOpen(false); fetchData(); }}
        nivelId={nivel?.id}
      />
      <AnimatePresence>
        {isFormNivelOpen && (
          <FormPrograma
            isOpen={isFormNivelOpen}
            onClose={() => setIsFormNivelOpen(false)}
            onSave={() => {
              setIsFormNivelOpen(false);
              fetchData();
            }}
            programaAEditar={nivel}
          />
        )}
      </AnimatePresence>
    </>
  );
}