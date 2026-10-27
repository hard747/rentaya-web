import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { crearQueryClient, rutas } from '../App'

/** JWT de prueba con la misma forma que los que emite TokenService (la firma no se verifica en el cliente). */
export function tokenDePrueba(claims: Record<string, unknown>) {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const exp = Math.floor(Date.now() / 1000) + 3600
  return `${b64({ alg: 'HS256' })}.${b64({ iss: 'rentaya-api', exp, ...claims })}.firma`
}

type Manejador = (url: string, init: RequestInit) => { status?: number; body?: unknown } | undefined

/** Reemplaza fetch por una API simulada; las rutas no previstas fallan el test con 404. */
export function simularApi(manejador: Manejador) {
  const fetchSimulado = vi.fn(async (entrada: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(entrada)
    const respuesta = manejador(url, init) ?? { status: 404, body: { message: `Ruta no simulada: ${url}` } }
    const status = respuesta.status ?? 200
    return new Response(status === 204 ? null : JSON.stringify(respuesta.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchSimulado)
  return fetchSimulado
}

export function renderizarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  const queryClient = crearQueryClient()
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

export const paginaDe = <T,>(content: T[]) => ({
  content,
  page: { size: 12, number: 0, totalElements: content.length, totalPages: 1 },
})
