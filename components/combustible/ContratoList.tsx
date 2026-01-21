'use client'

import { useState, useEffect, useMemo } from 'react'
import { ContratoExtendido } from '@/components/combustible/types' 
import NuevoContrato from './modals/NuevoContrato'
import { Fuel, Hash, AlertCircle, Calendar, MapPin, Layers, Beaker, TrendingDown } from 'lucide-react'

interface Props {
  contratos: ContratoExtendido[]
}

export default function ContratoList({ contratos: contratosIniciales }: Props) {
  
  const [listaContratos, setListaContratos] = useState<ContratoExtendido[]>(contratosIniciales || [])
  
  const [pruebaContratoId, setPruebaContratoId] = useState<string>('')
  const [pruebaDetalleId, setPruebaDetalleId] = useState<string>('')
  const [cantidadConsumo, setCantidadConsumo] = useState<string>('')

  useEffect(() => {
    setListaContratos(contratosIniciales || [])
  }, [contratosIniciales])

  const formatoMoneda = (valor: number) => {
    return valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getBadgeColor = (porcentaje: number) => {
    if (porcentaje < 20) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    if (porcentaje < 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
  }

  const handleSimularConsumo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pruebaContratoId || !pruebaDetalleId || !cantidadConsumo) return

    const cantidad = parseInt(cantidadConsumo)
    
    setListaContratos(prev => prev.map(c => {
        if (String(c.id) === pruebaContratoId && c.detalles) {
            const nuevosDetalles = c.detalles.map(d => {
                if (String(d.id) === pruebaDetalleId) {
                    return { ...d, cantidad_actual: Math.max(0, d.cantidad_actual - cantidad) }
                }
                return d
            })
            return { ...c, detalles: nuevosDetalles }
        }
        return c
    }))
    
    setCantidadConsumo('')
  }

  const contratoSeleccionadoParaPrueba = useMemo(() => 
    listaContratos.find(c => String(c.id) === pruebaContratoId), 
  [listaContratos, pruebaContratoId])


  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <Fuel className="text-blue-600" />
            Contratos de Combustible
          </h2>
        </div>
        <NuevoContrato />
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {listaContratos.map((c) => {
          
          const detallesSeguros = c.detalles || [] 
          
          const totalValorActual = detallesSeguros.reduce((acc, d) => {
             return acc + (d.cantidad_actual * d.denominacion)
          }, 0)
          
          const totalValorInicial = detallesSeguros.reduce((acc, d) => {
             return acc + (d.cantidad_inicial * d.denominacion)
          }, 0)
          
          const porcentaje = totalValorInicial > 0 ? (totalValorActual / totalValorInicial) * 100 : 0
          const badgeColor = getBadgeColor(porcentaje)

          return (
            <div 
                key={c.id} 
                className="w-full max-w-[380px] h-[520px] bg-white dark:bg-neutral-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-neutral-800 flex flex-col overflow-hidden"
            >
              
              <div className="p-5 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30 flex-shrink-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1 mb-0.5">
                            <Hash size={11}/> Contrato
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {c.numero_contrato}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                        <Calendar size={12}/> {c.anio}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={14} className="text-gray-400"/>
                      <span className="font-medium">{c.estacion}</span>
                  </div>
              </div>

              <div className="p-5 flex-1 flex flex-col min-h-0">
                
                <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-3 flex-shrink-0">
                    <Layers size={12}/> Detalle de Cupones
                </p>
                
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 scroll-smooth overscroll-contain">
                    {detallesSeguros.length > 0 ? (
                        detallesSeguros.map((detalle) => (
                            <div key={detalle.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors duration-200">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                        {detalle.producto === 'Diesel' 
                                            ? <div className="w-2 h-2 rounded-full bg-green-600"></div> 
                                            : <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        }
                                        {detalle.producto}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">Q{detalle.denominacion} c/u</span>
                                </div>

                                <div className="text-right">
                                    <span className={`block font-bold ${detalle.cantidad_actual === 0 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                                        {detalle.cantidad_actual} <span className="text-[10px] text-gray-400 font-normal">disp.</span>
                                    </span>
                                    <span className="text-[10px] text-gray-400">de {detalle.cantidad_inicial}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-400 italic">
                            Sin detalles registrados.
                        </div>
                    )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0">
                 <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Saldo Disponible</span>
                        <span className="text-lg font-black text-gray-800 dark:text-white">
                             Q{formatoMoneda(totalValorActual)}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Total Contrato</span>
                        <span className="text-xs font-bold text-gray-500">
                             Q{formatoMoneda(totalValorInicial)}
                        </span>
                    </div>
                 </div>
                 
                 <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden mb-2">
                    <div 
                        className={`h-full transition-all duration-500 rounded-full ${porcentaje < 20 ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${porcentaje}%` }}
                    />
                 </div>

                 <div className="flex justify-between items-center">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {porcentaje.toFixed(0)}% Restante
                    </div>
                    <div className="scale-90 origin-right">
                       <NuevoContrato contrato={c} /> 
                    </div>
                 </div>
              </div>

            </div>
          )
        })}
      </div>

      {listaContratos.length === 0 && (
           <div className="flex flex-col items-center justify-center text-gray-400 dark:text-neutral-600 gap-3 p-10 border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
              <AlertCircle size={48} strokeWidth={1.5} />
              <p className="text-base font-medium">No hay contratos registrados</p>
          </div>
      )}

      <div className="mt-12 p-6 border-2 border-dashed border-amber-300/50 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10 rounded-xl">
        <h3 className="text-lg font-bold text-amber-700 dark:text-amber-500 flex items-center gap-2 mb-4">
            <Beaker className="w-5 h-5" /> 
            Zona de Pruebas: Consumir Cupón
        </h3>
        
        <form onSubmit={handleSimularConsumo} className="flex flex-col lg:flex-row items-end gap-4">
            <div className="w-full lg:w-1/4">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">1. Contrato</label>
                <select 
                    value={pruebaContratoId}
                    onChange={(e) => {
                        setPruebaContratoId(e.target.value)
                        setPruebaDetalleId('') 
                    }}
                    className="w-full rounded-lg border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3 focus:ring-2 focus:ring-amber-500"
                >
                    <option value="">-- Seleccione --</option>
                    {listaContratos.map(c => (
                        <option key={c.id} value={c.id}>#{c.numero_contrato} - {c.estacion}</option>
                    ))}
                </select>
            </div>

            <div className="w-full lg:w-1/4">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">2. Tipo de Cupón</label>
                <select 
                    value={pruebaDetalleId}
                    onChange={(e) => setPruebaDetalleId(e.target.value)}
                    disabled={!pruebaContratoId}
                    className="w-full rounded-lg border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3 focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                >
                    <option value="">-- Seleccione Cupón --</option>
                    {contratoSeleccionadoParaPrueba?.detalles?.map(d => (
                        <option key={d.id} value={d.id}>
                           {d.producto} (Q{d.denominacion}) - Disp: {d.cantidad_actual}
                        </option>
                    ))}
                </select>
            </div>

            <div className="w-full lg:w-1/4">
                 <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">3. Cantidad a Restar</label>
                <input 
                    type="number" 
                    min="1"
                    value={cantidadConsumo}
                    onChange={(e) => setCantidadConsumo(e.target.value)}
                    placeholder="Ej. 2"
                    className="w-full rounded-lg border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3 focus:ring-2 focus:ring-amber-500"
                />
            </div>

            <button 
                type="submit"
                disabled={!pruebaContratoId || !pruebaDetalleId || !cantidadConsumo}
                className="w-full lg:w-auto px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-amber-200 dark:shadow-none"
            >
                <TrendingDown size={16} />
                Descontar
            </button>
        </form>
      </div>

    </div>
  )
}