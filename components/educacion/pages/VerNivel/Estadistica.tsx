import { useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { Alumno } from '@/components/educacion/lib/esquemas';

interface EstadisticaProps {
    alumnosDelNivel: Alumno[];
}

const COLORS = {
    'Hombres': '#3b82f6', // blue-500
    'Mujeres': '#ec4899'  // pink-500
};

const legendFormatter = (value: string, entry: any) => {
    const { payload } = entry;
    return <span className="text-gray-700 dark:text-gray-300 font-medium ml-1">{value} ({payload.value})</span>;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 p-3 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                    {`${payload[0].name}: ${payload[0].value}`}
                </p>
            </div>
        );
    }
    return null;
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
        <div className="px-4 py-0 rounded-lg flex flex-col items-center justify-center w-full">
            {pieData.length > 0 ? (
                <PieChart width={350} height={200}>
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Legend 
                        iconType="circle" 
                        formatter={legendFormatter} 
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ paddingLeft: "10px" }}
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
                        stroke="none" 
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            
                            return (
                                <text 
                                    x={x} 
                                    y={y} 
                                    fill="white" 
                                    textAnchor="middle" 
                                    dominantBaseline="central" 
                                    fontSize={14} 
                                    fontWeight="bold"
                                >
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}
                    >
                        {pieData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                    </Pie>
                </PieChart>
            ) : (
                <div className="flex items-center justify-center h-64 text-sm text-gray-500 dark:text-gray-400">
                    No hay datos de género.
                </div>
            )}
        </div>
    );
}