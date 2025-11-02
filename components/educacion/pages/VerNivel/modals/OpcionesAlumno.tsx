import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, UserX } from 'lucide-react';
import type { Alumno } from '@/components/educacion/lib/esquemas';

interface TarjetaProps {
    alumno?: Alumno | null;
    onClose: () => void;
    onView?: () => void;
    onEdit?: (alumno: Alumno) => void;
    onDesinscribir?: () => void;
    permisos: string[];
}

export default function Tarjeta({ alumno, onClose, onView, onEdit, onDesinscribir, permisos }: TarjetaProps) {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        >
            <motion.div
                className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 shadow-xl"
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
            >
                <>
                    <h4 className="text-xl font-bold text-gray-800">{alumno?.nombre_completo}</h4>
                    <div className="grid grid-cols-1 gap-2">
                        <Button 
                            onClick={onView} 
                            className="bg-green-100 text-green-700 hover:bg-green-200 gap-2 text-base font-semibold"
                        >
                            <Eye className="h-5 w-5" /> Ver Tarjeta
                        </Button>
                        
                        {(permisos.includes('EDITAR') || permisos.includes('TODO')) && onEdit && (
                            <Button 
                                onClick={() => alumno && onEdit(alumno)} 
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 gap-2 text-base font-semibold"
                            >
                                <Pencil className="h-5 w-5" /> Editar Alumno
                            </Button>
                        )}
                        
                        {(permisos.includes('EDITAR') || permisos.includes('TODO')) && onDesinscribir && (
                            <Button 
                                onClick={onDesinscribir} 
                                className="bg-red-100 text-red-700 hover:bg-red-200 gap-2 text-base font-semibold"
                            >
                                <UserX className="h-5 w-5" /> Desasignar Alumno
                            </Button>
                        )}
                    </div>
                    <Button 
                        type="button" 
                        onClick={onClose} 
                        className="w-full mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200 text-base font-semibold"
                    >
                        Cerrar
                    </Button>
                </>
            </motion.div>
        </motion.div>
    );
}