import clsx from 'clsx'
import {
  Building2,
  CarFront,
  Gauge,
  HardHat,
  KeyRound,
  LogOut,
  Menu,
  Receipt,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Suspense, useState, type ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../lib/auth'
import { nombreTipo } from '../lib/format'
import type { Rol } from '../lib/types'
import { Logo } from './Logo'
import { TemaBoton } from './TemaBoton'
import { Boton, Cargando } from './ui'

interface Seccion {
  ruta: string
  texto: string
  icono: ComponentType<{ className?: string }>
  roles: Rol[]
}

// Mismos permisos que SecurityConfig en el backend.
const SECCIONES: Seccion[] = [
  { ruta: '/panel', texto: 'Resumen', icono: Gauge, roles: ['ADMIN', 'EMPLEADO'] },
  { ruta: '/panel/vehiculos', texto: 'Vehículos', icono: CarFront, roles: ['ADMIN', 'EMPLEADO'] },
  { ruta: '/panel/alquileres', texto: 'Alquileres', icono: Receipt, roles: ['ADMIN', 'EMPLEADO'] },
  { ruta: '/panel/clientes', texto: 'Clientes', icono: Users, roles: ['ADMIN', 'EMPLEADO'] },
  { ruta: '/panel/empleados', texto: 'Empleados', icono: HardHat, roles: ['ADMIN'] },
  { ruta: '/panel/talleres', texto: 'Talleres', icono: Building2, roles: ['ADMIN'] },
  { ruta: '/panel/planilla', texto: 'Planilla', icono: Wallet, roles: ['ADMIN'] },
  { ruta: '/panel/usuarios', texto: 'Usuarios', icono: KeyRound, roles: ['ADMIN'] },
]

export function seccionesPara(rol: Rol) {
  return SECCIONES.filter((s) => s.roles.includes(rol))
}

export function LayoutPanel() {
  const { sesion, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  if (!sesion) return null

  const menu = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones del panel">
      {seccionesPara(sesion.rol).map(({ ruta, texto, icono: Icono }) => (
        <NavLink
          key={ruta}
          to={ruta}
          end={ruta === '/panel'}
          onClick={() => setMenuAbierto(false)}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-marca-50 text-marca-700 dark:bg-marca-500/10 dark:text-marca-200'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
            )
          }
        >
          <Icono className="size-4" />
          {texto}
        </NavLink>
      ))}
    </nav>
  )

  const usuario = (
    <div className="flex items-center justify-between gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
      <div className="min-w-0 px-2">
        <p className="truncate text-sm font-medium">{sesion.username}</p>
        <p className="text-xs text-zinc-500">{nombreTipo[sesion.rol]}</p>
      </div>
      <div className="flex">
        <TemaBoton />
        <Boton variante="fantasma" tamano="sm" onClick={cerrarSesion} aria-label="Cerrar sesión" icono={<LogOut className="size-4" />} />
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-zinc-200 bg-white lg:flex dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        {menu}
        {usuario}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <Logo />
        <Boton
          variante="fantasma"
          tamano="sm"
          onClick={() => setMenuAbierto((a) => !a)}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          icono={menuAbierto ? <X className="size-5" /> : <Menu className="size-5" />}
        />
      </header>
      {menuAbierto && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-20 flex flex-col bg-white lg:hidden dark:bg-zinc-900">
          {menu}
          {usuario}
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<Cargando />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
