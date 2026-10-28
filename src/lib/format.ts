const moneda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const fecha = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

export const formatoMoneda = (valor: number) => moneda.format(valor)
export const formatoNumero = (valor: number) => numero.format(valor)
export const formatoFecha = (iso: string) => fecha.format(new Date(iso))

/** Mes en curso en formato AAAA-MM, como lo espera la API de liquidaciones. */
export function periodoActual(hoy = new Date()) {
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

export const nombreTipo: Record<string, string> = {
  AUTO: 'Carro',
  MOTO: 'Moto',
  CAMION: 'Caminhão',
  CLIENTE: 'Cliente',
  CLIENTE_PREMIUM: 'Premium',
  CONDUCTOR: 'Motorista',
  MECANICO: 'Mecânico',
  TALLER: 'Oficina',
  ADMIN: 'Administrador',
  EMPLEADO: 'Funcionário',
}
