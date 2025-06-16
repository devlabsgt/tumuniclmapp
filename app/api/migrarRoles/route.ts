import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET() {
  const { data: usuarios, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actualizados: string[] = [];

  for (const usuario of usuarios.users) {
    const meta = usuario.user_metadata as Record<string, any>;

    if (!Array.isArray(meta.roles)) {
      const nuevoMetadata = {
        ...meta,
        roles: meta.roles || [meta.rol],
      };

      // Nota: NO se elimina `rol`
      await supabaseAdmin.auth.admin.updateUserById(usuario.id, {
        user_metadata: nuevoMetadata,
      });

      actualizados.push(usuario.email || usuario.id);
    }
  }

  return NextResponse.json({ mensaje: 'Migración completada sin eliminar `rol`', actualizados });
}
