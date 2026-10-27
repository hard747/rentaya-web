import { zodResolver } from '@hookform/resolvers/zod'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { Logo } from '../components/Logo'
import { Aviso, Boton, Campo, Entrada, Tarjeta } from '../components/ui'
import { ApiError, mensajeDeError } from '../lib/api'
import { inicioSegunRol, useAuth } from '../lib/auth'

// Mismas reglas que las validaciones de LoginRequest y RegistroRequest en el backend.
const esquemaLogin = z.object({
  username: z.string().trim().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(1, 'Ingresa tu nombre completo'),
  dni: z.string().regex(/^\d{8}$/, 'El DNI tiene exactamente 8 dígitos'),
  email: z.email('Ingresa un correo válido'),
  username: z.string().trim().min(4, 'Mínimo 4 caracteres').max(50, 'Máximo 50 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
})

type DatosLogin = z.infer<typeof esquemaLogin>
type DatosRegistro = z.infer<typeof esquemaRegistro>

function Marco({ titulo, subtitulo, children }: { titulo: string; subtitulo: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
            <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p>
          </div>
        </div>
        <Tarjeta className="p-6">{children}</Tarjeta>
      </div>
    </div>
  )
}

export function Login() {
  const { sesion, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const desde = (useLocation().state as { desde?: string } | null)?.desde
  const { register, handleSubmit, formState, setError } = useForm<DatosLogin>({ resolver: zodResolver(esquemaLogin) })

  if (sesion) return <Navigate to={inicioSegunRol(sesion)} replace />

  const enviar = handleSubmit(async ({ username, password }) => {
    try {
      const nueva = await iniciarSesion(username, password)
      navigate(desde && desde !== '/login' ? desde : inicioSegunRol(nueva), { replace: true })
    } catch (e) {
      setError('root', { message: e instanceof ApiError && e.status === 401 ? 'Usuario o contraseña incorrectos' : mensajeDeError(e) })
    }
  })

  return (
    <Marco
      titulo="Ingresa a tu cuenta"
      subtitulo={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-marca-600 hover:underline dark:text-marca-400">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate aria-label="Iniciar sesión">
        <Campo etiqueta="Usuario" error={formState.errors.username?.message}>
          {(p) => <Entrada {...p} {...register('username')} autoComplete="username" autoFocus />}
        </Campo>
        <Campo etiqueta="Contraseña" error={formState.errors.password?.message}>
          {(p) => <Entrada {...p} {...register('password')} type="password" autoComplete="current-password" />}
        </Campo>
        {formState.errors.root && <Aviso>{formState.errors.root.message}</Aviso>}
        <Boton type="submit" className="w-full" cargando={formState.isSubmitting}>
          Ingresar
        </Boton>
      </form>
    </Marco>
  )
}

export function Registro() {
  const { sesion, registrarse } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState, setError } = useForm<DatosRegistro>({ resolver: zodResolver(esquemaRegistro) })

  if (sesion) return <Navigate to={inicioSegunRol(sesion)} replace />

  const enviar = handleSubmit(async (datos) => {
    try {
      await registrarse(datos)
      navigate('/', { replace: true })
    } catch (e) {
      // Los errores por campo del backend (por ejemplo, usuario repetido) se muestran en su campo.
      if (e instanceof ApiError && e.errores) {
        Object.entries(e.errores).forEach(([campo, message]) => setError(campo as keyof DatosRegistro, { message }))
      } else {
        setError('root', { message: mensajeDeError(e) })
      }
    }
  })

  const campo = (nombre: keyof DatosRegistro, etiqueta: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Campo etiqueta={etiqueta} error={formState.errors[nombre]?.message}>
      {(p) => <Entrada {...p} {...props} {...register(nombre)} />}
    </Campo>
  )

  return (
    <Marco
      titulo="Crea tu cuenta"
      subtitulo={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-marca-600 hover:underline dark:text-marca-400">
            Ingresa
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate aria-label="Crear cuenta">
        {campo('nombre', 'Nombre completo', { autoComplete: 'name', autoFocus: true })}
        {campo('dni', 'DNI', { inputMode: 'numeric', maxLength: 8 })}
        {campo('email', 'Correo', { type: 'email', autoComplete: 'email' })}
        {campo('username', 'Usuario', { autoComplete: 'username' })}
        {campo('password', 'Contraseña', { type: 'password', autoComplete: 'new-password' })}
        {formState.errors.root && <Aviso>{formState.errors.root.message}</Aviso>}
        <Boton type="submit" className="w-full" cargando={formState.isSubmitting}>
          Crear cuenta
        </Boton>
      </form>
    </Marco>
  )
}
