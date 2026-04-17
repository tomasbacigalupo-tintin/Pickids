import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, BottomSheet, Button, Card, Header, Screen, TextArea } from '../../components/ui'
import { StateChip } from '../../components/StateBar'
import { db } from '../../db/schema'
import { transicionar, labelMotivoRechazo } from '../../db/repos'
import { useSession } from '../../store/session'
import { fmtHora, dniMask } from '../../shared/format'
import { Phone, ShieldCheck, X, Check, Clock } from 'lucide-react'
import type { MotivoRechazo, Rol } from '../../shared/types'
import { useToast } from '../../store/toast'

export function DetalleSolicitud() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { usuarioId, rol } = useSession()
  const actorRol = (rol ?? 'porteria') as Exclude<Rol, 'padre'>
  const solicitud = useLiveQuery(() => id ? db.solicitudes.get(id) : undefined, [id])
  const hijos = useLiveQuery(() => solicitud ? db.alumnos.bulkGet(solicitud.alumnosIds) : [], [solicitud?.alumnosIds.join(',')]) ?? []
  const retiranteAut = useLiveQuery(() => solicitud?.retiranteAutorizadoId ? db.autorizados.get(solicitud.retiranteAutorizadoId) : undefined, [solicitud?.retiranteAutorizadoId])
  const retirantePadre = useLiveQuery(() => solicitud?.retiranteUsuarioId ? db.usuarios.get(solicitud.retiranteUsuarioId) : undefined, [solicitud?.retiranteUsuarioId])
  const solicitante = useLiveQuery(() => solicitud?.solicitanteId ? db.usuarios.get(solicitud.solicitanteId) : undefined, [solicitud?.solicitanteId])
  const timeline = useLiveQuery(() => id ? db.transiciones.where('solicitudId').equals(id).sortBy('at') : [], [id]) ?? []
  const [validarOpen, setValidarOpen] = useState(false)
  const [rechazarOpen, setRechazarOpen] = useState(false)
  const [motivoRech, setMotivoRech] = useState<MotivoRechazo>('identidad_no_coincide')
  const [notaRech, setNotaRech] = useState('')
  const pushToast = useToast(s => s.push)

  // Auto-transición a "en_validación" al abrir por primera vez
  useEffect(() => {
    async function run() {
      if (!solicitud || solicitud.estado !== 'solicitado' || !usuarioId) return
      await transicionar(solicitud.id, 'en_validacion', { actorId: usuarioId, actorRol })
    }
    run()
  }, [solicitud?.id])

  if (!solicitud) return null

  async function accion(hasta: 'autorizado' | 'en_preparacion' | 'listo' | 'entregado') {
    await transicionar(solicitud!.id, hasta, { actorId: usuarioId!, actorRol })
    pushToast({ title: `Estado: ${hasta.replace('_', ' ')}`, variant: 'success' })
  }
  async function rechazar() {
    await transicionar(solicitud!.id, 'rechazado', { actorId: usuarioId!, actorRol, motivoRechazo: motivoRech, notaRechazo: notaRech || labelMotivoRechazo(motivoRech) })
    setRechazarOpen(false)
    pushToast({ title: 'Solicitud rechazada', variant: 'error' })
  }
  async function marcarEntregado() {
    await accion('entregado')
    setValidarOpen(false)
    // Marca al alumno como retirado hoy
    for (const aid of solicitud!.alumnosIds) {
      await db.alumnos.update(aid, { asistencia: 'retirado_hoy' })
    }
    nav('/colegio/cola', { replace: true })
  }

  const nombres = hijos.filter(Boolean).map(h => h!.nombre).join(' y ')
  const retirante = solicitud.retiranteTipo === 'autorizado' ? retiranteAut : retirantePadre

  // Barra de acciones contextual
  const acciones = (() => {
    switch (solicitud.estado) {
      case 'solicitado':
      case 'en_validacion':
        return <>
          <Button variant="destructive" fullWidth onClick={() => setRechazarOpen(true)} leftIcon={<X size={18} />}>Rechazar</Button>
          <Button variant="primary" fullWidth onClick={() => accion('autorizado')} leftIcon={<ShieldCheck size={18} />}>Autorizar</Button>
        </>
      case 'autorizado':
        return <>
          <Button variant="destructive" onClick={() => setRechazarOpen(true)} leftIcon={<X size={18} />}>Rechazar</Button>
          <Button variant="primary" fullWidth onClick={() => accion('en_preparacion')}>Marcar en preparación</Button>
        </>
      case 'en_preparacion':
        return <>
          <Button variant="destructive" onClick={() => setRechazarOpen(true)} leftIcon={<X size={18} />}>Rechazar</Button>
          <Button variant="action" fullWidth onClick={() => accion('listo')}>Marcar listo para entregar</Button>
        </>
      case 'listo':
        return <>
          <Button variant="destructive" onClick={() => setRechazarOpen(true)} leftIcon={<X size={18} />}>Rechazar</Button>
          <Button variant="primary" fullWidth onClick={() => setValidarOpen(true)} leftIcon={<Check size={18} />}>Validar y entregar</Button>
        </>
      default:
        return <Button variant="ghost" fullWidth onClick={() => nav('/colegio/cola')}>Volver a la cola</Button>
    }
  })()

  return (
    <>
      <Header title={`Solicitud #${solicitud.id.slice(-5).toUpperCase()}`} back={() => nav('/colegio/cola')} />
      <Screen withStickyAction>
        <Card>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar nombre={hijos[0]?.nombre ?? '?'} apellido={hijos[0]?.apellido} size={64} />
            <div style={{ flex: 1 }}>
              <div className="t-h2" style={{ fontSize: 20 }}>{nombres}</div>
              <div className="t-sm t-muted">{hijos.map(h => `${h!.curso}${h!.division}`).join(' · ')}</div>
              <div style={{ marginTop: 6 }}><StateChip estado={solicitud.estado} /></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>QUIÉN RETIRA</div>
          {retirante ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar nombre={retirante.nombre} apellido={retirante.apellido} size={56} />
              <div style={{ flex: 1 }}>
                <div className="t-h3" style={{ fontSize: 16 }}>{retirante.nombre} {retirante.apellido}</div>
                <div className="t-sm t-muted">DNI {dniMask(retirante.dni ?? '')}{retirante.telefono ? ` · ${retirante.telefono}` : ''}</div>
                <div className="t-xs" style={{ marginTop: 2, textTransform: 'capitalize' }}>
                  {('relacion' in retirante ? retirante.relacion.replace('_', ' ') : 'Tutor/a')}
                  {' · '}
                  {(() => {
                    const isVerificado = 'verificado' in retirante ? retirante.verificado : retirante.estado === 'activo'
                    return (
                      <span style={{ color: isVerificado ? 'var(--p-success)' : 'var(--p-pending)', fontWeight: 600 }}>
                        {isVerificado ? '✓ Validado' : 'Verificar'}
                      </span>
                    )
                  })()}
                </div>
              </div>
              {retirante.telefono && (
                <a href={`tel:${retirante.telefono}`} className="pk-header__btn" aria-label="Llamar"><Phone size={18} /></a>
              )}
            </div>
          ) : <div className="t-sm t-muted">Sin datos de retirante.</div>}
        </Card>

        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>DATOS DEL RETIRO</div>
          <Row label="Solicitado" value={fmtHora(solicitud.createdAt)} />
          <Row label="Horario" value={solicitud.horario.tipo === 'ahora' ? 'Ahora' : solicitud.horario.hora} />
          <Row label="Motivo" value={{ rutina: 'Rutina', medico: 'Médico', familiar: 'Familiar', otro: 'Otro' }[solicitud.motivo]} />
          {solicitud.nota && <Row label="Nota" value={solicitud.nota} />}
        </Card>

        {solicitante && (
          <Card>
            <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>SOLICITADO POR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar nombre={solicitante.nombre} apellido={solicitante.apellido} />
              <div style={{ flex: 1 }}>
                <div className="t-h3" style={{ fontSize: 15 }}>{solicitante.nombre} {solicitante.apellido}</div>
                <div className="t-sm t-muted">{solicitante.email} · {solicitante.telefono}</div>
              </div>
              {solicitante.telefono && (
                <a href={`tel:${solicitante.telefono}`} className="pk-header__btn" aria-label="Llamar"><Phone size={18} /></a>
              )}
            </div>
          </Card>
        )}

        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>TIMELINE</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {timeline.map(t => (
              <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Clock size={14} color="var(--n-400)" style={{ marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <div className="t-sm">{t.estadoHasta.replace('_',' ')}</div>
                  <div className="t-xs t-faded">{fmtHora(t.at)} · {t.actorRol}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Screen>
      <div className="pk-sticky-action safe-bottom" style={{ flexDirection: 'row' }}>{acciones}</div>

      <BottomSheet open={validarOpen} onClose={() => setValidarOpen(false)} title="Validar identidad">
        {retirante && (
          <>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Avatar nombre={retirante.nombre} apellido={retirante.apellido} size={96} />
              <div className="t-h3" style={{ marginTop: 10 }}>{retirante.nombre} {retirante.apellido}</div>
              <div className="t-sm t-muted">DNI {dniMask(retirante.dni ?? '')}</div>
              <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>{('relacion' in retirante ? retirante.relacion.replace('_',' ') : 'Tutor/a')}</div>
            </div>
            <Button variant="secondary" fullWidth>Escanear DNI físico</Button>
            <Button variant="primary" fullWidth leftIcon={<Check size={18} />} onClick={marcarEntregado}>Confirmar y entregar</Button>
            <Button variant="ghost" fullWidth onClick={() => setValidarOpen(false)}>Cancelar</Button>
          </>
        )}
      </BottomSheet>

      <BottomSheet open={rechazarOpen} onClose={() => setRechazarOpen(false)} title="Rechazar retiro">
        <div>
          <div className="pk-field__label" style={{ marginBottom: 8 }}>Motivo</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {([
              ['identidad_no_coincide', 'Identidad no coincide'],
              ['autorizado_no_vigente', 'Autorizado no vigente'],
              ['hijo_ausente', 'Hijo ausente'],
              ['horario_no_permitido', 'Horario no permitido'],
              ['otro', 'Otro'],
            ] as [MotivoRechazo, string][]).map(([m, label]) => (
              <label key={m} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 10, background: motivoRech === m ? 'var(--p-primary-tint)' : 'var(--n-100)' }}>
                <input type="radio" checked={motivoRech === m} onChange={() => setMotivoRech(m)} />
                <span className="t-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <TextArea label="Nota (obligatoria)" value={notaRech} onChange={setNotaRech} rows={3} placeholder="Explicá brevemente..." />
        <Button variant="destructive" fullWidth disabled={!notaRech.trim()} onClick={rechazar}>Confirmar rechazo</Button>
        <Button variant="ghost" fullWidth onClick={() => setRechazarOpen(false)}>Cancelar</Button>
      </BottomSheet>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
      <div className="t-sm t-muted" style={{ width: 86, flexShrink: 0 }}>{label}</div>
      <div className="t-sm" style={{ fontWeight: 500 }}>{value}</div>
    </div>
  )
}
