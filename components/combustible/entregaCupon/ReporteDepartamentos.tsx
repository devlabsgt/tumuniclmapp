'use client';

import React, { useState, useTransition, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DetalleSolicitudModal from './modals/DetalleSolicitudModal';
import ExportarReportePdfModal from './modals/ExportarReportePdfModal';
import { FiltroConSugerencias } from './FiltroBusquedaReporte';
import { crearUrlPdfReporteDepartamento } from './lib/ReporteDepartamentoPdf';
import {
  guardarParamsReporte,
  leerParamsReporte,
  paramsReporteIguales,
} from './lib/reportePeriodoStorage';
import {
  getReporteJerarquicoCombustible,
  ReporteJerarquicoCombustible,
  FilaReporteDependencia,
  ParamsReporteCombustible,
} from './lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  User,
  SearchX,
  Calendar,
} from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const formatearQ = (monto: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);

const toMonthValue = (anio: number, mes: number) =>
  `${anio}-${String(mes + 1).padStart(2, '0')}`;

const fromMonthValue = (val: string) => {
  const [y, m] = val.split('-').map(Number);
  return { anio: y, mes: m - 1 };
};

const formatRangoLabel = (inicio: string, fin: string) => {
  const { anio: y1, mes: m1 } = fromMonthValue(inicio);
  const { anio: y2, mes: m2 } = fromMonthValue(fin);
  const mesIni = MESES_CORTOS[m1].toLowerCase();
  const mesFin = MESES_CORTOS[m2].toLowerCase();
  if (inicio === fin) return `${mesIni} ${y1}`;
  return `De ${mesIni} ${y1} a ${mesFin} ${y2}`;
};

const BTN_TOOLBAR =
  'flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all shadow-sm whitespace-nowrap';

const INPUT_MES =
  'text-sm border border-slate-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 bg-white dark:bg-neutral-900 text-slate-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 w-full';

const paramsDesdeMeses = (inicio: string, fin: string): ParamsReporteCombustible => {
  const ini = fromMonthValue(inicio);
  const end = fromMonthValue(fin);
  if (inicio === fin) {
    return {
      modoRango: false,
      anio: ini.anio,
      mes: ini.mes,
      mesInicio: ini.mes,
      mesFin: ini.mes,
      anioInicio: ini.anio,
      anioFin: ini.anio,
    };
  }
  return {
    modoRango: true,
    anio: ini.anio,
    mes: ini.mes,
    mesInicio: ini.mes,
    mesFin: end.mes,
    anioInicio: ini.anio,
    anioFin: end.anio,
  };
};

