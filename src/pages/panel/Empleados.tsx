import { useQuery } from '@tanstack/react-query'
import { Clock, Plus, Route, Star, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Aviso, Boton, Cargando, Celda, Encabezado, Insignia, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { formatoMoneda, nombreTipo } from '../../lib/format'
import type { Empleado, Pagina, Revision, Vehiculo } from '../../lib/types'
import { CampoSelector, CampoTexto, Estrellas, ModalFormulario, numero, texto, useAccionDirecta, useTrasOperar } from './comun'

type Accion = { tipo: 'horas' | 'calificar' | 'revisar'; empleado: Empleado } | null

export function Empleados() {
  const [accion, setAccion] = useState<Accion>(null)
  const [creando, setCreando] = useState(false)
  const [revision, setRevision] = useState<Revision | null>(null)
  const trasOperar = useTrasOperar()
  const { ejecutar, enCurso } = useAccionDirecta()

  const empleados = useQuery({ queryKey: ['empleados'], queryFn: () => api<Empleado[]>('/api/v1/empleados') })
  const vehiculos = useQuery({
    queryKey: ['vehiculos', 'todos'],
    queryFn: () => api<Pagina<Vehiculo>>('/api/v1/vehiculos?size=1000'),
    enabled: accion?.tipo === 'revisar',
  })

  const cerrar = () => {
    setAccion(null)
    setRevision(null)
  }

  return (
    <>
      <Encabezado
        titulo="Empleados"
        descripcion="Conductores y mecánicos: actividad del mes y pago calculado."
        acciones={
          <Boton onClick={() => setCreando(true)} icono={<Plus className="size-4" />}>
            Nuevo empleado
          </Boton>
        }
      />
      <Tarjeta>
        {empleados.isLoading ? (
          <Cargando />
        ) : empleados.isError ? (
          <div className="p-5">
            <Aviso>{mensajeDeError(empleados.error)}</Aviso>
          </div>
        ) : empleados.data!.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Aún no hay empleados.</p>
        ) : (
          <div className="p-1">
            <Tabla cabeceras={['Nombre', 'Rol', 'Actividad del mes', 'Calificación', 'Sueldo + bono', 'Pago del mes', '']}>
              {empleados.data!.map((e) => {
                const conductor = e.rol === 'CONDUCTOR'
                return (
                  <tr key={e.id}>
                    <Celda>
                      <p className="font-medium">{e.nombre}</p>
                      <p className="text-xs text-zinc-500">
                        DNI {e.dni} · {e.aniosAntiguedad} años
                      </p>
                    </Celda>
                    <Celda>
                      <Insignia tono={conductor ? 'marca' : 'gris'}>{nombreTipo[e.rol]}</Insignia>
                      <p className="mt-1 text-xs text-zinc-500">{conductor ? `Licencia ${e.licencia}` : e.especialidad}</p>
                    </Celda>
                    <Celda className="tabular-nums">{conductor ? `${e.viajesMes} viajes` : `${e.horasExtraMes} h extra`}</Celda>
                    <Celda>{conductor ? <Estrellas valor={e.promedioCalificacion} /> : <span className="text-zinc-400">—</span>}</Celda>
                    <Celda className="tabular-nums text-zinc-500">
                      {formatoMoneda(e.sueldoBase)} + {formatoMoneda(e.bonoAntiguedad)}
                    </Celda>
                    <Celda className="font-medium tabular-nums">{formatoMoneda(e.pagoMes)}</Celda>
                    <Celda>
                      <div className="flex justify-end gap-1">
                        {conductor ? (
                          <>
                            <Boton
                              variante="secundario"
                              tamano="sm"
                              cargando={enCurso === `viaje-${e.id}`}
                              icono={<Route className="size-4" />}
                              onClick={() => ejecutar(`viaje-${e.id}`, () => api(`/api/v1/empleados/${e.id}/viajes`, { metodo: 'POST' }), ['empleados', 'planilla'], `Viaje registrado para ${e.nombre}`)}
                            >
                              Viaje
                            </Boton>
                            <Boton variante="fantasma" tamano="sm" icono={<Star className="size-4" />} aria-label={`Calificar a ${e.nombre}`} onClick={() => setAccion({ tipo: 'calificar', empleado: e })} />
                          </>
                        ) : (
                          <>
                            <Boton variante="secundario" tamano="sm" icono={<Clock className="size-4" />} onClick={() => setAccion({ tipo: 'horas', empleado: e })}>
                              Horas
                            </Boton>
                            <Boton variante="fantasma" tamano="sm" icono={<Wrench className="size-4" />} aria-label={`Revisión de ${e.nombre}`} onClick={() => setAccion({ tipo: 'revisar', empleado: e })} />
                          </>
                        )}
                      </div>
                    </Celda>
                  </tr>
                )
              })}
            </Tabla>
          </div>
        )}
      </Tarjeta>

      <ModalFormulario
        abierto={accion?.tipo === 'horas'}
        titulo="Registrar horas extra"
        descripcion={accion?.empleado.nombre}
        textoEnviar="Registrar"
        onCerrar={cerrar}
        onEnviar={async (d) => {
          await api(`/api/v1/empleados/${accion!.empleado.id}/horas-extra`, { metodo: 'POST', cuerpo: { horas: numero(d, 'horas') } })
          trasOperar(['empleados', 'planilla'], 'Horas extra registradas')
        }}
      >
        <CampoTexto etiqueta="Horas" name="horas" type="number" min={1} required ayuda="Cada hora extra suma S/ 30 al pago del mes." />
      </ModalFormulario>

      <ModalFormulario
        abierto={accion?.tipo === 'calificar'}
        titulo="Calificar conductor"
        descripcion={accion?.empleado.nombre}
        textoEnviar="Calificar"
        onCerrar={cerrar}
        onEnviar={async (d) => {
          await api(`/api/v1/empleados/${accion!.empleado.id}/calificaciones`, { metodo: 'POST', cuerpo: { estrellas: numero(d, 'estrellas') } })
          trasOperar(['empleados'], 'Calificación registrada')
        }}
      >
        <CampoSelector etiqueta="Estrellas" name="estrellas" defaultValue="5">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)} ({n})
            </option>
          ))}
        </CampoSelector>
      </ModalFormulario>

      <ModalFormulario
        abierto={accion?.tipo === 'revisar'}
        titulo="Revisión de vehículo"
        descripcion={`${accion?.empleado.nombre ?? ''} calcula el costo de mantenimiento`}
        textoEnviar="Calcular"
        onCerrar={cerrar}
        onEnviar={async (d) => {
          const r = await api<Revision>(`/api/v1/empleados/${accion!.empleado.id}/revisiones/${numero(d, 'vehiculo')}`)
          setRevision(r)
          return false
        }}
      >
        <CampoSelector etiqueta="Vehículo" name="vehiculo" required disabled={vehiculos.isLoading} onChange={() => setRevision(null)}>
          <option value="">{vehiculos.isLoading ? 'Cargando…' : 'Elige un vehículo'}</option>
          {vehiculos.data?.content.map((v) => (
            <option key={v.id} value={v.id}>
              {v.descripcion}
            </option>
          ))}
        </CampoSelector>
        {revision && (
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
            <p className="text-sm text-zinc-500">{revision.vehiculo}</p>
            <p className="text-2xl font-semibold tabular-nums">{formatoMoneda(revision.costoMantenimiento)}</p>
          </div>
        )}
      </ModalFormulario>

      <ModalNuevoEmpleado abierto={creando} onCerrar={() => setCreando(false)} />
    </>
  )
}

