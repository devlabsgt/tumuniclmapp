import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import type { Alumno, Programa, Maestro } from './esquemas';

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

// Función para editar un maestro (Actualizada)
export const editarMaestro = async (maestro: Maestro) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('maestros_municipales')
        .update({
            nombre: maestro.nombre,
            ctd_alumnos: maestro.ctd_alumnos,
            telefono: maestro.telefono,
        })
        .eq('id', maestro.id)
        .select()
        .single();

    if (error) {
        console.error('Error al actualizar el maestro:', error.message);
        toast.error('Error al actualizar el maestro.');
        return null;
    }

    toast.success('Maestro actualizado con éxito.');
    return data;
};