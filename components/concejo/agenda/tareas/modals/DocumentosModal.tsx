'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Tarea } from '@/components/concejo/agenda/lib/esquemas'
import UploadPDF from '@/components/files/uploadPDF'
import ListPDF from '@/components/files/listPDF'

interface DocumentosModalProps {
  isOpen: boolean
  onClose: () => void
  tarea: Tarea
  rol: string
  estadoAgenda: string
}

export default function DocumentosModal({ isOpen, onClose, tarea, rol, estadoAgenda }: DocumentosModalProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  if (!isOpen) return null

  const puedeSubir = ['SUPER', 'SECRETARIO', 'SEC-TECNICO'].includes(rol) && estadoAgenda !== 'Finalizada'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Documentos Adjuntos</h2>
            <p className="text-sm text-gray-500 line-clamp-1">
              Punto: {tarea.titulo_item}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {puedeSubir && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Subir nuevo documento</h3>
              <UploadPDF 
                bucketName="archivos_tareas"
                tableName="archivos_tareas"
                referenceId={tarea.id}
                referenceColumn="tarea_id"
                onUploadComplete={() => setRefreshKey(prev => prev + 1)} 
              />
            </div>
          )}

          <div>
            <ListPDF 
              bucketName="archivos_tareas"
              tableName="archivos_tareas"
              referenceId={tarea.id}
              referenceColumn="tarea_id"
              refreshTrigger={refreshKey}
              rol={rol} // <--- Pasamos el rol aquí
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}