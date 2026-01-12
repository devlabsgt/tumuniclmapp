import { obtenerDatosGestor } from './actions';
import TareaList from './TareaList'; 

export default async function GestorTareas() {
  const datos = await obtenerDatosGestor();

  // Diseño de error mejorado: Centrado y con estilo de alerta
  if (!datos) return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-800 shadow-sm text-center font-medium">
            Error de autenticación
        </div>
    </div>
  );

  const { tareas, usuarios, usuarioActual, esJefe } = datos;

  return (
    // Contenedor principal:
    // - px-3 en móvil (gana espacio lateral para las tarjetas)
    // - sm:px-6 en tablet/escritorio (más aire)
    // - max-w-7xl centrado
    <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        {/* Título: text-2xl en móvil para que no ocupe 2 líneas innecesariamente, 3xl en escritorio */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Mis Tareas
        </h1>
        
        {/* Subtítulo y Badge de rol */}
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {esJefe && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Admin
                </span>
            )}
            <p className="text-slate-500 dark:text-gray-400 text-sm">
                {esJefe ? 'Vista general del equipo' : 'Gestiona tus pendientes del día'}
            </p>
        </div>
      </div>

      <TareaList 
        tareas={tareas} 
        usuarios={usuarios} 
        usuarioActual={usuarioActual}
        esJefe={esJefe} 
      />
    </div>
  );
}