'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, UploadCloud, X } from 'lucide-react'
import { toast } from 'react-toastify'

interface UploadPDFProps {
  bucketName: string
  tableName: string
  referenceId: string
  referenceColumn: string
  onUploadComplete?: () => void
}

export default function UploadPDF({
  bucketName,
  tableName,
  referenceId,
  referenceColumn,
  onUploadComplete
}: UploadPDFProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      if (selectedFile.type !== 'application/pdf') {
        toast.warning('Solo se permiten archivos PDF')
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.warning('El archivo no debe superar los 10MB')
        return
      }

      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      const fileExt = 'pdf'
      const fileName = `${referenceId}/${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from(tableName)
        .insert({
          [referenceColumn]: referenceId,
          nombre: file.name,
          file_path: filePath,
        })

      if (dbError) throw dbError

      toast.success('Documento subido correctamente')
      setFile(null)
      router.refresh()
      if (onUploadComplete) onUploadComplete()

    } catch (error) {
      console.error(error)
      toast.error('Error al subir el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full">
      {!file ? (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 border-gray-300 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click para subir PDF</span>
              </p>
              <p className="text-xs text-gray-500">
                (MAX. 10MB)
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
              accept="application/pdf"
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-white shadow-sm w-full">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">
              {file.name}
            </span>
            <button
              onClick={() => setFile(null)}
              disabled={isUploading}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              'Confirmar Subida'
            )}
          </button>
        </div>
      )}
    </div>
  )
}