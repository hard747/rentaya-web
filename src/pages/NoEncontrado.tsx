import { MapPinOff } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Boton, Vacio } from '../components/ui'

export function NoEncontrado() {
  const navigate = useNavigate()
  return (
    <div className="px-4 py-20">
      <Vacio icono={<MapPinOff className="size-5" />} titulo="Esta página no existe">
        <Boton className="mt-4" onClick={() => navigate('/')}>
          Ir al catálogo
        </Boton>
      </Vacio>
    </div>
  )
}
