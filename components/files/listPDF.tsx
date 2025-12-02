'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, Trash2, Loader2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import VerPDF from './verPDF'

interface FileRecord {
  id: string
  nombre: string
  file_path: string
  created_at: string
}

interface ListPDFProps {
  bucketName: string
  tableName: string
  referenceId: string
  referenceColumn: string
  refreshTrigger?: number
  rol: string // <--- Nueva prop recibida
}

export default function ListPDF({
  bucketName,
  tableName,
  referenceId,
  referenceColumn,
  refreshTrigger = 0,
  rol
}: ListPDFProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingFile, setViewingFile] = useState<FileRecord | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Definir quién puede eliminar
  const puedeEliminar = ['SUPER', 'SECRETARIO', 'SEC-TECNICO'].includes(rol)

  useEffect(() => {
    fetchFiles()
  }, [referenceId, refreshTrigger])

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(referenceColumn, referenceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error cargando archivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, filePath: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar archivo?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      setDeletingId(id)
      
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath])

      if (storageError) console.error('Error storage:', storageError)

      const { error: dbError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      setFiles(files.filter(f => f.id !== id))
      toast.success('Archivo eliminado correctamente')
      router.refresh()

    } catch (error) {
      console.error(error)
      toast.error('Error al eliminar el archivo')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Cargando documentos...</div>

  if (files.length === 0) {
    return <div className="text-sm italic text-gray-400">No hay PDFs adjuntos.</div>
  }

  return (
    <>
      <div className="flex flex-col gap-2 mt-4">
        <h3 className="text-sm font-semibold text-gray-900">Documentos Adjuntos ({files.length})</h3>
        <ul className="divide-y divide-gray-100 border rounded-md bg-white">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 p-2 bg-red-50 rounded-lg">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-xs">
                    {file.nombre}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(file.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Botón Ver (Para todos) */}
                <button
                  onClick={() => setViewingFile(file)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Botón Eliminar (Solo roles permitidos) */}
                {puedeEliminar && (
                  <button
                    onClick={() => handleDelete(file.id, file.file_path)}
                    disabled={deletingId === file.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <VerPDF 
        isOpen={!!viewingFile}
        onClose={() => setViewingFile(null)}
        filePath={viewingFile?.file_path || ''}
        fileName={viewingFile?.nombre || ''}
        bucketName={bucketName}
      />
    </>
  )
}