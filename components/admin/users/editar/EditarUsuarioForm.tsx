'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import CampoNombre from './CampoNombre';
import CampoEmail from './CampoEmail';
import DRolSelector from '@/components/ui/DRolSelector';
import PasswordEditor from './PasswordEditor';
import Swal from 'sweetalert2';
import { fetchUsuario } from '@/lib/usuarios/acciones';
import useSWR from 'swr';
import { createClient } from '@/utils/supabase/client';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditarUsuarioFormProps {
  id: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Rol {
  id: string;
  nombre: string;
}

export default function EditarUsuarioForm({ id, onSuccess, onCancel }: EditarUsuarioFormProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [original, setOriginal] = useState({
    nombre: '',
    email: '',
    rol: '',
    activo: true,
  });

  const { data: usuario, error, isLoading } = useSWR(
    id ? ['usuario', id] : null,
    () => fetchUsuario(id!)
  );

  useEffect(() => {
    const fetchRoles = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('roles').select('id, nombre');
      if (error) {
        console.error('Error al obtener roles:', error);
        return;
      }
      setRolesDisponibles(data);
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!usuario || rolesDisponibles.length === 0) return;
    
    const rolEncontrado = rolesDisponibles.find(r => r.nombre === usuario.rol);
    const rolId = rolEncontrado ? rolEncontrado.id : null;

    setNombre(usuario.nombre || '');
    setEmail(usuario.email || '');
    setRol(rolId);
    setActivo(usuario.activo);
    setOriginal({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      rol: rolId || '',
      activo: usuario.activo,
    });
  }, [usuario, rolesDisponibles]);

  const hayCambios =
    nombre !== original.nombre ||
    email !== original.email ||
    rol !== original.rol ||
    activo !== original.activo ||
    (mostrarPassword && (password || confirmar));

  const contraseñaValida =
    password &&
    password === confirmar &&
    /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);

  const guardarCambios = async () => {
    if (!id || (!hayCambios && !mostrarPassword)) {
      return Swal.fire('Sin cambios', 'No hiciste ninguna modificación.', 'info');
    }

    if (!rol) {
      return Swal.fire('Rol requerido', 'Debes seleccionar un rol.', 'warning');
    }

    if (mostrarPassword && (password || confirmar) && !contraseñaValida) {
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
      rol,
      activo,
    };

    if (mostrarPassword && password) {
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
      onSuccess();
    });
  };

  if (!id) return <p className="text-center text-red-600">ID no proporcionado.</p>;
  if (isLoading || rolesDisponibles.length === 0) return <p>Cargando datos de edición...</p>;
  if (error) {
    onCancel();
    return null;
  }
  if (!usuario) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800">Editar Información de usuario</h1>
      </div>
      <CampoNombre value={nombre} onChange={setNombre} />
      <CampoEmail value={email} onChange={setEmail} />
      <DRolSelector rol={rol} onChange={setRol} />

      <div className={`flex rounded-md border p-1 bg-gray-50 mt-2`}>
        <button
          type="button"
          onClick={() => setActivo(true)}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors duration-200 ${
            activo ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Activo
        </button>
        <button
          type="button"
          onClick={() => setActivo(false)}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors duration-200 ${
            !activo ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Inactivo
        </button>
      </div>

      <div className="w-full flex justify-end mt-4">
        <Button
          variant="link"
          onClick={() => setMostrarPassword(!mostrarPassword)}
          className="text-red-500 text-sm p-0 h-auto"
        >
          {mostrarPassword ? 'Ocultar cambio de contraseña' : 'Editar contraseña'}
          {mostrarPassword ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {mostrarPassword && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-2"
          >
            <PasswordEditor
              password={password}
              confirmar={confirmar}
              onPasswordChange={setPassword}
              onConfirmarChange={setConfirmar}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={guardarCambios}
        disabled={!hayCambios || cargando}
        className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4"
      >
        {cargando ? 'Guardando...' : 'Guardar cambios'}
      </Button>

    </div>
  );
}