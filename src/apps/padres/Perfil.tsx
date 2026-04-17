import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, Button, Card, Header, Screen, Switch, BottomSheet } from '../../components/ui'
import { ChevronRight, Bell, HelpCircle, LogOut, RefreshCw, Shield } from 'lucide-react'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'
import { useState } from 'react'
import { resetDemo } from '../../db/seed'
import { emit } from '../../db/sync'
import { requestNotifPermission } from '../../db/sync'
import { useToast } from '../../store/toast'

export function Perfil() {
  const nav = useNavigate()
  const { usuarioId, logout } = useSession()
  const usuario = useLiveQuery(() => usuarioId ? db.usuarios.get(usuarioId) : undefined, [usuarioId])
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const pushToast = useToast(s => s.push)

  if (!usuario) return null

  async function doReset() {
    await resetDemo()
    emit({ type: 'data_reset' })
    setTimeout(() => window.location.reload(), 50)
  }

  async function askNotifs() {
    const r = await requestNotifPermission()
    if (r === 'granted') pushToast({ title: 'Notificaciones activadas', variant: 'success' })
    else pushToast({ title: 'Notificaciones bloqueadas', body: 'Activalas desde los ajustes del sistema.', variant: 'warning' })
  }

  return (
    <>
      <Header title="Perfil" />
      <Screen withTabBar>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar nombre={usuario.nombre} apellido={usuario.apellido} size={64} />
            <div>
              <div className="t-h2" style={{ fontSize: 18 }}>{usuario.nombre} {usuario.apellido}</div>
              <div className="t-sm t-muted">{usuario.email}</div>
              {usuario.verificado && (
                <div className="t-xs" style={{ color: 'var(--p-success)', fontWeight: 600, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={12} /> Identidad verificada
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <ItemRow icon={<Bell size={18} />} label="Permitir notificaciones" action={<Button variant="ghost" size="sm" onClick={askNotifs}>Activar</Button>} />
          <ItemRow icon={<Bell size={18} />} label="Configurar notificaciones" onClick={() => nav('/padres/perfil/notificaciones')} arrow />
          <ItemRow icon={<HelpCircle size={18} />} label="Ayuda y FAQ" onClick={() => nav('/padres/perfil/ayuda')} arrow />
          <ItemRow icon={<RefreshCw size={18} />} label="Resetear datos demo" onClick={() => setConfirmReset(true)} arrow />
          <ItemRow icon={<LogOut size={18} />} label="Cerrar sesión" onClick={() => setConfirmLogout(true)} arrow danger />
        </Card>
      </Screen>

      <BottomSheet open={confirmReset} onClose={() => setConfirmReset(false)} title="¿Resetear datos demo?">
        <p className="t-body">Se va a borrar todo (solicitudes, autorizados, notificaciones) y volver al estado inicial.</p>
        <Button variant="destructive" fullWidth onClick={doReset}>Sí, resetear</Button>
        <Button variant="ghost" fullWidth onClick={() => setConfirmReset(false)}>Cancelar</Button>
      </BottomSheet>

      <BottomSheet open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Cerrar sesión">
        <Button variant="primary" fullWidth onClick={() => { logout(); nav('/login', { replace: true }) }}>Cerrar sesión</Button>
        <Button variant="ghost" fullWidth onClick={() => setConfirmLogout(false)}>Cancelar</Button>
      </BottomSheet>
    </>
  )
}

export function ConfigNotif() {
  const [estados, setEstados] = useState(true)
  const [mensajes, setMensajes] = useState(true)
  const [promos, setPromos] = useState(false)
  const [record, setRecord] = useState(true)
  const nav = useNavigate()
  return (
    <>
      <Header title="Notificaciones" back={() => nav(-1)} />
      <Screen>
        <Card>
          <Switch checked={estados} onChange={setEstados} label="Cambios de estado" description="Cuando cambia tu solicitud." />
          <Switch checked={mensajes} onChange={setMensajes} label="Mensajes del colegio" description="Avisos generales." />
          <Switch checked={record} onChange={setRecord} label="Recordatorios" description="Si alguien olvida retirar." />
          <Switch checked={promos} onChange={setPromos} label="Promociones" description="Novedades del producto." />
        </Card>
      </Screen>
    </>
  )
}

export function Ayuda() {
  const nav = useNavigate()
  const faqs = [
    ['¿Cómo pido un retiro?', 'Desde Inicio tocás "Solicitar retiro". En 3 pasos elegís a quién, quién lo retira y el horario.'],
    ['¿Cómo funciona un autorizado?', 'Cargás foto + DNI. El colegio valida. Después podés elegirlo al solicitar.'],
    ['¿Puedo cancelar?', 'Sí, hasta el estado "En preparación". Cuando el hijo está en portería ya no se puede.'],
    ['¿Qué pasa si expira?', 'Si nadie retira en 45 min desde "Listo", la solicitud se cierra y el alumno vuelve al aula.'],
    ['¿Comparto el QR?', 'Sí, desde el seguimiento. El autorizado abre el link y muestra el QR en portería.'],
  ]
  return (
    <>
      <Header title="Ayuda" back={() => nav(-1)} />
      <Screen>
        <div style={{ display: 'grid', gap: 10 }}>
          {faqs.map(([q, a], i) => (
            <details key={i} style={{ background: 'white', borderRadius: 16, padding: 14, boxShadow: 'var(--shadow-card)' }}>
              <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{q}</summary>
              <div className="t-body t-muted" style={{ marginTop: 8 }}>{a}</div>
            </details>
          ))}
        </div>
      </Screen>
    </>
  )
}

function ItemRow(props: { icon: React.ReactNode; label: string; onClick?: () => void; arrow?: boolean; action?: React.ReactNode; danger?: boolean }) {
  return (
    <div className="pk-list-row" onClick={props.onClick} style={{ cursor: props.onClick ? 'pointer' : 'default', color: props.danger ? 'var(--p-error)' : undefined }}>
      <span style={{ color: props.danger ? 'var(--p-error)' : 'var(--n-600)' }}>{props.icon}</span>
      <span style={{ flex: 1, fontWeight: 500 }}>{props.label}</span>
      {props.action}
      {props.arrow && <ChevronRight size={18} color="var(--n-400)" />}
    </div>
  )
}
