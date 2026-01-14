'use client'

import React, { useEffect, useState } from 'react'
import { X, Save, Loader2, ShieldAlert, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermisoEmpleado, UsuarioConJerarquia } from '../types'
import { guardarPermiso, PerfilUsuario } from '../acciones'
import { format } from 'date-fns'
import { toast } from 'react-toastify';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const TIPOS_GENERAL = [
  "Vacaciones",
  "Asuntos Personales",
  "Situaciones Administrativas",
  "Situaciones Académicas",
  "Licencias no remuneradas",
  "Sindicales",
  "Citaciones",
  "Calamidad Doméstica",
  "Otros"
];

const TIPOS_SEGURIDAD_SOCIAL = [
  "Consultas Médicas y/o Odontológicas",
  "Exámenes Médicos y/o Odontológicos",
  "Enfermedad Común",
  "Consulta IGSS",
  "Accidente de trabajo",
  "Enfermedad Profesional",
  "Licencias de Maternidad / Paternidad",
  "Incapacidad"
];

const TODOS_LOS_TIPOS = [...TIPOS_GENERAL, ...TIPOS_SEGURIDAD_SOCIAL];

interface Props {
  isOpen: boolean
  onClose: () => void
  permisoAEditar?: PermisoEmpleado | null
  onSuccess: () => void
  perfilUsuario: PerfilUsuario | null
  usuarios: UsuarioConJerarquia[]
}