function SelectorPeriodo({
  inicio,
  fin,
  onChange,
}: {
  inicio: string;
  fin: string;
  onChange: (ini: string, fin: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={BTN_TOOLBAR} title="Seleccionar periodo">
          <Calendar size={15} className="text-blue-500 shrink-0" />
          <span>{formatRangoLabel(inicio, fin)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <div className="flex flex-col gap-3 min-w-[12rem]">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Desde
            </label>
            <input
              type="month"
              value={inicio}
              onChange={(e) => onChange(e.target.value, fin)}
              className={INPUT_MES}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Hasta
            </label>
            <input
              type="month"
              value={fin}
              onChange={(e) => onChange(inicio, e.target.value)}
              className={INPUT_MES}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NodoFila extends FilaReporteDependencia {
  children: NodoFila[];
  tieneHijos: boolean;
}

interface Props {
  initialData: ReporteJerarquicoCombustible;
  initialParams: ParamsReporteCombustible;
}

const encontrarPadrePorPrefix = (
  branchPrefix: string,
  porPrefix: Map<string, NodoFila>
): NodoFila | undefined => {
  if (porPrefix.has(branchPrefix)) return porPrefix.get(branchPrefix);
  if (!branchPrefix.includes('.')) return undefined;

  const partes = branchPrefix.split('.');
  while (partes.length > 1) {
    partes.pop();
    const candidato = partes.join('.');
    if (porPrefix.has(candidato)) return porPrefix.get(candidato);
  }
  return undefined;
};

const getColorNivel = (fila: FilaReporteDependencia) => {
  if (fila.tipo === 'solicitud') {
    return {
      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      underline: '',
      text: 'text-slate-600 dark:text-slate-300',
      price: 'text-slate-700 dark:text-slate-400',
      row: 'bg-slate-50/70 dark:bg-slate-900/20',
    };
  }

  if (fila.tipo === 'empleado' || fila.esPuesto) {
    return {
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      underline: 'border-b-2 border-yellow-500',
      text: 'text-yellow-800 dark:text-yellow-300',
      price: 'text-yellow-700 dark:text-yellow-400',
      row: 'bg-yellow-50/40 dark:bg-yellow-900/10',
    };
  }

  const nivel = fila.level % 4;
  switch (nivel) {
    case 0:
      return {
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        underline: 'border-b-2 border-blue-500',
        text: 'text-blue-800 dark:text-blue-300',
        price: 'text-blue-700 dark:text-blue-400',
        row: 'bg-blue-50/50 dark:bg-blue-900/10',
      };
    case 1:
      return {
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        underline: 'border-b-2 border-red-500',
        text: 'text-red-800 dark:text-red-300',
        price: 'text-red-700 dark:text-red-400',
        row: 'bg-red-50/40 dark:bg-red-900/10',
      };
    case 2:
      return {
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        underline: 'border-b-2 border-purple-500',
        text: 'text-purple-800 dark:text-purple-300',
        price: 'text-purple-700 dark:text-purple-400',
        row: 'bg-purple-50/40 dark:bg-purple-900/10',
      };
    default:
      return {
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        underline: 'border-b-2 border-orange-500',
        text: 'text-orange-800 dark:text-orange-300',
        price: 'text-orange-700 dark:text-orange-400',
        row: 'bg-orange-50/40 dark:bg-orange-900/10',
      };
  }
};

const empleadoEnRamaMatch = (branchPrefix: string, ramasMatcheadas: Set<string>) =>
  [...ramasMatcheadas].some(
    (p) => branchPrefix === p || branchPrefix.startsWith(`${p}.`)
  );

const filtrarPorDepartamento = (filas: FilaReporteDependencia[], term: string) => {
  if (!term.trim()) return filas;

  const lower = term.toLowerCase();
  const visiblePrefixes = new Set<string>();
  const ramasMatcheadas = new Set<string>();

  filas.forEach((f) => {
    if (f.tipo !== 'dependencia' || !f.nombre.toLowerCase().includes(lower)) return;

    if (f.prefix && f.prefix !== '—') {
      visiblePrefixes.add(f.prefix);
      ramasMatcheadas.add(f.prefix);

      filas.forEach((other) => {
        if (
          other.tipo === 'dependencia' &&
          other.prefix?.startsWith(`${f.prefix}.`)
        ) {
          visiblePrefixes.add(other.prefix);
          ramasMatcheadas.add(other.prefix);
        }
      });
    }
    if (f.id === 'sin-dependencia') {
      visiblePrefixes.add('sin-dependencia');
      ramasMatcheadas.add('sin-dependencia');
    }
  });

  if (visiblePrefixes.size === 0) return [];

  return filas.filter((f) => {
    if (f.tipo === 'dependencia') {
      if (f.id === 'sin-dependencia') return visiblePrefixes.has('sin-dependencia');
      return f.prefix ? visiblePrefixes.has(f.prefix) : false;
    }
    if (f.tipo === 'empleado') return empleadoEnRamaMatch(f.branchPrefix, ramasMatcheadas);
    return false;
  });
};

const filtrarPorNombre = (filas: FilaReporteDependencia[], term: string) => {
  if (!term.trim()) return filas;

  const lower = term.toLowerCase();
  const visiblePrefixes = new Set<string>();
  const empleadosVisibles = new Set<string>();

  filas.forEach((f) => {
    if (f.tipo === 'empleado' && f.nombre.toLowerCase().includes(lower)) {
      empleadosVisibles.add(f.id);
      if (f.branchPrefix) visiblePrefixes.add(f.branchPrefix);
    }
  });

  if (empleadosVisibles.size === 0) return [];

  return filas.filter((f) => {
    if (f.tipo === 'empleado') return empleadosVisibles.has(f.id);
    if (f.tipo === 'dependencia') {
      if (f.id === 'sin-dependencia') return visiblePrefixes.has('sin-dependencia');
      return f.prefix ? visiblePrefixes.has(f.prefix) : false;
    }
    return false;
  });
};

const filtrarFilas = (
  filas: FilaReporteDependencia[],
  busquedaDep: string,
  busquedaNombre: string
) => {
  let resultado = filas;
  if (busquedaDep.trim()) resultado = filtrarPorDepartamento(resultado, busquedaDep);
  if (busquedaNombre.trim()) resultado = filtrarPorNombre(resultado, busquedaNombre);
  return resultado;
};

const buildTree = (filas: FilaReporteDependencia[]): NodoFila[] => {
  const roots: NodoFila[] = [];
  const porPrefix = new Map<string, NodoFila>();

  for (const fila of filas) {
    const nodo: NodoFila = { ...fila, children: [], tieneHijos: false };

    if (fila.tipo === 'dependencia' && fila.prefix && fila.prefix !== '—') {
      porPrefix.set(fila.prefix, nodo);
    }
    if (fila.id === 'sin-dependencia') {
      porPrefix.set('sin-dependencia', nodo);
    }

    if (fila.tipo === 'empleado') {
      const padre = encontrarPadrePorPrefix(fila.branchPrefix, porPrefix);
      if (padre) {
        padre.children.push(nodo);
        padre.tieneHijos = true;
      }

      if (fila.solicitudes?.length) {
        fila.solicitudes.forEach((sol) => {
          nodo.children.push({
            id: `sol-${sol.id}`,
            prefix: '',
            level: fila.level + 1,
            tipo: 'solicitud',
            nombre: sol.justificacion?.trim() || 'Sin justificación',
            total: sol.monto,
            esPuesto: false,
            branchPrefix: fila.branchPrefix,
            rutaDependencia: fila.rutaDependencia,
            solicitud: sol,
            children: [],
            tieneHijos: false,
          });
        });
        nodo.tieneHijos = true;
      }
      continue;
    }

    if (fila.prefix === '—') {
      roots.push(nodo);
      continue;
    }

    const parentPrefix =
      fila.prefix && fila.prefix.includes('.')
        ? fila.prefix.split('.').slice(0, -1).join('.')
        : null;

    if (parentPrefix && porPrefix.has(parentPrefix)) {
      porPrefix.get(parentPrefix)!.children.push(nodo);
      porPrefix.get(parentPrefix)!.tieneHijos = true;
    } else {
      roots.push(nodo);
    }
  }

  return roots;
};

const recalcularTotales = (nodos: NodoFila[]): void => {
  nodos.forEach((n) => {
    if (n.children.length > 0) {
      recalcularTotales(n.children);
      n.total = n.children.reduce((acc, c) => acc + c.total, 0);
    }
  });
};

const recogerIdsExpandibles = (nodos: NodoFila[], ids: Set<string>) => {
  nodos.forEach((n) => {
    if (n.tieneHijos) ids.add(n.id);
    recogerIdsExpandibles(n.children, ids);
  });
};

const aplanarTodo = (nodos: NodoFila[]): NodoFila[] => {
  const resultado: NodoFila[] = [];
  const recorrer = (lista: NodoFila[]) => {
    lista.forEach((n) => {
      resultado.push(n);
      if (n.children.length) recorrer(n.children);
    });
  };
  recorrer(nodos);
  return resultado;
};

interface NodoItemProps {
  nodo: NodoFila;
  expandidos: Set<string>;
  toggleExpand: (id: string) => void;
  onVerSolicitud: (id: number) => void;
}

function NodoItem({ nodo, expandidos, toggleExpand, onVerSolicitud }: NodoItemProps) {
  const colores = getColorNivel(nodo);
  const expandido = expandidos.has(nodo.id);
  const esExpandible = nodo.tieneHijos;
  const esSolicitud = nodo.tipo === 'solicitud';
  const mostrarNumero = nodo.tipo === 'dependencia' && nodo.prefix && !nodo.esPuesto;
  const sol = nodo.solicitud;

  const handleClick = () => {
    if (esSolicitud && sol) {
      onVerSolicitud(sol.id);
      return;
    }
    if (esExpandible) toggleExpand(nodo.id);
  };

  return (
    <div className="border-t border-slate-100 dark:border-neutral-800 first:border-t-0">
      <div
        onClick={handleClick}
        className={`grid grid-cols-[5rem_1fr_8.5rem] gap-2 px-4 py-2.5 ${colores.row} ${
          esSolicitud ? 'items-start' : 'items-center'
        } ${
          esExpandible || esSolicitud
            ? 'cursor-pointer hover:brightness-[0.98] dark:hover:brightness-110'
            : ''
        }`}
      >
        <div>
          {mostrarNumero && (
            <span
              className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md font-mono font-bold text-[11px] ${colores.badge} ${colores.underline}`}
            >
              {nodo.prefix}
            </span>
          )}
        </div>

        <div className="min-w-0 overflow-hidden text-left">
          {esSolicitud && sol ? (
            <p className={`text-sm leading-relaxed break-words ${colores.text}`}>
              <span>No.:</span>{' '}
              <span className="font-bold">{sol.correlativo ?? sol.id}</span>,{' '}
              <span>Placa:</span>{' '}
              <span className="font-bold">{sol.placa}</span>,{' '}
              <span>Just.</span>{' '}
              <span className="font-bold">
                {sol.justificacion?.trim() || 'Sin justificación'}
              </span>
            </p>
          ) : (
            <div className="flex items-center gap-2">
              {nodo.tipo === 'empleado' && (
                <User size={14} className={`shrink-0 ${colores.text}`} />
              )}
              <span className={`font-bold truncate ${colores.text}`}>{nodo.nombre}</span>
            </div>
          )}
        </div>

        <div className={`text-right font-mono font-extrabold whitespace-nowrap ${colores.price}`}>
          {formatearQ(nodo.total)}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expandido && nodo.children.length > 0 && (
          <motion.div
            key={`children-${nodo.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {nodo.children.map((hijo) => (
              <NodoItem
                key={hijo.id}
                nodo={hijo}
                expandidos={expandidos}
                toggleExpand={toggleExpand}
                onVerSolicitud={onVerSolicitud}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const etiquetaPeriodo = (params: ParamsReporteCombustible) => {
  if (!params.modoRango) {
    return `${MESES[params.mes]} ${params.anio}`;
  }
  const ini = toMonthValue(params.anioInicio, params.mesInicio);
  const fin = toMonthValue(params.anioFin, params.mesFin);
  return formatRangoLabel(ini, fin);
};

export default function ReporteDepartamentos({ initialData, initialParams }: Props) {
  const mesInicial = initialParams.modoRango
    ? toMonthValue(initialParams.anioInicio, initialParams.mesInicio)
    : toMonthValue(initialParams.anio, initialParams.mes);
  const mesFinal = initialParams.modoRango
    ? toMonthValue(initialParams.anioFin, initialParams.mesFin)
    : toMonthValue(initialParams.anio, initialParams.mes);

  const [data, setData] = useState<ReporteJerarquicoCombustible>(initialData);
  const [params, setParams] = useState<ParamsReporteCombustible>(initialParams);
  const [mesInicioValor, setMesInicioValor] = useState(mesInicial);
  const [mesFinValor, setMesFinValor] = useState(mesFinal);
  const [busquedaDep, setBusquedaDep] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [modoFiltroNombre, setModoFiltroNombre] = useState(false);
  const [solicitudModalId, setSolicitudModalId] = useState<number | null>(null);
  const [exportPdfOpen, setExportPdfOpen] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const sincronizarUiPeriodo = useCallback((p: ParamsReporteCombustible) => {
    if (!p.modoRango) {
      const valor = toMonthValue(p.anio, p.mes);
      setMesInicioValor(valor);
      setMesFinValor(valor);
      return;
    }
    setMesInicioValor(toMonthValue(p.anioInicio, p.mesInicio));
    setMesFinValor(toMonthValue(p.anioFin, p.mesFin));
  }, []);

  const construirParams = (): ParamsReporteCombustible =>
    paramsDesdeMeses(mesInicioValor, mesFinValor);

  const cargar = (nuevosParams?: ParamsReporteCombustible) => {
    const p = nuevosParams ?? construirParams();
    setParams(p);
    guardarParamsReporte(p);
    setBusquedaDep('');
    setBusquedaNombre('');
    setExpandidos(new Set());
    startTransition(async () => {
      const res = await getReporteJerarquicoCombustible(p);
      setData(res);
    });
  };

  useEffect(() => {
    const guardado = leerParamsReporte();
    if (!guardado || paramsReporteIguales(guardado, initialParams)) return;
    sincronizarUiPeriodo(guardado);
    cargar(guardado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filasArea = useMemo(
    () => filtrarFilas(data.filas, busquedaDep, busquedaNombre),
    [data.filas, busquedaDep, busquedaNombre]
  );

  const arbol = useMemo(() => {
    const tree = buildTree(filasArea);
    if (busquedaDep.trim() || busquedaNombre.trim()) {
      recalcularTotales(tree);
    }
    return tree;
  }, [filasArea, busquedaDep, busquedaNombre]);

  const autoExpandir = (dep: string, nombre: string) => {
    if (dep.trim() || nombre.trim()) {
      const todos = new Set<string>();
      recogerIdsExpandibles(
        buildTree(filtrarFilas(data.filas, dep, nombre)),
        todos
      );
      setExpandidos(todos);
    } else {
      setExpandidos(new Set());
    }
  };

  const handleBusquedaDep = (valor: string) => {
    setBusquedaDep(valor);
    setBusquedaNombre('');
    autoExpandir(valor, '');
  };

  const handleBusquedaNombre = (valor: string) => {
    setBusquedaNombre(valor);
    setBusquedaDep('');
    autoExpandir('', valor);
  };

  const limpiarFiltro = () => {
    setBusquedaDep('');
    setBusquedaNombre('');
    setExpandidos(new Set());
  };

  const valorFiltroAplicado = modoFiltroNombre ? busquedaNombre : busquedaDep;

  const handleVerSolicitud = useCallback((id: number) => {
    setSolicitudModalId(id);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExportarPdf = useCallback(
    async (busquedaDepPdf: string, busquedaNombrePdf: string) => {
      const filasPdf =
        busquedaDepPdf.trim() || busquedaNombrePdf.trim()
          ? filtrarFilas(data.filas, busquedaDepPdf, busquedaNombrePdf)
          : data.filas;

      if (filasPdf.length === 0) {
        throw new Error('No hay datos para generar el reporte.');
      }

      const tree = buildTree(filasPdf);
      if (busquedaDepPdf.trim() || busquedaNombrePdf.trim()) {
        recalcularTotales(tree);
      }
      const flat = aplanarTodo(tree);
      const titulo =
        busquedaDepPdf.trim() || busquedaNombrePdf.trim()
          ? busquedaNombrePdf || busquedaDepPdf
          : 'Todos los departamentos';
      const granTotal = tree.reduce((acc, n) => acc + n.total, 0);

      return crearUrlPdfReporteDepartamento({
        filas: flat.map((n) => ({
          prefix: n.prefix,
          nombre: n.nombre,
          total: n.total,
          tipo: n.tipo,
          esPuesto: n.esPuesto,
          level: n.level,
          solicitud: n.solicitud,
        })),
        tituloFiltro: titulo,
        periodo: etiquetaPeriodo(params),
        granTotal,
      });
    },
    [data.filas, params]
  );

  const aplicarPeriodo = (inicio: string, fin: string) => {
    setMesInicioValor(inicio);
    setMesFinValor(fin);
    cargar(paramsDesdeMeses(inicio, fin));
  };

  const hayDatos = arbol.length > 0;

  return (
    <div className="space-y-4 md:space-y-6 w-full md:w-[91%] px-3 md:px-0 mx-auto animate-in fade-in duration-500 mt-2 md:mt-4 xl:mt-5 pb-20">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4">
          <div className="flex items-start gap-3">
            <Link
              href="/protected/combustible"
              className="mt-1 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors print:hidden shrink-0"
              title="Volver"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Reporte por Departamento
              </h1>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                Consumo de cupones por área administrativa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 w-full xl:w-auto xl:justify-end print:hidden">
            <SelectorPeriodo
              inicio={mesInicioValor}
              fin={mesFinValor}
              onChange={aplicarPeriodo}
            />
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <FiltroConSugerencias
          modoNombre={modoFiltroNombre}
          onModoChange={setModoFiltroNombre}
          filas={data.filas}
          valorAplicado={valorFiltroAplicado}
          onSeleccionarDep={handleBusquedaDep}
          onSeleccionarNombre={handleBusquedaNombre}
          onLimpiar={limpiarFiltro}
        />
      </div>

      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-neutral-950/60 rounded-2xl backdrop-blur-sm print:hidden">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        )}

        {hayDatos ? (
          <>
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden print:hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-800/40">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Detalle del periodo
                </p>
                <button
                  onClick={() => setExportPdfOpen(true)}
                  className={`${BTN_TOOLBAR} justify-center`}
                  title="Generar PDF por departamento o persona"
                >
                  <ExternalLink size={15} className="text-blue-500" />
                  <span>GENERAR PDF</span>
                </button>
              </div>
              <div className="grid grid-cols-[5rem_1fr_8.5rem] gap-2 px-4 py-3 bg-slate-50 dark:bg-neutral-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <div>No.</div>
                <div>Dependencia / Nombre</div>
                <div className="text-right">Total</div>
              </div>
              {arbol.map((nodo) => (
                <NodoItem
                  key={nodo.id}
                  nodo={nodo}
                  expandidos={expandidos}
                  toggleExpand={toggleExpand}
                  onVerSolicitud={handleVerSolicitud}
                />
              ))}
            </div>

            <DetalleSolicitudModal
              solicitudId={solicitudModalId}
              onClose={() => setSolicitudModalId(null)}
            />

            <ExportarReportePdfModal
              open={exportPdfOpen}
              onClose={() => setExportPdfOpen(false)}
              filas={data.filas}
              onExportar={handleExportarPdf}
            />
          </>
        ) : (
          <div className="text-center py-16 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800">
            <SearchX size={32} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-slate-900 dark:text-white font-bold">No hay consumo registrado</h3>
            <p className="text-slate-500 text-sm mt-1">
              {busquedaDep.trim() || busquedaNombre.trim()
                ? 'No hay resultados con los filtros aplicados.'
                : `No se encontraron cupones aprobados en ${etiquetaPeriodo(params)}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
