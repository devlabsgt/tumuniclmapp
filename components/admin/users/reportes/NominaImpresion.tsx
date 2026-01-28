import React, { forwardRef, useMemo } from "react";

const FILAS_PAGINA_1 = 26;
const FILAS_PAGINA_X = 28;
const ALTO_FILA = "h-6";

interface Props {
  datos: any[];
  anio: string;
  nombreMes: string;
  numeroInforme: string;
  fechaHoyTexto: string;
  itemsPorPagina: number;
  firmas: { coordinator: string; dafim: string };
  formatQ: (val: number) => string;
  totales: {
    salarios: number;
    bonis: number;
    devengado: number;
    liquido: number;
    descuentos: number;
  };
}

export const NominaImpresion = forwardRef<HTMLDivElement, Props>(
  (
    {
      datos,
      anio,
      nombreMes,
      numeroInforme,
      fechaHoyTexto,
      firmas,
      formatQ,
      totales,
    },
    ref,
  ) => {
    const paginasProcesadas = useMemo(() => {
      const paginas: any[][] = [];
      let paginaActual: any[] = [];
      let espaciosUsados = 0;

      datos.forEach((fila, index) => {
        const prevFila = index > 0 ? datos[index - 1] : null;
        const esPrimeroDePagina = paginaActual.length === 0;

        const cambiaDependencia =
          !prevFila || prevFila.dependencia_nombre !== fila.dependencia_nombre;

        let costoFila = 1;
        if (esPrimeroDePagina || cambiaDependencia) {
          costoFila += 1;
        }

        const limiteActual =
          paginas.length === 0 ? FILAS_PAGINA_1 : FILAS_PAGINA_X;

        if (espaciosUsados + costoFila > limiteActual) {
          paginas.push(paginaActual);
          paginaActual = [];
          espaciosUsados = 0;
          costoFila = 2;
        }

        paginaActual.push(fila);
        espaciosUsados += costoFila;
      });

      if (paginaActual.length > 0) paginas.push(paginaActual);

      return paginas;
    }, [datos]);

    return (
      <div ref={ref} className="flex flex-col gap-8">
        {paginasProcesadas.map((datosPagina, indexPagina) => {
          const esUltimaPagina = indexPagina === paginasProcesadas.length - 1;
          const esPrimeraPagina = indexPagina === 0;

          const indiceInicial = paginasProcesadas
            .slice(0, indexPagina)
            .reduce((acc, curr) => acc + curr.length, 0);

          return (
            <div
              key={indexPagina}
              className="bg-white shadow-lg relative text-black flex flex-col justify-between"
              style={{ width: "1248px", height: "816px", padding: "40px" }}
            >
              <div className="flex-grow">
                {esPrimeraPagina ? (
                  <div className="flex justify-between items-center mb-2 border-b-2 border-[#0066CC] pb-2">
                    <div className="w-1/3 text-left text-xs text-gray-500 font-bold uppercase">
                      Municipalidad de Concepción Las Minas
                      <br />
                      <span className="font-normal normal-case">
                        Departamento de Chiquimula, Guatemala C.A.
                      </span>
                      <br />
                      <span className="font-normal normal-case text-[10px]">
                        Departamento de Recursos Humanos
                      </span>
                    </div>

                    <div className="w-1/3 text-center">
                      <h1 className="text-sm font-bold uppercase text-black leading-tight">
                        NÓMINA GENERAL DE EMPLEADOS Y FUNCIONARIOS
                      </h1>
                      <p className="text-[10px] text-gray-600 mt-1">
                        MES:{" "}
                        <span className="font-bold">
                          {nombreMes} {anio}
                        </span>{" "}
                        | INFORME No. {numeroInforme}
                      </p>
                    </div>

                    <div className="w-1/3 flex justify-end">
                      <img
                        src="/images/logo-muni.png"
                        alt="Logo"
                        className="h-[72px] object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 border-b border-gray-300 pb-1 flex justify-between items-end">
                    <span className="text-[9px] text-gray-400 uppercase">
                      Nómina General - {nombreMes} {anio} (Continuación)
                    </span>
                    <span className="text-[9px] text-gray-400">
                      Hoja {indexPagina + 1} de {paginasProcesadas.length}
                    </span>
                  </div>
                )}

                <table className="w-full border-collapse text-[8px] font-sans text-black border border-gray-300 table-fixed">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr className="[&>th]:border [&>th]:border-gray-400 [&>th]:h-6 [&>th]:px-0.5 [&>th]:text-center [&>th]:uppercase [&>th]:align-middle">
                      <th className="w-6">No.</th>
                      <th className="text-left w-40">Nombre Completo</th>
                      <th className="text-left w-64">Puesto</th>
                      <th className="w-8">Reng.</th>
                      <th className="w-16">Salario</th>
                      <th className="w-16">Bonif.</th>
                      <th className="w-16 bg-gray-200">Total Dev.</th>
                      <th className="w-11 text-red-700">IGSS</th>
                      <th className="w-11 text-red-700">ISR</th>
                      <th className="w-11 text-red-700">Plan</th>
                      <th className="w-14 text-red-700 bg-red-50">
                        Total Desc.
                      </th>
                      <th className="w-16 font-bold bg-green-50">Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosPagina.map((fila: any, idx: number) => {
                      const prevFila = idx > 0 ? datosPagina[idx - 1] : null;

                      const mostrarEncabezado =
                        !prevFila ||
                        prevFila.dependencia_nombre !== fila.dependencia_nombre;

                      return (
                        <React.Fragment key={fila.id}>
                          {mostrarEncabezado && (
                            <tr className="bg-gray-200 border border-gray-400 break-inside-avoid">
                              <td
                                colSpan={12}
                                className={`px-2 font-bold text-[8px] uppercase text-gray-800 border-b border-gray-300 align-middle leading-tight ${ALTO_FILA}`}
                              >
                                {fila.dependencia_nombre}
                              </td>
                            </tr>
                          )}
                          <tr
                            className={`[&>td]:border [&>td]:border-gray-300 [&>td]:px-1 [&>td]:align-middle hover:bg-gray-50`}
                          >
                            <td className={`text-center ${ALTO_FILA}`}>
                              {indiceInicial + idx + 1}
                            </td>
                            <td
                              className={`font-semibold whitespace-normal leading-none uppercase px-1 overflow-hidden ${ALTO_FILA}`}
                              title={fila.nombre}
                            >
                              <div className="line-clamp-2">{fila.nombre}</div>
                            </td>
                            <td
                              className={`whitespace-normal leading-none capitalize px-1 text-[8px] overflow-hidden ${ALTO_FILA}`}
                              title={fila.puesto}
                            >
                              <div className="line-clamp-2">{fila.puesto}</div>
                            </td>
                            <td className={`text-center ${ALTO_FILA}`}>
                              {fila.renglon}
                            </td>
                            <td className={`text-right px-1 ${ALTO_FILA}`}>
                              Q {formatQ(fila.salarioFinal)}
                            </td>
                            <td className={`text-right px-1 ${ALTO_FILA}`}>
                              Q {formatQ(fila.bonifFinal)}
                            </td>
                            <td
                              className={`text-right font-bold bg-gray-100 px-1 ${ALTO_FILA}`}
                            >
                              Q {formatQ(fila.totalDevengado)}
                            </td>
                            <td
                              className={`text-right text-red-800 px-1 ${ALTO_FILA}`}
                            >
                              {fila.igss > 0 ? formatQ(fila.igss) : "-"}
                            </td>
                            <td
                              className={`text-right text-red-800 px-1 ${ALTO_FILA}`}
                            >
                              {fila.isr > 0 ? formatQ(fila.isr) : "-"}
                            </td>
                            <td
                              className={`text-right text-red-800 px-1 ${ALTO_FILA}`}
                            >
                              {fila.plan > 0 ? formatQ(fila.plan) : "-"}
                            </td>
                            <td
                              className={`text-right font-semibold text-red-800 bg-red-50 px-1 ${ALTO_FILA}`}
                            >
                              Q {formatQ(fila.totalDescuentos)}
                            </td>
                            <td
                              className={`text-right font-bold text-green-800 bg-green-50 px-1 ${ALTO_FILA}`}
                            >
                              Q {formatQ(fila.liquido)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {esUltimaPagina && (
                      <tr
                        className={`bg-gray-800 text-white font-bold [&>td]:px-1 [&>td]:text-right text-[9px] break-inside-avoid`}
                      >
                        <td
                          colSpan={4}
                          className={`text-center uppercase tracking-widest align-middle ${ALTO_FILA}`}
                        >
                          TOTALES GENERALES
                        </td>
                        <td className={`align-middle ${ALTO_FILA}`}>
                          Q {formatQ(totales.salarios)}
                        </td>
                        <td className={`align-middle ${ALTO_FILA}`}>
                          Q {formatQ(totales.bonis)}
                        </td>
                        <td className={`align-middle ${ALTO_FILA}`}>
                          Q {formatQ(totales.devengado)}
                        </td>
                        <td
                          colSpan={3}
                          className={`text-center bg-gray-700 text-gray-300 align-middle ${ALTO_FILA}`}
                        >
                          ---
                        </td>
                        <td className={`bg-red-900 align-middle ${ALTO_FILA}`}>
                          Q {formatQ(totales.descuentos)}
                        </td>
                        <td
                          className={`bg-green-900 align-middle ${ALTO_FILA}`}
                        >
                          Q {formatQ(totales.liquido)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {esUltimaPagina && (
                  <div className="mt-4 text-[9px] px-2 mb-2">
                    <p className="mb-1 font-bold uppercase">
                      A: Dirección de Administración Financiera Integrada
                      Municipal (DAFIM)
                    </p>
                    <p className="text-justify leading-tight">
                      Se traslada la presente <strong>NÓMINA DE PAGO</strong>{" "}
                      del mes de{" "}
                      <strong>
                        {nombreMes} {anio}
                      </strong>{" "}
                      para su trámite.
                    </p>
                  </div>
                )}
              </div>

              {esUltimaPagina ? (
                <div className="mt-auto w-full pt-2">
                  <div className="flex justify-around items-end">
                    <div className="text-center">
                      <div className="border-t border-black w-48 mx-auto mb-1"></div>
                      <div className="font-bold text-[9px] uppercase">
                        {firmas.coordinator || "__________________________"}
                      </div>
                      <div className="text-[8px] uppercase">
                        Coordinador(a) RRHH
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-black w-48 mx-auto mb-1"></div>
                      <div className="font-bold text-[9px] uppercase">
                        {firmas.dafim || "__________________________"}
                      </div>
                      <div className="text-[8px] uppercase">
                        Director(a) DAFIM
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div></div>
              )}

              <div className="absolute bottom-4 left-0 w-full text-center text-[8px] text-gray-400 border-t mx-10 pt-1">
                Generado el {fechaHoyTexto} | Página {indexPagina + 1} de{" "}
                {paginasProcesadas.length}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

NominaImpresion.displayName = "NominaImpresion";