export default function CrearEditarPermiso({ isOpen, onClose, permisoAEditar, onSuccess, perfilUsuario, usuarios }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [openComboboxEmpleado, setOpenComboboxEmpleado] = useState(false)

  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [openComboboxTipo, setOpenComboboxTipo] = useState(false)
  const [otroTipoManual, setOtroTipoManual] = useState<string>('')
  const [esRemunerado, setEsRemunerado] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setError('')
      setOtroTipoManual('')
      
      if (permisoAEditar) {
        setSelectedUserId(permisoAEditar.user_id)
        setEsRemunerado(permisoAEditar.remunerado || false)
        
        const tipoEncontrado = TODOS_LOS_TIPOS.find(t => t.toLowerCase() === permisoAEditar.tipo.toLowerCase())
        if (tipoEncontrado) {
          setSelectedTipo(tipoEncontrado)
        } else {
          setSelectedTipo('Otros')
          setOtroTipoManual(permisoAEditar.tipo)
        }
      } else {
        setSelectedTipo('')
        setEsRemunerado(false)
        if (usuarios.length === 1) {
           setSelectedUserId(usuarios[0].id)
        } else {
           setSelectedUserId('')
        }
      }
    }
  }, [isOpen, permisoAEditar, usuarios])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedUserId) {
        setError('Debes seleccionar un empleado.')
        return
    }

    if (!selectedTipo) {
        setError('Debes seleccionar un tipo de permiso.')
        return
    }

    if (selectedTipo === 'Otros' && !otroTipoManual.trim()) {
        setError('Por favor especifica el tipo de permiso manual.')
        return
    }

    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.set('user_id', selectedUserId)
    const tipoFinal = selectedTipo === 'Otros' ? otroTipoManual : selectedTipo
    formData.set('tipo', tipoFinal)

    // === SOLUCIÓN ZONA HORARIA ===
    // Convertimos la hora local del input a ISO String (UTC) antes de enviar
    const inicioLocal = formData.get('inicio') as string
    const finLocal = formData.get('fin') as string

    if (inicioLocal) {
        // new Date() usa la zona horaria del navegador (Guatemala) para crear el objeto
        // toISOString() lo convierte a UTC absoluto, que es lo que Supabase guarda correctamente
        formData.set('inicio', new Date(inicioLocal).toISOString())
    }
    if (finLocal) {
        formData.set('fin', new Date(finLocal).toISOString())
    }
    // ============================
    
    try {
      await guardarPermiso(formData, permisoAEditar?.id)
      toast.success(permisoAEditar ? 'Permiso actualizado correctamente' : 'Solicitud creada correctamente');
      onSuccess()
      onClose()
    } catch (err: any) {
      setError('Error al guardar el permiso. Verifica los datos.')
      toast.error(err.message || 'Error al guardar');
    } finally {
      setLoading(false)
    }
  }

  // format() usa la hora local del navegador para mostrar, lo cual es correcto
  const defaultInicio = permisoAEditar?.inicio 
    ? format(new Date(permisoAEditar.inicio), "yyyy-MM-dd'T'HH:mm") 
    : ''
  
  const defaultFin = permisoAEditar?.fin 
    ? format(new Date(permisoAEditar.fin), "yyyy-MM-dd'T'HH:mm") 
    : ''

  const esAdmin = ['SUPER', 'RRHH', 'SECRETARIO'].includes(perfilUsuario?.rol || '');
  const esSoloLectura = !!permisoAEditar && !esAdmin;
  const esUnicoUsuario = usuarios.length === 1;
  const usuarioSeleccionadoObj = usuarios.find(u => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            {permisoAEditar ? (esSoloLectura ? 'Detalles del Permiso' : 'Editar Solicitud') : 'Nueva Solicitud'}
            {esSoloLectura && <span className="text-[10px] bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-gray-500">Solo Lectura</span>}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Empleado
            </label>
            
            {(permisoAEditar || esUnicoUsuario || esSoloLectura) ? (
                 <input 
                    type="text" 
                    disabled 
                    value={usuarioSeleccionadoObj?.nombre || 'Cargando...'}
                    className="p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 text-gray-500 w-full"
                 />
            ) : (
              <Popover open={openComboboxEmpleado} onOpenChange={setOpenComboboxEmpleado}>
                <PopoverTrigger asChild disabled={esSoloLectura}>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openComboboxEmpleado}
                    disabled={esSoloLectura}
                    className="w-full justify-between font-normal text-sm border-gray-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-200 disabled:opacity-50"
                  >
                    {selectedUserId
                      ? usuarios.find((u) => u.id === selectedUserId)?.nombre
                      : "Seleccionar empleado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command className="dark:bg-neutral-900">
                    <CommandInput placeholder="Buscar empleado..." />
                    <CommandList>
                      <CommandEmpty>No se encontró el empleado.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {usuarios.map((usuario) => (
                          <CommandItem
                            key={usuario.id}
                            value={usuario.nombre || ''}
                            onSelect={() => {
                              setSelectedUserId(usuario.id === selectedUserId ? "" : usuario.id)
                              setOpenComboboxEmpleado(false)
                            }}
                            className="dark:text-gray-200 dark:aria-selected:bg-neutral-800"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUserId === usuario.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{usuario.nombre}</span>
                              <span className="text-[10px] text-gray-400">{usuario.oficina_nombre}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            <input type="hidden" name="user_id" value={selectedUserId} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tipo de Permiso
            </label>
            
            {esSoloLectura ? (
               <input
                 type="text"
                 disabled
                 value={selectedTipo === 'Otros' ? otroTipoManual : selectedTipo}
                 className="p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 text-gray-500 w-full"
               />
            ) : (
                <>
                    <Popover open={openComboboxTipo} onOpenChange={setOpenComboboxTipo}>
                    <PopoverTrigger asChild disabled={esSoloLectura}>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openComboboxTipo}
                        disabled={esSoloLectura}
                        className="w-full justify-between font-normal text-sm border-gray-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-200 disabled:opacity-50"
                        >
                        {selectedTipo
                            ? selectedTipo
                            : "Seleccionar tipo..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command className="dark:bg-neutral-900">
                        <CommandInput placeholder="Buscar tipo..." />
                        <CommandList>
                            <CommandEmpty>No se encontró el tipo.</CommandEmpty>
                            <div className="max-h-60 overflow-y-auto">
                                <CommandGroup heading="General">
                                {TIPOS_GENERAL.map((tipo) => (
                                    <CommandItem
                                    key={tipo}
                                    value={tipo}
                                    onSelect={(currentValue) => {
                                        const valorOriginal = TIPOS_GENERAL.find(t => t.toLowerCase() === currentValue.toLowerCase()) || currentValue
                                        setSelectedTipo(valorOriginal)
                                        setOpenComboboxTipo(false)
                                    }}
                                    className="dark:text-gray-200 dark:aria-selected:bg-neutral-800"
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTipo === tipo ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {tipo}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                                
                                <CommandSeparator className="dark:bg-neutral-800" />
                                
                                <CommandGroup heading="Seguridad Social">
                                {TIPOS_SEGURIDAD_SOCIAL.map((tipo) => (
                                    <CommandItem
                                    key={tipo}
                                    value={tipo}
                                    onSelect={(currentValue) => {
                                        const valorOriginal = TIPOS_SEGURIDAD_SOCIAL.find(t => t.toLowerCase() === currentValue.toLowerCase()) || currentValue
                                        setSelectedTipo(valorOriginal)
                                        setOpenComboboxTipo(false)
                                    }}
                                    className="dark:text-gray-200 dark:aria-selected:bg-neutral-800"
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTipo === tipo ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {tipo}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </div>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                    </Popover>

                    {selectedTipo === 'Otros' && (
                    <input
                        type="text"
                        placeholder="Especifique el motivo..."
                        value={otroTipoManual}
                        disabled={esSoloLectura}
                        onChange={(e) => setOtroTipoManual(e.target.value)}
                        className="mt-1 p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:ring-1 focus:ring-blue-500 outline-none dark:text-gray-200 w-full disabled:bg-gray-100 dark:disabled:bg-neutral-800"
                    />
                    )}
                </>
            )}
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="remunerado"
              name="remunerado"
              checked={esRemunerado}
              onChange={(e) => setEsRemunerado(e.target.checked)}
              disabled={esSoloLectura}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 disabled:opacity-50"
            />
            <label
              htmlFor="remunerado"
              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
            >
              Remunerado
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inicio" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Inicio
              </label>
              <input
                type="datetime-local"
                name="inicio"
                id="inicio"
                required
                disabled={esSoloLectura}
                defaultValue={defaultInicio}
                className="p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:ring-1 focus:ring-blue-500 outline-none dark:text-gray-200 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-neutral-800"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fin" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Fin
              </label>
              <input
                type="datetime-local"
                name="fin"
                id="fin"
                required
                disabled={esSoloLectura}
                defaultValue={defaultFin}
                className="p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:ring-1 focus:ring-blue-500 outline-none dark:text-gray-200 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-neutral-800"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
               <label htmlFor="estado" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                 Estado de la Solicitud
               </label>
               {esAdmin && (
                  <div className="flex items-center gap-1">
                     <ShieldAlert className="w-3 h-3 text-blue-600" />
                     <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        Rol: {perfilUsuario?.rol}
                     </span>
                  </div>
               )}
            </div>
            
            <select
              name="estado"
              id="estado"
              required
              disabled={!esAdmin || esSoloLectura} 
              defaultValue={permisoAEditar?.estado || 'pendiente'}
              className="p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed dark:text-gray-200"
            >
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-neutral-800">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-9 text-xs"
              disabled={loading}
            >
              {esSoloLectura ? 'Cerrar' : 'Cancelar'}
            </Button>
            
            {!esSoloLectura && (
                <Button 
                type="submit" 
                className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
                >
                {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                {permisoAEditar ? 'Actualizar' : 'Crear Solicitud'}
                </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}