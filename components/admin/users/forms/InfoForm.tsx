"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import {
  Calendar,
  CircleDollarSign,
  Fingerprint,
  Hash,
  MapPin,
  Phone,
  Shield,
  Map,
  Home,
  Heart,
  Briefcase,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  Save,
} from "lucide-react";
import { MODAL_FIELD_CLASS, ModalInput, ModalSelect } from "@/components/ui/general-modal";
import {
  CAMPO_MONO_CLASS,
  CAMPO_SUBMIT_BTN_CLASS,
  CampoFormulario,
} from "./CampoFormulario";
import { useInfoForm } from "./hooks";
import { useQuery } from "@tanstack/react-query";
import { obtenerProfesionesUnicas } from "./action";

type InfoFormData = {
  telefono: string;
  dpi: string;
  nit: string;
  igss: string;
  cuenta_no: string;
  direccion: string;
  nacimiento: string;
  domicilio: string;
  vecindad: string;
  estado_civil: string;
  genero: string;
  profesion: string;
  fecha_antiguedad: string;
};

function calcularAntiguedad(fechaStr: string) {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return null;
  
  const hoy = new Date();
  
  let years = hoy.getFullYear() - fecha.getFullYear();
  let months = hoy.getMonth() - fecha.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (hoy.getDate() < fecha.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  const partes = [];
  if (years > 0) partes.push(`${years} año${years > 1 ? 's' : ''}`);
  if (months > 0) partes.push(`${months} mes${months > 1 ? 'es' : ''}`);
  
  if (partes.length === 0) return "Menos de un mes";
  return partes.join(' y ');
}

type InfoFormUser = {
  id?: string;
  user_id?: string;
  telefono?: string | null;
  dpi?: string | null;
  nit?: string | null;
  igss?: string | null;
  cuenta_no?: string | null;
  direccion?: string | null;
  nacimiento?: string | null;
  domicilio?: string | null;
  vecindad?: string | null;
  estado_civil?: string | null;
  genero?: string | null;
  profesion?: string | null;
  fecha_antiguedad?: string | null;
};

export default function InfoForm({ userData }: { userData: InfoFormUser }) {
  const userId = userData?.id || userData?.user_id || "";

  const { usuarioData, isLoadingData, handleSave, isSaving } =
    useInfoForm(userId);

  const { data: profesiones } = useQuery({
    queryKey: ['profesiones-unicas'],
    queryFn: obtenerProfesionesUnicas,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [profesionFocused, setProfesionFocused] = useState(false);

  const [formData, setFormData] = useState<InfoFormData>({
    telefono: "",
    dpi: "",
    nit: "",
    igss: "",
    cuenta_no: "",
    direccion: "",
    nacimiento: "",
    domicilio: "",
    vecindad: "",
    estado_civil: "",
    genero: "",
    profesion: "",
    fecha_antiguedad: "",
  });
  const [original, setOriginal] = useState<InfoFormData>({
    telefono: "",
    dpi: "",
    nit: "",
    igss: "",
    cuenta_no: "",
    direccion: "",
    nacimiento: "",
    domicilio: "",
    vecindad: "",
    estado_civil: "",
    genero: "",
    profesion: "",
    fecha_antiguedad: "",
  });

  const cleanNumbers = (val: string) => val.toString().replace(/\D/g, "");

  const snapshotDesdeDatos = (datos: InfoFormUser): InfoFormData => ({
    telefono: cleanNumbers(datos.telefono || ""),
    dpi: cleanNumbers(datos.dpi || ""),
    nit: cleanNumbers(datos.nit || ""),
    igss: cleanNumbers(datos.igss || ""),
    cuenta_no: cleanNumbers(datos.cuenta_no || ""),
    direccion: datos.direccion || "",
    nacimiento: datos.nacimiento
      ? String(datos.nacimiento).split("T")[0]
      : "",
    domicilio: datos.domicilio || "",
    vecindad: datos.vecindad || "",
    estado_civil: datos.estado_civil || "",
    genero: datos.genero || "",
    profesion: datos.profesion || "",
    fecha_antiguedad: datos.fecha_antiguedad
      ? String(datos.fecha_antiguedad).split("T")[0]
      : "",
  });

  const formatPhoneDisplay = (val: string) => {
    const clean = cleanNumbers(val).slice(0, 8);
    if (clean.length <= 4) return clean;
    return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  };

  const formatDPIDisplay = (val: string) => {
    const clean = cleanNumbers(val).slice(0, 13);
    if (clean.length <= 4) return clean;
    if (clean.length <= 9) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
    return `${clean.slice(0, 4)} ${clean.slice(4, 9)} ${clean.slice(9)}`;
  };

  const formatEveryFour = (val: string) => {
    return cleanNumbers(val)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  useLayoutEffect(() => {
    const datos = usuarioData || userData;

    if (datos) {
      const snapshot = snapshotDesdeDatos(datos);
      setFormData(snapshot);
      setOriginal(snapshot);
    }
  }, [usuarioData, userData]);

  const hayCambios = useMemo(
    () =>
      formData.telefono !== original.telefono ||
      formData.dpi !== original.dpi ||
      formData.nit !== original.nit ||
      formData.igss !== original.igss ||
      formData.cuenta_no !== original.cuenta_no ||
      formData.direccion !== original.direccion ||
      formData.nacimiento !== original.nacimiento ||
      formData.domicilio !== original.domicilio ||
      formData.vecindad !== original.vecindad ||
      formData.estado_civil !== original.estado_civil ||
      formData.genero !== original.genero ||
      formData.profesion !== original.profesion ||
      formData.fecha_antiguedad !== original.fecha_antiguedad,
    [formData, original],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (["telefono", "dpi", "igss", "nit", "cuenta_no"].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: cleanNumbers(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hayCambios || isSaving) return;
    handleSave(formData);
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col gap-3 py-1" aria-busy>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 pt-1">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-3 w-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 pt-1">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-40 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  const igssComoDpi =
    formData.igss === formData.dpi && formData.igss !== "";

  return (
    <form
      onSubmit={onSubmit}
      className="flex animate-in flex-col gap-3 py-1 duration-500 fade-in"
    >
      <div className="mb-0.5 flex flex-col gap-1 px-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {step === 1 && "Paso 1: Datos Personales"}
          {step === 2 && "Paso 2: Ubicación y Contacto"}
          {step === 3 && "Paso 3: Laboral y Administrativo"}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-6 content-start min-h-[500px] md:min-h-0">
        {step === 1 && (
          <>
            <CampoFormulario icon={Fingerprint} label="DPI" className="md:col-span-3">
              <ModalInput
                type="text"
                name="dpi"
                value={formatDPIDisplay(formData.dpi)}
                onChange={handleChange}
                inputMode="numeric"
                className={CAMPO_MONO_CLASS}
              />
            </CampoFormulario>

            <CampoFormulario icon={Hash} label="NIT" className="md:col-span-3">
              <ModalInput
                type="text"
                name="nit"
                value={formatEveryFour(formData.nit)}
                onChange={handleChange}
                inputMode="numeric"
                className={CAMPO_MONO_CLASS}
              />
            </CampoFormulario>

            <CampoFormulario icon={Calendar} label="Fecha de nacimiento" className="md:col-span-2">
              <ModalInput
                type="date"
                name="nacimiento"
                value={formData.nacimiento}
                onChange={handleChange}
              />
            </CampoFormulario>

            <CampoFormulario icon={User} label="Género" className="md:col-span-2">
              <div className={`w-full flex items-center gap-6 ${MODAL_FIELD_CLASS}`}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="genero"
                    value="M"
                    checked={formData.genero === "M"}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${formData.genero === "M" ? 'border-blue-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                    {formData.genero === "M" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Masculino</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="genero"
                    value="F"
                    checked={formData.genero === "F"}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${formData.genero === "F" ? 'border-pink-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                    {formData.genero === "F" && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Femenino</span>
                </label>
              </div>
            </CampoFormulario>

            <CampoFormulario icon={Heart} label="Estado civil" className="md:col-span-2">
              <ModalSelect
                name="estado_civil"
                value={formData.estado_civil}
                onChange={handleChange}
              >
                <option value="">Seleccione...</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Viudo/a">Viudo/a</option>
                <option value="Unido/a de hecho">Unido/a de hecho</option>
              </ModalSelect>
            </CampoFormulario>
          </>
        )}

        {step === 2 && (
          <>
            <CampoFormulario icon={Phone} label="Teléfono" className="md:col-span-3">
              <ModalInput
                type="tel"
                name="telefono"
                value={formatPhoneDisplay(formData.telefono)}
                onChange={handleChange}
                inputMode="numeric"
                autoComplete="tel"
                className={CAMPO_MONO_CLASS}
              />
            </CampoFormulario>

            <CampoFormulario icon={Home} label="Domicilio" className="md:col-span-3">
              <ModalInput
                name="domicilio"
                value={formData.domicilio}
                onChange={handleChange}
              />
            </CampoFormulario>

            <CampoFormulario icon={Map} label="Vecindad" className="md:col-span-3">
              <ModalInput
                name="vecindad"
                value={formData.vecindad}
                onChange={handleChange}
              />
            </CampoFormulario>

            <CampoFormulario
              icon={MapPin}
              label="Dirección de residencia"
              className="md:col-span-3"
            >
              <ModalInput
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
              />
            </CampoFormulario>
          </>
        )}

        {step === 3 && (
          <>
            <CampoFormulario icon={Shield} label="Afiliación IGSS" className="md:col-span-3">
              <ModalInput
                type="text"
                name="igss"
                value={
                  igssComoDpi
                    ? formatDPIDisplay(formData.igss)
                    : formData.igss
                }
                onChange={handleChange}
                inputMode="numeric"
                className={igssComoDpi ? CAMPO_MONO_CLASS : MODAL_FIELD_CLASS}
              />
            </CampoFormulario>

            <CampoFormulario icon={CircleDollarSign} label="No. cuenta (Banrural)" className="md:col-span-3">
              <ModalInput
                type="text"
                name="cuenta_no"
                value={formatEveryFour(formData.cuenta_no)}
                onChange={handleChange}
                inputMode="numeric"
                className={CAMPO_MONO_CLASS}
              />
            </CampoFormulario>

            <CampoFormulario icon={Briefcase} label="Profesión" className="md:col-span-3">
              <div className="relative group">
                <ModalInput
                  name="profesion"
                  value={formData.profesion}
                  onChange={handleChange}
                  autoComplete="off"
                  onFocus={() => setProfesionFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setProfesionFocused(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const currentText = formData.profesion.toLowerCase();
                      if (currentText.length >= 3) {
                        const matches = profesiones?.filter(p => p.toLowerCase().includes(currentText)) || [];
                        if (matches.length === 1) {
                          e.preventDefault();
                          setFormData((prev) => ({ ...prev, profesion: matches[0] }));
                          setProfesionFocused(false);
                        }
                      }
                    }
                  }}
                />
                
                {profesionFocused && formData.profesion.length >= 3 && profesiones?.some(p => p.toLowerCase().includes(formData.profesion.toLowerCase())) && (
                  <div 
                    id="profesion-dropdown"
                    className="absolute z-50 w-full bottom-full mb-1 bg-white dark:bg-[#1a1c23] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                  >
                    {profesiones?.filter(p => p.toLowerCase().includes(formData.profesion.toLowerCase())).map((prof, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, profesion: prof }));
                          setProfesionFocused(false);
                        }}
                        className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors"
                      >
                        {prof}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CampoFormulario>

            <CampoFormulario 
              icon={Clock} 
              label={
                <span className="flex items-center gap-2">
                  <span>FECHA DE ANTIGÜEDAD</span>
                  {formData.fecha_antiguedad && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium normal-case tracking-normal">
                      {calcularAntiguedad(formData.fecha_antiguedad)}
                    </span>
                  )}
                </span>
              } 
              className="md:col-span-3"
            >
              <ModalInput
                type="date"
                name="fecha_antiguedad"
                value={formData.fecha_antiguedad}
                onChange={handleChange}
              />
            </CampoFormulario>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-auto pt-4">
        <div className="flex items-center justify-center gap-3 w-full py-4 bg-zinc-100 dark:bg-[#1a1c23] rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="text-gray-500 dark:text-gray-600 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 transition-colors"
          >
            <ChevronsLeft size={20} />
          </button>

          <div className="flex items-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${step === i
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                >
                  {i}
                </button>
                {i < 3 && (
                  <div className="w-8 h-[1px] bg-gray-300 dark:bg-gray-600 mx-2" />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            disabled={step === totalSteps}
            className="text-gray-500 dark:text-gray-600 hover:text-gray-800 dark:hover:text-white disabled:opacity-50 transition-colors"
          >
            <ChevronsRight size={20} />
          </button>
        </div>

        {step === totalSteps && (
          <button
            type="submit"
            disabled={!hayCambios || isSaving}
            className={`flex items-center justify-center gap-2 h-12 w-fit mx-auto px-8 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors ${(!hayCambios || isSaving) ? "opacity-50 cursor-not-allowed" : "hover:bg-green-500"}`}
          >
            {isSaving ? "Guardando..." : "Guardar información personal"} <Save size={18} />
          </button>
        )}
      </div>
    </form>
  );
}
