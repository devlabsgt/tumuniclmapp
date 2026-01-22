'use client'

import React, { useEffect, useState } from 'react'
import { X, Save, Loader2, Check, ChevronsUpDown, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermisoEmpleado } from '../types'
import { guardarPermiso, PerfilUsuario, gestionarPermiso } from '../acciones'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TipoVistaPermisos } from '@/hooks/permisos/usePermisos'

const TIPOS_GENERAL = [ "Vacaciones", "Asuntos Personales", "Situaciones Administrativas", "Situaciones Académicas", "Licencias no remuneradas", "Sindicales", "Citaciones", "Calamidad Doméstica", "Otros" ];
const TIPOS_SEGURIDAD_SOCIAL = [ "Consultas Médicas y/o Odontológicas", "Exámenes Médicos y/o Odontológicos", "Enfermedad Común", "Consulta IGSS", "Accidente de trabajo", "Enfermedad Profesional", "Licencias de Maternidad / Paternidad", "Incapacidad" ];

interface Props {
  isOpen: boolean
  onClose: () => void
  permisoAEditar?: PermisoEmpleado | null
  onSuccess: () => void
  perfilUsuario: PerfilUsuario | null
  tipoVista: TipoVistaPermisos 
}

export default function CrearEditarPermiso({ isOpen, onClose, permisoAEditar, onSuccess, perfilUsuario, tipoVista }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [openComboboxTipo, setOpenComboboxTipo] = useState(false)
  const [otroTipoManual, setOtroTipoManual] = useState<string>('')
  const [esRemunerado, setEsRemunerado] = useState(false)

  // === LÓGICA SIMPLIFICADA ===
  const esRRHH = ['RRHH', 'SUPER', 'SECRETARIO'].includes(perfilUsuario?.rol || '');
  
  // Modos de Gestión
  const esJefeAprobando = tipoVista === 'gestion_jefe' && permisoAEditar?.estado === 'pendiente';
  const esRRHHAprobando = tipoVista === 'gestion_rrhh' && permisoAEditar?.estado === 'aprobado_jefe';
  const esModoGestion = esJefeAprobando || esRRHHAprobando;
  
  // Modo Lectura: Si existe permiso y NO soy RRHH (o si estoy gestionando, los inputs de texto se bloquean)
  const esSoloLectura = (!!permisoAEditar && !esRRHH) || esModoGestion;

  // Nombre a mostrar en el input
  const nombreEmpleado = permisoAEditar?.usuario?.nombre || perfilUsuario?.nombre || '';
  const userId = permisoAEditar?.user_id || perfilUsuario?.id || '';

  useEffect(() => {
    if (isOpen) {
      if (permisoAEditar) {
        setEsRemunerado(permisoAEditar.remunerado || false)
        const tipo = [...TIPOS_GENERAL, ...TIPOS_SEGURIDAD_SOCIAL].find(t => t.toLowerCase() === permisoAEditar.tipo.toLowerCase())
        if (tipo) { setSelectedTipo(tipo); setOtroTipoManual('') } 
        else { setSelectedTipo('Otros'); setOtroTipoManual(permisoAEditar.tipo) }
      } else {
        setSelectedTipo(''); setOtroTipoManual(''); setEsRemunerado(false)
      }
    }
  }, [isOpen, permisoAEditar])

  if (!isOpen) return null

  const handleGestion = async (accion: 'aprobar' | 'rechazar') => {
      if (!permisoAEditar) return;
      setLoading(true);
      try {
          // Si es RRHH aprobando, enviamos el estado del check remunerado
          if (esRRHHAprobando && accion === 'aprobar') {
             // Pequeño truco: guardamos primero el estado del check si cambió
             const formData = new FormData();
             formData.set('remunerado', esRemunerado ? 'on' : 'off');
             // Nota: Esto requeriría que gestionarPermiso acepte remunerado o hacerlo en dos pasos.
             // Para simplificar y no romper 'gestionarPermiso', asumimos que el backend maneja el update simple
             // O usamos guardarPermiso parcial. Por ahora, mantendremos el flujo estándar.
             
             // ACTUALIZACIÓN RÁPIDA DEL REMUNERADO ANTES DE APROBAR
             await guardarPermiso(formData, permisoAEditar.id); 
          }

          await gestionarPermiso(permisoAEditar.id, accion, permisoAEditar.user_id);
          toast.success(accion === 'aprobar' ? 'Solicitud Procesada' : 'Solicitud Rechazada');
          onSuccess(); onClose();
      } catch (err: any) { toast.error(err.message); } 
      finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedTipo) return toast.error('Selecciona un tipo.');
    if (selectedTipo === 'Otros' && !otroTipoManual.trim()) return toast.error('Especifique el tipo.');

    setLoading(true);
    const formData = new FormData(e.currentTarget)
    formData.set('user_id', userId) 
    formData.set('tipo', selectedTipo === 'Otros' ? otroTipoManual : selectedTipo)

    const inicio = formData.get('inicio') as string;
    const fin = formData.get('fin') as string;
    if (inicio) formData.set('inicio', new Date(inicio).toISOString());
    if (fin) formData.set('fin', new Date(fin).toISOString());
    
    // Si NO es RRHH, limpiamos campos administrativos
    if (!esRRHH) { formData.delete('estado'); formData.delete('remunerado'); }

    try {
      await guardarPermiso(formData, permisoAEditar?.id)
      toast.success(permisoAEditar ? 'Actualizado' : 'Creado');
      onSuccess(); onClose();
    } catch (err: any) { toast.error(err.message); } 
    finally { setLoading(false); }
  }

  const defaultInicio = permisoAEditar?.inicio ? format(new Date(permisoAEditar.inicio), "yyyy-MM-dd'T'HH:mm") : ''
  const defaultFin = permisoAEditar?.fin ? format(new Date(permisoAEditar.fin), "yyyy-MM-dd'T'HH:mm") : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {esModoGestion ? 'Gestionar Solicitud' : (permisoAEditar ? 'Detalles / Editar' : 'Nueva Solicitud')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Empleado</label>
            <input type="text" readOnly value={nombreEmpleado} className="p-2 text-sm rounded-md border border-gray-300 bg-gray-100 dark:bg-neutral-900 dark:border-neutral-800 text-gray-500 dark:text-gray-400 w-full outline-none cursor-default"/>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tipo</label>
            {esSoloLectura ? (
               <input type="text" readOnly value={selectedTipo === 'Otros' ? otroTipoManual : selectedTipo} className="p-2 text-sm rounded-md border border-gray-300 bg-gray-100 dark:bg-neutral-900 dark:border-neutral-800 text-gray-500 dark:text-gray-400 w-full outline-none" />
            ) : (
                <>
                    <Popover open={openComboboxTipo} onOpenChange={setOpenComboboxTipo}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-sm border-gray-300 dark:bg-neutral-950 dark:border-neutral-800 dark:text-gray-200">
                        {selectedTipo || "Seleccionar tipo..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command className="dark:bg-neutral-900 dark:border-neutral-800">
                        <CommandInput placeholder="Buscar tipo..." />
                        <CommandList>
                            <div className="max-h-60 overflow-y-auto">
                                <CommandGroup heading="General">
                                {TIPOS_GENERAL.map((t) => (
                                    <CommandItem key={t} value={t} onSelect={(val) => { const orig = TIPOS_GENERAL.find(x => x.toLowerCase() === val.toLowerCase()) || val; setSelectedTipo(orig); setOpenComboboxTipo(false) }}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedTipo === t ? "opacity-100" : "opacity-0")} /> {t}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup heading="Seguridad Social">
                                {TIPOS_SEGURIDAD_SOCIAL.map((t) => (
                                    <CommandItem key={t} value={t} onSelect={(val) => { const orig = TIPOS_SEGURIDAD_SOCIAL.find(x => x.toLowerCase() === val.toLowerCase()) || val; setSelectedTipo(orig); setOpenComboboxTipo(false) }}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedTipo === t ? "opacity-100" : "opacity-0")} /> {t}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </div>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                    </Popover>
                    {selectedTipo === 'Otros' && (
                    <input type="text" placeholder="Especifique..." value={otroTipoManual} onChange={(e) => setOtroTipoManual(e.target.value)} className="mt-1 p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-200 w-full" />
                    )}
                </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 dark:text-gray-400">Inicio</label>
              <input type="datetime-local" name="inicio" readOnly={esSoloLectura} defaultValue={defaultInicio} 
                className={cn("p-2 text-sm rounded-md border outline-none w-full", esSoloLectura ? "border-gray-300 bg-gray-100 text-gray-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400" : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 dark:text-gray-200 focus:ring-1 focus:ring-blue-500")}/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 dark:text-gray-400">Fin</label>
              <input type="datetime-local" name="fin" readOnly={esSoloLectura} defaultValue={defaultFin} 
                className={cn("p-2 text-sm rounded-md border outline-none w-full", esSoloLectura ? "border-gray-300 bg-gray-100 text-gray-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400" : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 dark:text-gray-200 focus:ring-1 focus:ring-blue-500")}/>
            </div>
          </div>

          {/* CHECKBOX REMUNERADO (Visible solo para RRHH y si YA existe la solicitud) */}
          {esRRHH && permisoAEditar && (
             <div className="flex items-center space-x-2 py-1">
                <input 
                  type="checkbox" 
                  id="remunerado" 
                  name="remunerado" 
                  checked={esRemunerado} 
                  onChange={(e) => setEsRemunerado(e.target.checked)} 
                  // Editable SOLO si RRHH está aprobando. En historial o edición normal, es ReadOnly/Disabled
                  disabled={!esRRHHAprobando} 
                  className="h-4 w-4 border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 disabled:opacity-50" 
                />
                <label htmlFor="remunerado" className="text-xs font-medium text-gray-700 dark:text-gray-300">Remunerado</label>
             </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
            {esModoGestion ? (
                <>
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="dark:bg-transparent dark:border-neutral-700 dark:text-gray-300 h-10">Cancelar</Button>
                    <Button type="button" onClick={() => handleGestion('rechazar')} className="bg-red-600 hover:bg-red-700 text-white h-10 px-4" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2"/>} Rechazar
                    </Button>
                    <Button type="button" onClick={() => handleGestion('aprobar')} className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2"/>} 
                        {esJefeAprobando ? 'Aprobar como jefe' : 'Aprobar como RRHH'}
                    </Button>
                </>
            ) : (
                <>
                    <Button type="button" variant="outline" onClick={onClose} className="h-10 dark:bg-transparent dark:border-neutral-700 dark:text-gray-300">Cerrar</Button>
                    {!esSoloLectura && <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-10" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Guardar</Button>}
                </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}