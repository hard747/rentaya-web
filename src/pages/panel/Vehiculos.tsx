import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Gauge, Plus, Trash2, Wrench } from 'lucide-react'
import { useState } from 'react'
import { detallesVehiculo, VehiculoIcono } from '../../components/VehiculoIcono'
import { Aviso, Boton, Cargando, Celda, Encabezado, Insignia, Paginacion, Selector, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { formatoMoneda, formatoNumero, nombreTipo } from '../../lib/format'
import type { Mantenimiento, Pagina, TipoVehiculo, Vehiculo } from '../../lib/types'
import { CampoSelector, CampoTexto, ModalFormulario, numero, texto, useTrasOperar } from './comun'

type Accion = { tipo: 'tarifa' | 'km' | 'eliminar'; vehiculo: Vehiculo } | null

export function Vehiculos() {
  const { sesion } = useAuth()
  const esAdmin = sesion?.rol === 'ADMIN'
  const [tipo, setTipo] = useState('')
  const [pagina, setPagina] = useState(0)
  const [accion, setAccion] = useState<Accion>(null)
  const [creando, setCreando] = useState(false)
  const [mantenimiento, setMantenimiento] = useState<Vehiculo | null>(null)
  const trasOperar = useTrasOperar()

  const vehiculos = useQuery({
    queryKey: ['vehiculos', 'panel', tipo, pagina],
    queryFn: () => api<Pagina<Vehiculo>>(`/api/v1/vehiculos?size=15&page=${pagina}&sort=id,desc${tipo ? `&tipo=${tipo}` : ''}`),
    placeholderData: keepPreviousData,
  })

  const cerrar = () => setAccion(null)

  return (
    <>
      <Encabezado
        titulo="Vehículos"
        descripcion="Flota activa: tarifas, kilometraje y mantenimiento."
        acciones={
          <>
            <Selector
              className="w-auto"
              aria-label="Filtrar por tipo"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value)
                setPagina(0)
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="AUTO">Autos</option>
              <option value="MOTO">Motos</option>
              <option value="CAMION">Camiones</option>
            </Selector>
            {esAdmin && (
              <Boton onClick={() => setCreando(true)} icono={<Plus className="size-4" />}>
                Nuevo vehículo
              </Boton>
            )}
          </>
        }
      />

      <Tarjeta>
        {vehiculos.isLoading ? (
          <Cargando />
        ) : vehiculos.isError ? (
          <div className="p-5">
            <Aviso>{mensajeDeError(vehiculos.error)}</Aviso>
          </div>
        ) : (
          <div className="p-1">
            <Tabla cabeceras={['Vehículo', 'Tipo', 'Detalle', 'Tarifa / día', 'Kilometraje', 'Estado', '']}>
              {vehiculos.data!.content.map((v) => (
                <tr key={v.id}>
                  <Celda>
                    <div className="flex items-center gap-3">
                      <VehiculoIcono tipo={v.tipo} />
                      <div>
                        <p className="font-medium">
                          {v.marca} {v.modelo} <span className="font-normal text-zinc-500">{v.anio}</span>
                        </p>
                        <p className="text-xs text-zinc-500">{v.placa}</p>
                      </div>
                    </div>
                  </Celda>
                  <Celda>{nombreTipo[v.tipo]}</Celda>
                  <Celda className="text-zinc-500">{detallesVehiculo(v)}</Celda>
                  <Celda className="tabular-nums">{formatoMoneda(v.tarifaDiariaBase)}</Celda>
                  <Celda className="tabular-nums">{formatoNumero(v.kilometraje)} km</Celda>
                  <Celda>
                    {v.tipo === 'CAMION' ? <Insignia>Uso interno</Insignia> : v.disponible ? <Insignia tono="verde">Disponible</Insignia> : <Insignia tono="ambar">Alquilado</Insignia>}
                  </Celda>
                  <Celda>
                    <div className="flex justify-end gap-1">
                      {esAdmin && (
                        <Boton variante="fantasma" tamano="sm" onClick={() => setAccion({ tipo: 'tarifa', vehiculo: v })}>
                          Tarifa
                        </Boton>
                      )}
                      <Boton variante="fantasma" tamano="sm" onClick={() => setAccion({ tipo: 'km', vehiculo: v })} icono={<Gauge className="size-4" />} aria-label={`Registrar kilómetros de ${v.placa}`} />
                      <Boton variante="fantasma" tamano="sm" onClick={() => setMantenimiento(v)} icono={<Wrench className="size-4" />} aria-label={`Costo de mantenimiento de ${v.placa}`} />
                      {esAdmin && (
                        <Boton variante="fantasma" tamano="sm" onClick={() => setAccion({ tipo: 'eliminar', vehiculo: v })} icono={<Trash2 className="size-4 text-red-600" />} aria-label={`Dar de baja ${v.placa}`} />
                      )}
                    </div>
                  </Celda>
                </tr>
              ))}
            </Tabla>
          </div>
        )}
      </Tarjeta>
      {vehiculos.data && (
        <Paginacion pagina={vehiculos.data.page.number} totalPaginas={vehiculos.data.page.totalPages} total={vehiculos.data.page.totalElements} onCambiar={setPagina} />
      )}

      <ModalFormulario
        abierto={accion?.tipo === 'tarifa'}
        titulo="Cambiar tarifa"
        descripcion={accion?.vehiculo.descripcion}
        textoEnviar="Guardar tarifa"
        onCerrar={cerrar}
        onEnviar={async (d) => {
          await api(`/api/v1/vehiculos/${accion!.vehiculo.id}/tarifa`, { metodo: 'PUT', cuerpo: { tarifaDiariaBase: numero(d, 'tarifa') } })
          trasOperar(['vehiculos'], 'Tarifa actualizada')
        }}
      >
        <CampoTexto etiqueta="Tarifa diaria base (S/)" name="tarifa" type="number" min={0.01} step={0.01} required defaultValue={accion?.vehiculo.tarifaDiariaBase} />
      </ModalFormulario>

      <ModalFormulario
        abierto={accion?.tipo === 'km'}
        titulo="Registrar kilómetros"
        descripcion={accion?.vehiculo.descripcion}
        textoEnviar="Registrar"
        onCerrar={cerrar}
        onEnviar={async (d) => {
          await api(`/api/v1/vehiculos/${accion!.vehiculo.id}/kilometros`, { metodo: 'POST', cuerpo: { kilometros: numero(d, 'km') } })
          trasOperar(['vehiculos'], 'Kilometraje actualizado')
        }}
      >
        <CampoTexto etiqueta="Kilómetros recorridos" name="km" type="number" min={0.01} step={0.01} required ayuda={`Kilometraje actual: ${formatoNumero(accion?.vehiculo.kilometraje ?? 0)} km`} />
      </ModalFormulario>

      <ModalFormulario
        abierto={accion?.tipo === 'eliminar'}
        titulo="Dar de baja el vehículo"
        descripcion="Es una baja lógica: deja de aparecer en el catálogo, pero su historial se conserva."
        textoEnviar="Dar de baja"
        peligro
        onCerrar={cerrar}
        onEnviar={async () => {
          await api(`/api/v1/vehiculos/${accion!.vehiculo.id}`, { metodo: 'DELETE' })
          trasOperar(['vehiculos'], 'Vehículo dado de baja')
        }}
      >
        <p className="text-sm">
          ¿Dar de baja <strong>{accion?.vehiculo.descripcion}</strong>?
        </p>
      </ModalFormulario>

      <ModalMantenimiento vehiculo={mantenimiento} onCerrar={() => setMantenimiento(null)} />
      <ModalNuevoVehiculo abierto={creando} onCerrar={() => setCreando(false)} />
    </>
  )
}

