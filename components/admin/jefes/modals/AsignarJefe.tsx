'use client'

import React, { useState } from 'react'
import { X, Save, Loader2, Check, ChevronsUpDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { asignarJefeDirecto, removerJefe } from '../actions'
import { toast } from 'react-toastify' // Toast para notificaciones
import Swal from 'sweetalert2' // Swal solo para confirmación de borrado
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function AsignarJefe({ seleccion, usuarios, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [open, setOpen] = useState(false)

  if (!seleccion) return null

  // Lógica de Asignar (Solo Toastify)
  const handleSave = async () => {
    if (!userId) return toast.warning('Debe seleccionar un empleado para asignar.')

    setLoading(true)
    try {
      await asignarJefeDirecto(seleccion.id, userId)
      toast.success('Jefatura actualizada correctamente')
      onSuccess()
      onClose()
      setUserId('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Lógica de Desasignar (Confirmación con Swal + Toastify final)
  const handleRemove = async () => {
    // Confirmación con SweetAlert respetando Dark Mode
    const result = await Swal.fire({
      title: '¿Quitar responsable?',
      text: "La oficina quedará sin jefe asignado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      background: '#171717', // Fondo oscuro (neutral-900)
      color: '#e5e7eb',     // Texto claro (gray-200)
      customClass: {
        popup: 'border border-neutral-800 rounded-lg'
      }
    })

    if (!result.isConfirmed) return

    setLoading(true)
    try {
      await removerJefe(seleccion.id)
      toast.success('Responsable desasignado correctamente')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-sm border border-neutral-800">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-tight italic">Asignar Responsable</h3>
            <p className="text-[10px] text-blue-500 font-bold uppercase truncate max-w-[280px]">{seleccion.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18}/></button>
        </div>

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Empleado a asignar</h4>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal text-xs border-neutral-800 bg-neutral-950 text-gray-200 h-9">
                  {userId ? usuarios.find((u: any) => u.user_id === userId)?.nombre : "Seleccionar empleado..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command className="dark:bg-neutral-900 border-none">
                  <CommandInput placeholder="Buscar nombre..." className="text-xs" />
                  <CommandList>
                    <CommandEmpty>No hay resultados.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {usuarios.map((u: any) => (
                        <CommandItem key={u.user_id} value={u.nombre} onSelect={() => { setUserId(u.user_id); setOpen(false); }} className="text-xs dark:text-gray-200">
                          <Check className={cn("mr-2 h-3 w-3", userId === u.user_id ? "opacity-100" : "opacity-0")} />
                          {u.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
            {seleccion.jefe_id ? (
               <Button variant="destructive" onClick={handleRemove} disabled={loading} className="h-8 text-[10px] uppercase font-bold">
                 <Trash2 className="w-3 h-3 mr-2" />
                 Quitar
               </Button>
            ) : <div></div>}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="h-8 text-[10px] uppercase font-bold" disabled={loading}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading || !userId} className="h-8 text-[10px] uppercase font-bold bg-blue-600 text-white">
                {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}