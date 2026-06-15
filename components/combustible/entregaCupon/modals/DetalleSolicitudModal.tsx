'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { getSolicitudDetalleEntrega } from '../lib/actions';
import { SolicitudEntrega } from '../lib/schemas';
import { EntregaResumenBody, EntregaResumenCabecera } from '../EntregaResumen';
import { EncabezadoMunicipal } from '../EncabezadoMunicipal';

interface Props {
  solicitudId: number | null;
  onClose: () => void;
}

export default function DetalleSolicitudModal({ solicitudId, onClose }: Props) {
  const [sol, setSol] = useState<SolicitudEntrega | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!solicitudId) {
      setSol(null);
      return;
    }

    startTransition(async () => {
      const data = await getSolicitudDetalleEntrega(solicitudId);
      setSol(data);
    });
  }, [solicitudId]);

  const titulo =
    sol?.correlativo != null
      ? `Solicitud No. ${sol.correlativo} — ${sol.municipio_destino}`
      : sol
        ? `Solicitud ${sol.id} — ${sol.municipio_destino}`
        : 'Detalle de solicitud';

  return (
    <Dialog open={!!solicitudId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="
          w-[calc(100vw-0.5rem)] max-w-none sm:max-w-5xl lg:max-w-6xl
          p-0 gap-0 overflow-hidden max-h-[95dvh] overflow-y-auto
          rounded-none sm:rounded-2xl border-blue-100 dark:border-neutral-800
        "
      >
        <DialogTitle className="sr-only">{titulo}</DialogTitle>
        <DialogDescription className="sr-only">
          Resumen de la solicitud de combustible
        </DialogDescription>

        <EncabezadoMunicipal />

        {isPending ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : !sol ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
            No se pudo cargar la solicitud.
          </div>
        ) : (
          <div className="overflow-hidden">
            <EntregaResumenCabecera sol={sol} />
            <div className="border-t border-dashed border-slate-200 dark:border-neutral-800">
              <EntregaResumenBody sol={sol} layout="wide" showActionButton={false} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
