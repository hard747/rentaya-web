const moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 })
const fecha = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' })

export const formatoMoneda = (valor: number) => moneda.format(valor)
export const formatoNumero = (valor: number) => numero.format(valor)
export const formatoFecha = (iso: string) => fecha.format(new Date(iso))

/** Mes en curso en formato AAAA-MM, como lo espera la API de liquidaciones. */
export function periodoActual(hoy = new Date()) {
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

export const nombreTipo: Record<string, string> = {
  AUTO: 'Auto',
  MOTO: 'Moto',
  CAMION: 'Camión',
  CLIENTE: 'Cliente',
  CLIENTE_PREMIUM: 'Premium',
  CONDUCTOR: 'Conductor',
  MECANICO: 'Mecánico',
  TALLER: 'Taller',
  ADMIN: 'Administrador',
  EMPLEADO: 'Empleado',
}
