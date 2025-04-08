'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { createClient } from '@/utils/supabase/client';
import CampoNombre from './CampoNombre';
import CampoEmail from './CampoEmail';
import RolSelector from '@/components/ui/RolSelector';
import PasswordEditor from './PasswordEditor';
import { Switch } from '@/components/ui/Switch';

export default function EditarUsuarioForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState(true); // true por defecto
  const [cargando, setCargando] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

const [original, setOriginal] = useState({ nombre: '', email: '', rol: '', activo: true });

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
      setOriginal({
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo === 'true' || user.activo === true,
      });
      setActivo(user.activo === 'true' || user.activo === true);
    };

    cargarUsuario();
  }, [id]);

const contraseñaValida =
  password &&
  password === confirmar &&
  /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);

const hayCambios =
  nombre !== original.nombre ||
  email !== original.email ||
  rol !== original.rol ||
  activo !== original.activo ||
  (mostrarPassword && contraseñaValida);

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

    const emailModificado = email !== original.email;

    if (emailModificado) {
      const supabase = createClient();
      const { data: yaExiste, error } = await supabase.rpc('correo_ya_registrado', {
        email_input: email,
      });

      if (error || yaExiste) {
        setCargando(false);
        Swal.fire({
          icon: 'warning',
          title: 'Correo ya registrado',
          text: 'Ese correo ya está en uso.',
        });
        return;
      }
    }

const actualizarData: any = { id, email, nombre, rol, activo };

    if (mostrarPassword) {
      const contraseñaValida =
        password &&
        password === confirmar &&
        /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);

      if (!contraseñaValida) {
        setCargando(false);
        Swal.fire({
          icon: 'error',
          title: 'Contraseña inválida',
          text: 'La contraseña no cumple los requisitos o no coincide.',
        });
        return;
      }

      actualizarData.password = password;
    }

    const res = await fetch('/api/users/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actualizarData),
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

    if (emailModificado) {
      Swal.fire({
        icon: 'info',
        title: 'Correo modificado',
        text: 'Se envió un enlace de confirmación al nuevo correo.',
      }).then(() => router.push(`/protected/admin/users/ver?id=${id}`));
      return;
    }

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
      <div className="flex items-center justify-between mt-2">
      <Label className="text-base">Activo</Label>
      <Switch checked={activo} onCheckedChange={setActivo} />
    </div>


      <Button
        variant="outline"
        type="button"
        onClick={() => setMostrarPassword((prev) => !prev)}
        className="mt-4 border-red-500 text-red-600 hover:bg-red-50"
      >
        {mostrarPassword ? 'Cancelar cambio de contraseña' : 'Editar contraseña'}
      </Button>



      {mostrarPassword && (
        <PasswordEditor
          password={password}
          confirmar={confirmar}
          onPasswordChange={setPassword}
          onConfirmarChange={setConfirmar}
        />
      )}

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