function ModalMantenimiento({ vehiculo, onCerrar }: { vehiculo: Vehiculo | null; onCerrar: () => void }) {
  const consulta = useQuery({
    queryKey: ['vehiculos', 'mantenimiento', vehiculo?.id],
    queryFn: () => api<Mantenimiento>(`/api/v1/vehiculos/${vehiculo!.id}/mantenimiento`),
    enabled: vehiculo !== null,
  })
  return (
    <ModalFormulario abierto={vehiculo !== null} titulo="Costo de mantenimiento" descripcion={vehiculo?.descripcion} textoEnviar="Listo" onCerrar={onCerrar} onEnviar={async () => {}}>
      {consulta.isLoading ? (
        <Cargando texto="Calculando…" />
      ) : consulta.isError ? (
        <Aviso>{mensajeDeError(consulta.error)}</Aviso>
      ) : (
        consulta.data && (
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
            <p className="text-sm text-zinc-500">Con {formatoNumero(consulta.data.kilometraje)} km</p>
            <p className="text-3xl font-semibold tabular-nums">{formatoMoneda(consulta.data.costoMantenimiento)}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Polimorfismo: cada tipo calcula su propio costo (auto 100 + km × 0,05 · moto 50 + km × 0,03 · camión 300 + km × 0,10 + t × 20).
            </p>
          </div>
        )
      )}
    </ModalFormulario>
  )
}

