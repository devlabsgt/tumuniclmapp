import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import type { Alumno, Programa } from './esquemas';

export const eliminarPrograma = async (programa: Programa, onEliminado: () => void) => {
    const confirmacion = await Swal.fire({
        title: '¿Está seguro?',
        text: `Se eliminará el programa "${programa.nombre}" y todos sus niveles y alumnos asociados. ¡Esta acción no se puede revertir!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, ¡eliminar!',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        const supabase = createClient();
        const { error } = await supabase.from('programas_educativos').delete().eq('id', programa.id);
        if (error) {
            toast.error('No se pudo eliminar el programa.');
        } else {
            toast.error(`El programa "${programa.nombre}" ha sido eliminado.`);
            onEliminado();
        }
    }
};

export const desinscribirAlumno = async (alumnoId: string, programaId: number, alumnoNombre: string, onComplete: () => void) => {
    const confirmacion = await Swal.fire({
        title: '¿Está seguro?',
        text: `Se desasignará a "${alumnoNombre}" de este nivel. El registro del alumno no se eliminará.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6c757d',  // Botón de confirmar en gris
        cancelButtonColor: '#007bff',   // Botón de cancelar en azul
        confirmButtonText: 'Sí, ¡desasignar!',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        const supabase = createClient();
        const { error } = await supabase
            .from('alumnos_inscripciones')
            .delete()
            .match({ alumno_id: alumnoId, programa_id: programaId });

        if (error) {
            toast.error('No se pudo quitar la inscripción.');
        } else {
            toast.error(`"${alumnoNombre}" ha sido desasignado de este nivel.`);
            onComplete();
        }
    }
};
