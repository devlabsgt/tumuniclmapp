'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { alumnoSchema, type Alumno as AlumnoType } from '../lib/esquemas';
import { toast } from 'react-toastify';

type AlumnoFormData = z.infer<typeof alumnoSchema>;

interface Lugar {
    id: number;
    nombre: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  alumnoAEditar?: AlumnoType | null;
  nivelId: number;
  todosLosAlumnos: AlumnoType[];
  alumnosInscritos: AlumnoType[];
}

export default function Alumno({ isOpen, onClose, onSave, alumnoAEditar, nivelId, todosLosAlumnos, alumnosInscritos }: Props) {
  const isEditMode = !!alumnoAEditar;
  const [lugares, setLugares] = useState<Lugar[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<AlumnoFormData>({
    resolver: zodResolver(alumnoSchema),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AlumnoType[]>([]);
  const [selectedAlumno, setSelectedAlumno] = useState<AlumnoType | null>(null);

  const sexoActual = watch('sexo');

  useEffect(() => {
    if (isOpen) {
      const supabase = createClient();
      
      const fetchAndReset = async () => {
        const { data: lugaresData, error } = await supabase.from('lugares_clm').select('id, nombre').order('nombre');
        if (error) {
          toast.error('No se pudieron cargar los lugares.');
        } else {
          setLugares(lugaresData as Lugar[]);
        }

        if (alumnoAEditar) {
          const nacimientoFormatted = new Date(alumnoAEditar.fecha_nacimiento).toISOString().split('T')[0];
          reset({ ...alumnoAEditar, fecha_nacimiento: nacimientoFormatted });
          setSelectedAlumno(alumnoAEditar);
          setSearchTerm(alumnoAEditar.nombre_completo);
        } else {
          reset({
            nombre_completo: '',
            cui_alumno: '',
            fecha_nacimiento: '',
            sexo: 'M',
            nombre_encargado: '',
            cui_encargado: '',
            telefono_encargado: '',
            telefono_alumno: '',
            ubicacion: '',
          });
          setSelectedAlumno(null);
          setSearchTerm('');
        }
      };

      fetchAndReset();
    }
  }, [isOpen, alumnoAEditar, reset]);

  useEffect(() => {
    if (!isEditMode && searchTerm.length > 2 && !selectedAlumno) {
      const filtered = todosLosAlumnos.filter(
        (a) => a.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, todosLosAlumnos, selectedAlumno, isEditMode]);

  const handleSelectAlumno = (alumno: AlumnoType) => {
    const yaInscrito = alumnosInscritos.some(inscrito => inscrito.id === alumno.id && inscrito.programa_id === nivelId);

    if (yaInscrito) {
      toast.info(`"${alumno.nombre_completo}" ya se encuentra inscrito en este nivel.`);
      setSearchResults([]);
      return;
    }

    const nacimientoFormatted = new Date(alumno.fecha_nacimiento).toISOString().split('T')[0];
    reset({ ...alumno, fecha_nacimiento: nacimientoFormatted });
    setSelectedAlumno(alumno);
    setSearchTerm(alumno.nombre_completo);
    setSearchResults([]);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setValue('nombre_completo', e.target.value);
    
    if (selectedAlumno && !isEditMode) {
      reset({
        nombre_completo: e.target.value,
        cui_alumno: '',
        fecha_nacimiento: '',
        sexo: 'M',
        nombre_encargado: '',
        cui_encargado: '',
        telefono_encargado: '',
        telefono_alumno: '',
        ubicacion: '',
      })
      setSelectedAlumno(null);
    }
  };

  const onSubmit = async (formData: AlumnoFormData) => {
    const supabase = createClient();
    let operationToast: 'creado' | 'actualizado' | 'inscrito' = 'creado';

    try {
      let alumnoId = selectedAlumno?.id || alumnoAEditar?.id;

      if (isEditMode) {
        if (formData.cui_alumno !== alumnoAEditar?.cui_alumno) {
            const { data: existingCui } = await supabase
                .from('alumnos')
                .select('id')
                .eq('cui_alumno', formData.cui_alumno)
                .single();
            if (existingCui) {
                toast.error('El nuevo CUI del alumno ya está registrado para otra persona.');
                return;
            }
        }
        const { error } = await supabase.from('alumnos').update(formData).eq('id', alumnoId);
        if (error) throw new Error(`Error al actualizar alumno: ${error.message}`);
        operationToast = 'actualizado';

      } else {
        if (!alumnoId) {
          const { data: existingCui } = await supabase
            .from('alumnos')
            .select('id')
            .eq('cui_alumno', formData.cui_alumno)
            .single();
          
          if (existingCui) {
            toast.error('El CUI del alumno ya está registrado. Búsquelo por nombre para inscribirlo.');
            return;
          }

          const { data: nuevoAlumno, error } = await supabase.from('alumnos').insert(formData).select('id').single();
          if (error) throw new Error(`Error al crear alumno: ${error.message}`);
          alumnoId = nuevoAlumno.id;
          operationToast = 'creado';
        }

        const { error: inscripcionError } = await supabase.from('alumnos_inscripciones').insert({
          alumno_id: alumnoId,
          programa_id: nivelId,
        });

        if (inscripcionError) {
          if (inscripcionError.message.includes('duplicate key')) {
              toast.info(`El alumno ya estaba inscrito en este nivel.`);
          } else {
              throw new Error(`Error al inscribir: ${inscripcionError.message}`);
          }
        } else {
          operationToast = 'inscrito';
        }
      }
      
      toast.success(`Alumno ${operationToast} correctamente.`);
      onSave();
      onClose();

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Editar Datos del Alumno' : 'Inscribir Alumno'}</h2>
              <p className="text-sm text-gray-500">Complete la información requerida.</p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full -mt-2 -mr-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* --- SECCIÓN DATOS DEL ALUMNO --- */}
            <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700">Datos del Alumno</h3>
              
              <div>
                <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <Input
                    id="nombre_completo"
                    {...register("nombre_completo")}
                    value={searchTerm}
                    onChange={handleNameChange}
                    onBlur={() => setTimeout(() => setSearchResults([]), 150)}
                    placeholder={isEditMode ? "Nombre del alumno" : "Buscar o crear alumno..."}
                    className={errors.nombre_completo ? 'border-red-500' : ''}
                    autoComplete="off"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute w-full bg-white border rounded-md mt-1 z-20 max-h-40 overflow-y-auto shadow-lg">
                      {searchResults.map((alumno, index) => (
                        <button 
                          type="button" 
                          key={alumno.id} 
                          className={`w-full text-left p-3 text-sm hover:bg-blue-500 hover:text-white transition-colors duration-150 ${index < searchResults.length - 1 ? 'border-b' : ''}`}
                          onClick={() => handleSelectAlumno(alumno)}
                        >
                          {alumno.nombre_completo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.nombre_completo && <p className="text-sm text-red-500 mt-1">{errors.nombre_completo.message}</p>}
              </div>

              <div>
                <label htmlFor="cui_alumno" className="block text-sm font-medium text-gray-700 mb-1">CUI / DPI</label>
                <Input id="cui_alumno" {...register("cui_alumno")} placeholder="13 dígitos sin espacios" className={errors.cui_alumno ? 'border-red-500' : ''} readOnly={!!selectedAlumno && !isEditMode} />
                {errors.cui_alumno && <p className="text-sm text-red-500 mt-1">{errors.cui_alumno.message}</p>}
              </div>
              
              <div>
                <label htmlFor="telefono_alumno" className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
                <Input id="telefono_alumno" {...register("telefono_alumno")} placeholder="8 dígitos sin espacios" className={errors.telefono_alumno ? 'border-red-500' : ''} readOnly={!!selectedAlumno && !isEditMode} />
                {errors.telefono_alumno && <p className="text-sm text-red-500 mt-1">{errors.telefono_alumno.message}</p>}
              </div>

              <div>
                <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <Input id="fecha_nacimiento" type="date" {...register("fecha_nacimiento")} className={errors.fecha_nacimiento ? 'border-red-500' : ''} readOnly={!!selectedAlumno && !isEditMode} />
                {errors.fecha_nacimiento && <p className="text-sm text-red-500 mt-1">{errors.fecha_nacimiento.message}</p>}
              </div>

              <div>
                <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <select 
                  id="ubicacion" 
                  {...register("ubicacion")} 
                  className={`w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ubicacion ? 'border-red-500' : ''}`}
                  disabled={!!selectedAlumno && !isEditMode}
                >
                  <option value="">-- Seleccione una ubicación --</option>
                  {lugares.map(lugar => (
                      <option key={lugar.id} value={lugar.nombre}>{lugar.nombre}</option>
                  ))}
                </select>
                {errors.ubicacion && <p className="text-sm text-red-500 mt-1">{errors.ubicacion.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                <div className={`flex rounded-md border p-1 bg-gray-50 ${!!selectedAlumno && !isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <button type="button" onClick={() => setValue('sexo', 'M', { shouldValidate: true })} className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors duration-200 ${sexoActual === 'M' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`} disabled={!!selectedAlumno && !isEditMode}>Masculino</button>
                    <button type="button" onClick={() => setValue('sexo', 'F', { shouldValidate: true })} className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors duration-200 ${sexoActual === 'F' ? 'bg-pink-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`} disabled={!!selectedAlumno && !isEditMode}>Femenino</button>
                </div>
                {errors.sexo && <p className="text-sm text-red-500 mt-1">{errors.sexo.message}</p>}
              </div>
            </div>

            {/* --- SECCIÓN DATOS DEL ENCARGADO --- */}
            <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700">Datos del Encargado</h3>
              
              <div>
                <label htmlFor="nombre_encargado" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Encargado</label>
                <Input id="nombre_encargado" {...register("nombre_encargado")} placeholder="Nombre completo del encargado" className={errors.nombre_encargado ? 'border-red-500' : ''} readOnly={!!selectedAlumno && !isEditMode} />
                {errors.nombre_encargado && <p className="text-sm text-red-500 mt-1">{errors.nombre_encargado.message}</p>}
              </div>

              <div>
                <label htmlFor="cui_encargado" className="block text-sm font-medium text-gray-700 mb-1">CUI / DPI</label>
                <Input id="cui_encargado" {...register("cui_encargado")} placeholder="13 dígitos sin espacios" className={errors.cui_encargado ? 'border-red-500' : ''} readOnly={!!selectedAlumno && !isEditMode} />
                {errors.cui_encargado && <p className="text-sm text-red-500 mt-1">{errors.cui_encargado.message}</p>}
              </div>

              <div>
                <label htmlFor="telefono_encargado" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <Input id="telefono_encargado" {...register("telefono_encargado")} placeholder="8 dígitos sin espacios" className={errors.telefono_encargado ? 'border-red-500' : ''} readOnly={!!selectedAlumno && !isEditMode} />
                {errors.telefono_encargado && <p className="text-sm text-red-500 mt-1">{errors.telefono_encargado.message}</p>}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Inscribir')}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}