import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, configurarSesion } from './api'
import { guardarToken, leerToken, tokenGuardado, type Sesion } from './sesion'
import type { TokenResponse } from './types'

interface DatosRegistro {
  username: string
  password: string
  nombre: string
  dni: string
  email: string
}

interface ContextoAuth {
  sesion: Sesion | null
  iniciarSesion: (username: string, password: string) => Promise<Sesion>
  registrarse: (datos: DatosRegistro) => Promise<Sesion>
  cerrarSesion: () => void
}

const AuthContext = createContext<ContextoAuth | null>(null)

function sesionInicial(): Sesion | null {
  const token = tokenGuardado()
  const sesion = token ? leerToken(token) : null
  if (!sesion) guardarToken(null)
  configurarSesion(sesion?.token ?? null)
  return sesion
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(sesionInicial)
  const queryClient = useQueryClient()

  const aplicar = useCallback(
    (token: string | null) => {
      const nueva = token ? leerToken(token) : null
      guardarToken(nueva?.token ?? null)
      configurarSesion(nueva?.token ?? null)
      queryClient.clear()
      setSesion(nueva)
      return nueva
    },
    [queryClient],
  )

  const cerrarSesion = useCallback(() => {
    aplicar(null)
  }, [aplicar])

  // Si la API responde 401 con un token (vencido o revocado), la sesión se cierra.
  useEffect(() => {
    configurarSesion(sesion?.token ?? null, cerrarSesion)
  }, [sesion, cerrarSesion])

  // Cierra la sesión justo cuando vence el token.
  useEffect(() => {
    if (!sesion) return
    const id = setTimeout(cerrarSesion, Math.max(0, sesion.expira - Date.now()))
    return () => clearTimeout(id)
  }, [sesion, cerrarSesion])

  const valor = useMemo<ContextoAuth>(() => {
    const conToken = (respuesta: TokenResponse) => {
      const nueva = aplicar(respuesta.token)
      if (!nueva) throw new Error('La API devolvió un token inválido')
      return nueva
    }
    return {
      sesion,
      cerrarSesion,
      iniciarSesion: async (username, password) =>
        conToken(await api<TokenResponse>('/api/v1/auth/login', { metodo: 'POST', cuerpo: { username, password } })),
      registrarse: async (datos) =>
        conToken(await api<TokenResponse>('/api/v1/auth/registro', { metodo: 'POST', cuerpo: datos })),
    }
  }, [sesion, aplicar, cerrarSesion])

  return <AuthContext value={valor}>{children}</AuthContext>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return contexto
}

/** Página de inicio según el rol: la empresa va al panel y el cliente a sus alquileres. */
export function inicioSegunRol(sesion: Sesion | null) {
  if (!sesion) return '/'
  return sesion.rol === 'CLIENTE' ? '/mis-alquileres' : '/panel'
}
