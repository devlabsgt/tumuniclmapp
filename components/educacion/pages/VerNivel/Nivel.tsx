'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Alumno, Programa } from '../../lib/esquemas';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Pencil, UserX, Eye, GraduationCap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PieChart, Pie, Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AlumnoCard from '../../forms/AlumnoCard';
import FormAlumno from '../../forms/Alumno';
import AsignarMaestro from '../../forms/AsignarMaestro';
import FormPrograma from '../../forms/Programa'; // Importar el componente del modal del programa
import { Input } from '@/components/ui/input';
import useUserData from '@/hooks/useUserData';
import { useParams, useRouter } from 'next/navigation';
import { useNivelData } from '@/hooks/educacion/useNivelData';
import { toast } from 'react-toastify';
import { createClient } from '@/utils/supabase/client';
import MensajeAnimado from '../../../ui/Typeanimation';

const COLORS = {
  'Hombres': '#3b82f6',
  'Mujeres': '#ec4899'
};

const calculateAge = (dob: Date): number => {
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

export default function Nivel() {
  const router = useRouter();
  const params = useParams();
  const nivelId = params.nivelId as string;
  const { rol } = useUserData();
  const { nivel, alumnosDelNivel, maestros, loading, fetchData } = useNivelData(nivelId);

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormAlumnoOpen, setIsFormAlumnoOpen] = useState(false);
  const [alumnoParaEditar, setAlumnoParaEditar] = useState<Alumno | null>(null);
  const [isAsignarMaestroOpen, setIsAsignarMaestroOpen] = useState(false);
  const [isFormNivelOpen, setIsFormNivelOpen] = useState(false); // Nuevo estado para el modal de edición de nivel
  const [accionesAbiertas, setAccionesAbiertas] = useState<Alumno | null>(null);
  const [todosLosAlumnos, setTodosLosAlumnos] = useState<Alumno[]>([]);
  const [alumnoPendienteDesasignar, setAlumnoPendienteDesasignar] = useState<Alumno | null>(null);

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
  
  // Hook para controlar el desplazamiento del body
  useEffect(() => {
    const isModalOpen = isFormAlumnoOpen || alumnoSeleccionado || isAsignarMaestroOpen || isFormNivelOpen || accionesAbiertas || alumnoPendienteDesasignar;
    if (isModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Limpieza al desmontar el componente
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isFormAlumnoOpen, alumnoSeleccionado, isAsignarMaestroOpen, isFormNivelOpen, accionesAbiertas, alumnoPendienteDesasignar]);


  const pieData = useMemo(() => {
    const hombres = alumnosDelNivel.filter(a => a.sexo === 'M').length;
    const mujeres = alumnosDelNivel.filter(a => a.sexo === 'F').length;
    return [
      { name: 'Hombres', value: hombres },
      { name: 'Mujeres', value: mujeres },
    ].filter(item => item.value > 0);
  }, [alumnosDelNivel]);

  const legendFormatter = (value: string, entry: any) => {
      const { payload } = entry;
      return <span className="text-gray-700">{value} ({payload.value})</span>;
  };

  const sortedAlumnos = useMemo(() => {
    if (!alumnosDelNivel) return [];
    return [...alumnosDelNivel].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
  }, [alumnosDelNivel]);

  const handleCloseAlumnoCard = () => {
    setAlumnoSeleccionado(null);
  };
  
  // Función para abrir el modal de Alumno
  const handleOpenFormAlumno = () => {
    setAlumnoParaEditar(null);
    setIsFormAlumnoOpen(true);
  };
  
  // Función para abrir el modal de edición de Alumno
  const handleOpenEditarAlumno = (alumno: Alumno) => {
    setAlumnoParaEditar(alumno);
    setIsFormAlumnoOpen(true);
  };

  // Función para cerrar el modal de Alumno sin guardar
  const handleCancelFormAlumno = () => {
    setIsFormAlumnoOpen(false);
    setAlumnoParaEditar(null);
  };

  // Función para cerrar el modal de Alumno y recargar los datos
  const handleSaveAndCloseFormAlumno = () => {
    setIsFormAlumnoOpen(false);
    setAlumnoParaEditar(null);
    fetchData();
  };

  // Función para abrir el modal de Asignar Maestro
  const handleOpenAsignarMaestro = () => {
    setIsAsignarMaestroOpen(true);
  };

  // Función para cerrar el modal de Asignar Maestro sin guardar
  const handleCancelAsignarMaestro = () => {
    setIsAsignarMaestroOpen(false);
  };

  // Función para cerrar el modal de Asignar Maestro y recargar los datos
  const handleSaveAndCloseAsignarMaestro = () => {
    setIsAsignarMaestroOpen(false);
    fetchData();
  };

  // Función para abrir el modal de edición de nivel
  const handleOpenEditarNivel = () => {
      setIsFormNivelOpen(true);
  };

  // Función para cerrar el modal de nivel y recargar los datos
  const handleSaveAndCloseNivel = () => {
      setIsFormNivelOpen(false);
      fetchData();
  };

  // Función que inicia el proceso de desasignación mostrando el modal de confirmación
  const handleDesinscribirAlumno = (alumno: Alumno) => {
    setAlumnoPendienteDesasignar(alumno);
  };
  
  // Función que realiza la desasignación después de la confirmación
  const confirmarDesasignacion = async () => {
    if (!alumnoPendienteDesasignar || !nivel) return;

    const supabase = createClient();
    const { error } = await supabase
        .from('alumnos_inscripciones')
        .delete()
        .match({ alumno_id: alumnoPendienteDesasignar.id, programa_id: nivel.id });

    if (error) {
        toast.error('No se pudo quitar la inscripción.');
    } else {
        toast.error(`"${alumnoPendienteDesasignar.nombre_completo}" ha sido desasignado de este nivel.`);
        fetchData();
    }
    setAlumnoPendienteDesasignar(null);
    setAccionesAbiertas(null);
  };

  const maestroAsignado = useMemo(() => {
    if (!nivel || !nivel.maestro_id || !maestros || maestros.length === 0) return null;
    return maestros.find(m => m.id === nivel.maestro_id);
  }, [nivel, maestros]);
  
  if (loading || !nivel) {
    return <div className="text-center py-10">Cargando Nivel...</div>;
  }

  return (
    <>
      <div className="mx-auto w-full lg:w-4/5 max-w-7xl p-4 lg:p-6">
      <header className="flex justify-between items-start mb-4">
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
          <div className='flex flex-col text-right'>
              <div className="flex justify-end items-center gap-2 mb-2">
                  <Button
                      onClick={handleOpenEditarNivel}
                      className="w-auto gap-2 whitespace-nowrap bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                      variant="outline"
                  >
                      <h3 className="text-xl">
                          {nivel.nombre}
                      </h3>
                      <Pencil className="h-4 w-4 text-blue-700" />
                  </Button>
              </div>
              <p className="text-sm text-gray-600">{nivel.descripcion || 'Sin descripción'}</p>
              <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold">Maestro Encargado:</span>{' '}
                  {maestroAsignado ? maestroAsignado.nombre : 'No asignado'}
              </p>
          </div>
      </header>
              
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
                variant="outline"
                className="w-full sm:w-1/2 gap-2 text-blue-600 border-blue-600 shadow-sm hover:bg-blue-50 hover:shadow-md"
                onClick={handleOpenFormAlumno}
            >
                Inscribir Alumno
            </Button>
            {(rol === 'SUPER' || rol === 'ADMINISTRADOR' || rol === 'DIGITADOR') && (
              <Button
                  variant="outline"
                  className="w-full sm:w-1/2 gap-2 text-blue-600 border-blue-600 shadow-sm hover:bg-blue-50 hover:shadow-md"
                  onClick={handleOpenAsignarMaestro}
              >
                  Asignar Maestro
              </Button>
            )}
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Buscar alumno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-4">
          <div className="w-full overflow-x-auto">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Listado de Alumnos ({alumnosDelNivel.length})</h4>
                    <div className="text-start text-sm text-blue-500 mb-4 mt-4">
            <MensajeAnimado
              textos={['Seleccione un alumno para ver más']}
            />
        </div>
            <div className="rounded-lg border">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr className="border-b">
                    <th scope="col" className="px-4 py-1 border-r text-center whitespace-nowrap">No.</th>
                    <th scope="col" className="px-4 py-1 border-r">Nombre</th>
                    <th scope="col" className="px-4 py-1 border-r">Edad</th>
                    <th scope="col" className="px-4 py-1 border-r">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAlumnos.map((alumno, index) => {
                    const edad = alumno.fecha_nacimiento ? calculateAge(new Date(alumno.fecha_nacimiento)) : null;
                    const esMayorDeEdad = edad !== null && edad >= 18;
                    return (
                      <tr
                        key={alumno.id}
                        className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setAccionesAbiertas(alumno)}
                      >
                        <td className="px-4 py-1 border-r text-center whitespace-nowrap">{index + 1}</td>
                        <td className="px-4 py-1 border-r font-medium text-gray-900 whitespace-nowrap">{alumno.nombre_completo}</td>
                        <td className="px-4 py-1 border-r">
                          {edad !== null ? (
                            <span className={esMayorDeEdad ? 'text-green-600 font-bold underline' : ''}>
                              {`${edad} años`}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="px-4 py-1 border-r">{alumno.telefono_alumno || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-full bg-slate-50 p-4 rounded-lg flex flex-col">
            <h4 className="text-md font-semibold text-gray-800 mb-4 text-center">Distribución por Género</h4>
            <div className="h-64 w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                    <Legend iconType="circle" formatter={legendFormatter} />
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14}>{`${(percent * 100).toFixed(0)}%`}</text>;
                      }}>
                      {pieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-gray-500">No hay datos de género.</div>}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {accionesAbiertas && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          >
            <motion.div
              className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <h4 className="text-xl font-bold text-gray-800">{accionesAbiertas.nombre_completo}</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => { setAlumnoSeleccionado(accionesAbiertas); }} 
                  className="bg-green-100 text-green-700 hover:bg-green-200 gap-2 text-base font-semibold"
                >
                  <Eye className="h-5 w-5" /> Ver Tarjeta
                </Button>
                <Button 
                  onClick={() => handleOpenEditarAlumno(accionesAbiertas)} 
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 gap-2 text-base font-semibold"
                >
                  <Pencil className="h-5 w-5" /> Editar Alumno
                </Button>
                <Button 
                  onClick={() => handleDesinscribirAlumno(accionesAbiertas)} 
                  className="bg-red-100 text-red-700 hover:bg-red-200 gap-2 text-base font-semibold"
                >
                  <UserX className="h-5 w-5" /> Desasignar Alumno
                </Button>
              </div>
              <Button 
                type="button" 
                onClick={() => setAccionesAbiertas(null)} 
                className="w-full mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-base font-semibold"
              >
                Cerrar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alumnoPendienteDesasignar && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          >
            <motion.div
              className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 shadow-xl"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <h4 className="text-xl font-bold text-gray-800">Confirmación</h4>
              <p className="text-gray-600">¿Está seguro de que desea desasignar a "{alumnoPendienteDesasignar.nombre_completo}" de este nivel?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAlumnoPendienteDesasignar(null)}>Cancelar</Button>
                <Button onClick={confirmarDesasignacion} className="bg-red-600 hover:bg-red-700">Sí, desasignar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alumnoSeleccionado && (
          <AlumnoCard 
            isOpen={!!alumnoSeleccionado} 
            onClose={handleCloseAlumnoCard} 
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
        onClose={handleCancelAsignarMaestro}
        onSave={handleSaveAndCloseAsignarMaestro}
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