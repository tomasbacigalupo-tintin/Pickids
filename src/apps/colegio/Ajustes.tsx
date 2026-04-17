import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, BottomSheet, Button, Card, Header, Input, Screen, TextArea, Segmented } from '../../components/ui'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'
import { Clock, Users, Megaphone, LogOut, RefreshCw, ChevronRight } from 'lucide-react'
import { resetDemo } from '../../db/seed'
import { emit } from '../../db/sync'
import { uid } from '../../shared/format'
import { useToast } from '../../store/toast'

export function Ajustes() {
  const nav = useNavigate()
  const { logout, rol } = useSession()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const admin = rol === 'administracion'
  const coord = rol === 'coordinacion' || admin

  async function doReset() {
    await resetDemo()
    emit({ type: 'data_reset' })
    setTimeout(() => window.location.reload(), 50)
  }

  return (
    <>
      <Header title="Ajustes" />
      <Screen withTabBar>
        <Card style={{ padding: 0 }}>
          {coord && <ItemRow icon={<Clock size={18} />} label="Horarios de retiro" onClick={() => nav('/colegio/ajustes/horarios')} arrow />}
          {admin && <ItemRow icon={<Users size={18} />} label="Usuarios del colegio" onClick={() => nav('/colegio/ajustes/usuarios')} arrow />}
          {coord && <ItemRow icon={<Megaphone size={18} />} label="Publicar mensaje" onClick={() => nav('/colegio/ajustes/mensaje')} arrow />}
          <ItemRow icon={<RefreshCw size={18} />} label="Resetear datos demo" onClick={() => setConfirmReset(true)} arrow />
          <ItemRow icon={<LogOut size={18} />} label="Cerrar sesión" onClick={() => setConfirmLogout(true)} danger />
        </Card>
      </Screen>

      <BottomSheet open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Cerrar sesión">
        <Button variant="primary" fullWidth onClick={() => { logout(); nav('/login', { replace: true }) }}>Cerrar sesión</Button>
        <Button variant="ghost" fullWidth onClick={() => setConfirmLogout(false)}>Cancelar</Button>
      </BottomSheet>

      <BottomSheet open={confirmReset} onClose={() => setConfirmReset(false)} title="¿Resetear datos demo?">
        <Button variant="destructive" fullWidth onClick={doReset}>Sí, resetear</Button>
        <Button variant="ghost" fullWidth onClick={() => setConfirmReset(false)}>Cancelar</Button>
      </BottomSheet>
    </>
  )
}

export function Horarios() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const colegio = useLiveQuery(() => usuario?.colegioId ? db.colegios.get(usuario.colegioId) : undefined, [usuario?.colegioId])
  const [apertura, setApertura] = useState(colegio?.horarioApertura ?? '07:30')
  const [cierre, setCierre] = useState(colegio?.horarioCierre ?? '18:00')
  const pushToast = useToast(s => s.push)

  async function guardar() {
    if (!colegio) return
    await db.colegios.update(colegio.id, { horarioApertura: apertura, horarioCierre: cierre })
    pushToast({ title: 'Horarios actualizados', variant: 'success' })
    nav(-1)
  }

  return (
    <>
      <Header title="Horarios de retiro" back={() => nav(-1)} />
      <Screen>
        <Card>
          <div className="t-sm t-muted">Definí el rango horario permitido para solicitar retiros.</div>
        </Card>
        <label className="pk-field">
          <span className="pk-field__label">Apertura</span>
          <input type="time" value={apertura} onChange={(e) => setApertura(e.target.value)} className="pk-textarea" style={{ height: 48 }} />
        </label>
        <label className="pk-field">
          <span className="pk-field__label">Cierre</span>
          <input type="time" value={cierre} onChange={(e) => setCierre(e.target.value)} className="pk-textarea" style={{ height: 48 }} />
        </label>
        <Button variant="primary" fullWidth onClick={guardar}>Guardar</Button>
      </Screen>
    </>
  )
}

export function UsuariosColegio() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const staff = useLiveQuery(async () => {
    if (!usuario?.colegioId) return []
    const u = await db.usuarios.where('colegioId').equals(usuario.colegioId).toArray()
    return u.filter(x => x.roles.some(r => r !== 'padre'))
  }, [usuario?.colegioId]) ?? []

  return (
    <>
      <Header title="Usuarios del colegio" back={() => nav(-1)} />
      <Screen>
        <div style={{ display: 'grid', gap: 10 }}>
          {staff.map(u => (
            <Card key={u.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar nombre={u.nombre} apellido={u.apellido} />
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ fontSize: 15 }}>{u.nombre} {u.apellido}</div>
                  <div className="t-sm t-muted">{u.email}</div>
                  <div className="t-xs" style={{ color: 'var(--p-primary)', fontWeight: 600, textTransform: 'capitalize' }}>{u.roles.filter(r => r !== 'padre').join(' · ')}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Screen>
    </>
  )
}

export function PublicarMensaje() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [audiencia, setAudiencia] = useState<'todos' | 'curso'>('todos')
  const pushToast = useToast(s => s.push)

  async function publicar() {
    if (!usuario?.colegioId) return
    await db.mensajes.put({
      id: uid('m-'),
      colegioId: usuario.colegioId,
      titulo: titulo.trim(),
      cuerpo: cuerpo.trim(),
      audiencia: 'todos',
      publicadoPor: usuario.id,
      createdAt: Date.now(),
    })
    emit({ type: 'mensaje_nuevo', mensajeId: 'na' })
    // Notificar a todos los padres del colegio
    const padres = await db.usuarios.where('colegioId').equals(usuario.colegioId).toArray()
    const now = Date.now()
    for (const p of padres) {
      if (!p.roles.includes('padre')) continue
      await db.notificaciones.put({
        id: uid('n-'),
        destinatarioId: p.id,
        destinatarioTipo: 'padre',
        tipo: 'mensaje_colegio',
        prioridad: 'normal',
        titulo: titulo.trim(),
        cuerpo: cuerpo.trim(),
        deepLink: '/padres/inicio',
        leida: false,
        createdAt: now,
      })
    }
    pushToast({ title: 'Mensaje publicado', variant: 'success' })
    nav(-1)
  }

  return (
    <>
      <Header title="Publicar mensaje" back={() => nav(-1)} />
      <Screen>
        <Input label="Título" value={titulo} onChange={setTitulo} placeholder="Ej: Simulacro de evacuación" />
        <TextArea label="Cuerpo" value={cuerpo} onChange={setCuerpo} rows={6} placeholder="Detalle del mensaje..." />
        <div>
          <div className="pk-field__label" style={{ marginBottom: 8 }}>Audiencia</div>
          <Segmented value={audiencia} onChange={setAudiencia} items={[{ id: 'todos', label: 'Todos' }, { id: 'curso', label: 'Por curso' }]} />
        </div>
        <Button variant="primary" fullWidth disabled={!titulo.trim() || !cuerpo.trim()} onClick={publicar}>Publicar</Button>
      </Screen>
    </>
  )
}

function ItemRow(props: { icon: React.ReactNode; label: string; onClick?: () => void; arrow?: boolean; danger?: boolean }) {
  return (
    <div className="pk-list-row" onClick={props.onClick} style={{ cursor: props.onClick ? 'pointer' : 'default', color: props.danger ? 'var(--p-error)' : undefined }}>
      <span style={{ color: props.danger ? 'var(--p-error)' : 'var(--n-600)' }}>{props.icon}</span>
      <span style={{ flex: 1, fontWeight: 500 }}>{props.label}</span>
      {props.arrow && <ChevronRight size={18} color="var(--n-400)" />}
    </div>
  )
}
