import React, { forwardRef, useMemo } from "react";

const FILAS_PAGINA_1 = 26;
const FILAS_PAGINA_X = 25;
const ALTO_FILA = "h-6";

interface Props {
  datos: any[];
  anio: string;
  nombreMes: string;
  numeroInforme: string;
  fechaHoyTexto: string;
  itemsPorPagina: number;
  firmas: { coordinator: string };
  formatQ: (val: number) => string;
  totales: {
    salarios: number;
    honorarios: number;
    dietas: number;
    bonis: number;
    gastosRep: number;
    devengado: number;
    liquido: number;
    descuentos: number;
  };
  columnasOcultas?: string[];
  oficinasOcultas?: string[];
  empleadosOcultos?: string[];
  onOcultarColumna?: (col: string) => void;
  onOcultarOficina?: (oficina: string) => void;
  onOcultarEmpleado?: (id: string) => void;
}

const NominaImpresion = forwardRef<HTMLDivElement, Props>(
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
      columnasOcultas = [],
      oficinasOcultas = [],
      empleadosOcultos = [],
      onOcultarColumna,
      onOcultarOficina,
      onOcultarEmpleado,
    },
    ref,
  ) => {
    const paginasProcesadas = useMemo(() => {
      const datosFiltrados = datos.filter(
        (f) =>
          !oficinasOcultas.includes(f.dependencia_nombre) &&
          !empleadosOcultos.includes(f.id),
      );

      const datosOrdenados = [...datosFiltrados].sort((a, b) => {
        const nameA = a.dependencia_nombre.toUpperCase();
        const nameB = b.dependencia_nombre.toUpperCase();
        if (nameA.includes("ALCALDÍA MUNICIPAL")) return -1;
        if (nameB.includes("ALCALDÍA MUNICIPAL")) return 1;
        return 0;
      });

      const paginas: any[][] = [];
      let paginaActual: any[] = [];
      let espaciosUsados = 0;

      datosOrdenados.forEach((fila, index) => {
        const prevFila = index > 0 ? datosOrdenados[index - 1] : null;
        const esPrimeroDePagina = paginaActual.length === 0;
        const cambiaDependencia =
          !prevFila || prevFila.dependencia_nombre !== fila.dependencia_nombre;

        let costoFila = 1;
        if (esPrimeroDePagina || cambiaDependencia) costoFila += 1;

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
    }, [datos, oficinasOcultas, empleadosOcultos]);

    const visible = (col: string) => !columnasOcultas.includes(col);
    const handleHideCol = (col: string) => () =>
      onOcultarColumna && onOcultarColumna(col);

    const handleHideOficina = (oficina: string) => () =>
      onOcultarOficina && onOcultarOficina(oficina);

    const handleHideEmpleado = (id: string) => () =>
      onOcultarEmpleado && onOcultarEmpleado(id);

    const colSpanTable = [
      visible("no"),
      visible("nombre"),
      visible("cargo"),
      visible("renglon"),
      visible("dietas"),
      visible("salario"),
      visible("honorarios"),
      visible("bonif"),
      visible("gastos_rep"),
      visible("total_dev"),
      visible("igss"),
      visible("plan"),
      visible("isr"),
      visible("total_desc"),
      visible("liquido"),
    ].filter(Boolean).length;

    const thClass =
      "border border-gray-400 h-6 px-0.5 text-center uppercase align-middle cursor-pointer hover:bg-red-100 hover:text-red-900 transition-colors";

    const getDependenciaCorta = (dep: string) => {
      if (!dep) return "";
      const parts = dep.split(">");
      return parts[parts.length - 1].trim();
    };

    return (
      <div ref={ref} className="flex flex-col gap-8">
        {paginasProcesadas.map((datosPagina, indexPagina) => {
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
                        Departamento Municipal de Recursos Humanos
                      </span>
                      <br />
                      <span className="font-normal normal-case text-[10px]">
                        Encargado(a) de actualización de datos:{" "}
                        <span className="font-bold">
                          {firmas.coordinator || "No asignado"}
                        </span>
                      </span>
                    </div>
                    <div className="w-1/3 text-center">
                      <h1 className="text-sm font-bold uppercase text-black leading-tight">
                        REMUNERACIONES DE EMPLEADOS Y SERVIDORES PÚBLICOS
                      </h1>
                      <p className="text-[10px] text-gray-600 mt-1">
                        MES:{" "}
                        <span className="font-bold">
                          {nombreMes} {anio}
                        </span>{" "}
                        | INFORME No. N4-{numeroInforme}
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
                    <tr>
                      {visible("no") && (
                        <th
                          className={`w-6 ${thClass}`}
                          onClick={handleHideCol("no")}
                          title="Ocultar columna No."
                        >
                          No.
                        </th>
                      )}
                      {visible("nombre") && (
                        <th
                          className={`text-left w-40 ${thClass}`}
                          onClick={handleHideCol("nombre")}
                          title="Ocultar columna Nombre"
                        >
                          Nombre Completo
                        </th>
                      )}
                      {visible("cargo") && (
                        <th
                          className={`text-left w-44 ${thClass}`}
                          onClick={handleHideCol("cargo")}
                          title="Ocultar columna Cargo"
                        >
                          Cargo
                        </th>
                      )}
                      {visible("renglon") && (
                        <th
                          className={`w-8 ${thClass}`}
                          onClick={handleHideCol("renglon")}
                          title="Ocultar columna Reng."
                        >
                          Reng.
                        </th>
                      )}
                      {visible("dietas") && (
                        <th
                          className={`w-16 ${thClass}`}
                          onClick={handleHideCol("dietas")}
                          title="Ocultar columna Dietas"
                        >
                          Dietas
                        </th>
                      )}
                      {visible("salario") && (
                        <th
                          className={`w-16 ${thClass}`}
                          onClick={handleHideCol("salario")}
                          title="Ocultar columna Salario"
                        >
                          Salario
                        </th>
                      )}
                      {visible("honorarios") && (
                        <th
                          className={`w-16 ${thClass}`}
                          onClick={handleHideCol("honorarios")}
                          title="Ocultar columna Honorarios"
                        >
                          Honorarios
                        </th>
                      )}
                      {visible("bonif") && (
                        <th
                          className={`w-16 ${thClass}`}
                          onClick={handleHideCol("bonif")}
                          title="Ocultar columna Bonif."
                        >
                          Bonif.
                        </th>
                      )}
                      {visible("gastos_rep") && (
                        <th
                          className={`w-16 ${thClass}`}
                          onClick={handleHideCol("gastos_rep")}
                          title="Ocultar columna Gastos Rep."
                        >
                          Gastos Rep.
                        </th>
                      )}
                      {visible("total_dev") && (
                        <th
                          className={`w-16 bg-gray-200 ${thClass}`}
                          onClick={handleHideCol("total_dev")}
                          title="Ocultar columna Total Dev."
                        >
                          Total Dev.
                        </th>
                      )}
                      {visible("igss") && (
                        <th
                          className={`w-11 text-red-700 ${thClass}`}
                          onClick={handleHideCol("igss")}
                          title="Ocultar columna IGSS"
                        >
                          IGSS
                        </th>
                      )}
                      {visible("plan") && (
                        <th
                          className={`w-11 text-red-700 ${thClass}`}
                          onClick={handleHideCol("plan")}
                          title="Ocultar columna Plan"
                        >
                          Plan
                        </th>
                      )}
                      {visible("isr") && (
                        <th
                          className={`w-11 text-red-700 ${thClass}`}
                          onClick={handleHideCol("isr")}
                          title="Ocultar columna ISR"
                        >
                          ISR
                        </th>
                      )}
                      {visible("total_desc") && (
                        <th
                          className={`w-14 text-red-700 bg-red-50 ${thClass}`}
                          onClick={handleHideCol("total_desc")}
                          title="Ocultar columna Total Desc."
                        >
                          Total Desc.
                        </th>
                      )}
                      {visible("liquido") && (
                        <th
                          className={`w-16 font-bold bg-green-50 ${thClass}`}
                          onClick={handleHideCol("liquido")}
                          title="Ocultar columna Líquido"
                        >
                          Líquido
                        </th>
                      )}
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
                            <tr
                              className="bg-gray-200 border border-gray-400 break-inside-avoid cursor-pointer hover:bg-red-200 transition-colors group"
                              onClick={handleHideOficina(
                                fila.dependencia_nombre,
                              )}
                              title="Clic para ocultar toda esta oficina"
                            >
                              <td
                                colSpan={colSpanTable}
                                className={`px-2 font-bold text-[8px] uppercase text-gray-800 border-b border-gray-300 align-middle leading-tight ${ALTO_FILA}`}
                              >
                                <span className="text-blue-600">
                                  Dependencia:
                                </span>{" "}
                                {getDependenciaCorta(fila.dependencia_nombre)}
                              </td>
                            </tr>
                          )}
                          <tr
                            className="[&>td]:border [&>td]:border-gray-300 [&>td]:px-1 [&>td]:align-middle hover:bg-red-50 cursor-pointer transition-colors"
                            onClick={handleHideEmpleado(fila.id)}
                            title="Clic para ocultar empleado"
                          >
                            {visible("no") && (
                              <td className={`text-center ${ALTO_FILA}`}>
                                {indiceInicial + idx + 1}
                              </td>
                            )}
                            {visible("nombre") && (
                              <td
                                className={`font-semibold px-1 overflow-hidden ${ALTO_FILA}`}
                              >
                                <div className="line-clamp-2">
                                  {fila.nombre}
                                </div>
                              </td>
                            )}
                            {visible("cargo") && (
                              <td
                                className={`px-1 text-[8px] overflow-hidden ${ALTO_FILA}`}
                              >
                                <div className="line-clamp-2">
                                  {fila.puesto}
                                </div>
                              </td>
                            )}
                            {visible("renglon") && (
                              <td className={`text-center ${ALTO_FILA}`}>
                                {fila.renglon}
                              </td>
                            )}
                            {visible("dietas") && (
                              <td
                                className={`px-1 ${ALTO_FILA} ${fila.dietaFinal > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.dietaFinal > 0
                                  ? `Q ${formatQ(fila.dietaFinal)}`
                                  : "---"}
                              </td>
                            )}
                            {visible("salario") && (
                              <td
                                className={`px-1 ${ALTO_FILA} ${fila.salarioFinal > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.salarioFinal > 0
                                  ? `Q ${formatQ(fila.salarioFinal)}`
                                  : "---"}
                              </td>
                            )}
                            {visible("honorarios") && (
                              <td
                                className={`px-1 ${ALTO_FILA} ${fila.honorarioFinal > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.honorarioFinal > 0
                                  ? `Q ${formatQ(fila.honorarioFinal)}`
                                  : "---"}
                              </td>
                            )}
                            {visible("bonif") && (
                              <td
                                className={`px-1 ${ALTO_FILA} ${fila.bonifFinal > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.bonifFinal > 0
                                  ? `Q ${formatQ(fila.bonifFinal)}`
                                  : "---"}
                              </td>
                            )}
                            {visible("gastos_rep") && (
                              <td
                                className={`px-1 ${ALTO_FILA} ${fila.gastosRepFinal > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.gastosRepFinal > 0
                                  ? `Q ${formatQ(fila.gastosRepFinal)}`
                                  : "---"}
                              </td>
                            )}
                            {visible("total_dev") && (
                              <td
                                className={`px-1 font-bold bg-gray-100 ${ALTO_FILA} ${fila.totalDevengado > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.totalDevengado > 0
                                  ? `Q ${formatQ(fila.totalDevengado)}`
                                  : "---"}
                              </td>
                            )}
                            {visible("igss") && (
                              <td
                                className={`px-1 text-red-800 ${ALTO_FILA} ${fila.igss > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.igss > 0 ? formatQ(fila.igss) : "---"}
                              </td>
                            )}
                            {visible("plan") && (
                              <td
                                className={`px-1 text-red-800 ${ALTO_FILA} ${fila.plan > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.plan > 0 ? formatQ(fila.plan) : "---"}
                              </td>
                            )}
                            {visible("isr") && (
                              <td
                                className={`px-1 text-red-800 ${ALTO_FILA} ${fila.isr > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.isr > 0 ? formatQ(fila.isr) : "---"}
                              </td>
                            )}
                            {visible("total_desc") && (
                              <td
                                className={`px-1 font-semibold text-red-800 bg-red-50 ${ALTO_FILA} ${fila.totalDescuentos > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.totalDescuentos > 0
                                  ? `Q ${formatQ(fila.totalDescuentos)}`
                                  : "---"}
                              </td>
                            )}
                            {visible("liquido") && (
                              <td
                                className={`px-1 font-bold text-green-800 bg-green-50 ${ALTO_FILA} ${fila.liquido > 0 ? "text-right" : "text-center"}`}
                              >
                                {fila.liquido > 0
                                  ? `Q ${formatQ(fila.liquido)}`
                                  : "---"}
                              </td>
                            )}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
export default NominaImpresion;
