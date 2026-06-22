'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ItemInventario } from './lib/schemas';
import { useInventarioActivo, useDependenciasBasicas, useUsuariosBasicos } from './lib/hooks';
import InventarioList from './InventarioList';
import CrearInventarioModal from './modals/CrearInventarioModal';
import TrasladoModal from './modals/TrasladoModal';
import BajaModal from './modals/BajaModal';
import DetalleInventarioModal from './modals/DetalleInventarioModal';
import ReporteJerarquico from './ReporteJerarquico';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCcw, LayoutList, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiltroBusquedaLista, ModoFiltroLista } from './FiltroBusquedaLista';

export default function GestorInventario() {
  const [estadoFiltro, setEstadoFiltro] = useState('Activo');
  const { data: items = [], isLoading, refetch: cargarDatos } = useInventarioActivo(estadoFiltro);
  const { data: dependenciasBasicas = [] } = useDependenciasBasicas();
  const { data: usuariosBasicos = [] } = useUsuariosBasicos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('jerarquia');
  const [modoFiltroLista, setModoFiltroLista] = useState<ModoFiltroLista>('todos');
  const [textoFiltroLista, setTextoFiltroLista] = useState('');

  const itemsFiltradosLista = React.useMemo(() => {
    const term = textoFiltroLista.toLowerCase().trim();
    if (!term) return items;
    return items.filter(item => {
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
  }, [items, modoFiltroLista, textoFiltroLista]);

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
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Reporte Jerárquico</span>
            <span className="sm:hidden">Reporte</span>
          </button>
          <button
            onClick={() => handleTabChange('lista')}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 flex-1 sm:flex-none",
              activeTab === 'lista' ? "bg-white text-slate-950 shadow-sm dark:bg-neutral-950 dark:text-slate-50" : "hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-neutral-700/50"
            )}
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">Vista de Lista</span>
            <span className="sm:hidden">Lista</span>
          </button>
        </div>

        {/* Tabs Filtro de Estado */}
        <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-neutral-800 dark:text-slate-400 w-full xl:w-auto">
          {['Activo', 'Inactivo'].map((estado) => (
            <button
              key={estado}
              onClick={() => setEstadoFiltro(estado)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                estadoFiltro === estado 
                  ? (estado === 'Activo' ? "bg-emerald-100 text-emerald-800 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-800 shadow-sm dark:bg-red-900/40 dark:text-red-300")
                  : "hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-200/50 dark:hover:bg-neutral-700/50"
              )}
            >
              {estado}
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
            items={items}
            dependencias={dependenciasBasicas}
            usuarios={usuariosBasicos}
            className="w-full"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'lista' && (
          <div className="flex-1 overflow-y-auto mt-0 bg-white dark:bg-[#0a0a0a] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-neutral-800 h-full">
            <InventarioList 
              items={itemsFiltradosLista} 
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
          </div>
        )}

        {activeTab === 'jerarquia' && (
          <div className="flex-1 overflow-hidden mt-0 h-full">
            <ReporteJerarquico 
              estadoFiltro={estadoFiltro}
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
