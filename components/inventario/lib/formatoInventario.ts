export type TipoFilaInventario = 'dependencia' | 'empleado' | 'bien' | 'total-empleado';

export const formatearQ = (monto: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);

export const getColorNivel = (fila: { tipo: TipoFilaInventario; level: number; esPuesto?: boolean }) => {
  if (fila.tipo === 'bien') {
    return {
      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      underline: '',
      text: 'text-slate-600 dark:text-slate-300',
      price: 'text-slate-700 dark:text-slate-400',
      row: 'bg-slate-50/70 dark:bg-slate-900/20',
    };
  }

  if (fila.tipo === 'empleado' || fila.tipo === 'total-empleado' || fila.esPuesto) {
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
