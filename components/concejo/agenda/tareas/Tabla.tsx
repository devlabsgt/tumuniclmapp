'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tarea } from '../lib/acciones';

const statusStyles: Record<string, string> = {
  'Aprobado': 'bg-green-100 text-green-800',
  'No aprobado': 'bg-red-100 text-red-800',
  'En progreso': 'bg-blue-100 text-blue-800',
  'En comisión': 'bg-gray-100 text-gray-800',
  'En espera': 'bg-yellow-100 text-yellow-800',
  'No iniciado': 'bg-gray-100 text-gray-800',
  'Realizado': 'bg-indigo-100 text-indigo-800',
};

const votacionStyles: Record<string, string> = {
  'P1': 'bg-red-100 text-red-800',
  'Unanimidad': 'bg-green-100 text-green-800',
  'Ver Notas': 'bg-yellow-100 text-yellow-800',
  'Realizado': 'bg-indigo-100 text-indigo-800',
};

const getStatusClasses = (status: string | null) => {
  if (!status) return 'bg-white';
  return statusStyles[status] || 'bg-white';
};

const getVotacionClasses = (votacion: string | null) => {
  if (!votacion) return 'bg-white';
  return votacionStyles[votacion] || 'bg-white';
};

const getStatusTextClasses = (status: string) => {
  if (status === 'Aprobado') return 'text-green-800';
  if (status === 'No aprobado') return 'text-red-800';
  if (status === 'En progreso') return 'text-blue-800';
  if (status === 'En comisión') return 'text-gray-800';
  if (status === 'En espera') return 'text-yellow-800';
  if (status === 'No iniciado') return 'text-gray-800';
  if (status === 'Realizado') return 'text-indigo-800';
  return 'text-gray-800';
};

const calcularDiasRestantes = (fechaVencimiento: string | null): string => {
  if (!fechaVencimiento) return '-';
  const dias = differenceInDays(parseISO(fechaVencimiento), new Date());
  if (dias < 0) return 'Vencido';
  if (dias === 0) return 'Hoy';
  return `${dias + 1} días`;
};

interface TablaProps {
  tareas: Tarea[];
  handleOpenEditModal: (tarea: Tarea) => void;
  handleOpenNotasModal: (tarea: Tarea) => void;
  handleOpenSeguimientoModal: (tarea: Tarea) => void;
}

export default function Tabla({ tareas, handleOpenEditModal, handleOpenNotasModal, handleOpenSeguimientoModal }: TablaProps) {
    const sCol = 100;
    const lCol = 250;
    const totalWidth = 50 + (sCol * 5) + (lCol * 2);

    const columns = useMemo<ColumnDef<Tarea>[]>(() => [
    {
      accessorKey: 'id',
      header: '#',
      size: 30,
      minSize: 30,
      cell: (info) => (
        <div className="flex justify-center items-center">
          {info.row.index + 1}
        </div>
      ),
    },
    {
      accessorKey: 'titulo_item',
      header: 'Punto a Tratar',
      size: lCol,
      minSize: sCol,
      cell: info => <>{info.getValue() as string}</>,
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      size: sCol,
      minSize: sCol,
      cell: info => (
        <div className={`flex justify-center w-full`}>
          <span className={`text-xs leading-5 font-semibold ${getStatusTextClasses(info.getValue() as string)}`}>
            {info.getValue() as string}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'votacion',
      header: 'Votación',
      size: sCol,
      minSize: sCol,
      cell: info => (
        <div className={`flex justify-center w-full`}>
          <span className={`text-xs leading-5 font-semibold`}>
            {info.getValue() as string}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'categoria.nombre',
      header: 'Categoría',
      size: sCol,
      minSize: sCol,
      cell: info => <div className="whitespace-nowrap overflow-hidden text-ellipsis">{info.getValue() as string}</div>,
    },
    {
      accessorKey: 'fecha_vencimiento',
      header: 'Vencimiento',
      size: sCol,
      minSize: sCol,
      cell: info => {
        const date = info.getValue() as string;
        return <div className="whitespace-nowrap">{date ? format(parseISO(date), 'd MMM, yyyy', { locale: es }) : '-'}</div>;
      },
    },
    {
      accessorKey: 'diasRestantes',
      header: 'Días Restantes',
      size: sCol,
      minSize: sCol,
      cell: info => {
        const fechaVencimiento = info.row.original.fecha_vencimiento;
        return <div className="whitespace-nowrap">{calcularDiasRestantes(fechaVencimiento)}</div>;
      },
    },
    {
      accessorKey: 'notas',
      header: 'Notas',
      size: lCol,
      minSize: lCol,
      cell: info => (
        <>
          {(info.getValue() as string[] | null)?.map((nota, index) => (
            <p key={index} className="border-b border-gray-200 first:pt-0 last:border-b-0">{nota}</p>
          ))}
        </>
      ),
    },
    {
      accessorKey: 'seguimiento',
      header: 'Seguimiento',
      size: lCol,
      minSize: lCol,
      cell: info => (
        <>
          {(info.getValue() as string[] | null)?.map((seg, index) => (
            <p key={index} className="border-b border-gray-200 first:pt-0 last:border-b-0">{seg}</p>
          ))}
        </>
      ),
    },
  ], []);

  const table = useReactTable({
    data: tareas,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto">
      {tareas.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">Aún no hay tareas creadas para esta agenda.</p>
        </div>
      ) : (
        <table className="min-w-[1250px] w-full border border-gray-300">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="p-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="divide-y divide-gray-200">
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    className={`p-1 border border-gray-300 align-top cursor-pointer transition-colors hover:bg-gray-100 ${cell.column.id === 'estado' ? getStatusClasses(row.original.estado) : ''} ${cell.column.id === 'votacion' ? getVotacionClasses(row.original.votacion || null) : ''}`}
                    style={{ width: cell.column.getSize() }}
                    onClick={() => {
                      if (cell.column.id === 'notas') {
                        handleOpenNotasModal(row.original);
                      } else if (cell.column.id === 'seguimiento') {
                        handleOpenSeguimientoModal(row.original);
                      } else {
                        handleOpenEditModal(row.original);
                      }
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}