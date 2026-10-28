import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CLAVE_TOKEN } from './lib/sesion'
import type { Vehiculo } from './lib/types'
import { paginaDe, renderizarEn, simularApi, tokenDePrueba } from './test/utilidades'

const yaris: Vehiculo = {
  id: 1, tipo: 'AUTO', placa: 'ABC-123', marca: 'Toyota', modelo: 'Yaris', anio: 2022, tarifaDiariaBase: 120,
  kilometraje: 0, descripcion: 'Auto Toyota Yaris (ABC-123)', numeroPuertas: 4, disponible: true,
}
const volvo: Vehiculo = {
  id: 2, tipo: 'CAMION', placa: 'CAM-001', marca: 'Volvo', modelo: 'FH', anio: 2020, tarifaDiariaBase: 400,
  kilometraje: 1000, descripcion: 'Camión Volvo FH (CAM-001)', capacidadToneladas: 12,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Catálogo público', () => {
  it('muestra los vehículos y los camiones no se pueden alquilar', async () => {
    simularApi((url) => (url.includes('/api/v1/vehiculos?') ? { body: paginaDe([yaris, volvo]) } : undefined))
    renderizarEn('/')

    const tarjetaYaris = (await screen.findByRole('heading', { name: 'Toyota Yaris' })).closest('div.flex-col') as HTMLElement
    expect(within(tarjetaYaris).getByText('Disponível')).toBeInTheDocument()
    expect(within(tarjetaYaris).getByRole('button', { name: 'Alugar' })).toBeEnabled()

    const tarjetaVolvo = screen.getByRole('heading', { name: 'Volvo FH' }).closest('div.flex-col') as HTMLElement
    expect(within(tarjetaVolvo).getByText('Uso interno')).toBeInTheDocument()
    expect(within(tarjetaVolvo).queryByRole('button', { name: 'Alugar' })).not.toBeInTheDocument()
  })

  it('al alquilar sin sesión lleva al login', async () => {
    simularApi((url) => (url.includes('/api/v1/vehiculos?') ? { body: paginaDe([yaris]) } : undefined))
    const router = renderizarEn('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Alugar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('un cliente ve el precio calculado por el backend y confirma el alquiler', async () => {
    localStorage.setItem(CLAVE_TOKEN, tokenDePrueba({ sub: 'anatorres', rol: ['CLIENTE'], clienteId: 5 }))
    const fetch = simularApi((url, init) => {
      if (url.includes('/api/v1/vehiculos?')) return { body: paginaDe([yaris]) }
      if (url.includes('/cotizacion')) return { body: { clienteId: 5, cliente: 'Ana', vehiculoId: 1, vehiculo: yaris.descripcion, dias: 3, costoTotal: 360 } }
      if (url.endsWith('/api/v1/alquileres') && init.method === 'POST') return { status: 201, body: { id: 9, vehiculo: yaris.descripcion } }
      if (url.includes('/api/v1/alquileres?')) return { body: paginaDe([]) }
    })
    const router = renderizarEn('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Alugar' }))
    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByText(/360,00/)).toBeInTheDocument()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar aluguel' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/mis-alquileres'))
    const post = fetch.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ clienteId: 5, vehiculoId: 1, dias: 3 })
  })
})

describe('Acceso y permisos', () => {
  it('el login guarda el token y lleva al panel según el rol', async () => {
    const token = tokenDePrueba({ sub: 'admin', rol: ['ADMIN'] })
    simularApi((url) => {
      if (url.endsWith('/auth/login')) return { body: { token, tipo: 'Bearer', expiraEnSegundos: 3600, rol: 'ADMIN' } }
      if (url.includes('/api/v1/vehiculos')) return { body: url.includes('estadisticas') ? [] : paginaDe([yaris]) }
      if (url.includes('/api/v1/alquileres')) return { body: paginaDe([]) }
      if (url.includes('/pagos/pendientes')) return { body: { periodo: '2026-10', estado: 'PENDIENTE', pagos: [], total: 0 } }
    })
    const router = renderizarEn('/login')

    await userEvent.type(await screen.findByLabelText('Usuário'), 'admin')
    await userEvent.type(screen.getByLabelText('Senha'), 'clave-secreta')
    await userEvent.click(within(screen.getByRole('form', { name: 'Entrar' })).getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/panel'))
    expect(localStorage.getItem(CLAVE_TOKEN)).toBe(token)
    expect(await screen.findByRole('link', { name: 'Folha de pagamento' })).toBeInTheDocument()
  })

  it('muestra el error de credenciales incorrectas', async () => {
    simularApi(() => ({ status: 401, body: { message: 'Credenciales inválidas' } }))
    renderizarEn('/login')

    await userEvent.type(await screen.findByLabelText('Usuário'), 'admin')
    await userEvent.type(screen.getByLabelText('Senha'), 'incorrecta')
    await userEvent.click(within(screen.getByRole('form', { name: 'Entrar' })).getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Usuário ou senha incorretos')).toBeInTheDocument()
  })

  it('valida el registro en el cliente antes de llamar a la API', async () => {
    const fetch = simularApi(() => undefined)
    renderizarEn('/registro')

    await userEvent.type(await screen.findByLabelText('DNI'), '123')
    await userEvent.click(within(screen.getByRole('form', { name: 'Criar conta' })).getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('O DNI tem exatamente 8 dígitos')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('un EMPLEADO no ve las secciones de administrador y no puede entrar a la planilla', async () => {
    localStorage.setItem(CLAVE_TOKEN, tokenDePrueba({ sub: 'pedro', rol: ['EMPLEADO'] }))
    simularApi((url) => {
      if (url.includes('/api/v1/vehiculos')) return { body: paginaDe([yaris]) }
      if (url.includes('/api/v1/alquileres')) return { body: paginaDe([]) }
    })
    const router = renderizarEn('/panel/planilla')

    await waitFor(() => expect(router.state.location.pathname).toBe('/panel'))
    expect(await screen.findByRole('link', { name: 'Veículos' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Folha de pagamento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument()
  })

  it('sin sesión, el panel redirige al login', async () => {
    simularApi(() => undefined)
    const router = renderizarEn('/panel/vehiculos')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
