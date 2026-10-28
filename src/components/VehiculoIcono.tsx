import clsx from 'clsx'
import { Bike, CarFront, Truck } from 'lucide-react'
import type { TipoVehiculo } from '../lib/types'

const iconos = { AUTO: CarFront, MOTO: Bike, CAMION: Truck }
const fondos = {
  AUTO: 'from-marca-500 to-marca-700',
  MOTO: 'from-emerald-500 to-teal-700',
  CAMION: 'from-amber-500 to-orange-700',
}

export function VehiculoIcono({ tipo, grande }: { tipo: TipoVehiculo; grande?: boolean }) {
  const Icono = iconos[tipo]
  return (
    <div className={clsx('grid place-items-center bg-gradient-to-br text-white', fondos[tipo], grande ? 'h-36 rounded-t-xl' : 'size-9 rounded-lg')}>
      <Icono className={grande ? 'size-14 opacity-90' : 'size-4.5'} strokeWidth={grande ? 1.25 : 2} aria-hidden />
    </div>
  )
}

export function detallesVehiculo(v: { tipo: TipoVehiculo; numeroPuertas?: number; cilindrada?: number; incluyeCasco?: boolean; capacidadToneladas?: number }) {
  if (v.tipo === 'AUTO') return `${v.numeroPuertas} portas`
  if (v.tipo === 'MOTO') return `${v.cilindrada} cc${v.incluyeCasco ? ' · com capacete' : ''}`
  return `${v.capacidadToneladas} t de carga`
}
