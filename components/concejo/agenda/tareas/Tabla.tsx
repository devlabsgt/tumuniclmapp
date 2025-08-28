'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel, // <--- Error de escritura corregido
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Tarea } from '../lib/esquemas';

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

interface TablaProps {
  tareas: Tarea[];
  handleOpenEditModal: (tarea: Tarea) => void;
  handleOpenNotasModal: (tarea: Tarea) => void;
  handleOpenSeguimientoModal: (tarea: Tarea) => void;
  estadoAgenda: string;
}

export default function Tabla({ tareas, handleOpenEditModal, handleOpenNotasModal, handleOpenSeguimientoModal, estadoAgenda }: TablaProps) {
  const sCol = 150;
  const lCol = 250;

  const columns = useMemo<ColumnDef<Tarea>[]>(() => {
    const baseColumns: ColumnDef<Tarea>[] = [
      {
        accessorKey: 'id',
        header: '#',
        size: 30,
        cell: (info) => (
          <div className="flex justify-center items-center h-full">
            {info.row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: 'titulo_item',
        header: 'Punto a Tratar',
        size: lCol,
        cell: info => <div className="flex justify-start items-center h-full text-left">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: sCol,
        cell: info => (
          <div className="flex justify-center items-center h-full">
            <span className={`text-sm leading-5 font-bold ${getStatusTextClasses(info.getValue() as string)}`}>
              {info.getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'votacion',
        header: 'Votación',
        size: sCol,
        cell: info => (
          <div className="flex justify-center items-center h-full">
            <span className={`text-sm leading-5 font-bold`}>
              {info.getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'categoria.nombre',
        header: 'Categoría',
        size: sCol,
        cell: info => <div className="flex justify-start items-center h-full whitespace-nowrap overflow-hidden text-ellipsis text-left">{info.getValue() as string}</div>,
      },
    ];

    if (estadoAgenda === 'En progreso' || estadoAgenda === 'Finalizada') {
      baseColumns.push(
        {
          accessorKey: 'notas',
          header: 'Notas',
          size: lCol,
          cell: info => (
            <div className="flex flex-col gap-2 w-full justify-start items-start">
              {(info.getValue() as string[] | null)?.map((nota, index) => (
                <div key={index} className="bg-transparent w-full">
                  <div className="flex items-center w-full">
                    <div className="flex-1 h-px bg-gray-300"></div>

                    <span className="flex-shrink-0 text-xs text-gray-500 font-semibold">{index + 1}</span>
                    
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                  <div className="p-2 text-sm leading-relaxed">
                    {nota}
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          accessorKey: 'seguimiento',
          header: 'Seguimiento',
          size: lCol,
          cell: info => (
            <div className="flex flex-col gap-2 w-full justify-start items-start">
              {(info.getValue() as string[] | null)?.map((seg, index) => (
                <div key={index} className="bg-transparent w-full">
                  <div className="flex items-center w-full">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="flex-shrink-0 text-xs text-gray-500 font-semibold">{index + 1}</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                  <div className="p-2 text-sm leading-relaxed">
                    {seg}
                  </div>
                </div>
              ))}
            </div>
          ),
        }
      );
    }

    return baseColumns;
  }, [estadoAgenda]);

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
        <table className="min-w-max w-full border border-gray-300 table-fixed">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="p-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300"
                    style={{ width: `${header.getSize()}px` }}
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
                    style={{ width: `${cell.column.getSize()}px` }}
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