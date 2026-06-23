import { FilaReporteInventario } from './schemas';

export type FiltroEstadoInventario = 'todos' | 'activos' | 'inactivos';

export interface ItemEstadistica {
  nombre: string;
  total: number; // Valor Q
  cantidad: number; // Cantidad física
  detalle?: string;
}

export interface EstadisticasInventario {
  granTotal: number;
  totalBienes: number;
  totalPersonas: number;
  totalDependencias: number;
  promedioPorBien: number;
  promedioPorPersona: number;
  porArea: ItemEstadistica[];
  porDepartamento: ItemEstadistica[];
  porPersona: ItemEstadistica[];
  porEstado: ItemEstadistica[];
  porAsignacion: ItemEstadistica[];
}

const isActivo = (estado?: string) => {
  if (!estado) return false;
  const e = estado.toLowerCase();
  return ['activo', 'regular', 'malo'].includes(e);
};

const bienPasaFiltro = (bien: FilaReporteInventario, filtro: FiltroEstadoInventario) => {
  if (filtro === 'todos') return true;
  const activo = isActivo(bien.estado);
  if (filtro === 'activos') return activo;
  return !activo; // inactivos o baja
};

export function calcularEstadisticasInventario(
  filas: FilaReporteInventario[],
  filtro: FiltroEstadoInventario = 'todos'
): EstadisticasInventario {
  // Solo nos interesan las filas que representan bienes físicos
  const bienes = filas.filter(f => f.tipo === 'bien');
  const bienesFiltrados = bienes.filter(b => bienPasaFiltro(b, filtro));

  let granTotal = 0;
  let totalBienes = 0;
  const personasVistas = new Set<string>();
  const dependenciasVistas = new Set<string>();

  const acumArea = new Map<string, ItemEstadistica>();
  const acumDepto = new Map<string, ItemEstadistica>();
  const acumPersona = new Map<string, ItemEstadistica>();
  const acumEstado = new Map<string, ItemEstadistica>();
  const acumAsignacion = new Map<string, ItemEstadistica>();

  const agregar = (mapa: Map<string, ItemEstadistica>, clave: string, nombre: string, valor: number, cant: number, detalle?: string) => {
    if (!mapa.has(clave)) {
      mapa.set(clave, { nombre, total: 0, cantidad: 0, detalle });
    }
    const stat = mapa.get(clave)!;
    stat.total += valor;
    stat.cantidad += cant;
  };

  bienesFiltrados.forEach(b => {
    const valor = Number(b.valor || 0);
    const cant = Number(b.cantidad || 1);

    granTotal += valor;
    totalBienes += cant;

    if (b.info_usuario?.user_id) personasVistas.add(b.info_usuario.user_id);
    if (b.dependencias?.id) dependenciasVistas.add(b.dependencias.id);

    // 1. Por Estado
    const strEstado = b.estado || 'Desconocido';
    agregar(acumEstado, strEstado, strEstado, valor, cant);

    // 2. Por Asignación
    if (b.info_usuario || b.dependencias) {
      agregar(acumAsignacion, 'asignados', 'Bienes Asignados', valor, cant);
      if (b.info_usuario) {
        agregar(acumPersona, b.info_usuario.user_id, b.info_usuario.nombre || 'Sin nombre', valor, cant);
      }
    } else {
      agregar(acumAsignacion, 'sin_asignar', 'Bienes sin Asignar', valor, cant);
    }

    // 3. Por Área y Departamento
    const ruta = b.rutaDependencia ? b.rutaDependencia.split(' › ') : [];
    if (ruta.length > 0) {
      const area = ruta[0]; // Nivel 1 (ej. ORGANOS ADMINISTRATIVOS o CONCEJO MUNICIPAL)
      const depto = b.nombreDepartamento || ruta[ruta.length - 1]; // Nivel final (padre real si es puesto)
      agregar(acumArea, area, area, valor, cant);
      agregar(acumDepto, depto, depto, valor, cant, area);
    } else {
      agregar(acumArea, 'sin_area', 'Sin Área Definida', valor, cant);
      agregar(acumDepto, 'sin_depto', 'Sin Departamento', valor, cant);
    }
  });

  const totalPersonas = personasVistas.size;
  const totalDependencias = dependenciasVistas.size;

  const ordenar = (mapa: Map<string, ItemEstadistica>) =>
    Array.from(mapa.values()).sort((a, b) => b.total - a.total); // Ordenar por valor en Q descendente

  return {
    granTotal,
    totalBienes,
    totalPersonas,
    totalDependencias,
    promedioPorBien: totalBienes > 0 ? granTotal / totalBienes : 0,
    promedioPorPersona: totalPersonas > 0 ? granTotal / totalPersonas : 0,
    porArea: ordenar(acumArea),
    porDepartamento: ordenar(acumDepto),
    porPersona: ordenar(acumPersona),
    porEstado: ordenar(acumEstado),
    porAsignacion: ordenar(acumAsignacion)
  };
}
