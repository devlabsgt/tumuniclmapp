import { getContratos } from './actions' 
import ContratoList from '@/components/combustible/contrato/ContratoList'

export default async function GestorContratos() {
  const contratos = await getContratos()
  
  return (
    <div className="w-full">
      <ContratoList contratos={contratos} />
    </div>
  )
}