function ModalNuevoVehiculo({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [tipo, setTipo] = useState<TipoVehiculo>('AUTO')
  const trasOperar = useTrasOperar()

  return (
    <ModalFormulario
      abierto={abierto}
      titulo="Nuevo vehículo"
      textoEnviar="Crear vehículo"
      onCerrar={onCerrar}
      onEnviar={async (d) => {
        const base = {
          tipo,
          placa: texto(d, 'placa').toUpperCase(),
          marca: texto(d, 'marca'),
          modelo: texto(d, 'modelo'),
          anio: numero(d, 'anio'),
          tarifaDiariaBase: numero(d, 'tarifa'),
        }
        const propios =
          tipo === 'AUTO'
            ? { numeroPuertas: numero(d, 'puertas') }
            : tipo === 'MOTO'
              ? { cilindrada: numero(d, 'cilindrada'), incluyeCasco: d.get('casco') === 'on' }
              : { capacidadToneladas: numero(d, 'toneladas') }
        const creado = await api<Vehiculo>('/api/v1/vehiculos', { metodo: 'POST', cuerpo: { ...base, ...propios } })
        trasOperar(['vehiculos'], `${creado.descripcion} creado`)
      }}
    >
      <CampoSelector etiqueta="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoVehiculo)}>
        <option value="AUTO">Auto</option>
        <option value="MOTO">Moto</option>
        <option value="CAMION">Camión</option>
      </CampoSelector>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="Placa" name="placa" required pattern="[A-Za-z]{3}-\d{3}" placeholder="ABC-123" ayuda="Formato AAA-999" />
        <CampoTexto etiqueta="Año" name="anio" type="number" min={1990} max={2027} required />
        <CampoTexto etiqueta="Marca" name="marca" required />
        <CampoTexto etiqueta="Modelo" name="modelo" required />
        <CampoTexto etiqueta="Tarifa diaria (S/)" name="tarifa" type="number" min={0.01} step={0.01} required />
        {tipo === 'AUTO' && <CampoTexto etiqueta="Número de puertas" name="puertas" type="number" min={2} max={5} required defaultValue={4} />}
        {tipo === 'MOTO' && <CampoTexto etiqueta="Cilindrada (cc)" name="cilindrada" type="number" min={1} required />}
        {tipo === 'CAMION' && <CampoTexto etiqueta="Capacidad (toneladas)" name="toneladas" type="number" min={0.01} step={0.01} required />}
      </div>
      {tipo === 'MOTO' && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="casco" className="size-4 rounded accent-marca-600" /> Incluye casco (+ S/ 5 por día)
        </label>
      )}
    </ModalFormulario>
  )
}
