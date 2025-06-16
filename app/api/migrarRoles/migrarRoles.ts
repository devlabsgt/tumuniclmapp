import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET() {
  const { data: usuarios, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actualizados: string[] = [];

  for (const usuario of usuarios.users) {
    const meta: Record<string, any> = usuario.user_metadata;

    const yaTieneRolesArray = Array.isArray(meta?.roles);
    const rolSimple = typeof meta?.rol === 'string' ? meta.rol : null;

    if (!yaTieneRolesArray && rolSimple) {
      const nuevoMetadata: Record<string, any> = {
        ...meta,
        roles: [rolSimple], // Agrega el campo roles como array
      };

      // **NO eliminamos 'rol', lo dejamos por compatibilidad**
      await supabaseAdmin.auth.admin.updateUserById(usuario.id, {
        user_metadata: nuevoMetadata,
      });

      actualizados.push(usuario.email || usuario.id);
    }
  }

  return NextResponse.json({
    mensaje: 'Migración completada sin eliminar `rol`',
    actualizados,
  });
}
