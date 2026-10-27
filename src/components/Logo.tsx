import { CarFront } from 'lucide-react'
import { Link } from 'react-router'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-marca-600 text-white">
        <CarFront className="size-4.5" aria-hidden />
      </span>
      RentaYa
    </Link>
  )
}