function ModalNuevoEmpleado({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const [rol, setRol] = useState<'CONDUCTOR' | 'MECANICO'>('CONDUCTOR')
  const trasOperar = useTrasOperar()
  return (
    <ModalFormulario
      abierto={abierto}
      titulo="Nuevo empleado"
      textoEnviar="Crear empleado"
      onCerrar={onCerrar}
      onEnviar={async (d) => {
        const cuerpo = {
          tipo: rol,
          nombre: texto(d, 'nombre'),
          dni: texto(d, 'dni'),
          sueldoBase: numero(d, 'sueldo'),
          aniosAntiguedad: numero(d, 'anios'),
          ...(rol === 'CONDUCTOR' ? { licencia: texto(d, 'licencia') } : { especialidad: texto(d, 'especialidad') }),
        }
        const creado = await api<Empleado>('/api/v1/empleados', { metodo: 'POST', cuerpo })
        trasOperar(['empleados', 'planilla'], `${creado.nombre} agregado`)
      }}
    >
      <CampoSelector etiqueta="Rol" value={rol} onChange={(e) => setRol(e.target.value as typeof rol)}>
        <option value="CONDUCTOR">Conductor</option>
        <option value="MECANICO">Mecánico</option>
      </CampoSelector>
      <CampoTexto etiqueta="Nombre completo" name="nombre" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="DNI" name="dni" required pattern="\d{8}" inputMode="numeric" maxLength={8} />
        <CampoTexto etiqueta="Sueldo base (S/)" name="sueldo" type="number" min={0.01} step={0.01} required />
        <CampoTexto etiqueta="Años de antigüedad" name="anios" type="number" min={0} required defaultValue={0} />
        {rol === 'CONDUCTOR' ? (
          <CampoSelector etiqueta="Licencia" name="licencia" defaultValue="A">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </CampoSelector>
        ) : (
          <CampoTexto etiqueta="Especialidad" name="especialidad" required placeholder="Motores, frenos…" />
        )}
      </div>
    </ModalFormulario>
  )
}
