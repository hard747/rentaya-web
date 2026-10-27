import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router'
import { AvisoServidor } from './components/AvisoServidor'
import { LayoutPublico } from './components/LayoutPublico'
import { NotificacionesProvider } from './components/Notificaciones'
import { RutaProtegida } from './components/RutaProtegida'
import { Cargando } from './components/ui'
import { ApiError } from './lib/api'
import { AuthProvider } from './lib/auth'
import { Catalogo } from './pages/Catalogo'
import { NoEncontrado } from './pages/NoEncontrado'

/** Carga diferida: el catálogo público llega rápido y el resto se descarga al entrar a cada sección. */
function diferido<M>(cargar: () => Promise<M>, nombre: keyof M) {
  return lazy(() => cargar().then((m) => ({ default: m[nombre] as ComponentType })))
}

const Login = diferido(() => import('./pages/Acceso'), 'Login')
const Registro = diferido(() => import('./pages/Acceso'), 'Registro')
const MisAlquileres = diferido(() => import('./pages/MisAlquileres'), 'MisAlquileres')
const LayoutPanel = diferido(() => import('./components/LayoutPanel'), 'LayoutPanel')
const Resumen = diferido(() => import('./pages/panel/Resumen'), 'Resumen')
const Vehiculos = diferido(() => import('./pages/panel/Vehiculos'), 'Vehiculos')
const Alquileres = diferido(() => import('./pages/panel/Alquileres'), 'Alquileres')
const Clientes = diferido(() => import('./pages/panel/Clientes'), 'Clientes')
const Empleados = diferido(() => import('./pages/panel/Empleados'), 'Empleados')
const Talleres = diferido(() => import('./pages/panel/Talleres'), 'Talleres')
const Planilla = diferido(() => import('./pages/panel/Planilla'), 'Planilla')
const Usuarios = diferido(() => import('./pages/panel/Usuarios'), 'Usuarios')

export function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Los errores 4xx son definitivos (permiso, validación, no existe): no tiene sentido reintentar.
        retry: (intentos, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && intentos < 2,
      },
    },
  })
}

function Raiz() {
  return (
    <AuthProvider>
      <NotificacionesProvider>
        <AvisoServidor />
        <Suspense fallback={<Cargando />}>
          <Outlet />
        </Suspense>
      </NotificacionesProvider>
    </AuthProvider>
  )
}

export const rutas = [
  {
    element: <Raiz />,
    children: [
      {
        element: <LayoutPublico />,
        children: [
          { path: '/', element: <Catalogo /> },
          { path: '/login', element: <Login /> },
          { path: '/registro', element: <Registro /> },
          {
            path: '/mis-alquileres',
            element: (
              <RutaProtegida roles={['CLIENTE']}>
                <MisAlquileres />
              </RutaProtegida>
            ),
          },
          { path: '*', element: <NoEncontrado /> },
        ],
      },
      {
        path: '/panel',
        element: (
          <RutaProtegida roles={['ADMIN', 'EMPLEADO']}>
            <LayoutPanel />
          </RutaProtegida>
        ),
        children: [
          { index: true, element: <Resumen /> },
          { path: 'vehiculos', element: <Vehiculos /> },
          { path: 'alquileres', element: <Alquileres /> },
          { path: 'clientes', element: <Clientes /> },
          ...[
            { path: 'empleados', element: <Empleados /> },
            { path: 'talleres', element: <Talleres /> },
            { path: 'planilla', element: <Planilla /> },
            { path: 'usuarios', element: <Usuarios /> },
          ].map((r) => ({ ...r, element: <RutaProtegida roles={['ADMIN']}>{r.element}</RutaProtegida> })),
        ],
      },
    ],
  },
]

const router = createBrowserRouter(rutas)
const queryClient = crearQueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
