import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Header, Screen } from '../../components/ui'
import { ShieldCheck, Users, Settings } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'

export function SelectorRol() {
  const nav = useNavigate()
  const { usuarioId, selectRol } = useSession()
  const usuario = useLiveQuery(() => usuarioId ? db.usuarios.get(usuarioId) : undefined, [usuarioId])

  useEffect(() => {
    if (usuario && usuario.roles.length === 1) {
      selectRol(usuario.roles[0])
      nav(usuario.roles[0] === 'padre' ? '/padres/inicio' : '/colegio/cola', { replace: true })
    }
  }, [usuario, nav, selectRol])

  if (!usuario) return null
  const tieneRol = (r: string) => usuario.roles.includes(r as any)

  function elegir(r: any, path: string) {
    selectRol(r)
    nav(path, { replace: true })
  }

  return (
    <>
      <Header title="Elegí tu rol del turno" />
      <Screen>
        <p className="t-body t-muted">Hola, {usuario.nombre}. ¿Cómo vas a operar hoy?</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {tieneRol('padre') && (
            <Card onClick={() => elegir('padre', '/padres/inicio')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--p-primary-tint)', color: 'var(--p-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Users size={26} /></div>
                <div><div className="t-h3">Padre / Madre</div><div className="t-sm t-muted">Solicitar y seguir retiros</div></div>
              </div>
            </Card>
          )}
          {tieneRol('porteria') && (
            <Card onClick={() => elegir('porteria', '/colegio/cola')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--p-action-tint)', color: 'var(--p-action)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={26} /></div>
                <div><div className="t-h3">Portería</div><div className="t-sm t-muted">Validar y entregar alumnos</div></div>
              </div>
            </Card>
          )}
          {tieneRol('coordinacion') && (
            <Card onClick={() => elegir('coordinacion', '/colegio/cola')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--p-inprogress-tint)', color: 'var(--p-inprogress)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Users size={26} /></div>
                <div><div className="t-h3">Coordinación</div><div className="t-sm t-muted">Todo lo de Portería + reportes y mensajes</div></div>
              </div>
            </Card>
          )}
          {tieneRol('administracion') && (
            <Card onClick={() => elegir('administracion', '/colegio/cola')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--p-grey-tint)', color: 'var(--p-grey)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={26} /></div>
                <div><div className="t-h3">Administración</div><div className="t-sm t-muted">Horarios, usuarios y todo lo anterior</div></div>
              </div>
            </Card>
          )}
        </div>
      </Screen>
    </>
  )
}
