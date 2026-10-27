// Contrato de la API: refleja los DTOs de rentaya-api (paquete dto).

export type Rol = 'ADMIN' | 'EMPLEADO' | 'CLIENTE'
export type TipoVehiculo = 'AUTO' | 'MOTO' | 'CAMION'

export interface Pagina<T> {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

export interface TokenResponse {
  token: string
  tipo: string
  expiraEnSegundos: number
  rol: Rol
}

export interface Vehiculo {
  id: number
  tipo: TipoVehiculo
  placa: string
  marca: string
  modelo: string
  anio: number
  tarifaDiariaBase: number
  kilometraje: number
  descripcion: string
  numeroPuertas?: number
  cilindrada?: number
  incluyeCasco?: boolean
  capacidadToneladas?: number
  disponible?: boolean
}

export interface Mantenimiento {
  id: number
  tipo: TipoVehiculo
  placa: string
  kilometraje: number
  costoMantenimiento: number
}

export interface EstadisticaMarca {
  marca: string
  promedioKilometraje: number
  promedioCilindrada?: number
  cantidad: number
}

export interface Alquiler {
  id: number
  clienteId: number
  cliente: string
  vehiculoId: number
  vehiculo: string
  dias: number
  costoTotal: number
  estado: 'ACTIVO' | 'FINALIZADO'
  fechaInicio: string
  fechaDevolucion?: string
  kmRecorridos?: number
}

export interface Cotizacion {
  clienteId: number
  cliente: string
  vehiculoId: number
  vehiculo: string
  dias: number
  costoTotal: number
}

export interface Cliente {
  id: number
  rol: 'CLIENTE' | 'CLIENTE_PREMIUM'
  nombre: string
  dni: string
  email: string
  porcentajeDescuento?: number
  info: string
}

export interface Empleado {
  id: number
  rol: 'CONDUCTOR' | 'MECANICO'
  nombre: string
  dni: string
  sueldoBase: number
  aniosAntiguedad: number
  bonoAntiguedad: number
  pagoMes: number
  licencia?: string
  viajesMes?: number
  promedioCalificacion?: number
  especialidad?: string
  horasExtraMes?: number
  info: string
}

export interface Revision {
  mecanicoId: number
  vehiculoId: number
  vehiculo: string
  costoMantenimiento: number
}

export interface Taller {
  id: number
  razonSocial: string
  ruc: string
  montoFacturadoMes: number
  pagoMes: number
  promedioCalificacion: number
}

export interface Pago {
  tipo: string
  beneficiario: string
  identificador: string
  monto: number
}

export interface Planilla {
  periodo: string
  estado: string
  pagos: Pago[]
  total: number
}

export interface Usuario {
  id: number
  username: string
  rol: Rol
  clienteId?: number
}
