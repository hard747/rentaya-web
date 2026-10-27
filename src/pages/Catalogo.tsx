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
  { valor: 'AUTO', texto: 'Autos' },
  { valor: 'MOTO', texto: 'Motos' },
  { valor: 'CAMION', texto: 'Camiones' },
]

const ORDENES = [
  { valor: 'id,desc', texto: 'Más recientes' },
  { valor: 'tarifaDiariaBase,asc', texto: 'Precio: menor a mayor' },
  { valor: 'tarifaDiariaBase,desc', texto: 'Precio: mayor a menor' },
  { valor: 'anio,desc', texto: 'Año: más nuevos' },
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
            <Sparkles className="size-3" /> Autos y motos para cada viaje
          </Insignia>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Alquila un auto o una moto en minutos.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-500 text-pretty">
            Elige el vehículo, mira el precio final al instante y confirma. Sin papeleo.
          </p>
          <dl className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-3">
            {[
              { icono: Timer, titulo: '10% de descuento', texto: 'en autos desde 7 días' },
              { icono: ShieldCheck, titulo: 'Casco incluido', texto: 'en motos seleccionadas' },
              { icono: Sparkles, titulo: 'Clientes premium', texto: 'hasta 30% de descuento' },
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
          <div role="tablist" aria-label="Tipo de vehículo" className="flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
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
          <Cargando texto="Cargando vehículos…" />
        ) : vehiculos.isError ? (
          <Aviso>{mensajeDeError(vehiculos.error)}</Aviso>
        ) : vehiculos.data!.content.length === 0 ? (
          <Vacio icono={<SearchX className="size-5" />} titulo="No hay vehículos de este tipo">
            Prueba con otro filtro.
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
            <Insignia tono="verde">Disponible</Insignia>
          ) : (
            <Insignia tono="ambar">Alquilado</Insignia>
          )}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {v.placa} · {formatoNumero(v.kilometraje)} km
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p>
            <span className="text-xl font-semibold tabular-nums">{formatoMoneda(v.tarifaDiariaBase)}</span>
            <span className="text-sm text-zinc-500"> / día</span>
          </p>
          {!esCamion && (
            <Boton tamano="sm" onClick={onAlquilar} disabled={!v.disponible}>
              Alquilar
            </Boton>
          )}
        </div>
      </div>
    </Tarjeta>
  )
}
