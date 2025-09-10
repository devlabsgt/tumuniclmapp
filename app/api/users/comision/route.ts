import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

// MANEJA LA OBTENCIÓN DE COMISIONES
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let rpcOptions = {};
    if (userId) {
      rpcOptions = { user_id_filtro: userId };
    }

    const { data, error } = await supabaseAdmin.rpc('obtener_comisiones', rpcOptions);

    if (error) {
      console.error('Error al obtener comisiones:', error);
      return NextResponse.json({ error: 'No se pudieron obtener las comisiones' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// MANEJA LA CREACIÓN DE UNA NUEVA COMISIÓN
export async function POST(request: Request) {
    try {
        const { titulo, fecha, hora, encargadoId, userIds, comentarios } = await request.json();

        const { data: comisionData, error: comisionError } = await supabaseAdmin
            .from('comisiones')
            .insert({ titulo, fecha, hora, comentarios })
            .select()
            .single();

        if (comisionError) {
            throw new Error(`Error al crear la comisión: ${comisionError.message}`);
        }

        if (!comisionData) {
            throw new Error('No se pudo obtener el ID de la comisión creada.');
        }

        const comisionId = comisionData.id;

        const asistentes = [
            {
                comision_id: comisionId,
                asistente_id: encargadoId,
                encargado: true,
            },
            ...userIds.map((userId: string) => ({
                comision_id: comisionId,
                asistente_id: userId,
                encargado: false,
            })),
        ];

        const { error: asistentesError } = await supabaseAdmin
            .from('comision_asistentes')
            .insert(asistentes);

        if (asistentesError) {
            await supabaseAdmin.from('comisiones').delete().match({ id: comisionId });
            throw new Error(`Error al asignar asistentes: ${asistentesError.message}`);
        }

        return NextResponse.json(comisionData, { status: 201 });
    } catch (error: any) {
        console.error('Error en POST /api/users/comision:', error);
        return NextResponse.json({ error: error.message || 'No se pudo crear la comisión' }, { status: 500 });
    }
}

// MANEJA LA ACTUALIZACIÓN DE UNA COMISIÓN
export async function PUT(request: Request) {
    try {
        const { id, titulo, fecha, hora, userIds, encargadoId, comentarios } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'El ID de la comisión es obligatorio' }, { status: 400 });
        }

        const { data: comisionData, error: comisionError } = await supabaseAdmin
            .from('comisiones')
            .update({ titulo, fecha, hora, comentarios })
            .match({ id })
            .select()
            .single();

        if (comisionError) {
            throw new Error(`Error al actualizar la comisión: ${comisionError.message}`);
        }

        const { error: deleteError } = await supabaseAdmin
            .from('comision_asistentes')
            .delete()
            .match({ comision_id: id });

        if (deleteError) {
            throw new Error(`Error al eliminar asistentes antiguos: ${deleteError.message}`);
        }
        
        const asistentesParaInsertar = [
            {
                comision_id: id,
                asistente_id: encargadoId,
                encargado: true,
            },
            ...userIds.map((userId: string) => ({
                comision_id: id,
                asistente_id: userId,
                encargado: false,
            })),
        ];

        const { error: insertError } = await supabaseAdmin
            .from('comision_asistentes')
            .insert(asistentesParaInsertar);

        if (insertError) {
            throw new Error(`Error al insertar nuevos asistentes: ${insertError.message}`);
        }

        return NextResponse.json(comisionData, { status: 200 });
    } catch (error: any) {
        console.error(`Error en PUT /api/users/comision:`, error);
        return NextResponse.json({ error: error.message || 'No se pudo actualizar la comisión' }, { status: 500 });
    }
}

// MANEJA LA ELIMINACIÓN DE UNA COMISIÓN
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'El ID de la comisión es obligatorio' }, { status: 400 });
        }

        const { error: deleteAsistentesError } = await supabaseAdmin
            .from('comision_asistentes')
            .delete()
            .match({ comision_id: id });

        if (deleteAsistentesError) {
            throw new Error(`Error al eliminar asistentes de la comisión: ${deleteAsistentesError.message}`);
        }

        const { error: deleteComisionError } = await supabaseAdmin
            .from('comisiones')
            .delete()
            .match({ id });

        if (deleteComisionError) {
            throw new Error(`Error al eliminar la comisión: ${deleteComisionError.message}`);
        }

        return NextResponse.json({ message: 'Comisión eliminada con éxito' }, { status: 200 });
    } catch (error: any) {
        console.error(`Error en DELETE /api/users/comision:`, error);
        return NextResponse.json({ error: error.message || 'No se pudo eliminar la comisión' }, { status: 500 });
    }
}

