import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Boton } from './ui'

export function TemaBoton() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.classList.contains('dark'))

  const alternar = () => {
    const nuevo = !oscuro
    document.documentElement.classList.toggle('dark', nuevo)
    try {
      localStorage.setItem('rentaya.tema', nuevo ? 'oscuro' : 'claro')
    } catch {
      // Sin almacenamiento: el tema vale solo para esta visita.
    }
    setOscuro(nuevo)
  }

  return (
    <Boton
      variante="fantasma"
      tamano="sm"
      onClick={alternar}
      aria-label={oscuro ? 'Usar tema claro' : 'Usar tema oscuro'}
      icono={oscuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    />
  )
}
