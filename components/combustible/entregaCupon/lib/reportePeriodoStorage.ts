import { ParamsReporteCombustible } from './actions';

const STORAGE_KEY = 'combustible-reporte-periodo';

const esMesValido = (mes: number) => Number.isInteger(mes) && mes >= 0 && mes <= 11;
const esAnioValido = (anio: number) => Number.isInteger(anio) && anio >= 2000 && anio <= 2100;

const esParamsValido = (value: unknown): value is ParamsReporteCombustible => {
  if (!value || typeof value !== 'object') return false;
  const p = value as ParamsReporteCombustible;
  return (
    typeof p.modoRango === 'boolean' &&
    esMesValido(p.mes) &&
    esAnioValido(p.anio) &&
    esMesValido(p.mesInicio) &&
    esMesValido(p.mesFin) &&
    esAnioValido(p.anioInicio) &&
    esAnioValido(p.anioFin)
  );
};

export function guardarParamsReporte(params: ParamsReporteCombustible) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // ignorar cuota o modo privado
  }
}

export function leerParamsReporte(): ParamsReporteCombustible | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return esParamsValido(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function paramsReporteIguales(
  a: ParamsReporteCombustible,
  b: ParamsReporteCombustible
) {
  return (
    a.modoRango === b.modoRango &&
    a.mes === b.mes &&
    a.anio === b.anio &&
    a.mesInicio === b.mesInicio &&
    a.mesFin === b.mesFin &&
    a.anioInicio === b.anioInicio &&
    a.anioFin === b.anioFin
  );
}
