import { afterEach, describe, expect, it, vi } from 'vitest'
import { simularApi } from '../test/utilidades'
import { api, ApiError, configurarSesion, mensajeDeError } from './api'

afterEach(() => {
  configurarSesion(null, () => {})
  vi.unstubAllGlobals()
})

describe('api', () => {
  it('envía el token en el header Authorization y el cuerpo como JSON', async () => {
    const fetch = simularApi(() => ({ status: 201, body: { id: 1 } }))
    configurarSesion('mi-token')

    await expect(api('/api/v1/clientes', { metodo: 'POST', cuerpo: { nombre: 'Ana' } })).resolves.toEqual({ id: 1 })

    const [, init] = fetch.mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer mi-token', 'Content-Type': 'application/json' })
    expect(init?.body).toBe('{"nombre":"Ana"}')
  })

  it('convierte el error de la API en ApiError con los errores por campo', async () => {
    simularApi(() => ({ status: 400, body: { message: 'Datos inválidos', errores: { dni: 'debe tener 8 dígitos' } } }))

    const error = await api('/api/v1/clientes').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect(mensajeDeError(error)).toBe('dni: debe tener 8 dígitos')
  })

  it('cierra la sesión si un token es rechazado con 401', async () => {
    simularApi(() => ({ status: 401, body: { message: 'Falta el token o no es válido' } }))
    const alExpirar = vi.fn()
    configurarSesion('token-vencido', alExpirar)

    await expect(api('/api/v1/clientes')).rejects.toThrow('Falta el token')
    expect(alExpirar).toHaveBeenCalledOnce()
  })

  it('un login fallido (sin token) no dispara el cierre de sesión', async () => {
    simularApi(() => ({ status: 401, body: { message: 'Usuario o contraseña incorrectos' } }))
    const alExpirar = vi.fn()
    configurarSesion(null, alExpirar)

    await expect(api('/api/v1/auth/login', { metodo: 'POST', cuerpo: {} })).rejects.toBeInstanceOf(ApiError)
    expect(alExpirar).not.toHaveBeenCalled()
  })

  it('responde undefined ante 204 No Content', async () => {
    simularApi(() => ({ status: 204 }))
    await expect(api('/api/v1/vehiculos/1', { metodo: 'DELETE' })).resolves.toBeUndefined()
  })

  it('explica un fallo de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(api('/api/v1/vehiculos')).rejects.toMatchObject({ status: 0 })
  })
})
