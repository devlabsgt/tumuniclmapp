'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createContrato, updateContrato, deleteContrato, getSiguienteCorrelativo } from '@/components/combustible/contrato/actions'
import { ContratoExtendido } from '@/components/combustible/contrato/types'
import { Plus, X, Loader2, Pencil, Trash2, Save, FileText, AlertCircle, Fuel, RefreshCw } from 'lucide-react'
import Swal from 'sweetalert2'

interface ItemContrato {
  id: string
  producto: string
  denominacion: number
  cantidad: number
  totalLine: number
}

interface Props {
  contrato?: ContratoExtendido
}

export default function NuevoContrato({ contrato }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) 
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [items, setItems] = useState<ItemContrato[]>([])
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [generatedContractNum, setGeneratedContractNum] = useState('')

  const [tempProducto, setTempProducto] = useState('Gasolina')
  const [tempDenom, setTempDenom] = useState('')
  const [tempCant, setTempCant] = useState('')

  const isEditing = !!contrato

  const generateContractNumber = async (year: number) => {
    if (isEditing && contrato) return

    setIsGenerating(true)
    try {
      const res = await getSiguienteCorrelativo(year)
      
      if (res && res.success) {
        if (res.formatted) {
           setGeneratedContractNum(res.formatted)
        } else {
           const nextSeq = res.sequence || 1
           const seqString = String(nextSeq).padStart(4, '0')
           setGeneratedContractNum(`${seqString}-${year}`)
        }
      }
    } catch (err) {
      console.error("Error generando correlativo", err)
      setError("Error al conectar con el servidor para generar el correlativo.")
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (isOpen && !isEditing) {
      generateContractNumber(selectedYear)
    }
  }, [isOpen, selectedYear, isEditing])

  useEffect(() => {
    setMounted(true)
    
    if (isOpen) {
        if (contrato) {
           setGeneratedContractNum(contrato.numero_contrato)
           setSelectedYear(contrato.anio)

           if (contrato.detalles && contrato.detalles.length > 0) {
              const loadedItems: ItemContrato[] = contrato.detalles.map(d => ({
                 id: crypto.randomUUID(),
                 producto: d.producto,
                 denominacion: d.denominacion,
                 cantidad: d.cantidad_inicial, 
                 totalLine: d.denominacion * d.cantidad_inicial
              }))
              setItems(loadedItems)
           }
        } else {
           setItems([])
           setTempProducto('Gasolina')
           setTempDenom('')
           setTempCant('')
           setError(null)
           setSelectedYear(new Date().getFullYear())
        }
    }
  }, [contrato, isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [isOpen])

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const startYear = 2025
    const endYear = currentYear + 1
    const list = []
    const finalEndYear = endYear < startYear ? startYear + 1 : endYear
    for (let y = startYear; y <= finalEndYear; y++) {
      list.push(y)
    }
    return list.sort((a, b) => b - a)
  }, [])

  const totalContrato = useMemo(() => {
    return items.reduce((acc, item) => acc + item.totalLine, 0)
  }, [items])

  const handleAddItem = () => {
    const denom = parseFloat(tempDenom)
    const cant = parseInt(tempCant)

    if (!tempProducto || isNaN(denom) || isNaN(cant) || denom <= 0 || cant <= 0) {
        Swal.fire({ 
            toast: true, position: 'top', icon: 'warning', 
            title: 'Datos incompletos', showConfirmButton: false, timer: 2000,
            customClass: { container: 'z-[99999]' } 
        })
        return
    }

    const newItem: ItemContrato = {
        id: crypto.randomUUID(),
        producto: tempProducto,
        denominacion: denom,
        cantidad: cant,
        totalLine: denom * cant
    }

    setItems([...items, newItem])
    setTempDenom('')
    setTempCant('')
  }

  const handleRemoveItem = async (id: string) => {
    const result = await Swal.fire({
        title: '¿Quitar este cupón?',
        text: "Se eliminará de la lista.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, quitar',
        cancelButtonText: 'Cancelar',
        customClass: { container: 'z-[99999]' } 
    })

    if (result.isConfirmed) {
        setItems(items.filter(i => i.id !== id))
        Swal.fire({
            toast: true, position: 'top', icon: 'success',
            title: 'Cupón eliminado', showConfirmButton: false, timer: 1500,
            customClass: { container: 'z-[99999]' }
        })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const estacion = formData.get('estacion') as string
    
    if (!estacion || estacion === "") {
        setError("Debes seleccionar una Estación de Servicio.")
        return
    }

    if (!generatedContractNum || generatedContractNum.trim() === "") {
        setError("El número de contrato no se ha generado correctamente.")
        return
    }

    if (items.length === 0) {
        setError("Debes agregar al menos un cupón al detalle para guardar.")
        return
    }

    setIsLoading(true)
    setError(null)

    const data: any = {
      anio: Number(selectedYear),
      estacion: estacion,
      numero_contrato: generatedContractNum.trim(), 
      detalles: items.map(i => ({
          producto: i.producto,
          denominacion: i.denominacion,
          cantidad: i.cantidad
      }))
    }
    
    let res
    if (isEditing && contrato) {
       res = await updateContrato(contrato.id, data)
    } else {
       res = await createContrato(data)
    }

    if (res?.success) {
      setIsOpen(false)
      if (!isEditing) setItems([]) 
      Swal.fire({
          toast: true, position: 'top-end', icon: 'success', 
          title: isEditing ? 'Actualizado correctamente' : 'Contrato creado',
          showConfirmButton: false, timer: 3000, background: isEditing ? '#3b82f6' : '#22c55e', color: '#fff',
          customClass: { container: 'z-[99999]' }
      })
    } else {
      setError(res?.error || 'Error desconocido')
    }
    setIsLoading(false)
  }

  async function handleDelete() {
    if (!contrato) return

    const result = await Swal.fire({
        title: '¿Eliminar Contrato?',
        text: "Se borrará el contrato y todos sus cupones asociados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: { container: 'z-[99999]' } 
    })

    if (!result.isConfirmed) return

    setIsLoading(true)
    const res = await deleteContrato(contrato.id)

    if (res?.success) {
        setIsOpen(false)
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: 'Contrato eliminado',
            showConfirmButton: false, timer: 3000, background: '#ef4444', color: '#fff',
            customClass: { container: 'z-[99999]' }
        })
    } else {
        setError(res?.error || "Error al eliminar")
        setIsLoading(false)
    }
  }

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}/>
      
      <div className="relative z-10 bg-white dark:bg-neutral-900 w-full sm:w-[95%] sm:max-w-2xl lg:max-w-5xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-10 fade-in duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-neutral-800 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
            {isEditing ? <><Pencil size={20} className="text-blue-500"/> Editar Contrato</> : <><Plus size={20} className="text-green-500"/> Nuevo Contrato Combustible</>}
          </h3>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full text-gray-500 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-4 space-y-4">
                    <div className="p-5 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 h-full">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-neutral-700 pb-2">
                            <FileText size={16} className="text-blue-600"/> Datos Generales
                        </h4>
                        
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">Año del Contrato</label>
                                <select 
                                    name="anio" 
                                    value={selectedYear}
                                    disabled={isEditing} 
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className={`w-full p-2.5 border rounded-lg outline-none text-sm font-medium
                                        ${isEditing 
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200 dark:bg-neutral-800 dark:border-neutral-700' 
                                            : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500'
                                        }`}
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">Estación de Servicio</label>
                                <select name="estacion" defaultValue={contrato?.estacion || ""} className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
                                    <option value="" disabled>Seleccione...</option>
                                    <option value="La Robusta">La Robusta</option>
                                    <option value="Puma">Puma</option>
                                    <option value="Texaco">Texaco</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500">No. Contrato Físico</label>
                                    {!isEditing && (
                                      <button 
                                        type="button" 
                                        onClick={() => generateContractNumber(selectedYear)}
                                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                                        title="Recalcular secuencia"
                                      >
                                        <RefreshCw size={10} className={isGenerating ? "animate-spin" : ""} /> Actualizar
                                      </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input 
                                        name="numero_contrato" 
                                        required 
                                        readOnly
                                        value={generatedContractNum}
                                        className="w-full p-2.5 border rounded-lg outline-none text-sm font-bold tracking-widest bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400"
                                    />
                                    {isGenerating && (
                                        <div className="absolute right-3 top-2.5">
                                            <Loader2 size={16} className="animate-spin text-blue-500"/>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {isEditing ? 'El número no se puede editar.' : 'Generado automáticamente.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                             <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                ℹ️ El número se genera automáticamente basado en los registros del año <strong>{selectedYear}</strong>.
                             </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-5">
                    
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Fuel size={32} strokeWidth={1} className="text-gray-300"/>
                    </h4>

                    <div className="grid grid-cols-12 gap-3 items-end bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
                        <div className="col-span-12 sm:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">Producto</label>
                            <select value={tempProducto} onChange={(e) => setTempProducto(e.target.value)} className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="Gasolina">Gasolina</option>
                                <option value="Diesel">Diesel</option>
                            </select>
                        </div>
                        <div className="col-span-6 sm:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">Denominación</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">Q</span>
                                <input type="number" placeholder="0.00" value={tempDenom} onChange={(e) => setTempDenom(e.target.value)} className="w-full p-2.5 pl-7 bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                            </div>
                        </div>
                        <div className="col-span-6 sm:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-blue-600 uppercase">Cantidad</label>
                            <input type="number" placeholder="0" value={tempCant} onChange={(e) => setTempCant(e.target.value)} className="w-full p-2.5 bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                        </div>
                        <div className="col-span-12 sm:col-span-2">
                            <button type="button" onClick={handleAddItem} className="w-full h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-1 shadow-md">
                                <Plus size={18}/> <span className="sm:hidden">Agregar</span>
                            </button>
                        </div>
                    </div>

                    <div className="border border-gray-100 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-500 font-bold text-xs uppercase">
                                <tr>
                                    <th className="p-3">Producto</th>
                                    <th className="p-3 text-right">Valor</th>
                                    <th className="p-3 text-right">Cant.</th>
                                    <th className="p-3 text-right">Subtotal</th>
                                    <th className="p-3 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-400 italic flex flex-col items-center justify-center gap-2">
                                            <Fuel size={32} strokeWidth={1} className="text-gray-300"/>
                                           No hay cupones agregados aún.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/50">
                                            <td className="p-3 font-medium text-gray-700 dark:text-gray-200">
                                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${item.producto === 'Diesel' ? 'bg-green-600' : 'bg-blue-500'}`}></span>
                                                {item.producto}
                                            </td>
                                            <td className="p-3 text-right text-gray-500">Q{item.denominacion.toFixed(2)}</td>
                                            <td className="p-3 text-right text-gray-500">{item.cantidad}</td>
                                            <td className="p-3 text-right font-bold text-gray-800 dark:text-white">Q{item.totalLine.toLocaleString('en-GT', {minimumFractionDigits: 2})}</td>
                                            <td className="p-3 text-center">
                                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors">
                                                    <X size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {items.length > 0 && (
                                <tfoot className="bg-gray-50 dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right font-bold text-gray-500 uppercase text-xs">Valor Total (Est.):</td>
                                        <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400 text-base">
                                            Q{totalContrato.toLocaleString('en-GT', {minimumFractionDigits: 2})}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                </div>
            </div>

            <div className={`mt-8 pt-4 flex flex-col-reverse sm:flex-row gap-3 ${isEditing ? 'sm:justify-between' : 'sm:justify-end'} border-t border-gray-100 dark:border-neutral-800`}>
              
              {isEditing && (
                <button 
                    type="button" 
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Trash2 size={16} /> <span className="sm:hidden lg:inline">Eliminar Contrato</span>
                </button>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <button 
                    type="button" 
                    onClick={() => setIsOpen(false)} 
                    className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={isLoading || isGenerating} 
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                    {isEditing ? 'Actualizar Contrato' : 'Guardar Contrato'}
                </button>
              </div>

            </div>

          </form>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {isEditing ? (
        <button 
            onClick={() => setIsOpen(true)} 
            className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
            <Pencil size={16} />
            Editar
        </button>
      ) : (
        <button 
            onClick={() => setIsOpen(true)} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
            <Plus size={18} strokeWidth={3} />
            <span className="font-bold">Nuevo Contrato</span>
        </button>
      )}

      {mounted && isOpen && createPortal(
         modalContent,
         document.body
      )}
    </>
  )
}