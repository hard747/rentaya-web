import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { api, mensajeDeError } from '../lib/api'
import { formatoMoneda } from '../lib/format'
import type { Alquiler, Cliente, Cotizacion, Pagina, Vehiculo } from '../lib/types'
import { useNotificar } from './Notificaciones'
import { Aviso, Boton, Campo, Entrada, Modal, Selector } from './ui'

interface Props {
  vehiculo: Vehiculo | null
  /** Para un CLIENTE es su propio id (del token); para la empresa se elige en el formulario. */
  clienteFijo?: number
  onCerrar: () => void
  onAlquilado?: (alquiler: Alquiler) => void
}

export function ModalAlquilar({ vehiculo, clienteFijo, onCerrar, onAlquilado }: Props) {
  const [dias, setDias] = useState('3')
  const [clienteElegido, setClienteElegido] = useState('')
  const notificar = useNotificar()
  const queryClient = useQueryClient()

  const clientes = useQuery({
    queryKey: ['clientes', 'todos'],
    queryFn: () => api<Pagina<Cliente>>('/api/v1/clientes?size=500&sort=nombre'),
    enabled: vehiculo !== null && clienteFijo === undefined,
  })

  const clienteId = clienteFijo ?? (clienteElegido ? Number(clienteElegido) : undefined)
  const diasNumero = Number(dias)
  const diasValidos = Number.isInteger(diasNumero) && diasNumero > 0 && diasNumero <= 365
  const diasDiferidos = useDeferredValue(diasNumero)

  // El precio lo calcula el backend (descuentos de 7 días, motos y clientes premium).
  const cotizacion = useQuery({
    queryKey: ['cotizacion', clienteId, vehiculo?.id, diasDiferidos],
    queryFn: () =>
      api<Cotizacion>(`/api/v1/alquileres/cotizacion?clienteId=${clienteId}&vehiculoId=${vehiculo!.id}&dias=${diasDiferidos}`),
    enabled: vehiculo !== null && clienteId !== undefined && diasValidos,
    placeholderData: (anterior) => anterior,
  })

  const alquilar = useMutation({
    mutationFn: () =>
      api<Alquiler>('/api/v1/alquileres', { metodo: 'POST', cuerpo: { clienteId, vehiculoId: vehiculo!.id, dias: diasNumero } }),
    onSuccess: (alquiler) => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
      queryClient.invalidateQueries({ queryKey: ['alquileres'] })
      notificar(`Alquiler confirmado: ${alquiler.vehiculo}`)
      onAlquilado?.(alquiler)
      cerrar()
    },
  })

  const cerrar = () => {
    alquilar.reset()
    setDias('3')
    setClienteElegido('')
    onCerrar()
  }

  return (
    <Modal abierto={vehiculo !== null} titulo="Alquilar vehículo" descripcion={vehiculo?.descripcion} onCerrar={cerrar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (diasValidos && clienteId !== undefined) alquilar.mutate()
        }}
      >
        {clienteFijo === undefined && (
          <Campo etiqueta="Cliente">
            {(p) => (
              <Selector {...p} required value={clienteElegido} onChange={(e) => setClienteElegido(e.target.value)} disabled={clientes.isLoading}>
                <option value="">{clientes.isLoading ? 'Cargando clientes…' : 'Elige un cliente'}</option>
                {clientes.data?.content.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} · DNI {c.dni}
                    {c.rol === 'CLIENTE_PREMIUM' ? ` · Premium ${c.porcentajeDescuento}%` : ''}
                  </option>
                ))}
              </Selector>
            )}
          </Campo>
        )}
        <Campo etiqueta="Días de alquiler" error={dias && !diasValidos ? 'Ingresa un número de días entre 1 y 365' : undefined} ayuda="Desde 7 días los autos tienen 10% de descuento.">
          {(p) => <Entrada {...p} type="number" min={1} max={365} inputMode="numeric" required value={dias} onChange={(e) => setDias(e.target.value)} />}
        </Campo>

        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-zinc-500">Total a pagar</span>
            <span className="text-2xl font-semibold tabular-nums" aria-live="polite">
              {cotizacion.data && diasValidos ? formatoMoneda(cotizacion.data.costoTotal) : '—'}
            </span>
          </div>
          {vehiculo && (
            <p className="mt-1 text-xs text-zinc-500">
              Tarifa base {formatoMoneda(vehiculo.tarifaDiariaBase)} por día · precio final calculado por el servidor
            </p>
          )}
        </div>

        {cotizacion.isError && <Aviso>{mensajeDeError(cotizacion.error)}</Aviso>}
        {alquilar.isError && <Aviso>{mensajeDeError(alquilar.error)}</Aviso>}

        <div className="flex justify-end gap-2 pt-2">
          <Boton variante="secundario" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={alquilar.isPending} disabled={!diasValidos || clienteId === undefined || !cotizacion.data}>
            Confirmar alquiler
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
