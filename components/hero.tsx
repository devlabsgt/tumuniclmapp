'use client';

import VerificarBeneficiario from '@/components/fertilizante/beneficiario/verificar/verificarBeneficiario';

export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center pt-12 px-4 w-full">
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-3xl text-center">
        Bienvenido a la Aplicación Web de la<br />
        <a
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Municipalidad de Concepción Las Minas
        </a>
      </p>

      {/* Línea divisoria decorativa */}
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-4" />

      {/* Input de búsqueda de beneficiario */}
      <div className="w-full max-w-xl">
                <h1 className="text-4xl font-bold text-center">Verificar Entrega de Abono</h1>

        <VerificarBeneficiario />
      </div>
    </div>
  );
}
