import { useQuery } from '@tanstack/react-query'
import { CalendarCheck } from 'lucide-react'
import { useState } from 'react'
import { Aviso, Boton, Cargando, Celda, Encabezado, Entrada, Insignia, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { formatoMoneda, nombreTipo, periodoActual } from '../../lib/format'
import type { Planilla as TipoPlanilla } from '../../lib/types'
import { ModalFormulario, useTrasOperar } from './comun'

function TablaPagos({ planilla }: { planilla: TipoPlanilla }) {
  if (planilla.pagos.length === 0) return <p className="p-6 text-sm text-zinc-500">No hay pagos en este periodo.</p>
  return (
    <div className="p-1">
      <Tabla cabeceras={['Beneficiario', 'Tipo', 'Identificador', 'Monto']}>
        {planilla.pagos.map((p) => (
          <tr key={`${p.tipo}-${p.identificador}`}>
            <Celda className="font-medium">{p.beneficiario}</Celda>
            <Celda>{nombreTipo[p.tipo] ?? p.tipo}</Celda>
            <Celda className="tabular-nums text-zinc-500">{p.identificador}</Celda>
            <Celda className="tabular-nums">{formatoMoneda(p.monto)}</Celda>
          </tr>
        ))}
        <tr className="bg-zinc-50 font-semibold dark:bg-zinc-800/50">
          <Celda>Total</Celda>
          <Celda />
          <Celda />
          <Celda className="tabular-nums">{formatoMoneda(planilla.total)}</Celda>
        </tr>
      </Tabla>
    </div>
  )
}

export function Planilla() {
  const [confirmando, setConfirmando] = useState(false)
  const [periodoHistorial, setPeriodoHistorial] = useState(periodoActual())
  const trasOperar = useTrasOperar()
  const periodo = periodoActual()

  const pendiente = useQuery({ queryKey: ['planilla', 'pendiente'], queryFn: () => api<TipoPlanilla>('/api/v1/pagos/pendientes') })
  const historial = useQuery({
    queryKey: ['planilla', 'historial', periodoHistorial],
    queryFn: () => api<TipoPlanilla>(`/api/v1/pagos/liquidaciones/${periodoHistorial}`),
    enabled: /^\d{4}-\d{2}$/.test(periodoHistorial),
  })

  return (
    <>
      <Encabezado
        titulo="Planilla mensual"
        descripcion="Todo lo que es Pagable: conductores, mecánicos y talleres, recorridos con polimorfismo."
        acciones={
          <Boton onClick={() => setConfirmando(true)} icono={<CalendarCheck className="size-4" />} disabled={!pendiente.data?.pagos.length}>
            Liquidar {periodo}
          </Boton>
        }
      />

      <Tarjeta>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="font-semibold">Pendiente del mes</h2>
          {pendiente.data && <Insignia tono="ambar">{pendiente.data.estado}</Insignia>}
        </div>
        {pendiente.isLoading ? <Cargando /> : pendiente.isError ? <div className="p-5"><Aviso>{mensajeDeError(pendiente.error)}</Aviso></div> : <TablaPagos planilla={pendiente.data!} />}
      </Tarjeta>

      <Tarjeta className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2">
          <h2 className="font-semibold">Historial de liquidaciones</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            Periodo
            <Entrada type="month" className="w-auto" value={periodoHistorial} onChange={(e) => setPeriodoHistorial(e.target.value)} />
          </label>
        </div>
        {historial.isLoading ? (
          <Cargando />
        ) : historial.isError ? (
          <div className="p-5">
            <Aviso>{mensajeDeError(historial.error)}</Aviso>
          </div>
        ) : historial.data?.estado === 'SIN_PAGOS' ? (
          <p className="p-6 text-sm text-zinc-500">El periodo {periodoHistorial} no se ha liquidado.</p>
        ) : (
          historial.data && <TablaPagos planilla={historial.data} />
        )}
      </Tarjeta>

      <ModalFormulario
        abierto={confirmando}
        titulo={`Liquidar ${periodo}`}
        descripcion="Registra todos los pagos y reinicia los contadores del mes (viajes, horas extra y facturas) en una sola transacción."
        textoEnviar="Liquidar"
        onCerrar={() => setConfirmando(false)}
        onEnviar={async () => {
          await api(`/api/v1/pagos/liquidaciones/${periodo}`, { metodo: 'POST' })
          setPeriodoHistorial(periodo)
          trasOperar(['planilla', 'empleados', 'talleres'], `Planilla de ${periodo} liquidada`)
        }}
      >
        {pendiente.data && (
          <p className="text-sm">
            Se pagarán <strong>{pendiente.data.pagos.length}</strong> beneficiarios por un total de <strong>{formatoMoneda(pendiente.data.total)}</strong>. Un mes solo puede liquidarse una vez.
          </p>
        )}
      </ModalFormulario>
    </>
  )
}
