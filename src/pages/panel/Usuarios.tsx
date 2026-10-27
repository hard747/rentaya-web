import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Aviso, Boton, Cargando, Celda, Encabezado, Insignia, Tabla, Tarjeta } from '../../components/ui'
import { api, mensajeDeError } from '../../lib/api'
import { nombreTipo } from '../../lib/format'
import type { Usuario } from '../../lib/types'
import { CampoSelector, CampoTexto, ModalFormulario, texto, useTrasOperar } from './comun'

const tonoRol = { ADMIN: 'rojo', EMPLEADO: 'marca', CLIENTE: 'gris' } as const

export function Usuarios() {
  const [creando, setCreando] = useState(false)
  const trasOperar = useTrasOperar()
  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: () => api<Usuario[]>('/api/v1/usuarios') })

  return (
    <>
      <Encabezado
        titulo="Usuarios"
        descripcion="Cuentas con acceso al sistema. Los clientes se registran solos; aquí se crean administradores y empleados."
        acciones={
          <Boton onClick={() => setCreando(true)} icono={<Plus className="size-4" />}>
            Nuevo usuario
          </Boton>
        }
      />
      <Tarjeta>
        {usuarios.isLoading ? (
          <Cargando />
        ) : usuarios.isError ? (
          <div className="p-5">
            <Aviso>{mensajeDeError(usuarios.error)}</Aviso>
          </div>
        ) : (
          <div className="p-1">
            <Tabla cabeceras={['Usuario', 'Rol', 'Cliente asociado']}>
              {usuarios.data!.map((u) => (
                <tr key={u.id}>
                  <Celda className="font-medium">{u.username}</Celda>
                  <Celda>
                    <Insignia tono={tonoRol[u.rol]}>{nombreTipo[u.rol]}</Insignia>
                  </Celda>
                  <Celda className="text-zinc-500">{u.clienteId ? `#${u.clienteId}` : '—'}</Celda>
                </tr>
              ))}
            </Tabla>
          </div>
        )}
      </Tarjeta>

      <ModalFormulario
        abierto={creando}
        titulo="Nuevo usuario"
        descripcion="La contraseña se guarda cifrada con BCrypt."
        textoEnviar="Crear usuario"
        onCerrar={() => setCreando(false)}
        onEnviar={async (d) => {
          const creado = await api<Usuario>('/api/v1/usuarios', {
            metodo: 'POST',
            cuerpo: { username: texto(d, 'username'), password: String(d.get('password')), rol: texto(d, 'rol') },
          })
          trasOperar(['usuarios'], `Usuario ${creado.username} creado`)
        }}
      >
        <CampoTexto etiqueta="Usuario" name="username" required minLength={4} maxLength={50} autoComplete="off" />
        <CampoTexto etiqueta="Contraseña" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" ayuda="Mínimo 8 caracteres" />
        <CampoSelector etiqueta="Rol" name="rol" defaultValue="EMPLEADO">
          <option value="EMPLEADO">Empleado</option>
          <option value="ADMIN">Administrador</option>
        </CampoSelector>
      </ModalFormulario>
    </>
  )
}
