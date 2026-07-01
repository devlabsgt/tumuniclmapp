'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ItemInventario, TipoVistaInventario } from './lib/schemas';
import { useInventarioActivo, useDependenciasBasicas, useUsuariosBasicos, useReporteJerarquicoInventario } from './lib/hooks';
import InventarioList from './InventarioList';
import CrearInventarioModal from './modals/CrearInventarioModal';
import TrasladoModal from './modals/TrasladoModal';
import BajaModal from './modals/BajaModal';
import DetalleInventarioModal from './modals/DetalleInventarioModal';
import ReporteJerarquico from './ReporteJerarquico';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCcw, LayoutList, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltroBusquedaLista, ModoFiltroLista } from './FiltroBusquedaLista';

interface GestorInventarioProps {
  tipoVista?: TipoVistaInventario;
}

export default function GestorInventario({ tipoVista = 'general' }: GestorInventarioProps) {
  const [estadoFiltro, setEstadoFiltro] = useState('Activo');
  // Fetch 'Todos' from server to filter on client side instantly
  const { data: todosItems = [], isLoading: isLoadingItems, refetch: cargarDatos } = useInventarioActivo('Todos', tipoVista);
  const { data: filasRAW = [], isLoading: isLoadingJerarquia } = useReporteJerarquicoInventario('Todos', tipoVista);
  const isLoading = isLoadingItems || isLoadingJerarquia;
  
  const { data: dependenciasBasicas = [] } = useDependenciasBasicas();
  const { data: usuariosBasicos = [] } = useUsuariosBasicos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('jerarquia');
  const [modoFiltroLista, setModoFiltroLista] = useState<ModoFiltroLista>('todos');
  const [textoFiltroLista, setTextoFiltroLista] = useState('');

  const counts = React.useMemo(() => {
    return todosItems.reduce(
      (acc, item) => {
        const estado = item.estado || '';
        if (['Activo', 'Regular', 'Malo'].includes(estado)) {
          acc.activos++;
        } else if (['Inactivo', 'Baja'].includes(estado)) {
          acc.inactivos++;
        }
        return acc;
      },
      { activos: 0, inactivos: 0 }
    );
  }, [todosItems]);

  const itemsPorEstado = React.useMemo(() => {
    const itemsInOrder: ItemInventario[] = [];
    const mappedIds = new Set<string>();
    
    const filasMap = new Map(filasRAW.map(f => [f.id, f]));
    const findTrueDependency = (parentId: string | undefined | null) => {
      if (!parentId) return null;
      let current = filasMap.get(parentId);
      while (current) {
        if (current.tipo === 'dependencia' && !current.esPuesto) {
          return current;
        }
        if (!current.parentId) break;
        current = filasMap.get(current.parentId);
      }
      return null;
    };

    filasRAW.forEach(fila => {
      if (fila.tipo === 'bien') {
        const realId = fila.id.replace('bien-', '');
        const realItem = todosItems.find(i => i.id === realId);
        if (realItem) {
          const estado = realItem.estado || '';
          const matchesEstado = 
            estadoFiltro === 'Todos' ||
            (estadoFiltro === 'Activo' && ['Activo', 'Regular', 'Malo'].includes(estado)) ||
            (estadoFiltro === 'Inactivo' && ['Inactivo', 'Baja'].includes(estado));

          if (matchesEstado) {
            const trueDep = findTrueDependency(fila.parentId);
            const gPrefix = trueDep ? trueDep.prefix : fila.branchPrefix;
            const gNombre = trueDep ? trueDep.nombre : (fila.nombreDepartamento || 'SIN ASIGNAR');
            const gLevel = trueDep ? trueDep.level : fila.level - 1;

            itemsInOrder.push({
              ...realItem,
              __groupName: gPrefix ? `${gPrefix} ${gNombre}` : gNombre,
              __groupLevel: gLevel,
              __groupPrefix: gPrefix,
              __groupNombre: gNombre
            });
            mappedIds.add(realId);
          }
        }
      }
    });

    todosItems.forEach(item => {
      if (!mappedIds.has(item.id)) {
        const estado = item.estado || '';
        const matchesEstado = 
            estadoFiltro === 'Todos' ||
            (estadoFiltro === 'Activo' && ['Activo', 'Regular', 'Malo'].includes(estado)) ||
            (estadoFiltro === 'Inactivo' && ['Inactivo', 'Baja'].includes(estado));
            
        if (matchesEstado) {
          itemsInOrder.push({ 
            ...item, 
            __groupName: 'SIN CLASIFICAR',
            __groupLevel: -1,
            __groupPrefix: '',
            __groupNombre: 'SIN CLASIFICAR'
          });
        }
      }
    });

    return itemsInOrder;
  }, [todosItems, filasRAW, estadoFiltro]);

  const itemsFiltradosLista = React.useMemo(() => {
    const term = textoFiltroLista.toLowerCase().trim();
    
    let filtered = itemsPorEstado;
    if (term) {
      filtered = itemsPorEstado.filter(item => {
        const matchDepto = item.dependencia_real?.nombre?.toLowerCase().includes(term);
        const matchEmpleado = item.info_usuario?.nombre?.toLowerCase().includes(term);
        const matchBien = item.descripcion?.toLowerCase().includes(term) || (item.serie && item.serie.toLowerCase().includes(term));
        
        if (modoFiltroLista === 'todos') {
          return matchDepto || matchEmpleado || matchBien;
        } else if (modoFiltroLista === 'departamento') {
          return matchDepto;
        } else if (modoFiltroLista === 'nombre') {
          return matchEmpleado;
        } else if (modoFiltroLista === 'bien') {
          return matchBien;
        }
        return true;
      });
    }

    return filtered;
  }, [itemsPorEstado, modoFiltroLista, textoFiltroLista]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inventario_active_tab');
      if (saved === 'lista' || saved === 'jerarquia') {
        setActiveTab(saved);
      }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventario_active_tab', tab);
    }
  };

  // Estado para Modales de Lista
  const [trasladoModalOpen, setTrasladoModalOpen] = useState(false);
  const [bajaModalOpen, setBajaModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [bienSeleccionado, setBienSeleccionado] = useState<{ id: string; nombre: string } | null>(null);
  const [bienDetalle, setBienDetalle] = useState<ItemInventario | null>(null);

  // Estados para paginación de lista
  const [paginaActualLista, setPaginaActualLista] = useState(1);
  const [itemsPorPaginaLista, setItemsPorPaginaLista] = useState(20);

  // Reiniciar paginación si cambian los filtros
  useEffect(() => {
    setPaginaActualLista(1);
  }, [textoFiltroLista, modoFiltroLista, estadoFiltro]);

  const totalPaginasLista = Math.ceil(itemsFiltradosLista.length / itemsPorPaginaLista);
  const itemsPaginadosLista = itemsFiltradosLista.slice(
    (paginaActualLista - 1) * itemsPorPaginaLista,
    paginaActualLista * itemsPorPaginaLista
  );

  // Efecto eliminado, TanStack Query maneja el fetching y refetching automáticamentee

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-neutral-950 p-4 md:p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Inventario</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controla, asigna y rastrea todos los bienes municipales
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeTab === 'lista' && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => cargarDatos()}
              disabled={isLoading}
              title="Actualizar lista"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}


          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Nuevo Bien
          </Button>
        </div>
      </div>

      {/* Controles de Vista y Filtro */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
        {/* Toggle Vista */}
        <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-neutral-800 dark:text-slate-400 w-full xl:w-fit">
          <button
            onClick={() => handleTabChange('jerarquia')}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 flex-1 sm:flex-none",
              activeTab === 'jerarquia' ? "bg-white text-slate-950 shadow-sm dark:bg-neutral-950 dark:text-slate-50" : "hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-neutral-700/50"
            )}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
            <span className="sm:hidden">Lista</span>
          </button>
          <button
            onClick={() => handleTabChange('lista')}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 flex-1 sm:flex-none",
              activeTab === 'lista' ? "bg-white text-slate-950 shadow-sm dark:bg-neutral-950 dark:text-slate-50" : "hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-neutral-700/50"
            )}
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">Tarjetas</span>
            <span className="sm:hidden">Tarjetas</span>
          </button>
        </div>

        {/* Tabs Filtro de Estado */}
        <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-neutral-800 dark:text-slate-400 w-full xl:w-auto">
          {['Activo', 'Inactivo'].map((estado) => (
            <button
              key={estado}
              onClick={() => setEstadoFiltro(estado)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 xl:flex-none",
                estadoFiltro === estado 
                  ? (estado === 'Activo' ? "bg-emerald-100 text-emerald-800 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-800 shadow-sm dark:bg-red-900/40 dark:text-red-300")
                  : "hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-neutral-700/50"
              )}
            >
              {estado} ({estado === 'Activo' ? counts.activos : counts.inactivos})
            </button>
          ))}
        </div>

      </div>

      {/* Filtro de Búsqueda (Solo en Vista de Lista) */}
      {activeTab === 'lista' && (
        <div className="w-full mb-4">
          <FiltroBusquedaLista
            modoFiltro={modoFiltroLista}
            onModoChange={setModoFiltroLista}
            valorAplicado={textoFiltroLista}
            onCambioTexto={setTextoFiltroLista}
            items={itemsPorEstado}
            dependencias={dependenciasBasicas}
            usuarios={usuariosBasicos}
            className="w-full"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'lista' && (
          <div className="flex-1 overflow-y-auto mt-0 bg-transparent sm:bg-white dark:sm:bg-[#0a0a0a] sm:rounded-xl py-2 sm:p-4 sm:shadow-sm sm:border sm:border-slate-200 dark:sm:border-neutral-800 h-full -mx-2 sm:mx-0 px-2 sm:px-0">
            <InventarioList 
              items={itemsPaginadosLista} 
              isLoading={isLoading} 
              onTrasladar={(id, nombre) => {
                setBienSeleccionado({ id, nombre });
                setTrasladoModalOpen(true);
              }}
              onBaja={(id, nombre) => {
                setBienSeleccionado({ id, nombre });
                setBajaModalOpen(true);
              }}
              onClickItem={(item) => {
                setBienDetalle(item);
                setDetalleModalOpen(true);
              }}
            />
            
            {/* Paginación de Lista */}
            {!isLoading && itemsFiltradosLista.length > 0 && (
              <div className="mt-8 flex flex-col items-center">
                <div className="flex justify-center mb-4 text-sm gap-2 items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Ver por:</span>
                  <select 
                    value={itemsPorPaginaLista} 
                    onChange={e => {
                      setItemsPorPaginaLista(parseInt(e.target.value));
                      setPaginaActualLista(1);
                    }} 
                    className="border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-md px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                
                <div className="flex justify-center gap-1.5 flex-wrap pb-10 max-w-full overflow-x-auto px-4">
                  <button 
                    onClick={() => setPaginaActualLista(p => Math.max(p - 1, 1))} 
                    disabled={paginaActualLista === 1} 
                    className="px-3.5 py-2 rounded-md border disabled:bg-slate-100 disabled:text-slate-400 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:disabled:bg-neutral-800/50 dark:disabled:text-neutral-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center shrink-0"
                  >
                    ←
                  </button>
                  
                  {Array.from({ length: totalPaginasLista }, (_, i) => i + 1)
                    .filter(n => {
                      // Grupos de 27 páginas como en el screenshot original
                      const grupo = Math.floor((paginaActualLista - 1) / 27);
                      return n > grupo * 27 && n <= (grupo + 1) * 27;
                    })
                    .map(numero => (
                      <button 
                        key={numero} 
                        onClick={() => setPaginaActualLista(numero)} 
                        className={`min-w-[40px] px-3 py-2 rounded-md border text-sm font-medium transition-colors shrink-0 ${
                          paginaActualLista === numero 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-slate-300 text-slate-600 hover:bg-slate-50 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {numero}
                      </button>
                    ))}
                    
                  <button 
                    onClick={() => setPaginaActualLista(p => Math.min(p + 1, totalPaginasLista))} 
                    disabled={paginaActualLista === totalPaginasLista || totalPaginasLista === 0} 
                    className="px-3.5 py-2 rounded-md border disabled:bg-slate-100 disabled:text-slate-400 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:disabled:bg-neutral-800/50 dark:disabled:text-neutral-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center shrink-0"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jerarquia' && (
          <div className="flex-1 overflow-hidden mt-0 h-full">
            <ReporteJerarquico 
              estadoFiltro={estadoFiltro}
              tipoVista={tipoVista}
              onClickItem={(nodo) => {
                // Map NodoFila to ItemInventario manually to show in DetalleInventarioModal
                const itemFake: any = {
                  id: nodo.id.replace('bien-', ''),
                  serie: nodo.serie || '',
                  descripcion: nodo.nombre,
                  ctd: nodo.cantidad,
                  valor: nodo.valor,
                  estado: nodo.estado || 'Activo',
                  imagen_url: nodo.imagen_url || null,
                  info_usuario: nodo.info_usuario || null,
                  dependencias: nodo.dependencias || null,
                };
                
                setBienDetalle(itemFake);
                setDetalleModalOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <CrearInventarioModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={() => {
           if (activeTab === 'lista') cargarDatos();
           // Si está en jerarquía se actualiza solo si implementamos un refresh, 
           // o podemos forzar un re-mount del componente ReporteJerarquico
        }} 
      />

      {bienSeleccionado && (
        <>
          <TrasladoModal
            open={trasladoModalOpen}
            onOpenChange={(open) => {
              setTrasladoModalOpen(open);
              if (!open) {
                setTimeout(() => { if (!bajaModalOpen) setBienSeleccionado(null); }, 300);
                if (activeTab === 'lista') cargarDatos();
              }
            }}
            idBien={bienSeleccionado.id}
            nombreBien={bienSeleccionado.nombre}
          />
          <BajaModal
            open={bajaModalOpen}
            onOpenChange={(open) => {
              setBajaModalOpen(open);
              if (!open) {
                setTimeout(() => { if (!trasladoModalOpen) setBienSeleccionado(null); }, 300);
                if (activeTab === 'lista') cargarDatos();
              }
            }}
            idBien={bienSeleccionado.id}
            nombreBien={bienSeleccionado.nombre}
          />
        </>
      )}

      <DetalleInventarioModal
        item={bienDetalle}
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
      />
    </div>
  );
}
