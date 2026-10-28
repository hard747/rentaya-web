import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { ModalAlquilar } from '../../components/ModalAlquilar'
import { Aviso, Boton, Cargando, Celda, Encabezado, Insignia, Paginacion, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { formatoFecha, formatoMoneda, formatoNumero } from '../../lib/format'
import type { Alquiler, Pagina, Vehiculo } from '../../lib/types'
import { CampoSelector, CampoTexto, ModalFormulario, numero, useTrasOperar } from './comun'

export function Alquileres() {
  const [params, setParams] = useSearchParams()
  const [pagina, setPagina] = useState(0)
  const [devolviendo, setDevolviendo] = useState<Alquiler | null>(null)
  const [eligiendo, setEligiendo] = useState(false)
  const [vehiculoElegido, setVehiculoElegido] = useState<Vehiculo | null>(null)
  const trasOperar = useTrasOperar()

  const alquileres = useQuery({
    queryKey: ['alquileres', 'panel', pagina],
    queryFn: () => api<Pagina<Alquiler>>(`/api/v1/alquileres?size=15&page=${pagina}`),
    placeholderData: keepPreviousData,
  })

  // Desde el catálogo, la empresa llega con ?vehiculo=id para alquilarlo a un cliente.
  const idDesdeCatalogo = params.get('vehiculo')
  const vehiculoCatalogo = useQuery({
    queryKey: ['vehiculos', 'uno', idDesdeCatalogo],
    queryFn: () => api<Vehiculo>(`/api/v1/vehiculos/${idDesdeCatalogo}`),
    enabled: idDesdeCatalogo !== null,
  })
  const vehiculoModal = vehiculoElegido ?? vehiculoCatalogo.data ?? null

  const disponibles = useQuery({
    queryKey: ['vehiculos', 'todos'],
    queryFn: () => api<Pagina<Vehiculo>>('/api/v1/vehiculos?size=1000'),
    enabled: eligiendo,
    select: (p) => p.content.filter((v) => v.tipo !== 'CAMION' && v.disponible),
  })

  return (
    <>
      <Encabezado
        titulo="Aluguéis"
        descripcion="Registre aluguéis para clientes e processe devoluções."
        acciones={
          <Boton onClick={() => setEligiendo(true)} icono={<Plus className="size-4" />}>
            Novo aluguel
          </Boton>
        }
      />

      <Tarjeta>
        {alquileres.isLoading ? (
          <Cargando />
        ) : alquileres.isError ? (
          <div className="p-5">
            <Aviso>{mensajeDeError(alquileres.error)}</Aviso>
          </div>
        ) : alquileres.data!.content.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Ainda não há aluguéis.</p>
        ) : (
          <div className="p-1">
            <Tabla cabeceras={['#', 'Cliente', 'Veículo', 'Início', 'Dias', 'Total', 'Status', '']}>
              {alquileres.data!.content.map((a) => (
                <tr key={a.id}>
                  <Celda className="text-zinc-500">{a.id}</Celda>
                  <Celda className="font-medium">{a.cliente}</Celda>
                  <Celda>{a.vehiculo}</Celda>
                  <Celda className="text-zinc-500">{formatoFecha(a.fechaInicio)}</Celda>
                  <Celda className="tabular-nums">{a.dias}</Celda>
                  <Celda className="tabular-nums">{formatoMoneda(a.costoTotal)}</Celda>
                  <Celda>
                    {a.estado === 'ACTIVO' ? (
                      <Insignia tono="verde">Em andamento</Insignia>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        Devolvido {a.fechaDevolucion && formatoFecha(a.fechaDevolucion)} · {formatoNumero(a.kmRecorridos ?? 0)} km
                      </span>
                    )}
                  </Celda>
                  <Celda>
                    {a.estado === 'ACTIVO' && (
                      <Boton variante="secundario" tamano="sm" onClick={() => setDevolviendo(a)} icono={<Undo2 className="size-4" />}>
                        Devolução
                      </Boton>
                    )}
                  </Celda>
                </tr>
              ))}
            </Tabla>
          </div>
        )}
      </Tarjeta>
      {alquileres.data && (
        <Paginacion pagina={alquileres.data.page.number} totalPaginas={alquileres.data.page.totalPages} total={alquileres.data.page.totalElements} onCambiar={setPagina} />
      )}

      <ModalFormulario
        abierto={devolviendo !== null}
        titulo="Registrar devolução"
        descripcion={devolviendo ? `${devolviendo.vehiculo} · ${devolviendo.cliente}` : undefined}
        textoEnviar="Finalizar aluguel"
        onCerrar={() => setDevolviendo(null)}
        onEnviar={async (d) => {
          await api(`/api/v1/alquileres/${devolviendo!.id}/devolucion`, { metodo: 'POST', cuerpo: { kmRecorridos: numero(d, 'km') } })
          trasOperar(['alquileres', 'vehiculos'], 'Devolução registrada: o veículo está disponível novamente')
        }}
      >
        <CampoTexto etiqueta="Quilômetros percorridos" name="km" type="number" min={0.01} step={0.01} required ayuda="São somados à quilometragem do veículo na mesma transação." />
      </ModalFormulario>

      <ModalFormulario
        abierto={eligiendo}
        titulo="Novo aluguel"
        descripcion="Escolha um veículo disponível."
        textoEnviar="Continuar"
        onCerrar={() => setEligiendo(false)}
        onEnviar={async (d) => {
          const elegido = disponibles.data?.find((v) => v.id === numero(d, 'vehiculo'))
          if (!elegido) throw new Error('Escolha um veículo')
          setVehiculoElegido(elegido)
        }}
      >
        <CampoSelector etiqueta="Veículo" name="vehiculo" required disabled={disponibles.isLoading}>
          <option value="">{disponibles.isLoading ? 'Carregando…' : 'Escolha um veículo'}</option>
          {disponibles.data?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.descripcion} · {formatoMoneda(v.tarifaDiariaBase)}/dia
            </option>
          ))}
        </CampoSelector>
      </ModalFormulario>

      <ModalAlquilar
        vehiculo={vehiculoModal}
        onCerrar={() => {
          setVehiculoElegido(null)
          if (idDesdeCatalogo) setParams({}, { replace: true })
        }}
      />
    </>
  )
}
