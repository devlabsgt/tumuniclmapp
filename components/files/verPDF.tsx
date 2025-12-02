'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Columns, Smartphone, ExternalLink } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

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
  const [isDualView, setIsDualView] = useState<boolean>(false)
  const [canDualView, setCanDualView] = useState<boolean>(false)
  
  const [containerWidth, setContainerWidth] = useState<number>(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        setContainerWidth(width)

        const isBigScreen = width >= 768
        setCanDualView(isBigScreen)

        if (!isBigScreen) {
          setIsDualView(false)
        } else {
          if (scale === 1.0 && !isDualView) setIsDualView(true) 
        }
      }
    }

    updateDimensions()
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

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
      setUrl(null)
      setPageNumber(1)
      setScale(1.0)
      setNumPages(0)
    }
  }, [isOpen, filePath, bucketName])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        e.stopPropagation()

        const direction = e.deltaY < 0 ? 1 : -1
        const step = 0.1

        setScale(prev => {
          let next = prev + (direction * step)
          next = Math.round(next * 10) / 10
          return Math.min(Math.max(0.2, next), 5.0)
        })
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const changePage = (offset: number) => {
    setPageNumber(prev => {
      const step = isDualView ? 2 : 1
      const newPage = prev + (offset * step)
      if (newPage < 1) return 1
      if (newPage > numPages) return prev
      return newPage
    })
  }

  const toggleViewMode = () => {
    if (!canDualView) return
    
    setIsDualView(prev => {
      const nuevoModo = !prev
      if (nuevoModo && pageNumber % 2 === 0 && pageNumber > 1) {
        setPageNumber(pageNumber - 1)
      }
      return nuevoModo
    })
  }

  const getPageWidth = () => {
    if (!containerWidth) return undefined
    const gap = 48 
    const available = containerWidth - gap

    if (isDualView) {
      return (available / 2) * scale
    } else {
      return available * scale
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-0 md:p-4 backdrop-blur-sm transition-all">
      <div className="relative w-full h-full md:h-[95vh] md:max-w-[95vw] bg-gray-900 md:rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 text-white shrink-0 z-10 relative shadow-md">
          <div className="flex items-center gap-4 overflow-hidden">
             <h3 className="text-sm font-semibold truncate max-w-[150px] md:max-w-md" title={fileName}>
              {fileName}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-1 py-1">
              <button 
                onClick={() => setScale(s => Math.max(0.2, Number((s - 0.1).toFixed(1))))} 
                className="p-1.5 hover:text-blue-400 rounded-md hover:bg-gray-600"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono w-10 text-center hidden sm:block">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale(s => Math.min(5.0, Number((s + 0.1).toFixed(1))))} 
                className="p-1.5 hover:text-blue-400 rounded-md hover:bg-gray-600"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {canDualView && (
              <button 
                onClick={toggleViewMode}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 transition-colors"
                title={isDualView ? "Cambiar a vista simple" : "Cambiar a vista libro"}
              >
                {isDualView ? <Smartphone size={16} /> : <Columns size={16} />}
                <span>{isDualView ? 'Libro' : 'Simple'}</span>
              </button>
            )}

             {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors hidden sm:flex"
                title="Abrir nativo"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}

            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-red-600/20 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="flex-1 bg-gray-900/50 overflow-auto relative flex items-start justify-center p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        >
          {loadingUrl ? (
            <div className="self-center flex flex-col items-center gap-2">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
               <span className="text-gray-400 text-sm">Cargando...</span>
            </div>
          ) : url ? (
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="self-center flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><span className="text-gray-400 text-sm">Procesando...</span></div>}
              error={<div className="text-red-400 self-center font-medium bg-red-900/20 px-4 py-2 rounded-md">Error al cargar PDF</div>}
              className="flex justify-center"
              externalLinkTarget="_blank"
            >
              <div 
                className="grid gap-6 transition-all duration-300 ease-in-out"
                style={{
                  gridTemplateColumns: isDualView ? '1fr 1fr' : '1fr'
                }}
              >
                <div className="relative shadow-2xl bg-white">
                  <Page 
                    pageNumber={pageNumber} 
                    width={getPageWidth()}
                    className="bg-white"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={<div style={{ height: 600 }} className="bg-white/10 animate-pulse w-full" />}
                  />
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                    {pageNumber}
                  </span>
                </div>
                
                {isDualView && pageNumber + 1 <= numPages && (
                   <div className="relative shadow-2xl bg-white">
                    <Page 
                      pageNumber={pageNumber + 1} 
                      width={getPageWidth()}
                      className="bg-white"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<div style={{ height: 600 }} className="bg-white/10 animate-pulse w-full" />}
                    />
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                      {pageNumber + 1}
                    </span>
                   </div>
                )}
              </div>
            </Document>
          ) : (
            <span className="text-gray-500 self-center bg-gray-800 px-4 py-2 rounded-md">No disponible</span>
          )}
        </div>

        {numPages > 0 && (
          <div className="bg-gray-800 border-t border-gray-700 p-3 md:p-4 flex items-center justify-center gap-6 text-white shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
             <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
              disabled={isDualView ? (pageNumber + 1 >= numPages) : (pageNumber >= numPages)}
              className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}