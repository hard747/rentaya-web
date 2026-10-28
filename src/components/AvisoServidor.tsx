import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { suscribirLentitud } from '../lib/api'

/** Explica la espera cuando el servidor gratuito de Render está despertando. */
export function AvisoServidor() {
  const [visible, setVisible] = useState(false)
  useEffect(() => suscribirLentitud(setVisible), [])
  if (!visible) return null
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 flex justify-center p-3">
      <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-zinc-900">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Acordando o servidor… o primeiro carregamento pode levar até um minuto.
      </div>
    </div>
  )
}
