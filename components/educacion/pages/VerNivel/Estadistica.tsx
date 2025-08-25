import { useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';
import type { Alumno } from '@/components/educacion/lib/esquemas';

interface EstadisticaProps {
    alumnosDelNivel: Alumno[];
}

const COLORS = {
    'Hombres': '#3b82f6',
    'Mujeres': '#ec4899'
};

const legendFormatter = (value: string, entry: any) => {
    const { payload } = entry;
    return <span className="text-gray-700">{value} ({payload.value})</span>;
};

export default function Estadistica({ alumnosDelNivel }: EstadisticaProps) {
    const pieData = useMemo(() => {
        const hombres = alumnosDelNivel.filter(a => a.sexo === 'M').length;
        const mujeres = alumnosDelNivel.filter(a => a.sexo === 'F').length;
        return [
            { name: 'Hombres', value: hombres },
            { name: 'Mujeres', value: mujeres },
        ].filter(item => item.value > 0);
    }, [alumnosDelNivel]);

    return (
        <div className=" px-4 py-0 rounded-lg flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
                <PieChart width={350} height={200}>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                    <Legend 
                        iconType="circle" 
                        formatter={legendFormatter} 
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                    />
                    <Pie
                        data={pieData}
                        cx={100}
                        cy={100}
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14}>{`${(percent * 100).toFixed(0)}%`}</text>;
                        }}
                    >
                        {pieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />)}
                    </Pie>
                </PieChart>
            ) : (
                <div className="flex items-center justify-center h-64 text-sm text-gray-500">No hay datos de género.</div>
            )}
        </div>
    );
}