import { useMemo, useState } from 'react'
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import { Button, Card, Header, Screen, StickyAction, Avatar, Segmented, TextArea, BottomSheet } from '../../components/ui'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { getHijosDeUsuario, crearSolicitud } from '../../db/repos'
import { useSession } from '../../store/session'
import { Check, User, UserCheck, Clock, AlertTriangle, Plus } from 'lucide-react'
import type { Autorizado, MotivoRetiro } from '../../shared/types'
import { isHorarioPermitido, nowHHMM } from '../../shared/format'

type Draft = {
  alumnosIds: string[]
  retiranteTipo: 'padre' | 'autorizado'
  retiranteAutorizadoId?: string
  horario: { tipo: 'ahora' } | { tipo: 'programado'; hora: string }
  motivo: MotivoRetiro
  nota: string
}

const defaultDraft = (): Draft => ({
  alumnosIds: [],
  retiranteTipo: 'padre',
  horario: { tipo: 'ahora' },
  motivo: 'rutina',
  nota: '',
})

export function SolicitarRetiro() {
  const [draft, setDraft] = useState<Draft>(defaultDraft())

  return (
    <Routes>
      <Route index element={<Paso1 draft={draft} setDraft={setDraft} />} />
      <Route path="quien" element={<Paso2 draft={draft} setDraft={setDraft} />} />
      <Route path="detalles" element={<Paso3 draft={draft} setDraft={setDraft} />} />
      <Route path="confirmar" element={<Confirmar draft={draft} />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}

function Paso1({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const hijos = useLiveQuery(() => getHijosDeUsuario(usuarioId), [usuarioId]) ?? []

  function toggle(id: string, disabled: boolean) {
    if (disabled) return
    const selected = new Set(draft.alumnosIds)
    if (selected.has(id)) selected.delete(id); else selected.add(id)
    setDraft({ ...draft, alumnosIds: Array.from(selected) })
  }
  function selectAllPresentes() {
    const ids = hijos.filter(h => h.asistencia === 'presente' && !h.bloqueadoRetiro).map(h => h.id)
    setDraft({ ...draft, alumnosIds: ids })
  }
  const puedeSeguir = draft.alumnosIds.length > 0

  return (
    <>
      <Header title="Solicitar retiro" back={() => nav('/padres/inicio')} subtitle="Paso 1 de 3" />
      <Screen withStickyAction>
        <h2 className="t-h2">¿A quién retirás hoy?</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {hijos.map(h => {
            const disabled = h.asistencia !== 'presente' || h.bloqueadoRetiro
            const checked = draft.alumnosIds.includes(h.id)
            return (
              <Card key={h.id} onClick={() => toggle(h.id, disabled)} style={{ opacity: disabled ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    border: `2px solid ${checked ? 'var(--p-primary)' : 'var(--n-200)'}`,
                    background: checked ? 'var(--p-primary)' : 'white',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {checked && <Check size={14} color="white" />}
                  </div>
                  <Avatar nombre={h.nombre} apellido={h.apellido} />
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 16 }}>{h.nombre} {h.apellido}</div>
                    <div className="t-sm t-muted">
                      {h.curso}{h.division} · {
                        h.bloqueadoRetiro ? 'Retiros suspendidos' :
                        h.asistencia === 'ausente' ? 'Ausente hoy' :
                        h.asistencia === 'retirado_hoy' ? 'Ya retirado' : 'Presente'
                      }
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        <Button variant="ghost" fullWidth onClick={selectAllPresentes}>Seleccionar todos los presentes</Button>
      </Screen>
      <StickyAction>
        <Button variant="primary" fullWidth disabled={!puedeSeguir} onClick={() => nav('quien')}>
          Continuar {draft.alumnosIds.length > 0 && `(${draft.alumnosIds.length})`}
        </Button>
      </StickyAction>
    </>
  )
}

function Paso2({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const autorizados = useLiveQuery(async () => {
    const mios = await db.autorizados.where('usuarioId').equals(usuarioId).toArray()
    // solo los que cubren alguno de los hijos seleccionados
    return mios.filter(a => a.alumnosPermitidos.some(aid => draft.alumnosIds.includes(aid)))
  }, [usuarioId, draft.alumnosIds.join(',')]) ?? []

  const puedeSeguir = draft.retiranteTipo === 'padre' || !!draft.retiranteAutorizadoId

  return (
    <>
      <Header title="Solicitar retiro" back={() => nav(-1)} subtitle="Paso 2 de 3" />
      <Screen withStickyAction>
        <h2 className="t-h2">¿Quién retira?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card onClick={() => setDraft({ ...draft, retiranteTipo: 'padre', retiranteAutorizadoId: undefined })}
                style={{ border: draft.retiranteTipo === 'padre' ? '2px solid var(--p-primary)' : '2px solid transparent' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--p-primary-tint)', color: 'var(--p-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={26} />
              </div>
              <div className="t-h3" style={{ fontSize: 15 }}>Yo</div>
            </div>
          </Card>
          <Card onClick={() => setDraft({ ...draft, retiranteTipo: 'autorizado' })}
                style={{ border: draft.retiranteTipo === 'autorizado' ? '2px solid var(--p-primary)' : '2px solid transparent' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--p-action-tint)', color: 'var(--p-action)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={26} />
              </div>
              <div className="t-h3" style={{ fontSize: 15 }}>Un autorizado</div>
            </div>
          </Card>
        </div>

        {draft.retiranteTipo === 'autorizado' && (
          <div>
            <div className="t-h3" style={{ marginBottom: 8 }}>Elegí el autorizado</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {autorizados.map((a: Autorizado) => {
                const disabled = a.estado !== 'activo'
                return (
                  <Card key={a.id} onClick={() => !disabled && setDraft({ ...draft, retiranteAutorizadoId: a.id })}
                        style={{
                          border: draft.retiranteAutorizadoId === a.id ? '2px solid var(--p-primary)' : '2px solid transparent',
                          opacity: disabled ? 0.6 : 1,
                        }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar nombre={a.nombre} apellido={a.apellido} />
                      <div style={{ flex: 1 }}>
                        <div className="t-h3" style={{ fontSize: 15 }}>{a.nombre} {a.apellido}</div>
                        <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>{a.relacion.replace('_', ' ')} · {a.estado}</div>
                      </div>
                    </div>
                  </Card>
                )
              })}
              {autorizados.length === 0 && (
                <Card>
                  <div className="t-sm t-muted">No tenés autorizados cargados para los hijos seleccionados.</div>
                </Card>
              )}
              <Button variant="secondary" fullWidth leftIcon={<Plus size={18} />} onClick={() => nav('/padres/autorizados/nuevo')}>
                Agregar autorizado
              </Button>
            </div>
          </div>
        )}
      </Screen>
      <StickyAction>
        <Button variant="primary" fullWidth disabled={!puedeSeguir} onClick={() => nav('../detalles')}>Continuar</Button>
      </StickyAction>
    </>
  )
}

function Paso3({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const colegio = useLiveQuery(() => usuario?.colegioId ? db.colegios.get(usuario.colegioId) : undefined, [usuario?.colegioId])

  const hora = draft.horario.tipo === 'programado' ? draft.horario.hora : nowHHMM()
  const enRango = colegio ? isHorarioPermitido(hora, colegio.horarioApertura, colegio.horarioCierre) : true

  return (
    <>
      <Header title="Solicitar retiro" back={() => nav(-1)} subtitle="Paso 3 de 3" />
      <Screen withStickyAction>
        <h2 className="t-h2">Horario y motivo</h2>

        <div>
          <div className="t-h3" style={{ marginBottom: 8, fontSize: 14 }}>Horario</div>
          <Segmented
            value={draft.horario.tipo}
            onChange={(v) => setDraft({ ...draft, horario: v === 'ahora' ? { tipo: 'ahora' } : { tipo: 'programado', hora: nowHHMM() } })}
            items={[{ id: 'ahora', label: 'Ahora' }, { id: 'programado', label: 'Programar' }]}
          />
          {draft.horario.tipo === 'programado' && (
            <div style={{ marginTop: 12 }}>
              <input type="time" className="pk-textarea" value={draft.horario.hora}
                     onChange={(e) => setDraft({ ...draft, horario: { tipo: 'programado', hora: e.target.value } })}
                     style={{ height: 48 }} />
            </div>
          )}
          {!enRango && (
            <Card variant="message" style={{ marginTop: 10, borderLeftColor: 'var(--p-error)', background: 'var(--p-error-tint)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <AlertTriangle size={18} color="var(--p-error)" />
                <div>
                  <div className="t-sm" style={{ color: 'var(--p-error)', fontWeight: 600 }}>Fuera del horario permitido</div>
                  <div className="t-xs t-muted">El colegio recibe solicitudes entre {colegio?.horarioApertura} y {colegio?.horarioCierre}.</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div>
          <div className="t-h3" style={{ marginBottom: 8, fontSize: 14 }}>Motivo</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['rutina', 'medico', 'familiar', 'otro'] as MotivoRetiro[]).map(m => (
              <button key={m}
                      className="pk-chip"
                      onClick={() => setDraft({ ...draft, motivo: m })}
                      style={{
                        color: draft.motivo === m ? 'white' : 'var(--p-primary)',
                        background: draft.motivo === m ? 'var(--p-primary)' : 'var(--p-primary-tint)',
                        padding: '8px 14px', cursor: 'pointer',
                      }}>
                {m === 'rutina' ? 'Rutina' : m === 'medico' ? 'Médico' : m === 'familiar' ? 'Familiar' : 'Otro'}
              </button>
            ))}
          </div>
        </div>

        <TextArea label="Nota (opcional)" value={draft.nota} onChange={(v) => setDraft({ ...draft, nota: v })}
                  placeholder="Ej: Turno oftalmólogo 15hs" maxLength={280} rows={3} hint={`${draft.nota.length}/280`} />
      </Screen>
      <StickyAction>
        <Button variant="primary" fullWidth disabled={!enRango} leftIcon={<Clock size={18} />}
                onClick={() => nav('../confirmar')}>Revisar y confirmar</Button>
      </StickyAction>
    </>
  )
}

function Confirmar({ draft }: { draft: Draft }) {
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const hijos = useLiveQuery(() => db.alumnos.bulkGet(draft.alumnosIds), [draft.alumnosIds.join(',')]) ?? []
  const autorizado = useLiveQuery(() => draft.retiranteAutorizadoId ? db.autorizados.get(draft.retiranteAutorizadoId) : undefined, [draft.retiranteAutorizadoId])
  const [error, setError] = useState<null | { reason: string; extra?: string; solicitudId?: string }>(null)
  const [loading, setLoading] = useState(false)

  async function enviar() {
    if (!usuario?.colegioId) return
    setLoading(true)
    const res = await crearSolicitud({
      colegioId: usuario.colegioId,
      alumnosIds: draft.alumnosIds,
      solicitanteId: usuarioId,
      retiranteTipo: draft.retiranteTipo,
      retiranteUsuarioId: draft.retiranteTipo === 'padre' ? usuarioId : undefined,
      retiranteAutorizadoId: draft.retiranteAutorizadoId,
      horario: draft.horario,
      motivo: draft.motivo,
      nota: draft.nota.trim() || null,
    })
    setLoading(false)
    if (res.ok) {
      nav(`/padres/seguimiento/${res.solicitud.id}`, { replace: true })
    } else if (res.reason === 'cotutor') {
      setError({ reason: 'cotutor', extra: res.conflictoCotutorNombre, solicitudId: res.solicitudExistente?.id })
    } else if (res.reason === 'duplicado') {
      setError({ reason: 'duplicado', solicitudId: res.solicitudExistente?.id })
    } else {
      setError({ reason: 'otro', extra: res.reason })
    }
  }

  const motivoLabel = { rutina: 'Rutina', medico: 'Médico', familiar: 'Familiar', otro: 'Otro' }[draft.motivo]

  return (
    <>
      <Header title="Confirmar solicitud" back={() => nav(-1)} />
      <Screen withStickyAction>
        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6 }}>HIJOS</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {hijos.filter(Boolean).map(h => (
              <div key={h!.id} className="pk-chip" style={{ background: 'var(--p-primary-tint)', color: 'var(--p-primary)' }}>
                {h!.nombre} — {h!.curso}{h!.division}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6 }}>QUIÉN RETIRA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            {draft.retiranteTipo === 'padre' ? (
              <>
                <Avatar nombre={usuario?.nombre ?? ''} apellido={usuario?.apellido} />
                <div><div className="t-h3" style={{ fontSize: 15 }}>{usuario?.nombre} {usuario?.apellido}</div><div className="t-sm t-muted">Vos mismo/a</div></div>
              </>
            ) : autorizado && (
              <>
                <Avatar nombre={autorizado.nombre} apellido={autorizado.apellido} />
                <div><div className="t-h3" style={{ fontSize: 15 }}>{autorizado.nombre} {autorizado.apellido}</div><div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>{autorizado.relacion.replace('_', ' ')}</div></div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6 }}>DATOS</div>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            <Row label="Horario" value={draft.horario.tipo === 'ahora' ? 'Ahora' : draft.horario.hora} />
            <Row label="Motivo" value={motivoLabel} />
            {draft.nota && <Row label="Nota" value={draft.nota} />}
          </div>
        </Card>

        <Card variant="message">
          <div className="t-sm">El colegio debe autorizar antes del retiro. Vas a recibir una notificación en cada paso.</div>
        </Card>

        <BottomSheet open={!!error} onClose={() => setError(null)} title={
          error?.reason === 'duplicado' ? 'Ya existe una solicitud' :
          error?.reason === 'cotutor' ? 'Cotutor interfiere' : 'No se pudo enviar'
        }>
          {error?.reason === 'duplicado' && (
            <>
              <p className="t-body">Ya existe una solicitud activa para los hijos seleccionados.</p>
              <Button variant="primary" fullWidth onClick={() => { setError(null); if (error.solicitudId) nav(`/padres/seguimiento/${error.solicitudId}`) }}>Ver solicitud existente</Button>
              <Button variant="ghost" fullWidth onClick={() => setError(null)}>Volver atrás</Button>
            </>
          )}
          {error?.reason === 'cotutor' && (
            <>
              <p className="t-body">{error.extra ?? 'Otro tutor'} ya generó una solicitud de retiro.</p>
              <Button variant="primary" fullWidth onClick={() => { setError(null); if (error.solicitudId) nav(`/padres/seguimiento/${error.solicitudId}`) }}>Ver la solicitud activa</Button>
              <Button variant="ghost" fullWidth onClick={() => setError(null)}>Cerrar</Button>
            </>
          )}
          {error?.reason === 'otro' && (
            <>
              <p className="t-body">{error.extra}</p>
              <Button variant="primary" fullWidth onClick={() => setError(null)}>Volver</Button>
            </>
          )}
        </BottomSheet>
      </Screen>
      <StickyAction>
        <Button variant="primary" fullWidth loading={loading} onClick={enviar}>Enviar solicitud</Button>
      </StickyAction>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div className="t-sm t-muted" style={{ width: 80, flexShrink: 0 }}>{label}</div>
      <div className="t-sm" style={{ fontWeight: 500 }}>{value}</div>
    </div>
  )
}
