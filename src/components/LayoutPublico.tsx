import { LayoutDashboard, LogOut, Receipt } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { nombreTipo } from '../lib/format'
import { Logo } from './Logo'
import { TemaBoton } from './TemaBoton'
import { Boton } from './ui'

const enlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
  }`

export function LayoutPublico() {
  const { sesion, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/" end className={enlace}>
                Catálogo
              </NavLink>
              {sesion?.rol === 'CLIENTE' && (
                <NavLink to="/mis-alquileres" className={enlace}>
                  Meus aluguéis
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <TemaBoton />
            {sesion ? (
              <>
                <span className="hidden text-sm text-zinc-500 md:inline">
                  {sesion.username} · {nombreTipo[sesion.rol]}
                </span>
                {sesion.rol === 'CLIENTE' ? (
                  <Link
                    to="/mis-alquileres"
                    aria-label="Meus aluguéis"
                    className="grid size-8 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <Receipt className="size-4" />
                  </Link>
                ) : (
                  <Boton tamano="sm" onClick={() => navigate('/panel')} icono={<LayoutDashboard className="size-4" />}>
                    Painel
                  </Boton>
                )}
                <Boton variante="fantasma" tamano="sm" onClick={cerrarSesion} icono={<LogOut className="size-4" />} aria-label="Sair" />
              </>
            ) : (
              <>
                <Boton variante="fantasma" tamano="sm" onClick={() => navigate('/login')}>
                  Entrar
                </Boton>
                <Boton tamano="sm" onClick={() => navigate('/registro')}>
                  Criar conta
                </Boton>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        RentaYa · React + Spring Boot ·{' '}
        <a className="underline hover:text-zinc-900 dark:hover:text-white" href="https://github.com/hard747/rentaya-web">
          código-fonte
        </a>
      </footer>
    </div>
  )
}
