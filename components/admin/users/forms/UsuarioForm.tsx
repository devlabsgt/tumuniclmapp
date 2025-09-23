'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PasswordForm from './PasswordForm';
import Swal from 'sweetalert2';
import { fetchUsuario } from '@/lib/usuarios/acciones';
import useSWR from 'swr';
import { createClient } from '@/utils/supabase/client';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

interface Rol {
  id: string;
  nombre: string;
}

type TabState = 'personal' | 'password';

interface UserFormProps {
  id: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().email('El correo electrónico es inválido.').endsWith('@tumuniclm.com', 'Debe ser un correo de @tumuniclm.com'),
  rol: z.string().min(1, 'Debe seleccionar un rol.'),
  activo: z.boolean(),
  password: z.string().optional()
    .refine(
      (value) => !value || value.length >= 8,
      'La contraseña debe tener al menos 8 caracteres.'
    )
    .refine(
      (value) => !value || /[a-z]/.test(value),
      'Debe contener al menos una letra minúscula.'
    )
    .refine(
      (value) => !value || /[A-Z]/.test(value),
      'Debe contener al menos una letra mayúscula.'
    )
    .refine(
      (value) => !value || /\d/.test(value),
      'Debe contener al menos un número.'
    )
    .refine(
      (value) => !value || /[\W]/.test(value),
      'Debe contener al menos un carácter especial.'
    ),
  confirmar: z.string().optional(),
}).refine(data => {
  if (data.password || data.confirmar) {
    return data.password === data.confirmar;
  }
  return true;
}, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmar'],
});


