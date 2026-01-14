import { obtenerDatosGestor } from './actions';
import TareaList from './TareaList'; 

export default async function GestorTareas() {
  const datos = await obtenerDatosGestor();

  if (!datos) return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-800 shadow-sm text-center font-medium">
            Error de autenticación
        </div>
    </div>
  );

  const { tareas, usuarios, usuarioActual, esJefe } = datos;

  return (
    // Quitamos los márgenes verticales internos excesivos porque TareaList ya tiene los suyos
    <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
      <TareaList 
        tareas={tareas} 
        usuarios={usuarios} 
        usuarioActual={usuarioActual}
        esJefe={esJefe} 
      />
    </div>
  );
}