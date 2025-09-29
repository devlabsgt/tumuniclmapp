import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: NextRequest) {
  const { id_categoria, descripcion, correlativo, monto } = await req.json();
  const user_id = req.headers.get('x-user-id') as string;

  if (!user_id || !id_categoria || !descripcion || !correlativo || !monto) {
    return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 });
  }

  try {
    const { data: bienData, error: bienError } = await supabase
      .from('bienes')
      .insert({ id_categoria, descripcion, correlativo, user_id })
      .select();

    if (bienError) throw bienError;
    
    const nuevoBienId = bienData[0].id;

    const { error: movimientoError } = await supabase
      .from('movimientos_inventario')
      .insert({ id_bien: nuevoBienId, tipo: 'Alta', id_usuario_destino: user_id, id_usuario_registro: user_id });

    if (movimientoError) throw movimientoError;

    const { error: transaccionError } = await supabase
      .from('transacciones')
      .insert({ id_bien: nuevoBienId, id_usuario_registro: user_id, monto, tipo: 'Alta' });

    if (transaccionError) throw transaccionError;

    return NextResponse.json({ message: 'Bien dado de alta exitosamente' }, { status: 200 });

  } catch (err) {
    console.error('Error en el proceso de alta de bien:', err);
    return NextResponse.json({ message: 'Error al dar de alta el bien' }, { status: 500 });
  }
}