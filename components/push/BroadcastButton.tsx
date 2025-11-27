'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

export default function BroadcastButton() {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.warning('Por favor completa el título y el mensaje')
      return
    }

    if (!confirm(`¿Estás seguro de enviar esta notificación a TODOS los usuarios?\n\nTítulo: "${title}"\nMensaje: "${message}"`)) return

    setLoading(true)
    try {
      const response = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title,
          body: message 
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Error al enviar')

      toast.success(`Enviado correctamente a ${data.total} dispositivos`)
      setTitle('')
      setMessage('')
    } catch (error) {
      console.error(error)
      toast.error('Error al enviar difusión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full mb-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-red-200 shadow-sm">
      <h3 className="text-red-600 font-bold text-sm mb-3">Panel de Difusión Global</h3>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la notificación"
          className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
          disabled={loading}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe el mensaje para todos los usuarios..."
            className="flex-grow p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={loading}
          />
          <button
            onClick={handleBroadcast}
            disabled={loading || !title.trim() || !message.trim()}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-bold transition-colors min-w-[100px]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}