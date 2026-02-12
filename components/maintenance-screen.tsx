"use client";

export default function MaintenanceScreen({ error }: { error?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-black p-4">
      <div className="max-w-xl w-full text-center space-y-6">
        {/* --- LOGO MUNICIPAL --- */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/logo-muni.png"
            alt="Municipalidad de Concepción Las Minas"
            className="w-54 h-auto object-contain drop-shadow-md"
          />
        </div>

        {/* --- TÍTULO AMIGABLE --- */}
        <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">
          Sistema no disponible{" "}
        </h1>

        {/* --- MENSAJE CERCANO --- */}
        <div className="space-y-4 px-4">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            <span className="font-bold">- SIGEM -</span> se encuentra
            temporalmente fuera de servicio.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Nuestro equipo de desarrollo está trabajando arduamente para
            restablecer el servicio lo antes posible. <br />
            <br />
            <span className="font-bold">
              Agradecemos tu comprensión y paciencia.
            </span>
          </p>
        </div>

        {/* --- BOTÓN DE ACCIÓN --- */}
        <div className="pt-8">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            Intentar acceder de nuevo
          </button>
        </div>

        {/* --- PIE DE PÁGINA --- */}
        <div className="mt-12 border-t border-gray-100 dark:border-neutral-800 pt-6">
          <p className="text-sm text-gray-400 font-medium">
            Municipalidad de Concepción Las Minas
          </p>
          <p className="text-[10px] text-gray-300 mt-1">
            Administración 2024 - 2028
          </p>
        </div>
      </div>
    </div>
  );
}
