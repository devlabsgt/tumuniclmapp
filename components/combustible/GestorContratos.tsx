import { createClient } from '@/utils/supabase/server'
import ContratoList from './ContratoList'

export default async function GestorContratos() {
  const supabase = await createClient()

  const { data: contratos } = await supabase
    .from('ContratoCombustible')
    .select(`
      *,
      detalles:DetalleContrato(*)
    `)
    .order('created_at', { ascending: false })
  
  return (
    <div className="w-full">
      <ContratoList contratos={contratos || []} />
    </div>
  )
}