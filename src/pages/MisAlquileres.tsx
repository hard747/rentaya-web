import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Aviso, Boton, Cargando, Encabezado, Insignia, Paginacion, Tarjeta, Vacio } from '../components/ui'
import { api, mensajeDeError } from '../lib/api'
import { formatoFecha, formatoMoneda, formatoNumero } from '../lib/format'
import type { Alquiler, Pagina } from '../lib/types'

export function MisAlquileres() {
  const [pagina, setPagina] = useState(0)
  const navigate = useNavigate()
  // El backend filtra por el clienteId del token: un cliente nunca recibe alquileres ajenos.
  const alquileres = useQuery({
    queryKey: ['alquileres', 'mios', pagina],
    queryFn: () => api<Pagina<Alquiler>>(`/api/v1/alquileres?size=10&page=${pagina}`),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Encabezado
        titulo="Meus aluguéis"
        descripcion="Seus aluguéis ativos e seu histórico."
        acciones={<Boton onClick={() => navigate('/')}>Alugar outro veículo</Boton>}
      />
      {alquileres.isLoading ? (
        <Cargando />
      ) : alquileres.isError ? (
        <Aviso>{mensajeDeError(alquileres.error)}</Aviso>
      ) : alquileres.data!.content.length === 0 ? (
        <Tarjeta>
          <Vacio icono={<Receipt className="size-5" />} titulo="Você ainda não tem aluguéis">
            Escolha um carro ou uma moto no catálogo.
          </Vacio>
        </Tarjeta>
      ) : (
        <>
          <ul className="space-y-3">
            {alquileres.data!.content.map((a) => (
              <li key={a.id}>
                <Tarjeta className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{a.vehiculo}</p>
                      {a.estado === 'ACTIVO' ? <Insignia tono="verde">Em andamento</Insignia> : <Insignia>Finalizado</Insignia>}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatoFecha(a.fechaInicio)} · {a.dias} {a.dias === 1 ? 'dia' : 'dias'}
                      {a.kmRecorridos !== undefined && ` · ${formatoNumero(a.kmRecorridos)} km percorridos`}
                    </p>
                  </div>
                  <p className="text-lg font-semibold tabular-nums">{formatoMoneda(a.costoTotal)}</p>
                </Tarjeta>
              </li>
            ))}
          </ul>
          <Paginacion
            pagina={alquileres.data!.page.number}
            totalPaginas={alquileres.data!.page.totalPages}
            total={alquileres.data!.page.totalElements}
            onCambiar={setPagina}
          />
        </>
      )}
    </div>
  )
}
