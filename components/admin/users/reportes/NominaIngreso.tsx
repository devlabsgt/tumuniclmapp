import React from "react";
import { ReporteNominaFila } from "./lib/actions";

interface Props {
  empleados: (ReporteNominaFila & {
    cantidadDisplay: string;
    totalDevengado: number;
  })[];
  onChange: (id: string, val: string) => void;
  onClearAll: () => void;
  formatQ: (val: number) => string;
}

export const NominaIngreso = ({
  empleados,
  onChange,
  onClearAll,
  formatQ,
}: Props) => {
  if (empleados.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
        No hay empleados en renglones 031/035 para editar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={onClearAll}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-xs font-bold hover:bg-red-200 transition-colors shadow-sm"
        >
          Restablecer Cantidades
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-base text-left">
          <thead className="bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 w-[30%]">Empleado</th>
              <th className="p-4 w-[30%]">Puesto</th>
              <th className="p-4 text-center w-[10%]">Renglón</th>
              <th className="p-4 text-right w-[10%]">Tarifa</th>
              <th className="p-4 w-[10%] text-center bg-yellow-50 dark:bg-yellow-900/10">
                Cantidad
              </th>
              <th className="p-4 text-right w-[10%]">Total Calc.</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-neutral-800">
            {empleados.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td className="p-4 font-semibold text-gray-800 dark:text-gray-200">
                  {emp.nombre}
                </td>
                <td className="p-4 text-gray-500 text-sm">{emp.puesto}</td>
                <td className="p-4 text-center">
                  <span className="bg-gray-200 dark:bg-neutral-700 px-2 py-1 rounded text-xs font-bold">
                    {emp.renglon}
                  </span>
                </td>
                <td className="p-4 text-right font-medium">
                  Q {formatQ(emp.salario_unitario)}
                </td>
                <td className="p-2 bg-yellow-50 dark:bg-yellow-900/10">
                  <input
                    type="text"
                    placeholder="0"
                    value={emp.cantidadDisplay}
                    onChange={(e) => onChange(emp.id, e.target.value)}
                    className="w-full h-10 border-2 border-yellow-200 dark:border-yellow-800 rounded-md text-center font-bold text-lg text-blue-700 bg-white dark:bg-neutral-900 focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 outline-none transition-all"
                  />
                </td>
                <td className="p-4 text-right font-bold text-green-600 text-lg">
                  Q {formatQ(emp.totalDevengado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
