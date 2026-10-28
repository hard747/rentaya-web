import { useQuery } from '@tanstack/react-query'
import { CalendarCheck } from 'lucide-react'
import { useState } from 'react'
import { Aviso, Boton, Cargando, Celda, Encabezado, Entrada, Insignia, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { formatoMoneda, nombreTipo, periodoActual } from '../../lib/format'
import type { Planilla as TipoPlanilla } from '../../lib/types'
import { ModalFormulario, useTrasOperar } from './comun'

const nombreEstado: Record<string, string> = { PENDIENTE: 'Pendente', PAGADO: 'Pago', SIN_PAGOS: 'Sem pagamentos' }

function TablaPagos({ planilla }: { planilla: TipoPlanilla }) {
  if (planilla.pagos.length === 0) return <p className="p-6 text-sm text-zinc-500">Não há pagamentos neste período.</p>
  return (
    <div className="p-1">
      <Tabla cabeceras={['Beneficiário', 'Tipo', 'Identificador', 'Valor']}>
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
        titulo="Folha de pagamento mensal"
        descripcion="Tudo o que é Pagable: motoristas, mecânicos e oficinas, percorridos com polimorfismo."
        acciones={
          <Boton onClick={() => setConfirmando(true)} icono={<CalendarCheck className="size-4" />} disabled={!pendiente.data?.pagos.length}>
            Fechar {periodo}
          </Boton>
        }
      />

      <Tarjeta>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="font-semibold">Pendente do mês</h2>
          {pendiente.data && <Insignia tono="ambar">{nombreEstado[pendiente.data.estado] ?? pendiente.data.estado}</Insignia>}
        </div>
        {pendiente.isLoading ? <Cargando /> : pendiente.isError ? <div className="p-5"><Aviso>{mensajeDeError(pendiente.error)}</Aviso></div> : <TablaPagos planilla={pendiente.data!} />}
      </Tarjeta>

      <Tarjeta className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2">
          <h2 className="font-semibold">Histórico de fechamentos</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            Período
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
          <p className="p-6 text-sm text-zinc-500">O período {periodoHistorial} ainda não foi fechado.</p>
        ) : (
          historial.data && <TablaPagos planilla={historial.data} />
        )}
      </Tarjeta>

      <ModalFormulario
        abierto={confirmando}
        titulo={`Fechar ${periodo}`}
        descripcion="Registra todos os pagamentos e zera os contadores do mês (viagens, horas extras e notas fiscais) em uma única transação."
        textoEnviar="Fechar folha"
        onCerrar={() => setConfirmando(false)}
        onEnviar={async () => {
          await api(`/api/v1/pagos/liquidaciones/${periodo}`, { metodo: 'POST' })
          setPeriodoHistorial(periodo)
          trasOperar(['planilla', 'empleados', 'talleres'], `Folha de ${periodo} fechada`)
        }}
      >
        {pendiente.data && (
          <p className="text-sm">
            Serão pagos <strong>{pendiente.data.pagos.length}</strong> beneficiários, em um total de <strong>{formatoMoneda(pendiente.data.total)}</strong>. Cada mês só pode ser fechado uma vez.
          </p>
        )}
      </ModalFormulario>
    </>
  )
}
