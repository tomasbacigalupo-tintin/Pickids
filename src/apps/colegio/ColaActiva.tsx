import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, Card, FAB, Header, Input, Screen } from '../../components/ui'
import { StateChip } from '../../components/StateBar'
import { db } from '../../db/schema'
import { Search, QrCode, ChevronRight } from 'lucide-react'
import { useSession } from '../../store/session'
import type { EstadoRetiro } from '../../shared/types'
import { fmtHora } from '../../shared/format'

const filtros: { id: 'todos' | EstadoRetiro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'solicitado', label: 'Pendientes' },
  { id: 'autorizado', label: 'Autorizados' },
  { id: 'listo', label: 'Listos' },
  { id: 'entregado', label: 'Entregados' },
]

export function ColaActiva({ totalDia }: { totalDia: number }) {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const colegio = useLiveQuery(() => usuario?.colegioId ? db.colegios.get(usuario.colegioId) : undefined, [usuario?.colegioId])
  const solicitudes = useLiveQuery(async () => {
    if (!usuario?.colegioId) return []
    return await db.solicitudes.where('colegioId').equals(usuario.colegioId).reverse().sortBy('createdAt')
  }, [usuario?.colegioId]) ?? []
  const alumnosMap = useLiveQuery(async () => {
    const todos = await db.alumnos.toArray()
    return new Map(todos.map(a => [a.id, a]))
  }, []) ?? new Map()
  const autorizadosMap = useLiveQuery(async () => {
    const todos = await db.autorizados.toArray()
    return new Map(todos.map(a => [a.id, a]))
  }, []) ?? new Map()
  const [filtro, setFiltro] = useState<'todos' | EstadoRetiro>('todos')
  const [q, setQ] = useState('')

  const filtradas = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0)
    return solicitudes
      .filter(s => s.createdAt >= start.getTime())
      .filter(s => {
        if (filtro === 'todos') return true
        if (filtro === 'solicitado') return s.estado === 'solicitado' || s.estado === 'en_validacion'
        if (filtro === 'autorizado') return s.estado === 'autorizado' || s.estado === 'en_preparacion'
        return s.estado === filtro
      })
      .filter(s => {
        if (!q.trim()) return true
        const nombres = s.alumnosIds.map(id => alumnosMap.get(id)?.nombre ?? '').join(' ')
        return nombres.toLowerCase().includes(q.toLowerCase())
      })
  }, [solicitudes, filtro, q, alumnosMap])

  return (
    <>
      <Header title={colegio?.nombre ?? 'Colegio'} subtitle={`${totalDia} retiros hoy`} />
      <Screen withTabBar>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
          {filtros.map(f => (
            <button key={f.id} className="pk-chip" onClick={() => setFiltro(f.id)}
                    style={{
                      color: filtro === f.id ? 'white' : 'var(--p-primary)',
                      background: filtro === f.id ? 'var(--p-primary)' : 'var(--p-primary-tint)',
                      padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
                    }}>{f.label}</button>
          ))}
        </div>
        <Input value={q} onChange={setQ} placeholder="Buscar alumno..." leftIcon={<Search size={18} />} />
        {filtradas.length === 0 && <Card><div className="t-sm t-muted">Sin solicitudes para este filtro.</div></Card>}
        <div style={{ display: 'grid', gap: 10 }}>
          {filtradas.map(s => {
            const hijos = s.alumnosIds.map(id => alumnosMap.get(id)).filter(Boolean)
            const retirante = s.retiranteTipo === 'autorizado' && s.retiranteAutorizadoId ? autorizadosMap.get(s.retiranteAutorizadoId) : null
            return (
              <Card key={s.id} onClick={() => nav(`/colegio/solicitud/${s.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar nombre={hijos[0]?.nombre ?? '?'} apellido={hijos[0]?.apellido} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-h3" style={{ fontSize: 15 }}>
                      {hijos.map(h => h!.nombre).join(', ')} · <span className="t-sm t-muted">{hijos[0]?.curso}{hijos[0]?.division}</span>
                    </div>
                    <div className="t-sm t-muted">Retira: {retirante ? `${retirante.nombre} (${retirante.relacion.replace('_',' ')})` : 'Padre/Madre'}</div>
                    <div className="t-xs t-faded">{fmtHora(s.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <StateChip estado={s.estado} />
                    <ChevronRight size={16} color="var(--n-400)" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Screen>
      <FAB icon={<QrCode size={22} />} label="Escanear QR" onClick={() => nav('/colegio/escanear')} variant="action" />
    </>
  )
}
