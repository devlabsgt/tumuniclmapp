import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Typewriter } from 'react-simple-typewriter';
import { Input } from '@/components/ui/input';
import type { Alumno, Maestro } from '@/components/educacion/lib/esquemas';

interface ListaProps {
    alumnosDelNivel: Alumno[];
    maestroAsignado: Maestro | null;
    setAccionesAbiertas: (alumno: Alumno | null) => void;
}

const calculateAge = (dob: Date): number => {
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
};

export default function Lista({ alumnosDelNivel, maestroAsignado, setAccionesAbiertas }: ListaProps) {
    const [searchTerm, setSearchTerm] = useState('');
    
    const sortedAndFilteredAlumnos = useMemo(() => {
        const filtered = alumnosDelNivel.filter(alumno =>
            alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return [...filtered].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
    }, [alumnosDelNivel, searchTerm]);

    return (
        <div className="w-full overflow-x-auto">
            <div className="relative w-full mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                    placeholder="Buscar alumno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
            </div>

            <div className="text-start text-sm text-blue-500 dark:text-blue-400 mb-4 mt-4">
                <Typewriter
                    words={['Seleccione un alumno para ver mas información.']}
                    loop={1}
                    cursor
                    cursorStyle="_"
                    typeSpeed={40}
                />
            </div>

            <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100">
                    Listado de Alumnos ({sortedAndFilteredAlumnos.length})
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Maestro Encargado:</span>{' '}
                    {maestroAsignado ? maestroAsignado.nombre : 'No asignado'}
                </p>
            </div>

            <div className="rounded-lg border dark:border-neutral-700">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-neutral-800 dark:text-gray-200">
                        <tr className="border-b dark:border-neutral-700">
                            <th scope="col" className="px-4 py-1 border-r dark:border-neutral-700 text-center whitespace-nowrap">No.</th>
                            <th scope="col" className="px-4 py-1 border-r dark:border-neutral-700">Nombre</th>
                            <th scope="col" className="px-4 py-1 border-r dark:border-neutral-700">Edad</th>
                            <th scope="col" className="px-4 py-1 border-r dark:border-neutral-700">Teléfono</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredAlumnos.map((alumno, index) => {
                            const edad = alumno.fecha_nacimiento ? calculateAge(new Date(alumno.fecha_nacimiento)) : null;
                            const esMayorDeEdad = edad !== null && edad >= 18;
                            return (
                                <tr
                                    key={alumno.id}
                                    className="bg-white dark:bg-neutral-900 border-b dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                                    onClick={() => setAccionesAbiertas(alumno)}
                                >
                                    <td className="px-4 py-1 border-r dark:border-neutral-700 text-center whitespace-nowrap">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-1 border-r dark:border-neutral-700 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                        {alumno.nombre_completo}
                                    </td>
                                    <td className="px-4 py-1 border-r dark:border-neutral-700">
                                        {edad !== null ? (
                                            <span className={esMayorDeEdad ? 'text-green-600 dark:text-green-400 font-bold underline' : ''}>
                                                {`${edad} años`}
                                            </span>
                                        ) : 'N/A'}
                                    </td>
                                    <td className="px-4 py-1 border-r dark:border-neutral-700">
                                        {alumno.telefono_alumno || 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}