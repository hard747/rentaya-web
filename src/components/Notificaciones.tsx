import clsx from 'clsx'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface Notificacion {
  id: number
  texto: string
  tipo: 'exito' | 'error'
}

const NotificacionesContext = createContext<(texto: string, tipo?: Notificacion['tipo']) => void>(() => {})

let siguienteId = 1

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Notificacion[]>([])

  const notificar = useCallback((texto: string, tipo: Notificacion['tipo'] = 'exito') => {
    const id = siguienteId++
    setLista((l) => [...l, { id, texto, tipo }])
    setTimeout(() => setLista((l) => l.filter((n) => n.id !== id)), 4000)
  }, [])

  return (
    <NotificacionesContext value={notificar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {lista.map((n) => (
          <div
            key={n.id}
            role="status"
            className={clsx(
              'pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ring-1',
              n.tipo === 'exito'
                ? 'bg-white text-zinc-900 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
                : 'bg-red-600 text-white ring-red-700',
            )}
          >
            {n.tipo === 'exito' ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> : <XCircle className="size-4 shrink-0" />}
            {n.texto}
          </div>
        ))}
      </div>
    </NotificacionesContext>
  )
}

export const useNotificar = () => useContext(NotificacionesContext)
