import { useQuery } from '@tanstack/react-query'
import { CarFront, CircleCheck, Receipt, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Aviso, Cargando, Celda, Encabezado, Insignia, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { formatoFecha, formatoMoneda, formatoNumero } from '../../lib/format'
import type { Alquiler, EstadisticaMarca, Pagina, Planilla, Vehiculo } from '../../lib/types'

function Indicador({ icono, titulo, valor, detalle }: { icono: ReactNode; titulo: string; valor: string; detalle?: string }) {
  return (
    <Tarjeta className="p-5">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        {icono}
        {titulo}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-zinc-500">{detalle}</p>}
    </Tarjeta>
  )
}

export function Resumen() {
  const { sesion } = useAuth()
  const esAdmin = sesion?.rol === 'ADMIN'

  const vehiculos = useQuery({
    queryKey: ['vehiculos', 'todos'],
    queryFn: () => api<Pagina<Vehiculo>>('/api/v1/vehiculos?size=1000'),
  })
  const alquileres = useQuery({
    queryKey: ['alquileres', 'todos'],
    queryFn: () => api<Pagina<Alquiler>>('/api/v1/alquileres?size=1000'),
  })
  const planilla = useQuery({
    queryKey: ['planilla', 'pendiente'],
    queryFn: () => api<Planilla>('/api/v1/pagos/pendientes'),
    enabled: esAdmin,
  })
  const marcas = useQuery({
    queryKey: ['vehiculos', 'estadisticas'],
    queryFn: () => api<EstadisticaMarca[]>('/api/v1/vehiculos/estadisticas/por-marca'),
    enabled: esAdmin,
  })

  if (vehiculos.isLoading || alquileres.isLoading) return <Cargando />
  if (vehiculos.isError || alquileres.isError) return <Aviso>{mensajeDeError(vehiculos.error ?? alquileres.error)}</Aviso>

  const flota = vehiculos.data!.content
  const alquilables = flota.filter((v) => v.tipo !== 'CAMION')
  const disponibles = alquilables.filter((v) => v.disponible).length
  const lista = alquileres.data!.content
  const activos = lista.filter((a) => a.estado === 'ACTIVO').length
  const ingresos = lista.reduce((suma, a) => suma + a.costoTotal, 0)
  const topMarcas = [...(marcas.data ?? [])].sort((a, b) => b.cantidad - a.cantidad).slice(0, 6)
  const maximo = Math.max(1, ...topMarcas.map((m) => m.cantidad))

  return (
    <>
      <Encabezado titulo={`Hola, ${sesion?.username}`} descripcion="Así está la operación hoy." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador icono={<CarFront className="size-4" />} titulo="Flota activa" valor={formatoNumero(flota.length)} detalle={`${alquilables.length} alquilables · ${flota.length - alquilables.length === 1 ? '1 camión' : `${flota.length - alquilables.length} camiones`}`} />
        <Indicador icono={<CircleCheck className="size-4" />} titulo="Disponibles" valor={formatoNumero(disponibles)} detalle={`${alquilables.length - disponibles} alquilados ahora`} />
        <Indicador icono={<Receipt className="size-4" />} titulo="Alquileres en curso" valor={formatoNumero(activos)} detalle={`${formatoMoneda(ingresos)} facturados en total`} />
        {esAdmin ? (
          <Indicador icono={<Wallet className="size-4" />} titulo="Planilla del mes" valor={planilla.data ? formatoMoneda(planilla.data.total) : '—'} detalle={planilla.data ? `${planilla.data.pagos.length} pagos pendientes` : undefined} />
        ) : (
          <Indicador icono={<Receipt className="size-4" />} titulo="Alquileres registrados" valor={formatoNumero(lista.length)} />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Tarjeta>
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 className="font-semibold">Últimos alquileres</h2>
            <Link to="/panel/alquileres" className="text-sm font-medium text-marca-600 hover:underline dark:text-marca-400">
              Ver todos
            </Link>
          </div>
          {lista.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-zinc-500">Aún no hay alquileres.</p>
          ) : (
            <Tabla cabeceras={['Cliente', 'Vehículo', 'Inicio', 'Total', 'Estado']}>
              {lista.slice(0, 6).map((a) => (
                <tr key={a.id}>
                  <Celda className="font-medium">{a.cliente}</Celda>
                  <Celda>{a.vehiculo}</Celda>
                  <Celda className="text-zinc-500">{formatoFecha(a.fechaInicio)}</Celda>
                  <Celda className="tabular-nums">{formatoMoneda(a.costoTotal)}</Celda>
                  <Celda>{a.estado === 'ACTIVO' ? <Insignia tono="verde">En curso</Insignia> : <Insignia>Finalizado</Insignia>}</Celda>
                </tr>
              ))}
            </Tabla>
          )}
        </Tarjeta>

        {esAdmin && (
          <Tarjeta className="p-5">
            <h2 className="font-semibold">Flota por marca</h2>
            <p className="text-xs text-zinc-500">Consulta nativa SQL agrupada en PostgreSQL</p>
            <ul className="mt-4 space-y-3">
              {topMarcas.map((m) => (
                <li key={m.marca}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{m.marca}</span>
                    <span className="tabular-nums text-zinc-500">{m.cantidad}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-2 rounded-full bg-marca-500" style={{ width: `${(m.cantidad / maximo) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">Promedio {formatoNumero(m.promedioKilometraje)} km</p>
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}
      </div>
    </>
  )
}
