'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Log {
  id: string;
  fecha: string;
  accion: string;
  descripcion: string;
  nombreModulo: string;
}

export default function Logs() {
  const supabase = createClient();

  const hoy = new Date().toISOString().split('T')[0];

  const [logs, setLogs] = useState<Log[]>([]);
  const [modulos, setModulos] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [filtro, setFiltro] = useState({
    modulo: '',
    usuario: '',
    fecha: hoy,
  });

const formatearFecha = (iso?: string | null) => {
  if (!iso || iso === 'null') return '—';

  const fechaObj = new Date(iso);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const dia = dias[fechaObj.getDay()];
  const horas = fechaObj.getHours().toString().padStart(2, '0');
  const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
  const segundos = fechaObj.getSeconds().toString().padStart(2, '0');

  const diaNum = fechaObj.getDate().toString().padStart(2, '0');
  const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
  const anio = fechaObj.getFullYear();

  return `${dia} ${horas}:${minutos}:${segundos}\n${diaNum}/${mes}/${anio}`;
};



const cambiarDia = (dias: number) => {
  const fechaBase = filtro.fecha || new Date().toISOString().split('T')[0];
  const nuevaFecha = new Date(fechaBase);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  const nuevaISO = nuevaFecha.toISOString().split('T')[0];
  setFiltro({ ...filtro, fecha: nuevaISO });
};


  const obtenerFiltros = async () => {
    const { data: modData } = await supabase
      .from('logs')
      .select('nombreModulo')
      .neq('nombreModulo', '')
      .order('nombreModulo', { ascending: true });

    const { data: userData } = await supabase
      .from('logs')
      .select('descripcion');

    const modulosUnicos = Array.from(new Set(modData?.map((l) => l.nombreModulo)));
    const usuariosUnicos = Array.from(new Set(userData?.map((l) => {
      const correoMatch = l.descripcion?.match(/([\w.-]+@[\w.-]+\.\w+)/);
      return correoMatch?.[1] ?? 'Desconocido';
    })));

    setModulos(modulosUnicos);
    setUsuarios(usuariosUnicos);
  };

  const obtenerLogs = async () => {
    let query = supabase.from('logs').select('*').order('fecha', { ascending: false });

    if (filtro.modulo) query = query.eq('nombreModulo', filtro.modulo);
    if (filtro.usuario) query = query.ilike('descripcion', `%${filtro.usuario}%`);
    if (filtro.fecha) {
      query = query
        .gte('fecha', `${filtro.fecha}T00:00:00`)
        .lte('fecha', `${filtro.fecha}T23:59:59`);
    }

    const { data } = await query;
    setLogs((data ?? []) as Log[]);
  };

  useEffect(() => {
    obtenerFiltros();
    obtenerLogs();
  }, []);

  useEffect(() => {
    obtenerLogs();
  }, [filtro]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Historial de Logs</h2>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          className="border p-2 rounded"
          value={filtro.modulo}
          onChange={(e) => setFiltro({ ...filtro, modulo: e.target.value })}
        >
          <option value="">Todos los módulos</option>
          {modulos.map((modulo) => (
            <option key={modulo} value={modulo}>
              {modulo}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={filtro.usuario}
          onChange={(e) => setFiltro({ ...filtro, usuario: e.target.value })}
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map((usuario) => (
            <option key={usuario} value={usuario}>
              {usuario}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarDia(-1)}
            className="px-2 text-lg border rounded hover:bg-gray-100"
          >
            &lt;
          </button>
          <input
            type="date"
            className="border p-2 rounded"
            value={filtro.fecha}
            onChange={(e) => setFiltro({ ...filtro, fecha: e.target.value })}
          />
          <button
            onClick={() => cambiarDia(1)}
            className="px-2 text-lg border rounded hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
            <th className="p-2 border w-32">Fecha</th> {/* o w-64 si quiere más */}
              <th className="p-2 border">Acción</th>
              <th className="p-2 border">Descripción</th>
              <th className="p-2 border">Módulo</th>
            </tr>
          </thead>
            <tbody>
            {logs.map((log) => {
                const fecha = new Date(log.fecha);
                const hora = fecha.getHours();
                const dia = fecha.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

                const esHorarioLaboral = hora >= 8 && hora < 17 && dia >= 1 && dia <= 5;
                const colorFila = esHorarioLaboral ? 'bg-green-100' : 'bg-yellow-100';

                return (
                <tr key={log.id} className={colorFila}>
                    <td className="p-2 border">{formatearFecha(log.fecha)}</td>
                    <td className="p-2 border">{log.accion}</td>
                    <td className="p-2 border">{log.descripcion}</td>
                    <td className="p-2 border">{log.nombreModulo}</td>
                </tr>
                );
            })}
            </tbody>

        </table>

        {logs.length === 0 && (
          <p className="mt-4 text-gray-500">No hay registros para los filtros seleccionados.</p>
        )}
      </div>
    </div>
  );
}
