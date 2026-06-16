import { FilaReporteDependencia, SolicitudReporteItem } from './actions';

export type FiltroCombustible = 'todos' | 'gasolina' | 'diesel';

export interface ItemEstadistica {
  nombre: string;
  total: number;
  solicitudes: number;
  puesto?: string;
  detalle?: string;
}

export interface PuntoTendencia {
  clave: string;
  etiqueta: string;
  total: number;
  solicitudes: number;
}

export interface EstadisticasReporte {
  granTotal: number;
  totalSolicitudes: number;
  totalPersonas: number;
  totalDependencias: number;
  promedioPorSolicitud: number;
  promedioPorPersona: number;
  personaTop?: ItemEstadistica;
  porArea: ItemEstadistica[];
  porDepartamento: ItemEstadistica[];
  porPersona: ItemEstadistica[];
  porCombustible: ItemEstadistica[];
  tendencia: PuntoTendencia[];
}

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const claveMes = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

const etiquetaMes = (fecha: Date) =>
  `${MESES_CORTOS[fecha.getMonth()]} ${String(fecha.getFullYear()).slice(2)}`;

const empleadoEnRama = (emp: FilaReporteDependencia, prefix: string) =>
  emp.branchPrefix === prefix || emp.branchPrefix.startsWith(`${prefix}.`);

const esGasolinaTipo = (tipo: string) => tipo.toLowerCase().includes('gasolina');
const esDieselTipo = (tipo: string) => tipo.toLowerCase().includes('diesel');

const solicitudPasaFiltro = (
  sol: SolicitudReporteItem,
  filtro: FiltroCombustible
) => {
  if (filtro === 'todos') return true;
  const tipo = sol.tipo_combustible?.trim() ?? '';
  if (filtro === 'gasolina') return esGasolinaTipo(tipo);
  return esDieselTipo(tipo);
};

const solicitudesFiltradas = (
  emp: FilaReporteDependencia,
  filtro: FiltroCombustible
) => (emp.solicitudes ?? []).filter((sol) => solicitudPasaFiltro(sol, filtro));

const totalEnRama = (
  empleados: FilaReporteDependencia[],
  prefix: string,
  filtro: FiltroCombustible
) => {
  let total = 0;
  let solicitudes = 0;
  empleados.forEach((emp) => {
    if (!empleadoEnRama(emp, prefix)) return;
    const sols = solicitudesFiltradas(emp, filtro);
    total += sols.reduce((acc, sol) => acc + sol.monto, 0);
    solicitudes += sols.length;
  });
  return { total, solicitudes };
};

export function calcularEstadisticas(
  filas: FilaReporteDependencia[],
  filtro: FiltroCombustible = 'todos'
): EstadisticasReporte {
  const empleados = filas.filter((f) => f.tipo === 'empleado');

  const acumCombustible = new Map<string, ItemEstadistica>();
  const acumTendencia = new Map<string, PuntoTendencia>();

  let granTotal = 0;
  let totalSolicitudes = 0;
  const solicitudesVistas = new Set<number>();

  empleados.forEach((emp) => {
    solicitudesFiltradas(emp, filtro).forEach((sol) => {
      if (solicitudesVistas.has(sol.id)) return;
      solicitudesVistas.add(sol.id);
      totalSolicitudes += 1;
      granTotal += sol.monto;

      const tipo = sol.tipo_combustible?.trim() || 'Sin tipo';
      const comb = acumCombustible.get(tipo) ?? {
        nombre: tipo,
        total: 0,
        solicitudes: 0,
      };
      comb.total += sol.monto;
      comb.solicitudes += 1;
      acumCombustible.set(tipo, comb);

      const fecha = new Date(sol.created_at);
      if (!Number.isNaN(fecha.getTime())) {
        const clave = claveMes(fecha);
        const punto = acumTendencia.get(clave) ?? {
          clave,
          etiqueta: etiquetaMes(fecha),
          total: 0,
          solicitudes: 0,
        };
        punto.total += sol.monto;
        punto.solicitudes += 1;
        acumTendencia.set(clave, punto);
      }
    });
  });

  const porPersona: ItemEstadistica[] = empleados
    .map((emp) => {
      const sols = solicitudesFiltradas(emp, filtro);
      return {
        nombre: emp.nombre,
        puesto: emp.nombrePuesto,
        total: sols.reduce((acc, sol) => acc + sol.monto, 0),
        solicitudes: sols.length,
      };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total);

  const porDepartamento: ItemEstadistica[] = filas
    .filter(
      (f) =>
        f.tipo === 'dependencia' &&
        f.level === 2 &&
        !f.esPuesto &&
        f.prefix &&
        f.prefix !== '—'
    )
    .map((f) => {
      const { total, solicitudes } = totalEnRama(empleados, f.prefix, filtro);
      return { nombre: f.nombre, total, solicitudes };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  const porArea: ItemEstadistica[] = filas
    .filter(
      (f) =>
        f.tipo === 'dependencia' &&
        f.level === 0 &&
        !f.esPuesto &&
        f.prefix &&
        f.prefix !== '—'
    )
    .map((f) => {
      const { total, solicitudes } = totalEnRama(empleados, f.prefix, filtro);
      return { nombre: f.nombre, total, solicitudes };
    })
    .filter((a) => a.total > 0)
    .sort((a, b) => b.total - a.total);

  const porCombustible = [...acumCombustible.values()].sort(
    (a, b) => b.total - a.total
  );
  const tendencia = [...acumTendencia.values()].sort((a, b) =>
    a.clave.localeCompare(b.clave)
  );

  const totalPersonas = porPersona.length;
  const totalDependencias = porDepartamento.length;

  return {
    granTotal,
    totalSolicitudes,
    totalPersonas,
    totalDependencias,
    promedioPorSolicitud: totalSolicitudes > 0 ? granTotal / totalSolicitudes : 0,
    promedioPorPersona: totalPersonas > 0 ? granTotal / totalPersonas : 0,
    personaTop: porPersona[0],
    porArea,
    porDepartamento,
    porPersona,
    porCombustible,
    tendencia,
  };
}
