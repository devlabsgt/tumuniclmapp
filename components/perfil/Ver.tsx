'use client';

import { User, Briefcase, Lock, CheckSquare } from 'lucide-react';

// Definición del tipo para las props de userData
type UserData = {
  nombre: string | null;
  email: string | null;
  rol: string | null;
  programas: string[] | null;
  cargando: boolean; // Aunque no se usa directamente aquí, es parte del tipo original del hook
};

export default function VerMiPerfil({ userData }: { userData: UserData }) {
  const { nombre, email, rol, programas } = userData; // Eliminamos 'cargando' de la desestructuración ya que no se usa aquí

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl mx-auto overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6">
        {/* Tarjeta de Nombre */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl flex items-center gap-2 md:gap-4">
          <User className="h-8 w-8 md:h-10 md:w-10 text-blue-600"/>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Nombre</p>
            <h3 className="text-sm md:text-xl font-semibold text-gray-800 dark:text-gray-100">{nombre || 'No asignado'}</h3>
          </div>
        </div>

        {/* Tarjeta de Email */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 md:p-6 rounded-xl flex items-center gap-2 md:gap-4">
          <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-indigo-600"/>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Email</p>
            <h3 className="text-sm md:text-xl font-semibold text-gray-800 dark:text-gray-100">{email || 'No disponible'}</h3>
          </div>
        </div>

        {/* Tarjeta de Rol */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl flex flex-col justify-between items-start gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Lock className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
            <div>
              <p className="text-xs md:text-sm text-gray-500">Rol</p>
              <h3 className="text-sm md:text-xl font-semibold text-gray-800 dark:text-gray-100 capitalize">{rol || 'No asignado'}</h3>
            </div>
          </div>
        </div>

        {/* Tarjeta de Programas */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl flex flex-col justify-between items-start gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <CheckSquare className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
            <div>
              <p className="text-xs md:text-sm text-gray-500">Programas</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {programas && programas.length > 0 ? (
                  programas.map(p => <span key={p} className="px-3 py-1 bg-green-200 text-green-800 text-sm font-semibold rounded-md border border-green-300 dark:bg-green-700 dark:text-green-100">{p}</span>)
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Ninguno</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}