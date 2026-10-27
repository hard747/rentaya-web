import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Aviso, Boton, Cargando, Celda, Encabezado, Insignia, Paginacion, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import type { Cliente, Pagina } from '../../lib/types'
import { CampoSelector, CampoTexto, ModalFormulario, numero, texto, useTrasOperar } from './comun'

export function Clientes() {
  const [pagina, setPagina] = useState(0)
  const [creando, setCreando] = useState(false)
  const [premium, setPremium] = useState(false)
  const trasOperar = useTrasOperar()

  const clientes = useQuery({
    queryKey: ['clientes', 'panel', pagina],
    queryFn: () => api<Pagina<Cliente>>(`/api/v1/clientes?size=15&page=${pagina}&sort=id,desc`),
    placeholderData: keepPreviousData,
  })

  return (
    <>
      <Encabezado
        titulo="Clientes"
        descripcion="Clientes normales y premium. Los clientes también pueden registrarse solos desde la web."
        acciones={
          <Boton onClick={() => setCreando(true)} icono={<Plus className="size-4" />}>
            Nuevo cliente
          </Boton>
        }
      />
      <Tarjeta>
        {clientes.isLoading ? (
          <Cargando />
        ) : clientes.isError ? (
          <div className="p-5">
            <Aviso>{mensajeDeError(clientes.error)}</Aviso>
          </div>
        ) : clientes.data!.content.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Aún no hay clientes.</p>
        ) : (
          <div className="p-1">
            <Tabla cabeceras={['Nombre', 'DNI', 'Correo', 'Tipo']}>
              {clientes.data!.content.map((c) => (
                <tr key={c.id}>
                  <Celda className="font-medium">{c.nombre}</Celda>
                  <Celda className="tabular-nums">{c.dni}</Celda>
                  <Celda className="text-zinc-500">{c.email}</Celda>
                  <Celda>{c.rol === 'CLIENTE_PREMIUM' ? <Insignia tono="marca">Premium · {c.porcentajeDescuento}%</Insignia> : <Insignia>Normal</Insignia>}</Celda>
                </tr>
              ))}
            </Tabla>
          </div>
        )}
      </Tarjeta>
      {clientes.data && (
        <Paginacion pagina={clientes.data.page.number} totalPaginas={clientes.data.page.totalPages} total={clientes.data.page.totalElements} onCambiar={setPagina} />
      )}

      <ModalFormulario
        abierto={creando}
        titulo="Nuevo cliente"
        textoEnviar="Crear cliente"
        onCerrar={() => {
          setCreando(false)
          setPremium(false)
        }}
        onEnviar={async (d) => {
          const cuerpo = {
            tipo: premium ? 'CLIENTE_PREMIUM' : 'CLIENTE',
            nombre: texto(d, 'nombre'),
            dni: texto(d, 'dni'),
            email: texto(d, 'email'),
            ...(premium && { porcentajeDescuento: numero(d, 'descuento') }),
          }
          const creado = await api<Cliente>('/api/v1/clientes', { metodo: 'POST', cuerpo })
          trasOperar(['clientes'], `Cliente ${creado.nombre} creado`)
        }}
      >
        <CampoSelector etiqueta="Tipo de cliente" value={premium ? 'p' : 'n'} onChange={(e) => setPremium(e.target.value === 'p')}>
          <option value="n">Normal</option>
          <option value="p">Premium (con descuento)</option>
        </CampoSelector>
        <CampoTexto etiqueta="Nombre completo" name="nombre" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="DNI" name="dni" required pattern="\d{8}" inputMode="numeric" maxLength={8} ayuda="8 dígitos" />
          <CampoTexto etiqueta="Correo" name="email" type="email" required />
        </div>
        {premium && <CampoTexto etiqueta="Descuento (%)" name="descuento" type="number" min={0} max={30} step={0.5} required ayuda="Entre 0 y 30 %" />}
      </ModalFormulario>
    </>
  )
}
