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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        >
            <motion.div
                className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-xl border dark:border-neutral-700"
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
            >
                <>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">{alumno?.nombre_completo}</h4>
                    
                    <div className="grid grid-cols-1 gap-2">
                        <Button 
                            onClick={onView} 
                            className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 gap-2 text-base font-semibold border-none"
                        >
                            <Eye className="h-5 w-5" /> Ver Tarjeta
                        </Button>
                        
                        {(permisos.includes('EDITAR') || permisos.includes('TODO')) && onEdit && (
                            <Button 
                                onClick={() => alumno && onEdit(alumno)} 
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 gap-2 text-base font-semibold border-none"
                            >
                                <Pencil className="h-5 w-5" /> Editar Alumno
                            </Button>
                        )}
                        
                        {(permisos.includes('EDITAR') || permisos.includes('TODO')) && onDesinscribir && (
                            <Button 
                                onClick={onDesinscribir} 
                                className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 gap-2 text-base font-semibold border-none"
                            >
                                <UserX className="h-5 w-5" /> Desasignar Alumno
                            </Button>
                        )}
                    </div>
                    
                    <Button 
                        type="button" 
                        onClick={onClose} 
                        className="w-full mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 text-base font-semibold"
                    >
                        Cerrar
                    </Button>
                </>
            </motion.div>
        </motion.div>
    );
}