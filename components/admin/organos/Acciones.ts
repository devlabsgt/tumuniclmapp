import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';

// --- Tipos de Datos ---
// Se añade "No" a Politica para que el tipo sea consistente
type Organo = { id: number; nombre: string; "No": number; };
type Politica = { id: number; nombre: string; "No": number; };

// --- Variables de Color ---
const COLOR_PRINCIPAL_CONFIRMAR = '#3B82F6';
const COLOR_CANCELAR = '#DC3545';

// --- FUNCIONES ---

export const crear = async (tipo: 'organo' | 'politica', onCreado: () => void) => {
    const nombreEntidad = tipo === 'organo' ? 'Órgano' : 'Política';
    const tablaBD = tipo === 'organo' ? 'organos' : 'politicas';

    const { value: formValues } = await Swal.fire({
        title: `Crear Nuevo ${nombreEntidad}`,
        html: `
            <div class="flex flex-col gap-4 text-left p-4">
                <div>
                    <label for="swal-input-nombre" class="block mb-1 text-sm font-medium text-gray-700">Nombre</label>
                    <input id="swal-input-nombre" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                </div>
                <div>
                    <label for="swal-input-no" class="block mb-1 text-sm font-medium text-gray-700">No.</label>
                    <input id="swal-input-no" type="number" step="1" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        preConfirm: async () => {
            const nombre = (document.getElementById('swal-input-nombre') as HTMLInputElement).value;
            const noValue = (document.getElementById('swal-input-no') as HTMLInputElement).value;
            
            if (!nombre || !noValue) {
                Swal.showValidationMessage('Ambos campos son obligatorios');
                return false;
            }
            
            const No = Number(noValue);
            if (!Number.isInteger(No)) {
                Swal.showValidationMessage('El campo "No." solo acepta números enteros.');
                return false;
            }

            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from(tablaBD)
                    .insert({ nombre, "No": No })
                    .select()
                    .single();

                if (error) {
                    const errorMessage = error.message.includes('unique constraint')
                        ? `Ya existe un ${nombreEntidad.toLowerCase()} con ese nombre o número.`
                        : `Error al crear: ${error.message}`;
                    Swal.showValidationMessage(errorMessage);
                    return false;
                }
                return data;
            } catch (error: any) {
                Swal.showValidationMessage(`Error inesperado: ${error.message}`);
                return false;
            }
        }
    });

    if (formValues) {
        Swal.fire('¡Creado!', `${nombreEntidad} "${formValues.nombre}" creado correctamente.`, 'success');
        onCreado();
    }
};

export const editar = async (tipo: 'organo' | 'politica', entidad: Organo | Politica, onActualizado: () => void) => {
    const nombreEntidad = tipo === 'organo' ? 'Órgano' : 'Política';
    const tablaBD = tipo === 'organo' ? 'organos' : 'politicas';

    const { value: formValues } = await Swal.fire({
        title: `Editar ${nombreEntidad}`,
        html: `
            <div class="flex flex-col gap-4 text-left p-4">
                <div>
                    <label for="swal-input-nombre" class="block mb-1 text-sm font-medium text-gray-700">Nombre</label>
                    <input id="swal-input-nombre" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" value="${entidad.nombre}">
                </div>
                <div>
                    <label for="swal-input-no" class="block mb-1 text-sm font-medium text-gray-700">No.</label>
                    <input id="swal-input-no" type="number" step="1" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" value="${entidad.No || ''}">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const nombre = (document.getElementById('swal-input-nombre') as HTMLInputElement).value;
            const no = (document.getElementById('swal-input-no') as HTMLInputElement).value;
            if (!nombre || !no) {
                Swal.showValidationMessage('Ambos campos son obligatorios');
                return false;
            }
            if (!Number.isInteger(Number(no))) {
                Swal.showValidationMessage('El campo "No." solo acepta números enteros.');
                return false;
            }
            return { nombre: nombre, No: Number(no) };
        }
    });

    if (formValues) {
        const isChanged = formValues.nombre !== entidad.nombre || formValues.No !== entidad.No;
        if (isChanged) {
            const supabase = createClient();
            const { error } = await supabase
                .from(tablaBD)
                .update({ nombre: formValues.nombre, "No": formValues.No })
                .eq('id', entidad.id);

            if (error) {
                Swal.fire('Error', 'Error al actualizar.', 'error');
            } else {
                Swal.fire('¡Actualizado!', `El ${nombreEntidad.toLowerCase()} se actualizó correctamente.`, 'success');
                onActualizado();
            }
        }
    }
};

export const crearYAsignarPolitica = async (organo: Organo, anioDeAsignacion: string, onComplete: () => void) => {
    const { value: formValues } = await Swal.fire({
        title: `Nueva Política para "${organo.nombre}"`,
        html: `
            <p class="text-sm text-gray-600 mb-4">Se creará y asignará para el año ${anioDeAsignacion}.</p>
            <div class="flex flex-col gap-4 text-left p-4">
                <div>
                    <label for="swal-input-nombre" class="block mb-1 text-sm font-medium text-gray-700">Nombre de la Política</label>
                    <input id="swal-input-nombre" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                </div>
                <div>
                    <label for="swal-input-no" class="block mb-1 text-sm font-medium text-gray-700">No.</label>
                    <input id="swal-input-no" type="number" step="1" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear y Asignar',
        cancelButtonText: 'Cancelar',
        preConfirm: async () => {
            const nombre = (document.getElementById('swal-input-nombre') as HTMLInputElement).value;
            const noValue = (document.getElementById('swal-input-no') as HTMLInputElement).value;
            if (!nombre || !noValue) {
                Swal.showValidationMessage('Ambos campos son obligatorios');
                return false;
            }
            const No = Number(noValue);
            if (!Number.isInteger(No)) {
                Swal.showValidationMessage('El campo "No." solo acepta números enteros.');
                return false;
            }

            const supabase = createClient();
            try {
                const { data: nuevaPolitica, error: errorPolitica } = await supabase
                    .from('politicas')
                    .insert({ nombre, "No": No })
                    .select()
                    .single();

                if (errorPolitica) throw new Error(`Ya existe una política con ese nombre o número.`);

                const { error: errorAsignacion } = await supabase
                    .from('organos_politicas')
                    .insert({
                        organo_id: organo.id,
                        politica_id: nuevaPolitica.id,
                        anio: Number(anioDeAsignacion)
                    });
                
                if (errorAsignacion) throw new Error(`Esta política ya está asignada a este órgano para este año.`);

                return nuevaPolitica;
            } catch (error: any) {
                Swal.showValidationMessage(error.message);
                return false;
            }
        }
    });

    if (formValues) {
        Swal.fire('¡Éxito!', `Política "${formValues.nombre}" creada y asignada.`, 'success');
        onComplete();
    }
};