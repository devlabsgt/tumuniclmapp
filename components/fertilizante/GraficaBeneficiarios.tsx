'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  beneficiarios: { lugar: string }[];
}

export function GraficaBeneficiarios({ beneficiarios }: Props) {
  const conteo = beneficiarios.reduce((acc: Record<string, number>, b) => {
    acc[b.lugar] = (acc[b.lugar] || 0) + 1;
    return acc;
  }, {});

  const lugares = Object.keys(conteo);
  const cantidades = Object.values(conteo);

  const data = {
    labels: lugares,
    datasets: [
      {
        label: 'Cantidad',
        data: cantidades,
        backgroundColor: lugares.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
        },
      },
    },
  };

  return (
    <div className="max-w-5xl mx-auto overflow-x-auto">
      <div className="w-full flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Pie data={data} options={options} />
        </div>
        <div className="max-h-[400px] overflow-y-auto w-64 border rounded p-2 text-sm bg-white shadow">
          {lugares.map((lugar, i) => (
            <div key={lugar} className="flex justify-between py-1 border-b">
              <span>{lugar}</span>
              <span className="font-semibold">{conteo[lugar]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
