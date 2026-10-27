import { describe, expect, it } from 'vitest'
import { tokenDePrueba } from '../test/utilidades'
import { leerToken } from './sesion'

describe('leerToken', () => {
  it('lee usuario, rol y clienteId del payload', () => {
    const token = tokenDePrueba({ sub: 'anatorres', rol: ['CLIENTE'], clienteId: 7 })
    expect(leerToken(token)).toMatchObject({ username: 'anatorres', rol: 'CLIENTE', clienteId: 7 })
  })

  it('acepta un ADMIN sin clienteId', () => {
    const sesion = leerToken(tokenDePrueba({ sub: 'admin', rol: ['ADMIN'] }))
    expect(sesion?.rol).toBe('ADMIN')
    expect(sesion?.clienteId).toBeUndefined()
  })

  it('rechaza un token vencido', () => {
    const token = tokenDePrueba({ sub: 'admin', rol: ['ADMIN'], exp: Math.floor(Date.now() / 1000) - 10 })
    expect(leerToken(token)).toBeNull()
  })

  it('rechaza texto que no es un JWT', () => {
    expect(leerToken('no-es-un-token')).toBeNull()
    expect(leerToken('a.b.c')).toBeNull()
  })
})
