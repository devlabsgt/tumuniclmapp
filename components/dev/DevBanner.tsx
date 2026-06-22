'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MensajeDev } from './zod';
import { getMensajesActivosDev } from './actions/mensajes';
import { getNivelConfig } from './nivelConfig';
import { MensajeFormateado } from './mensajeFormato';

export default function DevBanner() {
  const [mensajes, setMensajes] = useState<MensajeDev[]>([]);
  const [cerrados, setCerrados] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMensajesActivosDev().then(setMensajes);
  }, []);

  const visibles = mensajes.filter((m) => !cerrados.has(m.id));

  if (visibles.length === 0) return null;

  return (
    <div className="w-full space-y-0">
      <AnimatePresence>
        {visibles.map((m) => {
          const cfg = getNivelConfig(m.estado);
          const Icon = cfg.icon;

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, height: 0, borderColor: cfg.borderGlow[0] }}
              animate={{
                opacity: 1,
                height: 'auto',
                borderColor: cfg.borderGlow,
              }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                opacity: { duration: 0.25 },
                height: { duration: 0.25 },
                borderColor: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
              }}
              className={`${cfg.bg} border-2`}
            >
              <div className="w-full flex items-start gap-3 px-4 py-2.5">
                <div className={`flex-1 min-w-0 text-sm ${cfg.text}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Icon className={`w-6 h-6 flex-shrink-0 ${cfg.accent}`} />
                    <span className="font-bold">{m.titulo}</span>
                    <span className="hidden sm:inline opacity-40">—</span>
                    <MensajeFormateado
                      texto={m.mensaje}
                      className="opacity-80 text-xs sm:text-sm [&_strong]:font-bold [&_em]:italic"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setCerrados((prev) => new Set(prev).add(m.id))}
                  className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0 ${cfg.accent}`}
                  aria-label="Cerrar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
