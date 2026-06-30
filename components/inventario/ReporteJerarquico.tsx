'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FilaReporteInventario, TipoVistaInventario } from './lib/schemas';
import { NodoInventarioItem, NodoFila } from './NodoInventarioItem';
import { FiltroBusquedaInventario, ModoFiltro } from './FiltroBusquedaInventario';
import { useReporteJerarquicoInventario } from './lib/hooks';
import { ChevronsLeftRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import TrasladoModal from './modals/TrasladoModal';
import BajaModal from './modals/BajaModal';
import EstadisticasInventarioModal from './modals/EstadisticasInventarioModal';

const GRID_TABLA = 'grid grid-cols-[5rem_1fr_6rem_8.5rem] items-stretch';
const BORDE_TABLA = 'border-slate-300 dark:border-neutral-500';
const ENCABEZADO_BG = 'bg-slate-200 dark:bg-neutral-800';

interface ReporteJerarquicoProps {
  onClickItem?: (nodo: NodoFila) => void;
  estadoFiltro?: string;
  tipoVista?: TipoVistaInventario;
}

export default function ReporteJerarquico({ onClickItem, estadoFiltro = 'Activo', tipoVista = 'general' }: ReporteJerarquicoProps) {
  const { data: filasRAW = [], isLoading: loading } = useReporteJerarquicoInventario(estadoFiltro, tipoVista);
  const [expandidosManuales, setExpandidosManuales] = useState<Set<string>>(new Set());

  // Estado para modales
  const [trasladoModalOpen, setTrasladoModalOpen] = useState(false);
  const [bajaModalOpen, setBajaModalOpen] = useState(false);
  const [estadisticasModalOpen, setEstadisticasModalOpen] = useState(false);
  const [bienSeleccionado, setBienSeleccionado] = useState<{ id: string; nombre: string } | null>(null);
  
  const [modoFiltro, setModoFiltro] = useState<ModoFiltro>('departamento');
  const [filtroTexto, setFiltroTexto] = useState('');

  const buildTree = useCallback((
    filas: FilaReporteInventario[],
    expandSetDestino: Set<string>,
    textoFiltro: string,
    modo: ModoFiltro
  ): NodoFila[] => {
    const term = textoFiltro.toLowerCase().trim();
    const map = new Map<string, NodoFila>();
    const roots: NodoFila[] = [];

    // Primera pasada: clonar todos
    for (const f of filas) {
      map.set(f.id, { ...f, children: [], tieneHijos: false });
    }

    // Identificar dependencias padre -> hijos según el prefix (1 -> 1.1)
    const sortedFilas = [...filas].sort((a, b) => a.level - b.level);
    for (const f of sortedFilas) {
      const nodo = map.get(f.id)!;
      if (!f.parentId) {
        roots.push(nodo);
      } else {
        if (map.has(f.parentId)) {
          map.get(f.parentId)!.children.push(nodo);
        } else {
          // Fallback
          roots.push(nodo);
        }
      }
    }

    // Filtrar si hay texto
    if (term) {
      const nodosVisibles = new Set<string>();
      const marcarHaciaArriba = (id: string) => {
        let currentId: string | undefined = id;
        while (currentId) {
          nodosVisibles.add(currentId);
          expandSetDestino.add(currentId);
          
          // Encontrar padre en la estructura reconstruida
          let foundParent = undefined;
          for (const [pid, pNode] of map.entries()) {
            if (pNode.children.some(c => c.id === currentId)) {
               foundParent = pid;
               break;
            }
          }
          currentId = foundParent;
        }
      };

      for (const [id, nodo] of map.entries()) {
        let match = false;
        if (modo === 'departamento' && nodo.tipo === 'dependencia' && nodo.nombre.toLowerCase().includes(term)) match = true;
        if (modo === 'nombre' && nodo.tipo === 'empleado' && nodo.nombre.toLowerCase().includes(term)) match = true;
        if (modo === 'bien' && nodo.tipo === 'bien') {
            const nomMatch = nodo.nombre.toLowerCase().includes(term);
            const serieMatch = nodo.serie?.toLowerCase().includes(term);
            if (nomMatch || serieMatch) match = true;
        }

        if (match) {
          marcarHaciaArriba(id);
          // Opcional: mostrar todos los hijos del que hace match
          const marcarHijos = (n: NodoFila) => {
            nodosVisibles.add(n.id);
            expandSetDestino.add(n.id);
            n.children.forEach(marcarHijos);
          };
          marcarHijos(nodo);
        }
      }

      // Podar árbol
      const prune = (nodos: NodoFila[]) => {
        for (let i = nodos.length - 1; i >= 0; i--) {
          if (!nodosVisibles.has(nodos[i].id)) {
            nodos.splice(i, 1);
          } else {
            prune(nodos[i].children);
          }
        }
      };
      prune(roots);
    }

    // Set tieneHijos y totalizar (la BDD ya totalizó, pero podemos recalcular si podamos, o mantener los totales globales)
    const prepararHijos = (nodos: NodoFila[]) => {
       nodos.forEach(n => {
         n.tieneHijos = n.children.length > 0;
         prepararHijos(n.children);
       });
    };
    prepararHijos(roots);

    return roots;
  }, []);

  const [roots, expandidos] = useMemo(() => {
    const expandSet = new Set<string>();
    const tree = buildTree(filasRAW, expandSet, filtroTexto, modoFiltro);
    if (!filtroTexto) {
       // Mantener expandidos manuales
       expandidosManuales.forEach(e => expandSet.add(e));
    }
    return [tree, expandSet];
  }, [filasRAW, filtroTexto, modoFiltro, buildTree, expandidosManuales]);

  const toggleExpand = (nodo: NodoFila) => {
    setExpandidosManuales(prev => {
      const next = new Set(prev);
      if (next.has(nodo.id)) next.delete(nodo.id);
      else next.add(nodo.id);
      return next;
    });
  };

  const idsExpandiblesTotales = useMemo(() => {
    const ids = new Set<string>();
    const recoger = (nodos: NodoFila[]) => {
      nodos.forEach(n => {
        if (n.tieneHijos) {
          ids.add(n.id);
          recoger(n.children);
        }
      });
    };
    recoger(roots);
    return ids;
  }, [roots]);

  const todoExpandido = useMemo(() => {
    if (idsExpandiblesTotales.size === 0) return false;
    for (const id of idsExpandiblesTotales) {
      if (!expandidos.has(id)) return false;
    }
    return true;
  }, [idsExpandiblesTotales, expandidos]);

  const toggleExpandirTodo = useCallback(() => {
    if (todoExpandido) {
      setExpandidosManuales(new Set());
    } else {
      setExpandidosManuales(new Set(idsExpandiblesTotales));
    }
  }, [todoExpandido, idsExpandiblesTotales]);

  const handleTrasladar = useCallback((nodo: NodoFila) => {
    setBienSeleccionado({ id: nodo.id.replace('bien-', ''), nombre: nodo.nombre });
    setTrasladoModalOpen(true);
  }, []);

  const handleBaja = useCallback((nodo: NodoFila) => {
    setBienSeleccionado({ id: nodo.id.replace('bien-', ''), nombre: nodo.nombre });
    setBajaModalOpen(true);
  }, []);

  if (loading) {
     return <div className="p-4">Cargando reporte jerárquico...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 p-0 sm:p-4 rounded-none sm:rounded-xl shadow-none sm:shadow-sm border-0 sm:border border-slate-200 dark:border-neutral-800">
      
      <div className="mb-4 pt-2 sm:pt-0">
        <FiltroBusquedaInventario
          modoFiltro={modoFiltro}
          onModoChange={setModoFiltro}
          filas={filasRAW}
          valorAplicado={filtroTexto}
          onSeleccionar={setFiltroTexto}
          onLimpiar={() => setFiltroTexto('')}
        />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-slate-300 dark:border-neutral-600">
        
        <div className={`bg-slate-50/80 dark:bg-neutral-800/40 border-b ${BORDE_TABLA} px-4 py-3 flex items-center justify-between`}>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Detalle del Inventario
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEstadisticasModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Estadísticas</span>
            </button>
            <button
              onClick={toggleExpandirTodo}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-slate-700 dark:text-slate-300"
              title={todoExpandido ? 'Contraer todo' : 'Expandir todo'}
            >
              <motion.span
                animate={{ rotate: todoExpandido ? 90 : 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="inline-flex"
              >
                <ChevronsLeftRight size={16} />
              </motion.span>
              <span className="hidden sm:inline">{todoExpandido ? 'Contraer Todo' : 'Expandir Todo'}</span>
            </button>
          </div>
        </div>

        {/* Wrapper para el scroll horizontal y vertical de la tabla */}
        <div className="flex-1 overflow-auto bg-white dark:bg-[#0a0a0a]">
          <div className="min-w-[800px] flex flex-col h-full">
            {/* Encabezado */}
            <div className={`sticky top-0 z-10 ${ENCABEZADO_BG} border-b ${BORDE_TABLA}`}>
              <div className={`${GRID_TABLA}`}>
                <div className={`px-3 py-2 border-r ${BORDE_TABLA} text-xs font-bold text-slate-700 dark:text-slate-300 text-center uppercase tracking-wider`}>
                  No.
                </div>
                <div className={`px-3 py-2 border-r ${BORDE_TABLA} text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider`}>
                  Dependencia / Empleado / Bien
                </div>
                <div className={`px-3 py-2 border-r ${BORDE_TABLA} text-xs font-bold text-slate-700 dark:text-slate-300 text-center uppercase tracking-wider`}>
                  Cantidad
                </div>
                <div className={`px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 text-right uppercase tracking-wider`}>
                  Valor Total
                </div>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="flex-1">
              {roots.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No hay bienes registrados o no coinciden con la búsqueda.
                </div>
              ) : (
                <div className="flex flex-col pb-6">
                  {roots.map(root => (
                    <NodoInventarioItem
                      key={root.id}
                      nodo={root}
                      expandidos={expandidos}
                      toggleExpand={toggleExpand}
                      onTrasladar={handleTrasladar}
                      onBaja={handleBaja}
                      onClickItem={onClickItem}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {bienSeleccionado && (
        <>
          <TrasladoModal
            open={trasladoModalOpen}
            onOpenChange={(open) => {
              setTrasladoModalOpen(open);
              if (!open) {
                // Pequeño delay para que no se vea el modal vacío al cerrar
                setTimeout(() => { if (!bajaModalOpen) setBienSeleccionado(null); }, 300);
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
              }
            }}
            idBien={bienSeleccionado.id}
            nombreBien={bienSeleccionado.nombre}
          />
        </>
      )}

      <EstadisticasInventarioModal
        open={estadisticasModalOpen}
        onClose={() => setEstadisticasModalOpen(false)}
        filas={filasRAW}
        cargando={loading}
        estadoFiltroContexto={estadoFiltro}
      />
    </div>
  );
}
