'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import CampoNombre from './CampoNombre';
import CampoEmail from './CampoEmail';
import DRolSelector from '@/components/ui/DRolSelector';
import PasswordEditor from './PasswordEditor';
import { Switch } from '@/components/ui/Switch';

export default function EditarUsuarioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [original, setOriginal] = useState({
    nombre: '',
    email: '',
    rol: '',
    activo: true,
  });

useEffect(() => {
  if (!id) return;

  const cargarUsuario = async () => {
    const res = await fetch('/api/users/ver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();
    if (!res.ok || !json.usuario) {
      Swal.fire('Error', json.error || 'No se pudo obtener el usuario.', 'error');
      return router.push('/protected/admin/users');
    }

    const user = json.usuario;
    setNombre(user.nombre || '');
    setEmail(user.email || '');
    setRol(user.rol_id || null); // ← AQUÍ
    setActivo(user.activo === true || user.activo === 'true');
    setOriginal({
      nombre: user.nombre || '',
      email: user.email || '',
      rol: user.rol_id || '', // ← TAMBIÉN AQUÍ si quiere detectar cambios correctamente
      activo: user.activo === true || user.activo === 'true',
    });
  };

  cargarUsuario();
}, [id, router]);

  const hayCambios =
    nombre !== original.nombre ||
    email !== original.email ||
    rol !== original.rol ||
    activo !== original.activo ||
    mostrarPassword;

  const contraseñaValida =
    password &&
    password === confirmar &&
    /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);

  const guardarCambios = async () => {
    if (!id || !hayCambios) {
      return Swal.fire('Sin cambios', 'No hiciste ninguna modificación.', 'info');
    }

    if (!rol) {
      return Swal.fire('Rol requerido', 'Debes seleccionar un rol.', 'warning');
    }

    if (mostrarPassword && !contraseñaValida) {
      return Swal.fire(
        'Contraseña inválida',
        'Debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo.',
        'error'
      );
    }

    setCargando(true);

    const payload: any = {
      id,
      email,
      nombre,
      roles: [rol],
      activo,
    };

    if (mostrarPassword) {
      payload.password = password;
    }

    const res = await fetch('/api/users/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setCargando(false);

    if (!res.ok) {
      return Swal.fire('Error', json.error || 'No se pudo actualizar el usuario.', 'error');
    }

    Swal.fire('Actualizado', 'El usuario fue actualizado con éxito.', 'success').then(() => {
      router.push(`/protected/admin/users/ver?id=${id}`);
    });
  };

  if (!id) return <p className="text-center text-red-600">ID no proporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
      <CampoNombre value={nombre} onChange={setNombre} />
      <CampoEmail value={email} onChange={setEmail} />
      <DRolSelector rol={rol} onChange={setRol} />

      <div className="flex items-center justify-between mt-2">
        <Label className="text-base">Activo</Label>
        <Switch checked={activo} onCheckedChange={setActivo} />
      </div>

      <Button
        variant="outline"
        onClick={() => setMostrarPassword(!mostrarPassword)}
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
        onClick={guardarCambios}
        disabled={!hayCambios || cargando}
        className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
      >
        {cargando ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  );
}
