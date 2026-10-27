import type { Rol } from './types'

export interface Sesion {
  token: string
  username: string
  rol: Rol
  clienteId?: number
  /** Vencimiento en milisegundos desde epoch. */
  expira: number
}

/**
 * Lee el payload del JWT sin verificar la firma: eso lo hace el backend en cada petición.
 * Aquí solo se usa para mostrar el menú correcto y saber cuándo vence.
 */
export function leerToken(token: string, ahora = Date.now()): Sesion | null {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const json = JSON.parse(new TextDecoder().decode(bytes))
    const rol = Array.isArray(json.rol) ? json.rol[0] : json.rol
    const expira = json.exp * 1000
    if (!json.sub || !rol || !(expira > ahora)) return null
    return { token, username: json.sub, rol, clienteId: json.clienteId ?? undefined, expira }
  } catch {
    return null
  }
}

export const CLAVE_TOKEN = 'rentaya.token'

export function tokenGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

export function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token)
    else localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // Sin almacenamiento (modo privado): la sesión dura hasta recargar.
  }
}
