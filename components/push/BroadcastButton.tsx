'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import AnimatedIcon from '@/components/ui/AnimatedIcon'

export default function BroadcastButton() {
  const [loading, setLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const showBroadcastAlert = async () => {
    const { value: formValues } = await Swal.fire({
      title: '📢 Difusión Global',
      html: `
        <div class="flex flex-col gap-3 text-left">
          <label class="text-sm font-semibold text-gray-700">Título</label>
          <input id="swal-title" class="swal2-input m-0 w-full" placeholder="Ej: Aviso Importante" style="margin: 0 !important;">
          
          <label class="text-sm font-semibold text-gray-700 mt-2">Mensaje</label>
          <textarea id="swal-message" class="swal2-textarea m-0 w-full" placeholder="Escribe el mensaje..." style="margin: 0 !important;"></textarea>
          
          <label class="text-sm font-semibold text-gray-700 mt-2">URL (Opcional)</label>
          <input id="swal-url" class="swal2-input m-0 w-full" placeholder="/" value="/" style="margin: 0 !important;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enviar Ahora',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const title = (document.getElementById('swal-title') as HTMLInputElement).value
        const message = (document.getElementById('swal-message') as HTMLTextAreaElement).value
        const url = (document.getElementById('swal-url') as HTMLInputElement).value

        if (!title || !message) {
          Swal.showValidationMessage('Título y mensaje son requeridos')
          return false
        }

        return { title, message, url }
      }
    })

    if (formValues) {
      handleSend(formValues.title, formValues.message, formValues.url)
    }
  }

  const handleSend = async (title: string, message: string, url: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, url })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Error al enviar')

      Swal.fire({
        icon: 'success',
        title: '¡Enviado!',
        text: `Notificación enviada a ${data.total} dispositivos.`,
        confirmButtonColor: '#d97706',
        timer: 3000
      })
      
    } catch (error) {
      console.error(error)
      toast.error('Error al enviar la difusión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={showBroadcastAlert}
      disabled={loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-14 text-base md:text-xl font-bold gap-3 bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#713F12] border border-[#FEF08A] shadow-sm transition-all duration-200"
    >
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center">
            <AnimatedIcon 
                iconKey="mlwdofpz" 
                trigger={isHovered ? 'loop' : undefined}
                className="w-12 h-12"
            />
        </div>
      )}
      Difusión
    </Button>
  )
}