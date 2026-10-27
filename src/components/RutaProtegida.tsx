import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { inicioSegunRol, useAuth } from '../lib/auth'
import type { Rol } from '../lib/types'

/**
 * Oculta pantallas según el rol para la experiencia de usuario.
 * La seguridad real está en el backend: sin el rol correcto la API responde 403.
 */
export function RutaProtegida({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { sesion } = useAuth()
  const location = useLocation()
  if (!sesion) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (!roles.includes(sesion.rol)) return <Navigate to={inicioSegunRol(sesion)} replace />
  return children
}
