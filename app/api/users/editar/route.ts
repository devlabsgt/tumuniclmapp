import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { id, email, nombre, rol, password, activo } = await req.json(); // ✅ incluye activo

    if (!id || !email || !nombre || !rol) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const updateData: any = {
      email,
      user_metadata: { nombre, rol, activo }, // ✅ agrega activo al metadata
    };

    if (password) {
      updateData.password = password;
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);

    if (error) {
      console.error('Error Supabase:', error);
      return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Usuario actualizado con éxito', data });
  } catch (e) {
    console.error('Error interno:', e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
