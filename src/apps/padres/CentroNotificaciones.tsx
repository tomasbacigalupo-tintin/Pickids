import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button, Card, Header, Screen } from '../../components/ui'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'
import { fmtFecha } from '../../shared/format'
import { Bell, CheckCheck } from 'lucide-react'

export function CentroNotificaciones() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const lista = useLiveQuery(() => db.notificaciones.where('destinatarioId').equals(usuarioId).reverse().sortBy('createdAt'), [usuarioId]) ?? []

  async function marcarTodasLeidas() {
    await db.notificaciones.where('destinatarioId').equals(usuarioId).modify({ leida: true })
  }

  return (
    <>
      <Header title="Notificaciones" back={() => nav(-1)} right={
        <Button variant="ghost" size="sm" onClick={marcarTodasLeidas} leftIcon={<CheckCheck size={14} />}>Leer todas</Button>
      } />
      <Screen>
        {lista.length === 0 && (
          <Card><div className="t-sm t-muted">Sin notificaciones por ahora.</div></Card>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {lista.map(n => (
            <Card key={n.id} onClick={async () => {
              await db.notificaciones.update(n.id, { leida: true })
              if (n.deepLink) nav(n.deepLink)
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12, background: n.prioridad === 'critica' ? 'var(--p-error-tint)' : 'var(--p-primary-tint)',
                  color: n.prioridad === 'critica' ? 'var(--p-error)' : 'var(--p-primary)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><Bell size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {n.titulo}
                    {!n.leida && <span style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--p-action)' }} />}
                  </div>
                  <div className="t-sm t-muted">{n.cuerpo}</div>
                  <div className="t-xs t-faded" style={{ marginTop: 4 }}>{fmtFecha(n.createdAt)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Screen>
    </>
  )
}
