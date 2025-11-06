import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fechaInicio = searchParams.get('fecha_inicio');
    const fechaFin = searchParams.get('fecha_fin');

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ data: [] });
    }

    const rpcOptions: { user_id_filtro: string | null; fecha_inicio: string; fecha_fin: string } = {
      user_id_filtro: userId || null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    const { data, error } = await supabaseAdmin.rpc('obtener_comisiones', rpcOptions);

    if (error) {
      console.error('Error al obtener comisiones:', error);
      return NextResponse.json({ error: 'No se pudieron obtener las comisiones' }, { status: 500 });
    }
    
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
        }

        const { titulo, fecha_hora, encargadoId, userIds, comentarios, aprobado } = await request.json();

        const comentariosArray = Array.isArray(comentarios) ? comentarios : comentarios ? [comentarios] : [];

        const insertData: {
          titulo: string;
          fecha_hora: string;
          comentarios: string[];
          aprobado: boolean;
          creado_por: string;
          aprobado_por?: string | null;
        } = {
          titulo,
          fecha_hora,
          comentarios: comentariosArray,
          aprobado: aprobado || false,
          creado_por: user.id,
        };

        if (insertData.aprobado) {
          insertData.aprobado_por = user.id;
        }

        const { data: comisionData, error: comisionError } = await supabaseAdmin
            .from('comisiones')
            .insert(insertData)
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

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
        }

        const { id, titulo, fecha_hora, userIds, encargadoId, comentarios, aprobado } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'El ID de la comisión es obligatorio' }, { status: 400 });
        }

        const comentariosArray = Array.isArray(comentarios) ? comentarios : comentarios ? [comentarios] : [];

        const updateData: {
          titulo: string;
          fecha_hora: string;
          comentarios: string[];
          aprobado?: boolean;
          aprobado_por?: string | null;
        } = {
          titulo,
          fecha_hora,
          comentarios: comentariosArray,
        };

        if (aprobado !== undefined) {
            updateData.aprobado = aprobado;
            if (aprobado === true) {
              updateData.aprobado_por = user.id;
            } else {
              updateData.aprobado_por = null;
            }
        }

        const { data: comisionData, error: comisionError } = await supabaseAdmin
            .from('comisiones')
            .update(updateData)
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

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
        }

        const { id, aprobado } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'El ID de la comisión es obligatorio' }, { status: 400 });
        }

        const updateData: { aprobado?: boolean; aprobado_por?: string | null } = {};

        if (aprobado !== undefined) {
            updateData.aprobado = aprobado;
            if (aprobado === true) {
              updateData.aprobado_por = user.id;
            } else {
              updateData.aprobado_por = null;
            }
        }

        if (Object.keys(updateData).length === 0) {
             return NextResponse.json({ error: 'Se requiere al menos un campo para actualizar' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('comisiones')
            .update(updateData)
            .match({ id })
            .select()
            .single();

        if (error) {
            throw new Error(`Error al actualizar la comisión: ${error.message}`);
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error(`Error en PATCH /api/users/comision:`, error);
        return NextResponse.json({ error: error.message || 'No se pudo actualizar la comisión' }, { status: 500 });
    }
}


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

        const { error: deleteRegistrosError } = await supabaseAdmin
            .from('registros_comision')
            .delete()
            .match({ comision_id: id });

        if (deleteRegistrosError) {
            console.warn(`Error al eliminar registros de la comisión ${id}: ${deleteRegistrosError.message}`);
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