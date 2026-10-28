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
        titulo="Usuários"
        descripcion="Contas com acesso ao sistema. Os clientes se cadastram sozinhos; aqui são criados administradores e funcionários."
        acciones={
          <Boton onClick={() => setCreando(true)} icono={<Plus className="size-4" />}>
            Novo usuário
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
            <Tabla cabeceras={['Usuário', 'Perfil', 'Cliente associado']}>
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
        titulo="Novo usuário"
        descripcion="A senha é salva criptografada com BCrypt."
        textoEnviar="Criar usuário"
        onCerrar={() => setCreando(false)}
        onEnviar={async (d) => {
          const creado = await api<Usuario>('/api/v1/usuarios', {
            metodo: 'POST',
            cuerpo: { username: texto(d, 'username'), password: String(d.get('password')), rol: texto(d, 'rol') },
          })
          trasOperar(['usuarios'], `Usuário ${creado.username} criado`)
        }}
      >
        <CampoTexto etiqueta="Usuário" name="username" required minLength={4} maxLength={50} autoComplete="off" />
        <CampoTexto etiqueta="Senha" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" ayuda="Mínimo de 8 caracteres" />
        <CampoSelector etiqueta="Perfil" name="rol" defaultValue="EMPLEADO">
          <option value="EMPLEADO">Funcionário</option>
          <option value="ADMIN">Administrador</option>
        </CampoSelector>
      </ModalFormulario>
    </>
  )
}
