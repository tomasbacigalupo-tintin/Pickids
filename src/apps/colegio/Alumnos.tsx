import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, Card, Header, Input, Screen, Segmented } from '../../components/ui'
import { StateChip } from '../../components/StateBar'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'
import { Search, Phone, Siren } from 'lucide-react'
import { fmtFecha } from '../../shared/format'

export function Alumnos() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const lista = useLiveQuery(async () => {
    if (!usuario?.colegioId) return []
    return await db.alumnos.where('colegioId').equals(usuario.colegioId).toArray()
  }, [usuario?.colegioId]) ?? []
  const [q, setQ] = useState('')

  const filtradas = lista.filter(a => !q.trim() || `${a.nombre} ${a.apellido}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <Header title="Alumnos" />
      <Screen withTabBar>
        <Input value={q} onChange={setQ} placeholder="Buscar alumno..." leftIcon={<Search size={18} />} />
        <div style={{ display: 'grid', gap: 10 }}>
          {filtradas.map(a => (
            <Card key={a.id} onClick={() => nav(`/colegio/alumnos/${a.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar nombre={a.nombre} apellido={a.apellido} />
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ fontSize: 15 }}>{a.nombre} {a.apellido}</div>
                  <div className="t-sm t-muted">{a.curso}{a.division} · {a.turno}</div>
                </div>
                <span className="pk-chip" style={{
                  color: a.asistencia === 'presente' ? 'var(--p-success)' : a.asistencia === 'ausente' ? 'var(--p-error)' : 'var(--p-grey)',
                  background: a.asistencia === 'presente' ? 'var(--p-ready-tint)' : a.asistencia === 'ausente' ? 'var(--p-error-tint)' : 'var(--p-grey-tint)',
                }}>
                  {a.asistencia === 'presente' ? 'Presente' : a.asistencia === 'ausente' ? 'Ausente' : 'Retirado'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </Screen>
    </>
  )
}

export function FichaAlumno() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const alumno = useLiveQuery(() => id ? db.alumnos.get(id) : undefined, [id])
  const vinculos = useLiveQuery(() => id ? db.vinculos.where('alumnoId').equals(id).toArray() : [], [id]) ?? []
  const familia = useLiveQuery(() => vinculos.length ? db.usuarios.bulkGet(vinculos.map(v => v.usuarioId)) : [], [vinculos.map(v => v.usuarioId).join(',')]) ?? []
  const autorizados = useLiveQuery(async () => {
    if (!id) return []
    const all = await db.autorizados.toArray()
    return all.filter(a => a.alumnosPermitidos.includes(id))
  }, [id]) ?? []
  const historial = useLiveQuery(async () => {
    if (!id) return []
    const todas = await db.solicitudes.reverse().sortBy('createdAt')
    return todas.filter(s => s.alumnosIds.includes(id)).slice(0, 15)
  }, [id]) ?? []
  const [tab, setTab] = useState<'fam' | 'aut' | 'hist'>('fam')
  const { rol } = useSession()
  const puedeBloquear = rol === 'coordinacion' || rol === 'administracion'
  if (!alumno) return null

  async function toggleBloqueo() {
    if (!alumno) return
    await db.alumnos.update(alumno.id, {
      bloqueadoRetiro: !alumno.bloqueadoRetiro,
      bloqueadoMotivo: !alumno.bloqueadoRetiro ? 'Bloqueo temporal decidido por coordinación' : null,
    })
  }

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
              {alumno.observacionesMedicas && (
                <div className="t-xs" style={{ color: 'var(--p-error)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Siren size={12} /> {alumno.observacionesMedicas}
                </div>
              )}
            </div>
          </div>
        </Card>

        {puedeBloquear && (
          <Card variant={alumno.bloqueadoRetiro ? 'message' : 'default'} style={alumno.bloqueadoRetiro ? { borderLeftColor: 'var(--p-error)', background: 'var(--p-error-tint)' } : undefined}>
            <div className="t-h3" style={{ fontSize: 14 }}>Bloqueo temporal</div>
            <div className="t-sm t-muted">{alumno.bloqueadoRetiro ? 'El retiro está suspendido para este alumno.' : 'Los retiros están habilitados.'}</div>
            <button onClick={toggleBloqueo} style={{ marginTop: 10, color: 'var(--p-primary)', fontWeight: 600 }}>
              {alumno.bloqueadoRetiro ? 'Quitar bloqueo' : 'Bloquear retiros'}
            </button>
          </Card>
        )}

        <Segmented value={tab} onChange={setTab} items={[
          { id: 'fam', label: 'Familia' },
          { id: 'aut', label: 'Autorizados' },
          { id: 'hist', label: 'Historial' },
        ]} />

        {tab === 'fam' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {familia.filter(Boolean).map(u => (
              <Card key={u!.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar nombre={u!.nombre} apellido={u!.apellido} />
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 15 }}>{u!.nombre} {u!.apellido}</div>
                    <div className="t-sm t-muted">{u!.email}</div>
                  </div>
                  {u!.telefono && (
                    <a href={`tel:${u!.telefono}`} className="pk-header__btn" aria-label="Llamar"><Phone size={18} /></a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === 'aut' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {autorizados.length === 0 && <Card><div className="t-sm t-muted">Sin autorizados.</div></Card>}
            {autorizados.map(a => (
              <Card key={a.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar nombre={a.nombre} apellido={a.apellido} />
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 15 }}>{a.nombre} {a.apellido}</div>
                    <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>{a.relacion.replace('_',' ')} · {a.estado}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab === 'hist' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {historial.length === 0 && <Card><div className="t-sm t-muted">Sin retiros previos.</div></Card>}
            {historial.map(s => (
              <Card key={s.id} onClick={() => nav(`/colegio/solicitud/${s.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="t-sm">{fmtFecha(s.createdAt)}</div>
                  </div>
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
