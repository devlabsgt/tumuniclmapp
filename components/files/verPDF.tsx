'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Columns, Smartphone, ExternalLink } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'

// Estilos necesarios para react-pdf
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configuración del Worker usando CDN para evitar problemas con Webpack en Next.js 15
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`

interface VerPDFProps {
  filePath: string
  fileName: string
  bucketName: string
  isOpen: boolean
  onClose: () => void
}

export default function VerPDF({ filePath, fileName, bucketName, isOpen, onClose }: VerPDFProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(true)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  // isDualView determina si mostramos 2 páginas (desktop) o 1 (móvil)
  const [isDualView, setIsDualView] = useState<boolean>(false)
  
  const supabase = createClient()

  // Detectar tamaño de pantalla para activar vista doble en MD (768px) o superior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDualView(window.innerWidth >= 1024)
    }

    if (typeof window !== 'undefined') {
      checkScreenSize()
      window.addEventListener('resize', checkScreenSize)
    }
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Obtener URL firmada de Supabase
  useEffect(() => {
    if (isOpen && filePath) {
      const fetchUrl = async () => {
        try {
          setLoadingUrl(true)
          const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 3600)

          if (error) throw error
          if (data?.signedUrl) setUrl(data.signedUrl)
        } catch (error) {
          console.error(error)
        } finally {
          setLoadingUrl(false)
        }
      }
      fetchUrl()
    } else {
      // Resetear estados al cerrar
      setUrl(null)
      setPageNumber(1)
      setScale(1.0)
      setNumPages(0)
    }
  }, [isOpen, filePath, bucketName])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  // Lógica de paginación: avanza 1 página en modo simple, 2 en modo doble
  const changePage = (offset: number) => {
    setPageNumber(prev => {
      const step = isDualView ? 2 : 1
      const newPage = prev + (offset * step)
      
      if (newPage < 1) return 1
      // Asegurar no pasarse del total de páginas
      if (newPage > numPages) return prev
      
      return newPage
    })
  }

  const toggleViewMode = () => {
    setIsDualView(!isDualView)
    // Si pasamos a vista simple y estábamos en una página par, retroceder una para no perder el hilo
    setPageNumber(prev => (isDualView && prev % 2 === 0 && prev > 1) ? prev - 1 : prev)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-0 md:p-4 backdrop-blur-sm transition-all">
      <div className="relative w-full h-full md:h-[95vh] md:max-w-[95vw] bg-gray-900 md:rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 text-white shrink-0 z-10 relative shadow-md">
          <div className="flex items-center gap-4 overflow-hidden">
             <h3 className="text-sm font-semibold truncate max-w-[120px] md:max-w-md" title={fileName}>
              {fileName}
            </h3>
            {/* Botón para alternar vista manualmente */}
            <div className="hidden md:flex items-center gap-1 bg-gray-700/50 rounded-lg p-1">
              <button 
                onClick={toggleViewMode}
                className="p-1.5 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
                title={isDualView ? "Cambiar a vista simple" : "Cambiar a vista doble"}
              >
                {isDualView ? <Smartphone size={16} /> : <Columns size={16} />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Controles de Zoom */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-1 py-1">
              <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="p-1.5 hover:text-blue-400 rounded-md hover:bg-gray-600">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono w-8 text-center hidden sm:block">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(2.5, s + 0.1))} className="p-1.5 hover:text-blue-400 rounded-md hover:bg-gray-600">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

             {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors hidden sm:flex"
                title="Abrir PDF nativo en pestaña nueva"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-600/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* --- Cuerpo del Visor --- */}
        <div className="flex-1 bg-gray-900/50 overflow-auto relative flex items-start justify-center p-2 md:p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {loadingUrl ? (
            <div className="self-center flex flex-col items-center gap-2">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
               <span className="text-gray-400 text-sm">Preparando documento...</span>
            </div>
          ) : url ? (
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="self-center flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><span className="text-gray-400 text-sm">Cargando páginas...</span></div>}
              error={<div className="text-red-400 self-center font-medium bg-red-900/20 px-4 py-2 rounded-md">Error al cargar el PDF. Verifica tu conexión o permisos.</div>}
              className="flex justify-center my-auto"
              externalLinkTarget="_blank"
            >
              {/* GRID PRINCIPAL: 1 columna en móvil, 2 en desktop si isDualView es true */}
              <div className={`grid gap-4 transition-all duration-300 ${isDualView ? 'grid-cols-2' : 'grid-cols-1'}`}>
                
                {/* Página Actual (Izquierda en dual) */}
                <div className="shadow-2xl relative group transition-transform hover:scale-[1.005]">
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    loading={<div className="w-[300px] h-[400px] bg-white/10 animate-pulse rounded" />}
                    className="bg-white rounded-sm overflow-hidden"
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                  />
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Pág. {pageNumber}
                  </span>
                </div>
                
                {/* Página Siguiente (Derecha en dual) - Solo se renderiza si existe */}
                {isDualView && pageNumber + 1 <= numPages && (
                   <div className="shadow-2xl relative group transition-transform hover:scale-[1.005]">
                    <Page 
                      pageNumber={pageNumber + 1} 
                      scale={scale} 
                      loading={<div className="w-[300px] h-[400px] bg-white/10 animate-pulse rounded" />}
                      className="bg-white rounded-sm overflow-hidden"
                      renderAnnotationLayer={true}
                      renderTextLayer={true}
                    />
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Pág. {pageNumber + 1}
                    </span>
                   </div>
                )}
              </div>
            </Document>
          ) : (
            <span className="text-gray-500 self-center bg-gray-800 px-4 py-2 rounded-md">Documento no disponible</span>
          )}
        </div>

        {/* --- Footer de Paginación --- */}
        {numPages > 0 && (
          <div className="bg-gray-800 border-t border-gray-700 p-3 md:p-4 flex items-center justify-center gap-6 text-white shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
             <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <span className="text-sm font-medium tabular-nums bg-gray-700 px-3 py-1 rounded-full">
              {isDualView && pageNumber + 1 <= numPages
                ? `${pageNumber} - ${pageNumber + 1} de ${numPages}` 
                : `${pageNumber} de ${numPages}`
              }
            </span>

            <button
              onClick={() => changePage(1)}
              // Deshabilitar si la siguiente página (o el par siguiente en dual) supera el total
              disabled={isDualView ? (pageNumber + 1 >= numPages) : (pageNumber >= numPages)}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}