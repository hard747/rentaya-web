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
  username: z.string().trim().min(1, 'Informe seu usuário'),
  password: z.string().min(1, 'Informe sua senha'),
})

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(1, 'Informe seu nome completo'),
  dni: z.string().regex(/^\d{8}$/, 'O DNI tem exatamente 8 dígitos'),
  email: z.email('Informe um e-mail válido'),
  username: z.string().trim().min(4, 'Mínimo de 4 caracteres').max(50, 'Máximo de 50 caracteres'),
  password: z.string().min(8, 'Mínimo de 8 caracteres').max(72, 'Máximo de 72 caracteres'),
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
      setError('root', { message: e instanceof ApiError && e.status === 401 ? 'Usuário ou senha incorretos' : mensajeDeError(e) })
    }
  })

  return (
    <Marco
      titulo="Entre na sua conta"
      subtitulo={
        <>
          Não tem conta?{' '}
          <Link to="/registro" className="font-medium text-marca-600 hover:underline dark:text-marca-400">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate aria-label="Entrar">
        <Campo etiqueta="Usuário" error={formState.errors.username?.message}>
          {(p) => <Entrada {...p} {...register('username')} autoComplete="username" autoFocus />}
        </Campo>
        <Campo etiqueta="Senha" error={formState.errors.password?.message}>
          {(p) => <Entrada {...p} {...register('password')} type="password" autoComplete="current-password" />}
        </Campo>
        {formState.errors.root && <Aviso>{formState.errors.root.message}</Aviso>}
        <Boton type="submit" className="w-full" cargando={formState.isSubmitting}>
          Entrar
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
      titulo="Crie sua conta"
      subtitulo={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-marca-600 hover:underline dark:text-marca-400">
            Entre
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate aria-label="Criar conta">
        {campo('nombre', 'Nome completo', { autoComplete: 'name', autoFocus: true })}
        {campo('dni', 'DNI', { inputMode: 'numeric', maxLength: 8 })}
        {campo('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        {campo('username', 'Usuário', { autoComplete: 'username' })}
        {campo('password', 'Senha', { type: 'password', autoComplete: 'new-password' })}
        {formState.errors.root && <Aviso>{formState.errors.root.message}</Aviso>}
        <Boton type="submit" className="w-full" cargando={formState.isSubmitting}>
          Criar conta
        </Boton>
      </form>
    </Marco>
  )
}