export default function UserForm({ id, onSuccess, onCancel }: UserFormProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);

  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dpi, setDpi] = useState('');
  const [nit, setNit] = useState('');
  const [igss, setIgss] = useState('');
  const [cuentaNo, setCuentaNo] = useState('');

  const [cargando, setCargando] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [vistaActiva, setVistaActiva] = useState<TabState>('personal');

  const [original, setOriginal] = useState({
    nombre: '',
    email: '',
    rol: '',
    activo: true,
    direccion: '',
    telefono: '',
    dpi: '',
    nit: '',
    igss: '',
    cuentaNo: '',
  });

  const { data: usuario, error, isLoading } = useSWR(
    ['usuario', id],
    () => fetchUsuario(id!)
  );

  const [errors, setErrors] = useState<z.ZodIssue[]>([]);
  
  const hayCambios =
    nombre !== original.nombre ||
    email !== original.email ||
    rol !== original.rol ||
    activo !== original.activo ||
    direccion !== original.direccion ||
    telefono !== original.telefono ||
    dpi !== original.dpi ||
    nit !== original.nit ||
    igss !== original.igss ||
    cuentaNo !== original.cuentaNo ||
    (vistaActiva === 'password' && (password || confirmar));

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

    setDireccion(usuario.direccion || '');
    setTelefono(usuario.telefono || '');
    setDpi(usuario.dpi || '');
    setNit(usuario.nit || '');
    setIgss(usuario.igss || '');
    setCuentaNo(usuario.cuenta_no || '');

    setOriginal({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      rol: rolId || '',
      activo: usuario.activo,
      direccion: usuario.direccion || '',
      telefono: usuario.telefono || '',
      dpi: usuario.dpi || '',
      nit: usuario.nit || '',
      igss: usuario.igss || '',
      cuentaNo: usuario.cuenta_no || '',
    });
  }, [usuario, rolesDisponibles]);
  
  const validateForm = () => {
    const dataToValidate = {
        nombre,
        email,
        rol,
        activo,
        password: password || undefined,
        confirmar: confirmar || undefined,
    };
    const result = formSchema.safeParse(dataToValidate);
    if (!result.success) {
      setErrors(result.error.issues);
      return false;
    }
    setErrors([]);
    return true;
  };
  
  const guardarCambios = async () => {
    if (!id) {
      return Swal.fire('Error', 'ID de usuario no proporcionado para la edición.', 'error');
    }

    if (!hayCambios) {
      return Swal.fire('Sin cambios', 'No hiciste ninguna modificación.', 'info');
    }

    if (!validateForm()) {
        const firstError = errors[0];
        const errorMessage = firstError ? firstError.message : 'Error de validación desconocido.';
        return Swal.fire('Error de validación', errorMessage, 'error');
    }

    setCargando(true);
    
    const payload = {
      id,
      email,
      nombre,
      rol,
      activo,
      direccion,
      telefono,
      dpi,
      nit,
      igss,
      cuentaNo,
      password: password || undefined,
    };
    
    const apiRoute = '/api/users/editar';
    
    const res = await fetch(apiRoute, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setCargando(false);

    if (!res.ok) {
      return Swal.fire('Error', json.error || 'No se pudo guardar el usuario.', 'error');
    }

    Swal.fire('Guardado', 'El usuario fue guardado con éxito.', 'success').then(() => {
      onSuccess();
    });
  };

  if (!id) return <p className="text-center text-red-600">ID no proporcionado.</p>;
  if (isLoading || rolesDisponibles.length === 0) return <p>Cargando datos...</p>;
  if (error) {
    onCancel();
    return null;
  }
  if (!usuario) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full flex justify-end">
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="nombre" className="text-xs w-20">Nombre</Label>
        <div className="flex flex-col w-full">
          <Input 
            id="nombre" 
            name="nombre" 
            value={nombre} 
            onChange={(e) => {
              setNombre(e.target.value);
              validateForm();
            }} 
            className={`h-12 text-sm ${errors.find(err => err.path[0] === 'nombre') ? 'border-red-500' : ''}`}
          />
          {errors.find(err => err.path[0] === 'nombre') && <p className="text-red-500 text-xs mt-1">{errors.find(err => err.path[0] === 'nombre')?.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="email" className="text-xs w-20">Correo</Label>
        <div className="flex flex-col w-full">
          <Input 
            id="email" 
            name="email" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value);
              validateForm();
            }} 
            onBlur={() => {
              if (email && !email.includes('@')) setEmail(email.trim() + '@tumuniclm.com');
            }}
            className={`h-12 text-sm ${errors.find(err => err.path[0] === 'email') ? 'border-red-500' : ''}`}
          />
          {errors.find(err => err.path[0] === 'email') && <p className="text-red-500 text-xs mt-1">{errors.find(err => err.path[0] === 'email')?.message}</p>}
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-grow">
          <Label htmlFor="rol" className="text-xs w-20">Rol</Label>
          <div className="flex flex-col w-full">
            <select
              id="rol"
              name="rol"
              value={rol || ''}
              onChange={(e) => {
                setRol(e.target.value);
                validateForm();
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.find(err => err.path[0] === 'rol') ? 'border-red-500' : ''}`}
            >
              <option value="">Seleccione un rol</option>
              {rolesDisponibles.map((rolItem) => (
                <option key={rolItem.id} value={rolItem.id}>
                  {rolItem.nombre}
                </option>
              ))}
            </select>
            {errors.find(err => err.path[0] === 'rol') && <p className="text-red-500 text-xs mt-1">{errors.find(err => err.path[0] === 'rol')?.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end">
          <label htmlFor="toggle-activo" className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                id="toggle-activo"
                name="activo"
                className="sr-only peer"
                checked={activo}
                onChange={() => setActivo(!activo)}
              />
              <div className="block h-6 w-10 rounded-full bg-gray-200 peer-checked:bg-green-600 transition-colors duration-200"></div>
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all duration-200 peer-checked:translate-x-4"></div>
            </div>
            <div className="ml-3 text-gray-700 text-xs">
              {activo ? 'Activo' : 'Inactivo'}
            </div>
          </label>
        </div>
      </div>

      <div className="flex rounded-md border p-1 bg-gray-100 dark:bg-gray-800 h-12 mt-4">
        <button
          type="button"
          onClick={() => setVistaActiva('personal')}
          className={`flex-1 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${
            vistaActiva === 'personal' ? 'bg-blue-100 text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Información personal
        </button>
        <button
          type="button"
          onClick={() => setVistaActiva('password')}
          className={`flex-1 rounded-md text-sm md:text-base font-semibold transition-colors duration-200 ${
            vistaActiva === 'password' ? 'bg-blue-100 text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Contraseña
        </button>
      </div>

      {vistaActiva === 'personal' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="direccion" className="text-xs w-20">Dirección</Label>
                <Input id="direccion" name="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="telefono" className="text-xs w-20">Teléfono</Label>
                <Input id="telefono" name="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="dpi" className="text-xs w-20">DPI</Label>
                <Input id="dpi" name="dpi" value={dpi} onChange={(e) => setDpi(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="nit" className="text-xs w-20">NIT</Label>
                <Input id="nit" name="nit" value={nit} onChange={(e) => setNit(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="igss" className="text-xs w-20">IGSS</Label>
                <Input id="igss" name="igss" value={igss} onChange={(e) => setIgss(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="cuenta_no" className="text-xs w-20">No. de Cuenta</Label>
                <Input id="cuenta_no" name="cuenta_no" value={cuentaNo} onChange={(e) => setCuentaNo(e.target.value)} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {vistaActiva === 'password' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <PasswordForm
              password={password}
              confirmar={confirmar}
              onPasswordChange={(value) => {
                setPassword(value);
                validateForm();
              }}
              onConfirmarChange={(value) => {
                setConfirmar(value);
                validateForm();
              }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      <Button
        onClick={guardarCambios}
        disabled={!hayCambios || cargando}
        className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4"
      >
        Guardar cambios
      </Button>
    </div>
  );
}