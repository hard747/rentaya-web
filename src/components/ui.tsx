import clsx from 'clsx'
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'

const estilosBoton: Record<Variante, string> = {
  primario: 'bg-marca-600 text-white shadow-sm hover:bg-marca-700 disabled:bg-marca-400',
  secundario:
    'border border-zinc-300 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  peligro: 'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-400',
  fantasma: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
}

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: 'sm' | 'md'
  cargando?: boolean
  icono?: ReactNode
}

export function Boton({ variante = 'primario', tamano = 'md', cargando, icono, className, children, disabled, ...props }: PropsBoton) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || cargando}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
        tamano === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm',
        estilosBoton[variante],
        className,
      )}
    >
      {cargando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icono}
      {children}
    </button>
  )
}

// Sin ancho fijo: ocupa todo el ancho salvo que quien lo usa indique otro (w-auto, w-40…).
const anchoPorDefecto = (className?: string) => (/(^|\s)w-/.test(className ?? '') ? undefined : 'w-full')

const estiloEntrada =
  'block rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-500/20 aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900'

interface PropsCampo {
  etiqueta: string
  error?: string
  ayuda?: string
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Etiqueta, control y mensaje de error enlazados para lectores de pantalla. */
export function Campo({ etiqueta, error, ayuda, children }: PropsCampo) {
  const id = useId()
  const idMensaje = `${id}-mensaje`
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {etiqueta}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || ayuda ? idMensaje : undefined })}
      {error ? (
        <p id={idMensaje} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : ayuda ? (
        <p id={idMensaje} className="text-xs text-zinc-500">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}

export function Entrada({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(estiloEntrada, anchoPorDefecto(className), className)} />
}

export function Selector({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(estiloEntrada, 'pr-8', anchoPorDefecto(className), className)} />
}

type Tono = 'gris' | 'verde' | 'ambar' | 'rojo' | 'marca'

const estilosInsignia: Record<Tono, string> = {
  gris: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300',
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
  rojo: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
  marca: 'bg-marca-50 text-marca-700 ring-marca-600/20 dark:bg-marca-500/10 dark:text-marca-200',
}

export function Insignia({ tono = 'gris', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', estilosInsignia[tono])}>
      {children}
    </span>
  )
}

export function Tarjeta({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900', className)}>
      {children}
    </div>
  )
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {texto}
    </div>
  )
}

export function Aviso({ children, tono = 'rojo' }: { children: ReactNode; tono?: 'rojo' | 'ambar' }) {
  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm',
        tono === 'rojo'
          ? 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300'
          : 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-300',
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}

export function Vacio({ icono, titulo, children }: { icono: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="rounded-full bg-zinc-100 p-3 text-zinc-500 dark:bg-zinc-800">{icono}</div>
      <p className="font-medium">{titulo}</p>
      {children && <div className="max-w-sm text-sm text-zinc-500">{children}</div>}
    </div>
  )
}

export function Paginacion({ pagina, totalPaginas, total, onCambiar }: { pagina: number; totalPaginas: number; total: number; onCambiar: (p: number) => void }) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-4 pt-4 text-sm text-zinc-500">
      <span>
        Página {pagina + 1} de {totalPaginas} · {total} resultados
      </span>
      <div className="flex gap-2">
        <Boton variante="secundario" tamano="sm" disabled={pagina === 0} onClick={() => onCambiar(pagina - 1)} icono={<ChevronLeft className="size-4" />} aria-label="Página anterior" />
        <Boton variante="secundario" tamano="sm" disabled={pagina + 1 >= totalPaginas} onClick={() => onCambiar(pagina + 1)} icono={<ChevronRight className="size-4" />} aria-label="Página siguiente" />
      </div>
    </nav>
  )
}

interface PropsModal {
  abierto: boolean
  titulo: string
  descripcion?: string
  onCerrar: () => void
  children: ReactNode
}

/** Diálogo nativo: gestiona foco, Escape y fondo accesibles sin librerías. */
export function Modal({ abierto, titulo, descripcion, onCerrar, children }: PropsModal) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal?.()
    if (!abierto && dialogo.open) dialogo.close?.()
  }, [abierto])

  if (!abierto) return null
  return (
    <dialog
      ref={ref}
      open={typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal ? true : undefined}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/50 backdrop:backdrop-blur-sm dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-sm text-zinc-500">{descripcion}</p>}
        </div>
        <Boton variante="fantasma" tamano="sm" onClick={onCerrar} aria-label="Cerrar" icono={<X className="size-4" />} />
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  )
}

export function Encabezado({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  )
}

/** Tabla con desplazamiento horizontal propio para que no desborde la página en móviles. */
export function Tabla({ cabeceras, children }: { cabeceras: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          <tr>
            {cabeceras.map((c, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>
      </table>
    </div>
  )
}

export function Celda({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx('whitespace-nowrap px-4 py-3', className)}>{children}</td>
}
