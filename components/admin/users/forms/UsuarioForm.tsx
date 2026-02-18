'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PasswordForm from './PasswordForm';
import Swal from 'sweetalert2';
import { fetchUsuario } from '@/lib/usuarios/acciones';
import useSWR from 'swr';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

// Importamos el nuevo formulario
import InfoForm from './InfoForm';

interface Rol {
  id: string;
  nombre: string;
}

// Actualizamos los tipos de pestañas
type TabState = 'informacion' | 'personal';

interface UserFormProps {
  id: string;
  onSuccess: () => void;
  onCancel: () => void;
  rolUsuarioActual: string;
}

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().email('El correo electrónico es inválido.').endsWith('@tumuniclm.com', 'Debe ser un correo de @tumuniclm.com'),
  rol: z.string().min(1, 'Debe seleccionar un rol.'),
  activo: z.boolean(),
  password: z.string().optional()
    .refine((value) => !value || value.length >= 8, 'La contraseña debe tener al menos 8 caracteres.')
    .refine((value) => !value || /[a-z]/.test(value), 'Debe contener al menos una letra minúscula.')
    .refine((value) => !value || /[A-Z]/.test(value), 'Debe contener al menos una letra mayúscula.')
    .refine((value) => !value || /\d/.test(value), 'Debe contener al menos un número.')
    .refine((value) => !value || /[\W]/.test(value), 'Debe contener al menos un carácter especial.'),
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

export default function UserForm({ id, onSuccess, onCancel, rolUsuarioActual }: UserFormProps) {
  const [activeTab, setActiveTab] = useState<TabState>('informacion');
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [esJefe, setEsJefe] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [original, setOriginal] = useState({
    nombre: '',
    email: '',
    rol: '',
    activo: true,
    esJefe: false,
  });

  const { data: usuario, error, isLoading } = useSWR(
    ['usuario', id],
    () => fetchUsuario(id!)
  );

  const [errors, setErrors] = useState<z.ZodIssue[]>([]);
  
  const rolesFiltrados = useMemo(() => {
    if (rolUsuarioActual === 'SUPER') return rolesDisponibles;
    return rolesDisponibles.filter(rol => {
      const nombreRol = rol.nombre.trim().toUpperCase();
      return !nombreRol.includes('SUPER') && !nombreRol.includes('AFILIA');
    });
  }, [rolesDisponibles, rolUsuarioActual]);

  const hayCambios =
    nombre !== original.nombre ||
    email !== original.email ||
    rol !== original.rol ||
    activo !== original.activo ||
    esJefe !== original.esJefe ||
    (password || confirmar);

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
    setEsJefe(usuario.esjefe || false);

    setOriginal({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      rol: rolId || '',
      activo: usuario.activo,
      esJefe: usuario.esjefe || false,
    });
  }, [usuario, rolesDisponibles]);
  
  const validateForm = () => {
    const dataToValidate = { nombre, email, rol, activo, password: password || undefined, confirmar: confirmar || undefined };
    const result = formSchema.safeParse(dataToValidate);
    if (!result.success) {
      setErrors(result.error.issues);
      return false;
    }
    setErrors([]);
    return true;
  };
  
  const guardarCambios = async () => {
    if (!id) return Swal.fire('Error', 'ID de usuario no proporcionado.', 'error');
    if (!hayCambios) return Swal.fire('Sin cambios', 'No hiciste ninguna modificación.', 'info');

    if (!validateForm()) {
        const firstError = errors[0];
        return Swal.fire('Error de validación', firstError?.message || 'Error desconocido', 'error');
    }

    setCargando(true);
    const payload = { id, email, nombre, rol, activo, esJefe, password: password || undefined };
    const res = await fetch('/api/users/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setCargando(false);

    if (!res.ok) return Swal.fire('Error', json.error || 'No se pudo guardar.', 'error');

    Swal.fire('Guardado', 'El usuario fue guardado con éxito.', 'success').then(() => onSuccess());
  };

  if (!id) return <p className="text-center text-red-600">ID no proporcionado.</p>;
  if (isLoading || rolesDisponibles.length === 0) return <p className="text-center p-4">Cargando datos...</p>;
  if (error) { onCancel(); return null; }
  if (!usuario) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Sistema de Pestañas */}
      <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg w-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('informacion')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'informacion' 
            ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' 
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
          }`}
        >
          Usuario
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'personal' 
            ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' 
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700'
          }`}
        >
          Información Personal
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'informacion' ? (
          <motion.div
            key="account-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {/* Código Original - Pestaña Información */}
            <div className="flex items-center gap-2">
              <Label htmlFor="nombre" className="text-xs w-20">Nombre</Label>
              <div className="flex flex-col w-full">
                <Input 
                  id="nombre" 
                  value={nombre} 
                  onChange={(e) => { setNombre(e.target.value); validateForm(); }} 
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
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); validateForm(); }} 
                  onBlur={() => { if (email && !email.includes('@')) setEmail(email.trim() + '@tumuniclm.com'); }}
                  className={`h-12 text-sm ${errors.find(err => err.path[0] === 'email') ? 'border-red-500' : ''}`}
                />
                {errors.find(err => err.path[0] === 'email') && <p className="text-red-500 text-xs mt-1">{errors.find(err => err.path[0] === 'email')?.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="rol" className="text-xs w-20">Rol</Label>
              <div className="flex flex-col w-full">
                <select
                  id="rol"
                  value={rol || ''}
                  onChange={(e) => { setRol(e.target.value); validateForm(); }}
                  className={`w-full px-3 py-2 border dark:border-zinc-700 dark:bg-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.find(err => err.path[0] === 'rol') ? 'border-red-500' : ''}`}
                >
                  <option value="">Seleccione un rol</option>
                  {rolesFiltrados.map((rolItem) => (
                    <option key={rolItem.id} value={rolItem.id}>{rolItem.nombre}</option>
                  ))}
                </select>
                {errors.find(err => err.path[0] === 'rol') && <p className="text-red-500 text-xs mt-1">{errors.find(err => err.path[0] === 'rol')?.message}</p>}
              </div>
            </div>

            <div className="flex justify-center items-center gap-8 py-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={activo} onChange={() => setActivo(!activo)} />
                  <div className="block h-6 w-10 rounded-full bg-gray-200 peer-checked:bg-green-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-4"></div>
                </div>
                <div className="ml-3 text-gray-700 dark:text-zinc-300 text-xs">{activo ? 'Activo' : 'Inactivo'}</div>
              </label>

              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={esJefe} onChange={() => setEsJefe(!esJefe)} />
                  <div className="block h-6 w-10 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-4"></div>
                </div>
                <div className="ml-3 text-gray-700 dark:text-zinc-300 text-xs">{esJefe ? 'Es Jefe' : 'No es Jefe'}</div>
              </label>
            </div>

            <div className="border-t dark:border-zinc-800 my-2"></div>

            <PasswordForm
              password={password}
              confirmar={confirmar}
              onPasswordChange={(value) => { setPassword(value); validateForm(); }}
              onConfirmarChange={(value) => { setConfirmar(value); validateForm(); }}
            />

            <Button
              onClick={guardarCambios}
              disabled={!hayCambios || cargando}
              className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4"
            >
              Guardar cambios de cuenta
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="personal-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Nueva sección - Pestaña Información Personal */}
            <InfoForm userData={usuario} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}