import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, Button, Card, FAB, Header, Input, Screen, Segmented, StickyAction, BottomSheet } from '../../components/ui'
import { db } from '../../db/schema'
import { crearAutorizado, getHijosDeUsuario, setAutorizadoEstado } from '../../db/repos'
import { useSession } from '../../store/session'
import { Plus, Check } from 'lucide-react'
import type { RelacionAutorizado, VigenciaAutorizado } from '../../shared/types'
import { dniMask } from '../../shared/format'
import { useToast } from '../../store/toast'

export function AutorizadosLista() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const lista = useLiveQuery(() => db.autorizados.where('usuarioId').equals(usuarioId).toArray(), [usuarioId]) ?? []

  return (
    <>
      <Header title="Autorizados" />
      <Screen withTabBar>
        {lista.length === 0 && <Card><div className="t-sm t-muted">Todavía no cargaste autorizados.</div></Card>}
        <div style={{ display: 'grid', gap: 10 }}>
          {lista.map(a => {
            const color = a.estado === 'activo' ? 'var(--p-success)' : a.estado === 'pendiente' ? 'var(--p-pending)' : 'var(--p-grey)'
            const bg = a.estado === 'activo' ? 'var(--p-ready-tint)' : a.estado === 'pendiente' ? 'var(--p-pending-tint)' : 'var(--p-grey-tint)'
            return (
              <Card key={a.id} onClick={() => nav(`/padres/autorizados/${a.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar nombre={a.nombre} apellido={a.apellido} />
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 15 }}>{a.nombre} {a.apellido}</div>
                    <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>{a.relacion.replace('_', ' ')} · {a.alumnosPermitidos.length} hijo{a.alumnosPermitidos.length !== 1 ? 's' : ''}</div>
                  </div>
                  <span className="pk-chip" style={{ color, background: bg, textTransform: 'capitalize' }}>{a.estado}</span>
                </div>
              </Card>
            )
          })}
        </div>
      </Screen>
      <FAB icon={<Plus size={24} />} onClick={() => nav('/padres/autorizados/nuevo')} variant="action" />
    </>
  )
}

export function AgregarAutorizado() {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const hijos = useLiveQuery(() => getHijosDeUsuario(usuarioId), [usuarioId]) ?? []
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [relacion, setRelacion] = useState<RelacionAutorizado>('abuela')
  const [vigencia, setVigencia] = useState<VigenciaAutorizado>({ tipo: 'permanente' })
  const [alumnosIds, setAlumnosIds] = useState<string[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const pushToast = useToast(s => s.push)

  function toggleAlumno(id: string) {
    const s = new Set(alumnosIds); if (s.has(id)) s.delete(id); else s.add(id); setAlumnosIds(Array.from(s))
  }

  async function guardar() {
    if (!nombre || !apellido || !dni || alumnosIds.length === 0) { setErr('Completá nombre, apellido, DNI y al menos un hijo.'); return }
    setLoading(true)
    await crearAutorizado({
      usuarioId, nombre, apellido, dni: dni.replace(/\D/g, ''), telefono,
      relacion, vigencia, alumnosPermitidos: alumnosIds,
    })
    setLoading(false)
    pushToast({ title: 'Autorizado creado', body: vigencia.tipo === 'solo_hoy' ? 'Listo para hoy' : 'Pendiente de validación', variant: 'success' })
    nav('/padres/autorizados', { replace: true })
  }

  return (
    <>
      <Header title="Nuevo autorizado" back={() => nav(-1)} />
      <Screen withStickyAction>
        <div style={{
          alignSelf: 'center', width: 110, height: 110, borderRadius: 999, background: 'var(--n-100)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--n-400)',
          fontSize: 42, marginBottom: 8,
        }}>📷</div>
        <Input label="Nombre" value={nombre} onChange={setNombre} placeholder="Carmen" />
        <Input label="Apellido" value={apellido} onChange={setApellido} placeholder="Pérez" />
        <Input label="DNI" value={dniMask(dni)} onChange={(v) => setDni(v.replace(/\D/g, ''))} placeholder="28.456.789" inputMode="numeric" />
        <Input label="Teléfono" value={telefono} onChange={setTelefono} placeholder="+54 9 351 555 0200" inputMode="tel" />

        <div>
          <div className="pk-field__label" style={{ marginBottom: 8 }}>Relación</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['abuelo','abuela','tio','tia','amigo_familiar','remis','otro'] as RelacionAutorizado[]).map(r => (
              <button key={r} onClick={() => setRelacion(r)} className="pk-chip"
                      style={{
                        color: relacion === r ? 'white' : 'var(--p-primary)',
                        background: relacion === r ? 'var(--p-primary)' : 'var(--p-primary-tint)',
                        padding: '6px 12px', cursor: 'pointer', textTransform: 'capitalize',
                      }}>
                {r.replace('_',' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="pk-field__label" style={{ marginBottom: 8 }}>Vigencia</div>
          <Segmented value={vigencia.tipo} onChange={(v) => setVigencia(v === 'permanente' ? { tipo: 'permanente' } : v === 'solo_hoy' ? { tipo: 'solo_hoy' } : { tipo: 'rango', desde: new Date().toISOString().slice(0,10), hasta: new Date().toISOString().slice(0,10) })}
                     items={[
                       { id: 'permanente', label: 'Permanente' },
                       { id: 'solo_hoy', label: 'Solo hoy' },
                       { id: 'rango', label: 'Rango' },
                     ]} />
        </div>

        <div>
          <div className="pk-field__label" style={{ marginBottom: 8 }}>Hijos autorizados</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {hijos.map(h => {
              const checked = alumnosIds.includes(h.id)
              return (
                <Card key={h.id} onClick={() => toggleAlumno(h.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? 'var(--p-primary)' : 'var(--n-200)'}`, background: checked ? 'var(--p-primary)' : 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {checked && <Check size={14} color="white" />}
                    </div>
                    <Avatar nombre={h.nombre} apellido={h.apellido} size={36} />
                    <div style={{ flex: 1 }}>
                      <div className="t-h3" style={{ fontSize: 15 }}>{h.nombre} {h.apellido}</div>
                      <div className="t-xs t-muted">{h.curso}{h.division}</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {err && <div className="t-sm" style={{ color: 'var(--p-error)' }}>{err}</div>}
      </Screen>
      <StickyAction>
        <Button variant="primary" fullWidth loading={loading} onClick={guardar}>Guardar</Button>
      </StickyAction>
    </>
  )
}

export function DetalleAutorizado() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const a = useLiveQuery(() => id ? db.autorizados.get(id) : undefined, [id])
  const hijos = useLiveQuery(() => a ? db.alumnos.bulkGet(a.alumnosPermitidos) : [], [a?.alumnosPermitidos.join(',')]) ?? []
  const [confirmDesact, setConfirmDesact] = useState(false)
  const pushToast = useToast(s => s.push)
  if (!a) return null

  async function desactivar() {
    if (!a) return
    await setAutorizadoEstado(a.id, 'desactivado')
    setConfirmDesact(false)
    pushToast({ title: 'Autorizado desactivado', variant: 'info' })
    nav('/padres/autorizados', { replace: true })
  }

  async function reactivar() {
    if (!a) return
    await setAutorizadoEstado(a.id, 'activo')
    pushToast({ title: 'Autorizado activo', variant: 'success' })
  }

  return (
    <>
      <Header title={`${a.nombre} ${a.apellido}`} back={() => nav(-1)} />
      <Screen>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar nombre={a.nombre} apellido={a.apellido} size={64} />
            <div>
              <div className="t-h2" style={{ fontSize: 18 }}>{a.nombre} {a.apellido}</div>
              <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>{a.relacion.replace('_',' ')}</div>
            </div>
          </div>
        </Card>
        <Card>
          <Row label="DNI" value={dniMask(a.dni)} />
          <Row label="Teléfono" value={a.telefono ?? '—'} />
          <Row label="Vigencia" value={a.vigencia.tipo === 'rango' ? `${a.vigencia.desde} → ${a.vigencia.hasta}` : a.vigencia.tipo === 'permanente' ? 'Permanente' : 'Solo hoy'} />
          <Row label="Estado" value={a.estado} />
        </Card>
        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>HIJOS CUBIERTOS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {hijos.filter(Boolean).map(h => (
              <span key={h!.id} className="pk-chip" style={{ background: 'var(--p-primary-tint)', color: 'var(--p-primary)' }}>{h!.nombre}</span>
            ))}
          </div>
        </Card>
        {a.estado === 'activo' && <Button variant="destructive" fullWidth onClick={() => setConfirmDesact(true)}>Desactivar</Button>}
        {a.estado === 'desactivado' && <Button variant="primary" fullWidth onClick={reactivar}>Reactivar</Button>}
      </Screen>

      <BottomSheet open={confirmDesact} onClose={() => setConfirmDesact(false)} title="Desactivar autorizado">
        <p className="t-body">El autorizado ya no podrá retirar hijos hasta que lo reactives.</p>
        <Button variant="destructive" fullWidth onClick={desactivar}>Sí, desactivar</Button>
        <Button variant="ghost" fullWidth onClick={() => setConfirmDesact(false)}>Volver</Button>
      </BottomSheet>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
      <div className="t-sm t-muted" style={{ width: 90, flexShrink: 0 }}>{label}</div>
      <div className="t-sm" style={{ fontWeight: 500, textTransform: 'capitalize' }}>{value}</div>
    </div>
  )
}
