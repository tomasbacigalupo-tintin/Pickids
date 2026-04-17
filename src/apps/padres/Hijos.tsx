import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, Card, Header, Screen, Segmented } from '../../components/ui'
import { StateChip } from '../../components/StateBar'
import { db } from '../../db/schema'
import { getHijosDeUsuario } from '../../db/repos'
import { useSession } from '../../store/session'
import { fmtFecha } from '../../shared/format'
import { ChevronRight } from 'lucide-react'

export function HijosLista() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const hijos = useLiveQuery(() => getHijosDeUsuario(usuarioId), [usuarioId]) ?? []

  return (
    <>
      <Header title="Mis hijos" />
      <Screen withTabBar>
        {hijos.length === 0 && (
          <Card><div className="t-sm t-muted">Todavía no vinculaste a tus hijos.</div></Card>
        )}
        <div style={{ display: 'grid', gap: 10 }}>
          {hijos.map(h => (
            <Card key={h.id} onClick={() => nav(`/padres/hijos/${h.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar nombre={h.nombre} apellido={h.apellido} size={52} />
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ fontSize: 16 }}>{h.nombre} {h.apellido}</div>
                  <div className="t-sm t-muted">{h.curso}{h.division} · Turno {h.turno}</div>
                </div>
                <div className="pk-chip" style={{
                  color: h.asistencia === 'presente' ? 'var(--p-success)' : h.asistencia === 'ausente' ? 'var(--p-error)' : 'var(--p-grey)',
                  background: h.asistencia === 'presente' ? 'var(--p-ready-tint)' : h.asistencia === 'ausente' ? 'var(--p-error-tint)' : 'var(--p-grey-tint)',
                }}>
                  {h.asistencia === 'presente' ? 'Presente' : h.asistencia === 'ausente' ? 'Ausente' : 'Retirado'}
                </div>
                <ChevronRight size={18} color="var(--n-400)" />
              </div>
            </Card>
          ))}
        </div>
      </Screen>
    </>
  )
}

export function DetalleHijo() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const alumno = useLiveQuery(() => id ? db.alumnos.get(id) : undefined, [id])
  const autorizados = useLiveQuery(async () => {
    if (!id) return []
    const todos = await db.autorizados.where('usuarioId').equals(usuarioId).toArray()
    return todos.filter(a => a.alumnosPermitidos.includes(id))
  }, [id, usuarioId]) ?? []
  const historial = useLiveQuery(async () => {
    if (!id) return []
    const todas = await db.solicitudes.where('solicitanteId').equals(usuarioId).reverse().sortBy('updatedAt')
    return todas.filter(s => s.alumnosIds.includes(id)).slice(0, 10)
  }, [id, usuarioId]) ?? []
  const [tab, setTab] = useState<'info' | 'aut' | 'hist'>('info')
  if (!alumno) return null

  return (
    <>
      <Header title={`${alumno.nombre} ${alumno.apellido}`} back={() => nav(-1)} />
      <Screen>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar nombre={alumno.nombre} apellido={alumno.apellido} size={72} />
            <div>
              <div className="t-h2" style={{ fontSize: 20 }}>{alumno.nombre} {alumno.apellido}</div>
              <div className="t-sm t-muted">{alumno.curso}{alumno.division} · Turno {alumno.turno}</div>
            </div>
          </div>
        </Card>
        <Segmented value={tab} onChange={setTab} items={[
          { id: 'info', label: 'Info' },
          { id: 'aut', label: 'Autorizados' },
          { id: 'hist', label: 'Historial' },
        ]} />
        {tab === 'info' && (
          <Card>
            <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>OBSERVACIONES MÉDICAS</div>
            <div className="t-body">{alumno.observacionesMedicas ?? 'Sin observaciones registradas.'}</div>
          </Card>
        )}
        {tab === 'aut' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {autorizados.length === 0 && <Card><div className="t-sm t-muted">Sin autorizados para este hijo.</div></Card>}
            {autorizados.map(a => (
              <Card key={a.id} onClick={() => nav(`/padres/autorizados/${a.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar nombre={a.nombre} apellido={a.apellido} />
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 15 }}>{a.nombre} {a.apellido}</div>
                    <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>{a.relacion.replace('_', ' ')} · {a.estado}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === 'hist' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {historial.length === 0 && <Card><div className="t-sm t-muted">Sin retiros previos.</div></Card>}
            {historial.map(s => (
              <Card key={s.id} onClick={() => nav(`/padres/seguimiento/${s.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}><div className="t-sm">{fmtFecha(s.updatedAt)}</div></div>
                  <StateChip estado={s.estado} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Screen>
    </>
  )
}
