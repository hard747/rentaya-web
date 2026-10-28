import { useQuery } from '@tanstack/react-query'
import { Plus, ReceiptText, Star } from 'lucide-react'
import { useState } from 'react'
import { Aviso, Boton, Cargando, Celda, Encabezado, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { formatoMoneda } from '../../lib/format'
import type { Taller } from '../../lib/types'
import { CampoSelector, CampoTexto, Estrellas, ModalFormulario, numero, texto, useTrasOperar } from './comun'

type Accion = { tipo: 'factura' | 'calificar'; taller: Taller } | null

export function Talleres() {
  const [accion, setAccion] = useState<Accion>(null)
  const [creando, setCreando] = useState(false)
  const trasOperar = useTrasOperar()
  const talleres = useQuery({ queryKey: ['talleres'], queryFn: () => api<Taller[]>('/api/v1/talleres') })

  return (
    <>
      <Encabezado
        titulo="Oficinas externas"
        descripcion="Oficinas terceirizadas: faturamento do mês (+ 18 % IGV) e avaliações."
        acciones={
          <Boton onClick={() => setCreando(true)} icono={<Plus className="size-4" />}>
            Nova oficina
          </Boton>
        }
      />
      <Tarjeta>
        {talleres.isLoading ? (
          <Cargando />
        ) : talleres.isError ? (
          <div className="p-5">
            <Aviso>{mensajeDeError(talleres.error)}</Aviso>
          </div>
        ) : talleres.data!.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Ainda não há oficinas.</p>
        ) : (
          <div className="p-1">
            <Tabla cabeceras={['Razão social', 'RUC', 'Faturado no mês', 'Pagamento com IGV', 'Avaliação', '']}>
              {talleres.data!.map((t) => (
                <tr key={t.id}>
                  <Celda className="font-medium">{t.razonSocial}</Celda>
                  <Celda className="tabular-nums">{t.ruc}</Celda>
                  <Celda className="tabular-nums">{formatoMoneda(t.montoFacturadoMes)}</Celda>
                  <Celda className="font-medium tabular-nums">{formatoMoneda(t.pagoMes)}</Celda>
                  <Celda>
                    <Estrellas valor={t.promedioCalificacion} />
                  </Celda>
                  <Celda>
                    <div className="flex justify-end gap-1">
                      <Boton variante="secundario" tamano="sm" icono={<ReceiptText className="size-4" />} onClick={() => setAccion({ tipo: 'factura', taller: t })}>
                        Nota fiscal
                      </Boton>
                      <Boton variante="fantasma" tamano="sm" icono={<Star className="size-4" />} aria-label={`Avaliar ${t.razonSocial}`} onClick={() => setAccion({ tipo: 'calificar', taller: t })} />
                    </div>
                  </Celda>
                </tr>
              ))}
            </Tabla>
          </div>
        )}
      </Tarjeta>

      <ModalFormulario
        abierto={accion?.tipo === 'factura'}
        titulo="Registrar nota fiscal"
        descripcion={accion?.taller.razonSocial}
        textoEnviar="Registrar"
        onCerrar={() => setAccion(null)}
        onEnviar={async (d) => {
          await api(`/api/v1/talleres/${accion!.taller.id}/facturas`, { metodo: 'POST', cuerpo: { monto: numero(d, 'monto') } })
          trasOperar(['talleres', 'planilla'], 'Nota fiscal registrada')
        }}
      >
        <CampoTexto etiqueta="Valor (R$)" name="monto" type="number" min={0.01} step={0.01} required />
      </ModalFormulario>

      <ModalFormulario
        abierto={accion?.tipo === 'calificar'}
        titulo="Avaliar oficina"
        descripcion={accion?.taller.razonSocial}
        textoEnviar="Avaliar"
        onCerrar={() => setAccion(null)}
        onEnviar={async (d) => {
          await api(`/api/v1/talleres/${accion!.taller.id}/calificaciones`, { metodo: 'POST', cuerpo: { estrellas: numero(d, 'estrellas') } })
          trasOperar(['talleres'], 'Avaliação registrada')
        }}
      >
        <CampoSelector etiqueta="Estrelas" name="estrellas" defaultValue="5">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)} ({n})
            </option>
          ))}
        </CampoSelector>
      </ModalFormulario>

      <ModalFormulario
        abierto={creando}
        titulo="Nova oficina"
        textoEnviar="Criar oficina"
        onCerrar={() => setCreando(false)}
        onEnviar={async (d) => {
          const creado = await api<Taller>('/api/v1/talleres', { metodo: 'POST', cuerpo: { razonSocial: texto(d, 'razon'), ruc: texto(d, 'ruc') } })
          trasOperar(['talleres', 'planilla'], `${creado.razonSocial} adicionada`)
        }}
      >
        <CampoTexto etiqueta="Razão social" name="razon" required />
        <CampoTexto etiqueta="RUC" name="ruc" required pattern="\d{11}" inputMode="numeric" maxLength={11} ayuda="11 dígitos" />
      </ModalFormulario>
    </>
  )
}
