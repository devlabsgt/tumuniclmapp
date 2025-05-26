'use client';

import { useState } from 'react';
import { Progress } from '@/components/ui/Progress';
import MTopLugares from './MTopLugares';
import MEdadRangos from './MEdadRangos';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
  telefono?: string;
  sexo?: string;
  fecha_nacimiento?: string;
}

interface Props {
  data: Beneficiario[];
}

const calcularEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

export default function EstadisticasBeneficiarios({ data }: Props) {
  const totalMeta = 7000;
  const total = data.length;
  const hombres = data.filter((b) => b.sexo === 'M').length;
  const mujeres = data.filter((b) => b.sexo === 'F').length;
  const porcentaje = Math.min((total / totalMeta) * 100, 100);

  const edades = data.filter((b) => b.fecha_nacimiento).map((b) => calcularEdad(b.fecha_nacimiento!));

  const jovenes = edades.filter((e) => e >= 18 && e <= 25).length;
  const adultoMenor = edades.filter((e) => e >= 26 && e <= 35).length;
  const adulto = edades.filter((e) => e >= 36 && e <= 59).length;
  const adultoMayor = edades.filter((e) => e >= 60).length;

  const conteoPorEdad = [
    { rango: 'Jóvenes (18-25)', total: jovenes },
    { rango: 'Adulto menor (26-35)', total: adultoMenor },
    { rango: 'Adulto (36-59)', total: adulto },
    { rango: 'Adulto mayor (60+)', total: adultoMayor },
  ];

  const detallePorLugar: Record<string, any> = {};
  data.forEach((b) => {
    if (!b.fecha_nacimiento) return;
    const edad = calcularEdad(b.fecha_nacimiento);
    const lugar = b.lugar;
    const sexo = b.sexo;
    if (!detallePorLugar[lugar]) {
      detallePorLugar[lugar] = {
        jovenes: { total: 0, hombres: 0, mujeres: 0 },
        adultoMenor: { total: 0, hombres: 0, mujeres: 0 },
        adulto: { total: 0, hombres: 0, mujeres: 0 },
        adultoMayor: { total: 0, hombres: 0, mujeres: 0 },
      };
    }
    const grupo =
      edad >= 18 && edad <= 25
        ? 'jovenes'
        : edad >= 26 && edad <= 35
        ? 'adultoMenor'
        : edad >= 36 && edad <= 59
        ? 'adulto'
        : 'adultoMayor';
    detallePorLugar[lugar][grupo].total++;
    if (sexo === 'M') detallePorLugar[lugar][grupo].hombres++;
    else if (sexo === 'F') detallePorLugar[lugar][grupo].mujeres++;
  });

  const conteoPorLugar = data.reduce((acc: Record<string, number>, curr) => {
    acc[curr.lugar] = (acc[curr.lugar] || 0) + 1;
    return acc;
  }, {});

  const top3 = Object.entries(conteoPorLugar)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const [mostrarTopLugares, setMostrarTopLugares] = useState(false);
  const [mostrarEdadModal, setMostrarEdadModal] = useState(false);

  return (
    <div className="mb-4">
      <div className="text-lg font-bold text-green-700">
        <span className="text-green-800">Entregados: {total}</span> / {totalMeta} ({porcentaje.toFixed(2)}%)
      </div>

      <div className="mt-2">
        <Progress value={porcentaje} className="h-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div
          className="cursor-pointer px-3 py-4 border rounded shadow hover:bg-gray-100"
          onClick={() => setMostrarEdadModal(true)}
        >
          <div className="text-blue-600 font-bold text-lg">👥 Género y Edades</div>
          <div className="text-sm text-gray-700 mt-1">Hombres: {hombres} | Mujeres: {mujeres}</div>
          <div className="text-sm text-gray-700 mt-1">Jóvenes (18-25): {jovenes}</div>
          <div className="text-sm text-gray-700">Adulto menor (26-35): {adultoMenor}</div>
          <div className="text-sm text-gray-700">Adulto (36-59): {adulto}</div>
          <div className="text-sm text-gray-700">Adulto mayor (60+): {adultoMayor}</div>
          <div className="text-xs text-gray-500 mt-1">Haz clic para ver gráfico detallado</div>
        </div>

        <div
          className="cursor-pointer px-3 py-4 border rounded shadow hover:bg-gray-100"
          onClick={() => setMostrarTopLugares(true)}
        >
          <div className="text-blue-600 font-bold text-lg">🏆 Top 3 lugares</div>
          {top3.map(([lugar, cantidad]) => (
            <div key={lugar} className="text-sm text-gray-700">
              {lugar}: {cantidad}
            </div>
          ))}
          <div className="text-xs text-gray-500 mt-1">Haz clic para ver gráfico detallado</div>
        </div>
      </div>

      {mostrarTopLugares && (
        <MTopLugares conteoPorLugar={conteoPorLugar} onClose={() => setMostrarTopLugares(false)} />
      )}

      {mostrarEdadModal && (
        <MEdadRangos conteoPorEdad={conteoPorEdad} detallePorLugar={detallePorLugar} onClose={() => setMostrarEdadModal(false)} />
      )}
    </div>
  );
}
