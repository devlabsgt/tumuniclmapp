"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { maestroSchema, type Maestro as MaestroType } from "../lib/esquemas";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";

type MaestroFormData = z.infer<typeof maestroSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  maestroAEditar?: MaestroType | null;
  nivelId?: number;
}

export default function Maestro({
  isOpen,
  onClose,
  onSave,
  maestroAEditar,
  nivelId,
}: Props) {
  const isEditMode = !!maestroAEditar;
  const [maestrosExistentes, setMaestrosExistentes] = useState<MaestroType[]>(
    [],
  );
  const [maestroSeleccionado, setMaestroSeleccionado] =
    useState<MaestroType | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<MaestroFormData>({
    resolver: zodResolver(maestroSchema),
    defaultValues: {
      nombre: "",
      ctd_alumnos: 0,
      telefono: "",
    },
  });

  const nombreWatch = watch("nombre");

  useEffect(() => {
    if (!isEditMode) {
      const fetchMaestros = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("maestros_municipales")
          .select("id, nombre, ctd_alumnos, telefono");
        if (!error && data) {
          setMaestrosExistentes(data as MaestroType[]);
        }
      };
      fetchMaestros();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isOpen) {
      if (maestroAEditar) {
        reset(maestroAEditar);
      } else {
        reset({ nombre: "", ctd_alumnos: 0, telefono: "" });
        setMaestroSeleccionado(null);
      }
    }
  }, [isOpen, maestroAEditar, reset]);

  const onSubmit = async (formData: MaestroFormData) => {
    const supabase = createClient();

    if (isEditMode && maestroAEditar) {
      const { error } = await supabase
        .from("maestros_municipales")
        .update(formData)
        .eq("id", maestroAEditar.id);

      if (error) {
        toast.error(`Error al actualizar: ${error.message}`);
      } else {
        toast.success("Maestro actualizado correctamente.");
        onSave();
      }
      return;
    }

    let maestroId: number;

    const { data: existente } = await supabase
      .from("maestros_municipales")
      .select("id")
      .eq("nombre", formData.nombre)
      .maybeSingle();

    if (existente) {
      maestroId = existente.id;
      const { error: updateError } = await supabase
        .from("maestros_municipales")
        .update({
          ctd_alumnos: formData.ctd_alumnos,
          telefono: formData.telefono,
        })
        .eq("id", maestroId);

      if (updateError) {
        toast.error("Error al actualizar datos del maestro.");
        return;
      }
    } else {
      const { data: nuevoMaestro, error: createError } = await supabase
        .from("maestros_municipales")
        .insert(formData)
        .select("id")
        .single();

      if (createError) {
        toast.error("Error al crear el maestro.");
        return;
      }
      maestroId = nuevoMaestro.id;
    }

    if (nivelId) {
      const { error: assignError } = await supabase
        .from("programas_educativos")
        .update({ maestro_id: maestroId })
        .eq("id", nivelId);

      if (assignError) {
        toast.error("Error al asignar maestro al nivel.");
      } else {
        toast.success(
          existente
            ? "Maestro actualizado y asignado."
            : "Maestro creado y asignado.",
        );
        onSave();
      }
    } else {
      onSave();
    }
  };

  const handleSelectMaestro = (maestro: MaestroType) => {
    setMaestroSeleccionado(maestro);
    setValue("nombre", maestro.nombre, { shouldValidate: true });
    setValue("ctd_alumnos", maestro.ctd_alumnos, { shouldValidate: true });
    setValue("telefono", maestro.telefono || "", { shouldValidate: true });
  };

  const maestrosFiltrados =
    !isEditMode && nombreWatch
      ? maestrosExistentes.filter((m) =>
          m.nombre.toLowerCase().includes(nombreWatch.toLowerCase()),
        )
      : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-lg p-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isEditMode ? "Editar Maestro" : "Nuevo Maestro"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Proporcione los detalles del maestro.
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 p-6 bg-gray-50/50 dark:bg-neutral-800/50 rounded-lg border dark:border-neutral-700">
            <div className="relative">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                {...register("nombre")}
                autoComplete="off"
                onChange={(e) => {
                  setValue("nombre", e.target.value);
                  setMaestroSeleccionado(null);
                }}
              />
              <AnimatePresence>
                {maestrosFiltrados.length > 0 && (
                  <motion.ul className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {maestrosFiltrados.map((m) => (
                      <li
                        key={m.id}
                        onClick={() => handleSelectMaestro(m)}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-neutral-800"
                      >
                        {m.nombre}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" type="tel" {...register("telefono")} />
            </div>

            <div>
              <Label htmlFor="ctd_alumnos">Cantidad de Alumnos</Label>
              <Input
                id="ctd_alumnos"
                type="number"
                {...register("ctd_alumnos", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEditMode
                  ? "Actualizar"
                  : "Crear y Asignar"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
              