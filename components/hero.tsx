'use client';
 {/* Línea divisoria decorativa
import VerificarBeneficiario from '@/components/fertilizante/beneficiario/verificar/verificarBeneficiario';
 */}

import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center pt-12 w-full">
      <p className="text-xl md:text-4xl !leading-tight mx-auto max-w-3xl text-center">

        Bienvenido a la Aplicación Web de la<br />
        <a
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          Municipalidad de Concepción Las Minas
        </a>
        <br/><br/><br/><br/>
        <h1>
          Inicie sesión para acceder al sistema
        </h1>
      </p>

      {/* Línea divisoria decorativa */}
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-4" />

      <div className="w-full max-w-xl flex flex-col items-center gap-6">

      {/* Input de búsqueda de beneficiario 
        <h1 className="text-4xl font-bold text-center">Verificar Entrega de Abono</h1>
        <VerificarBeneficiario />
        */}
        <Button
          variant="outline"
          onClick={() => window.location.href = 'https://www.tumuniclm.com'}
          className="mt-4 text-lg"
        >
          Salir
        </Button>
      </div>
    </div>
  );
}
