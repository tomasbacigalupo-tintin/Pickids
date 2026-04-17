import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button, Card, Header, Screen, Avatar } from '../../components/ui'
import { StateChip } from '../../components/StateBar'
import { ChevronRight, Plus, Megaphone, Truck } from 'lucide-react'
import { db } from '../../db/schema'
import { getHijosDeUsuario, solicitudesActivasDeUsuario } from '../../db/repos'
import { useSession } from '../../store/session'
import { saludo, fmtFecha, fmtHora } from '../../shared/format'
import { ESTADO_META, idxEnBarra } from '../../shared/states'

export function Inicio() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const hijos = useLiveQuery(() => getHijosDeUsuario(usuarioId), [usuarioId]) ?? []
  const activas = useLiveQuery(() => solicitudesActivasDeUsuario(usuarioId), [usuarioId]) ?? []
  const historial = useLiveQuery(async () => {
    const todas = await db.solicitudes.where('solicitanteId').equals(usuarioId).reverse().sortBy('updatedAt')
    return todas.filter(s => ['entregado', 'rechazado', 'cancelado', 'expirado'].includes(s.estado)).slice(0, 3)
  }, [usuarioId]) ?? []
  const unread = useLiveQuery(async () => db.notificaciones.where('destinatarioId').equals(usuarioId).and(n => !n.leida).count(), [usuarioId]) ?? 0
  const mensaje = useLiveQuery(async () => {
    if (!usuario?.colegioId) return null
    const arr = await db.mensajes.where('colegioId').equals(usuario.colegioId).reverse().sortBy('createdAt')
    return arr[0]
  }, [usuario?.colegioId])

  if (!usuario) return null

  return (
    <>
      <Header title={saludo(usuario.nombre)} bell={{ count: unread, onClick: () => nav('/padres/notificaciones') }} />
      <Screen withTabBar>
        {activas.map(s => {
          const meta = ESTADO_META[s.estado]
          const pct = Math.max(1, idxEnBarra(s.estado) + 1)
          return (
            <Card key={s.id} variant="highlight" onClick={() => nav(`/padres/seguimiento/${s.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-xs" style={{ color: meta.color, fontWeight: 700, letterSpacing: 0.6 }}>RETIRO EN CURSO</div>
                  <HijosInline alumnosIds={s.alumnosIds} />
                  <div className="t-sm t-muted">{meta.label} · {fmtHora(s.createdAt)}</div>
                </div>
                <ChevronRight size={18} color="var(--n-400)" />
              </div>
              <div style={{ marginTop: 10, height: 6, background: 'rgba(245,158,11,0.14)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${(pct / 6) * 100}%`, height: '100%', background: meta.color, transition: 'width 0.3s' }} />
              </div>
            </Card>
          )
        })}

        <Button
          variant="action"
          fullWidth
          leftIcon={<Plus size={22} />}
          onClick={() => nav('/padres/solicitar')}
          disabled={hijos.length === 0}
        >Solicitar retiro</Button>

        <section>
          <div className="t-h3" style={{ marginBottom: 10 }}>Mis hijos</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {hijos.map(h => (
              <button key={h.id} onClick={() => nav(`/padres/hijos/${h.id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 64 }}>
                <Avatar nombre={h.nombre} apellido={h.apellido} size={56} />
                <span className="t-xs" style={{ color: 'var(--n-700)' }}>{h.nombre}</span>
              </button>
            ))}
            {hijos.length === 0 && <div className="t-sm t-muted">Vinculá tus hijos con el código de familia.</div>}
          </div>
        </section>

        <section>
          <div className="t-h3" style={{ marginBottom: 10 }}>Últimos retiros</div>
          {historial.length === 0 && <Card><div className="t-sm t-muted">Todavía no hay retiros completados.</div></Card>}
          <div style={{ display: 'grid', gap: 8 }}>
            {historial.map(s => (
              <Card key={s.id} onClick={() => nav(`/padres/seguimiento/${s.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <HijosInline alumnosIds={s.alumnosIds} />
                    <div className="t-sm t-muted">{fmtFecha(s.updatedAt)}</div>
                  </div>
                  <StateChip estado={s.estado} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {mensaje && (
          <Card variant="message">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--p-primary)', marginTop: 2 }}><Megaphone size={18} /></div>
              <div>
                <div className="t-h3" style={{ fontSize: 15 }}>{mensaje.titulo}</div>
                <div className="t-sm t-muted" style={{ marginTop: 4 }}>{mensaje.cuerpo}</div>
              </div>
            </div>
          </Card>
        )}
      </Screen>
    </>
  )
}

function HijosInline({ alumnosIds }: { alumnosIds: string[] }) {
  const hijos = useLiveQuery(() => db.alumnos.bulkGet(alumnosIds), [alumnosIds.join(',')]) ?? []
  const nombres = hijos.filter(Boolean).map(h => h!.nombre).join(' y ')
  return <div className="t-h3" style={{ fontSize: 16 }}>{nombres || '—'}</div>
}
