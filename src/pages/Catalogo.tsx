import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { SearchX, ShieldCheck, Sparkles, Timer } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ModalAlquilar } from '../components/ModalAlquilar'
import { detallesVehiculo, VehiculoIcono } from '../components/VehiculoIcono'
import { Aviso, Boton, Cargando, Insignia, Paginacion, Selector, Tarjeta, Vacio } from '../components/ui'
import { api, mensajeDeError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatoMoneda, formatoNumero } from '../lib/format'
import type { Pagina, Vehiculo } from '../lib/types'

const FILTROS = [
  { valor: '', texto: 'Todos' },
  { valor: 'AUTO', texto: 'Carros' },
  { valor: 'MOTO', texto: 'Motos' },
  { valor: 'CAMION', texto: 'Caminhões' },
]

const ORDENES = [
  { valor: 'id,desc', texto: 'Mais recentes' },
  { valor: 'tarifaDiariaBase,asc', texto: 'Preço: menor para maior' },
  { valor: 'tarifaDiariaBase,desc', texto: 'Preço: maior para menor' },
  { valor: 'anio,desc', texto: 'Ano: mais novos' },
]

export function Catalogo() {
  const [params, setParams] = useSearchParams()
  const tipo = params.get('tipo') ?? ''
  const orden = params.get('orden') ?? ORDENES[0].valor
  const pagina = Number(params.get('pagina') ?? 0)
  const { sesion } = useAuth()
  const navigate = useNavigate()
  const [elegido, setElegido] = useState<Vehiculo | null>(null)

  const vehiculos = useQuery({
    queryKey: ['vehiculos', 'catalogo', tipo, orden, pagina],
    queryFn: () =>
      api<Pagina<Vehiculo>>(`/api/v1/vehiculos?size=12&page=${pagina}&sort=${orden}${tipo ? `&tipo=${tipo}` : ''}`),
    placeholderData: keepPreviousData,
  })

  const cambiar = (clave: string, valor: string) => {
    const nuevos = new URLSearchParams(params)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    if (clave !== 'pagina') nuevos.delete('pagina')
    setParams(nuevos, { replace: clave !== 'pagina' })
  }

  const alquilar = (v: Vehiculo) => {
    if (!sesion) navigate('/login', { state: { desde: '/' } })
    else if (sesion.rol === 'CLIENTE') setElegido(v)
    else navigate(`/panel/alquileres?vehiculo=${v.id}`)
  }

  return (
    <>
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <Insignia tono="marca">
            <Sparkles className="size-3" /> Carros e motos para cada viagem
          </Insignia>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Alugue um carro ou uma moto em minutos.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-500 text-pretty">
            Escolha o veículo, veja o preço final na hora e confirme. Sem burocracia.
          </p>
          <dl className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-3">
            {[
              { icono: Timer, titulo: '10% de desconto', texto: 'em carros a partir de 7 dias' },
              { icono: ShieldCheck, titulo: 'Capacete incluído', texto: 'em motos selecionadas' },
              { icono: Sparkles, titulo: 'Clientes premium', texto: 'até 30% de desconto' },
            ].map(({ icono: Icono, titulo, texto }) => (
              <div key={titulo} className="flex gap-3">
                <Icono className="mt-0.5 size-5 shrink-0 text-marca-600 dark:text-marca-400" aria-hidden />
                <div>
                  <dt className="text-sm font-medium">{titulo}</dt>
                  <dd className="text-sm text-zinc-500">{texto}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Tipo de veículo" className="flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                role="tab"
                aria-selected={tipo === f.valor}
                onClick={() => cambiar('tipo', f.valor)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  tipo === f.valor
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white',
                )}
              >
                {f.texto}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            Ordenar
            <Selector className="w-auto" value={orden} onChange={(e) => cambiar('orden', e.target.value)}>
              {ORDENES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.texto}
                </option>
              ))}
            </Selector>
          </label>
        </div>

        {vehiculos.isLoading ? (
          <Cargando texto="Carregando veículos…" />
        ) : vehiculos.isError ? (
          <Aviso>{mensajeDeError(vehiculos.error)}</Aviso>
        ) : vehiculos.data!.content.length === 0 ? (
          <Vacio icono={<SearchX className="size-5" />} titulo="Não há veículos deste tipo">
            Tente outro filtro.
          </Vacio>
        ) : (
          <>
            <ul className={clsx('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', vehiculos.isPlaceholderData && 'opacity-60')}>
              {vehiculos.data!.content.map((v) => (
                <li key={v.id}>
                  <TarjetaVehiculo vehiculo={v} onAlquilar={() => alquilar(v)} />
                </li>
              ))}
            </ul>
            <Paginacion
              pagina={vehiculos.data!.page.number}
              totalPaginas={vehiculos.data!.page.totalPages}
              total={vehiculos.data!.page.totalElements}
              onCambiar={(p) => cambiar('pagina', String(p))}
            />
          </>
        )}
      </section>

      <ModalAlquilar
        vehiculo={elegido}
        clienteFijo={sesion?.clienteId}
        onCerrar={() => setElegido(null)}
        onAlquilado={() => navigate('/mis-alquileres')}
      />
    </>
  )
}

function TarjetaVehiculo({ vehiculo: v, onAlquilar }: { vehiculo: Vehiculo; onAlquilar: () => void }) {
  const esCamion = v.tipo === 'CAMION'
  return (
    <Tarjeta className="flex h-full flex-col overflow-hidden">
      <VehiculoIcono tipo={v.tipo} grande />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">
              {v.marca} {v.modelo}
            </h3>
            <p className="text-sm text-zinc-500">
              {v.anio} · {detallesVehiculo(v)}
            </p>
          </div>
          {esCamion ? (
            <Insignia>Uso interno</Insignia>
          ) : v.disponible ? (
            <Insignia tono="verde">Disponível</Insignia>
          ) : (
            <Insignia tono="ambar">Alugado</Insignia>
          )}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {v.placa} · {formatoNumero(v.kilometraje)} km
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p>
            <span className="text-xl font-semibold tabular-nums">{formatoMoneda(v.tarifaDiariaBase)}</span>
            <span className="text-sm text-zinc-500"> / dia</span>
          </p>
          {!esCamion && (
            <Boton tamano="sm" onClick={onAlquilar} disabled={!v.disponible}>
              Alugar
            </Boton>
          )}
        </div>
      </div>
    </Tarjeta>
  )
}
