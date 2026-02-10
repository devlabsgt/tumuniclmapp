'use client'

import { useState, useEffect, useMemo } from 'react'
import { ContratoExtendido } from '@/components/combustible/contrato/types' 
import NuevoContrato from './modals/NuevoContrato'
import { Fuel, Hash, Calendar, Layers, Filter, AlertCircle } from 'lucide-react'

interface Props {
  contratos: ContratoExtendido[]
}

export default function ContratoList({ contratos: contratosIniciales }: Props) {
  
  const [listaContratos, setListaContratos] = useState<ContratoExtendido[]>(contratosIniciales || [])
  
  const [anioFiltro, setAnioFiltro] = useState<string>(String(new Date().getFullYear()))

  useEffect(() => {
    setListaContratos(contratosIniciales || [])
  }, [contratosIniciales])

  const aniosDisponibles = useMemo(() => {
    const years = new Set(listaContratos.map(c => c.anio))
    return Array.from(years).sort((a, b) => b - a)
  }, [listaContratos])

  const contratosFiltrados = useMemo(() => {
    if (!anioFiltro) return listaContratos
    return listaContratos.filter(c => c.anio.toString() === anioFiltro)
  }, [listaContratos, anioFiltro])

  const formatoMoneda = (valor: number) => {
    return valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getBadgeColor = (porcentaje: number) => {
    if (porcentaje < 20) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    if (porcentaje < 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <Fuel className="text-blue-600" />
            Contratos de Combustible
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                    value={anioFiltro}
                    onChange={(e) => setAnioFiltro(e.target.value)}
                    className="pl-9 w-full rounded-lg border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                    <option value="">Todos los años</option>
                    {aniosDisponibles.map(anio => (
                        <option key={anio} value={anio}>{anio}</option>
                    ))}
                </select>
            </div>
            <NuevoContrato />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {contratosFiltrados.map((c) => {
          
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
                className="w-full h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-neutral-800 flex flex-col overflow-hidden"
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
                      <Fuel size={14} className="text-gray-400"/>
                      <span className="font-medium">{c.estacion}</span>
                  </div>
              </div>

              <div className="p-5 flex-1 flex flex-col min-h-0">
                
                <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-3 flex-shrink-0">
                    <Layers size={12}/> Detalle de Cupones
                </p>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detallesSeguros.length > 0 ? (
                        detallesSeguros.map((detalle) => {
                            const valorInicialItem = detalle.cantidad_inicial * detalle.denominacion;
                            const valorActualItem = detalle.cantidad_actual * detalle.denominacion;
                            const porcentajeItem = detalle.cantidad_inicial > 0 
                                ? (detalle.cantidad_actual / detalle.cantidad_inicial) * 100 
                                : 0;
                            const isDiesel = detalle.producto === 'Diesel';
                            const colorPrincipal = isDiesel ? 'bg-green-600' : 'bg-blue-600';
                            const colorBarra = isDiesel ? 'bg-green-500' : 'bg-blue-500';
                            const colorFondoBarra = isDiesel ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20';

                            return (
                            <div key={detalle.id} className="relative flex flex-col rounded-xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800 overflow-hidden">
                                
                                <div className={`${colorPrincipal} text-white p-3 flex justify-between items-center shadow-sm`}>
                                    <div>
                                        <div className="text-2xl font-black leading-none mb-0.5">
                                            Q{detalle.denominacion}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                                            {detalle.producto}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold leading-none">
                                            {detalle.cantidad_inicial} 
                                        </div>
                                        <div className="text-xs font-medium opacity-80 mt-0.5">
                                            Q{formatoMoneda(valorInicialItem)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end px-3 pb-3 mt-3">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                                            Cupones
                                        </span>
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                            {detalle.cantidad_actual} 
                                            <span className="text-gray-400 text-xs font-normal"> / {detalle.cantidad_inicial}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                                            Saldo
                                        </span>
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                            Q{formatoMoneda(valorActualItem)}
                                            <span className="text-gray-400 text-xs font-normal"> / Q{formatoMoneda(valorInicialItem)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`w-full h-1.5 ${colorFondoBarra}`}>
                                    <div 
                                        className={`h-full transition-all duration-500 ${colorBarra}`}
                                        style={{ width: `${porcentajeItem}%` }}
                                    />
                                </div>
                            </div>
                        )})
                    ) : (
                        <div className="col-span-1 sm:col-span-2 text-center p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-400 italic">
                            Sin detalles registrados.
                        </div>
                    )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0 mt-auto">
                 <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Saldo Total Disponible</span>
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

      {contratosFiltrados.length === 0 && (
           <div className="flex flex-col items-center justify-center text-gray-400 dark:text-neutral-600 gap-3 p-10 border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
              <AlertCircle size={48} strokeWidth={1.5} />
              <p className="text-base font-medium">No se encontraron contratos para el criterio seleccionado</p>
          </div>
      )}

    </div>
  )
}