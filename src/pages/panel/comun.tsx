import { useQueryClient } from '@tanstack/react-query'
import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { useNotificar } from '../../components/Notificaciones'
import { Aviso, Boton, Campo, Entrada, Modal, Selector } from '../../components/ui'
import { mensajeDeError } from '../../lib/api'

interface PropsModalFormulario {
  abierto: boolean
  titulo: string
  descripcion?: string
  textoEnviar: string
  peligro?: boolean
  onCerrar: () => void
  /**
   * Recibe los valores del formulario. Si lanza un error, se muestra sin cerrar el modal;
   * si devuelve false, el modal queda abierto (por ejemplo, para mostrar un resultado).
   */
  onEnviar: (datos: FormData) => Promise<unknown>
  children?: ReactNode
}

/**
 * Formulario en un modal. Las restricciones nativas (required, pattern, min) dan una primera validación,
 * y los errores del backend, que es la fuente de verdad, se muestran debajo.
 */
export function ModalFormulario({ abierto, titulo, descripcion, textoEnviar, peligro, onCerrar, onEnviar, children }: PropsModalFormulario) {
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cerrar = () => {
    setError(null)
    onCerrar()
  }

  return (
    <Modal abierto={abierto} titulo={titulo} descripcion={descripcion} onCerrar={cerrar}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setEnviando(true)
          setError(null)
          try {
            if ((await onEnviar(new FormData(e.currentTarget))) !== false) cerrar()
          } catch (err) {
            setError(mensajeDeError(err))
          } finally {
            setEnviando(false)
          }
        }}
      >
        {children}
        {error && <Aviso>{error}</Aviso>}
        <div className="flex justify-end gap-2 pt-2">
          <Boton variante="secundario" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" variante={peligro ? 'peligro' : 'primario'} cargando={enviando}>
            {textoEnviar}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

export function CampoTexto({ etiqueta, ayuda, ...props }: { etiqueta: string; ayuda?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <Campo etiqueta={etiqueta} ayuda={ayuda}>{(p) => <Entrada {...p} {...props} />}</Campo>
}

export function CampoSelector({ etiqueta, children, ...props }: { etiqueta: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Campo etiqueta={etiqueta}>
      {(p) => (
        <Selector {...p} {...props}>
          {children}
        </Selector>
      )}
    </Campo>
  )
}

/** Tras una operación: refresca las consultas afectadas y avisa al usuario. */
export function useTrasOperar() {
  const queryClient = useQueryClient()
  const notificar = useNotificar()
  return (claves: string[], mensaje: string) => {
    claves.forEach((clave) => queryClient.invalidateQueries({ queryKey: [clave] }))
    notificar(mensaje)
  }
}

/** Ejecuta una acción directa (sin formulario) y notifica el resultado o el error. */
export function useAccionDirecta() {
  const trasOperar = useTrasOperar()
  const notificar = useNotificar()
  const [enCurso, setEnCurso] = useState<string | null>(null)
  const ejecutar = async (id: string, accion: () => Promise<unknown>, claves: string[], mensaje: string) => {
    setEnCurso(id)
    try {
      await accion()
      trasOperar(claves, mensaje)
    } catch (e) {
      notificar(mensajeDeError(e), 'error')
    } finally {
      setEnCurso(null)
    }
  }
  return { ejecutar, enCurso }
}

export const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? '').trim()
export const numero = (datos: FormData, campo: string) => Number(datos.get(campo))

export function Estrellas({ valor }: { valor?: number }) {
  if (!valor) return <span className="text-zinc-400">Sem avaliação</span>
  return (
    <span className="tabular-nums" aria-label={`${valor} de 5 estrelas`}>
      <span className="text-amber-500">★</span> {valor.toFixed(2)}
    </span>
  )
}
