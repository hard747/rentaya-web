// Cliente HTTP de la API: agrega el token, traduce los errores y avisa cuando el servidor tarda.

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

/** Error con el formato uniforme de la API (GlobalExceptionHandler). */
export class ApiError extends Error {
  readonly status: number
  readonly errores?: Record<string, string>

  constructor(status: number, message: string, errores?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errores = errores
  }
}

let tokenActual: string | null = null
let alExpirarSesion: () => void = () => {}

export function configurarSesion(token: string | null, onExpirada?: () => void) {
  tokenActual = token
  if (onExpirada) alExpirarSesion = onExpirada
}

// El plan gratuito de Render "duerme" el servidor: la primera petición puede tardar ~1 minuto.
const UMBRAL_LENTO_MS = 4000
let lentas = 0
const oyentesLentitud = new Set<(hayLentas: boolean) => void>()

export function suscribirLentitud(oyente: (hayLentas: boolean) => void) {
  oyentesLentitud.add(oyente)
  return () => {
    oyentesLentitud.delete(oyente)
  }
}

function cambiarLentas(delta: number) {
  lentas += delta
  oyentesLentitud.forEach((o) => o(lentas > 0))
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE'

export async function api<T>(ruta: string, opciones: { metodo?: Metodo; cuerpo?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (opciones.cuerpo !== undefined) headers['Content-Type'] = 'application/json'
  const conToken = tokenActual !== null
  if (conToken) headers.Authorization = `Bearer ${tokenActual}`

  let marcadaLenta = false
  const temporizador = setTimeout(() => {
    marcadaLenta = true
    cambiarLentas(1)
  }, UMBRAL_LENTO_MS)

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
  } finally {
    clearTimeout(temporizador)
    if (marcadaLenta) cambiarLentas(-1)
  }

  if (respuesta.status === 204) return undefined as T
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    // Un token vencido o inválido cierra la sesión; un login fallido no (no lleva token).
    if (respuesta.status === 401 && conToken) alExpirarSesion()
    throw new ApiError(
      respuesta.status,
      datos?.message ?? `Error ${respuesta.status}`,
      datos?.errores ?? undefined,
    )
  }
  return datos as T
}

export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.errores) {
      return Object.entries(error.errores)
        .map(([campo, msg]) => `${campo}: ${msg}`)
        .join(' · ')
    }
    return error.message
  }
  return 'Ocurrió un error inesperado.'
}
