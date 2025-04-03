'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import CampoNombre from './CampoNombre';
import CampoEmail from './CampoEmail';
import RolSelector from '@/components/ui/RolSelector';

export default function EditarUsuarioForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');
  const [cargando, setCargando] = useState(false);

  const [original, setOriginal] = useState({ nombre: '', email: '', rol: '' });
useEffect(() => {
  if (!id) return;

  const supabase = createClient();

  const cargarUsuario = async () => {
    const { data: usuarios, error } = await supabase.rpc('obtener_usuarios');

    if (error || !usuarios) {
      router.push('/protected/admin/users');
      return;
    }

    const user = usuarios.find((u: any) => u.id === id);
    if (!user) {
      router.push('/protected/admin/users');
      return;
    }

    setNombre(user.nombre || '');
    setEmail(user.email || '');
    setRol(user.rol || '');
    setOriginal({ nombre: user.nombre, email: user.email, rol: user.rol });
  };

  cargarUsuario();
}, [id]);


  const hayCambios =
    nombre !== original.nombre || email !== original.email || rol !== original.rol;

const actualizarUsuario = async () => {
  if (!id || !hayCambios) {
    Swal.fire({
      icon: 'info',
      title: 'Sin cambios',
      text: 'No hiciste ninguna modificación.',
    });
    return;
  }

  setCargando(true);

  // Si el email fue modificado, verificar si ya está en uso
  const emailModificado = email !== original.email;

  if (emailModificado) {
    const supabase = createClient();
    const { data: yaExiste, error } = await supabase.rpc('correo_ya_registrado', {
      email_input: email,
    });

    if (error) {
      setCargando(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo verificar si el correo ya existe.',
      });
      return;
    }

    if (yaExiste) {
      setCargando(false);
      Swal.fire({
        icon: 'warning',
        title: 'Correo ya registrado',
        text: 'Ese correo ya está en uso. Usa uno diferente.',
      });
      return;
    }
  }

  // Proceder a actualizar
  const res = await fetch('/api/users/editar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, email, nombre, rol }),
  });

  const json = await res.json();
  setCargando(false);

  if (!res.ok) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: json.error || 'No se pudo actualizar el usuario.',
    });
    return;
  }

  // Mostrar info si el correo fue modificado
  if (emailModificado) {
    Swal.fire({
      icon: 'info',
      title: 'Correo modificado',
      text: 'Se envió un enlace de confirmación al nuevo correo. El cambio no surtirá efecto hasta que se confirme.',
    }).then(() => router.push(`/protected/admin/users/ver?id=${id}`));
    return;
  }

  // Caso normal (sin cambio de correo)
  Swal.fire({
    icon: 'success',
    title: 'Usuario actualizado',
  }).then(() => router.push(`/protected/admin/users/ver?id=${id}`));
};


  if (!id) return <p className="p-4 text-center">ID no proporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
      <CampoNombre value={nombre} onChange={setNombre} />
      <CampoEmail value={email} onChange={setEmail} />
      <RolSelector rol={rol} onChange={setRol} />
      <Button
        onClick={actualizarUsuario}
        disabled={!hayCambios || cargando}
        className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
      >
        {cargando ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  );
}
