import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, BottomSheet, Button, Card, Header, Screen } from '../../components/ui'
import { StateBar } from '../../components/StateBar'
import { QRView } from '../../components/QRView'
import { db } from '../../db/schema'
import { transicionar, labelMotivoRechazo } from '../../db/repos'
import { ESTADO_META, puedeCancelarPadre } from '../../shared/states'
import { useSession } from '../../store/session'
import { fmtHora, dniMask } from '../../shared/format'
import { Share2, XCircle, MessageCircle, Clock, Phone } from 'lucide-react'
import { useToast } from '../../store/toast'

export function SeguimientoEnVivo() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const usuarioId = useSession(s => s.usuarioId)!
  const solicitud = useLiveQuery(() => id ? db.solicitudes.get(id) : undefined, [id])
  const hijos = useLiveQuery(() => solicitud ? db.alumnos.bulkGet(solicitud.alumnosIds) : [], [solicitud?.alumnosIds.join(',')]) ?? []
  const retirantePadre = useLiveQuery(() => solicitud?.retiranteUsuarioId ? db.usuarios.get(solicitud.retiranteUsuarioId) : undefined, [solicitud?.retiranteUsuarioId])
  const retiranteAut   = useLiveQuery(() => solicitud?.retiranteAutorizadoId ? db.autorizados.get(solicitud.retiranteAutorizadoId) : undefined, [solicitud?.retiranteAutorizadoId])
  const transiciones   = useLiveQuery(async () => id ? (await db.transiciones.where('solicitudId').equals(id).sortBy('at')) : [], [id]) ?? []
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [shareSheet, setShareSheet] = useState(false)
  const pushToast = useToast(s => s.push)

  if (!solicitud) return <Header title="Seguimiento" back />

  const meta = ESTADO_META[solicitud.estado]
  const nombreHijos = hijos.filter(Boolean).map(h => h!.nombre).join(' y ')
  const link = `${window.location.origin}${import.meta.env.BASE_URL}c/${solicitud.qrToken}`

  async function cancelar() {
    await transicionar(solicitud!.id, 'cancelado', { actorId: usuarioId, actorRol: 'padre' })
    setConfirmCancel(false)
    pushToast({ title: 'Solicitud cancelada', variant: 'warning' })
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link)
      pushToast({ title: 'Link copiado', body: 'Compartilo con quien retira.', variant: 'success' })
    } catch {}
  }

  return (
    <>
      <Header title={`Retiro de ${nombreHijos}`} back right={<button className="pk-header__btn" aria-label="Chat"><MessageCircle size={22} /></button>} />
      <Screen withStickyAction>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {hijos.filter(Boolean).slice(0, 3).map(h => (
              <Avatar key={h!.id} nombre={h!.nombre} apellido={h!.apellido} size={56} />
            ))}
            <div>
              <div className="t-h3">{nombreHijos}</div>
              <div className="t-sm t-muted">{hijos.filter(Boolean).map(h => `${h!.curso}${h!.division}`).join(' · ')}</div>
            </div>
          </div>
        </Card>

        <StateBar estado={solicitud.estado} />

        <Card style={{ background: meta.bg, borderLeft: `4px solid ${meta.color}` }}>
          <div className="t-xs" style={{ color: meta.color, letterSpacing: 0.6, fontWeight: 700 }}>{meta.label.toUpperCase()}</div>
          <div className="t-body" style={{ marginTop: 4 }}>{meta.description}</div>
          {solicitud.motivoRechazo && (
            <div className="t-sm t-muted" style={{ marginTop: 6 }}>Motivo: {labelMotivoRechazo(solicitud.motivoRechazo)}{solicitud.notaRechazo ? ` — ${solicitud.notaRechazo}` : ''}</div>
          )}
        </Card>

        {(solicitud.estado !== 'entregado' && solicitud.estado !== 'rechazado' && solicitud.estado !== 'cancelado' && solicitud.estado !== 'expirado') && (
          <>
            <Card>
              <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>RETIRA</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {solicitud.retiranteTipo === 'padre' ? (
                  <>
                    <Avatar nombre={retirantePadre?.nombre ?? ''} apellido={retirantePadre?.apellido} size={56} />
                    <div>
                      <div className="t-h3" style={{ fontSize: 16 }}>{retirantePadre?.nombre} {retirantePadre?.apellido}</div>
                      <div className="t-sm t-muted">DNI {dniMask(retirantePadre?.dni ?? '')} · Tutor/a</div>
                    </div>
                  </>
                ) : retiranteAut && (
                  <>
                    <Avatar nombre={retiranteAut.nombre} apellido={retiranteAut.apellido} size={56} />
                    <div>
                      <div className="t-h3" style={{ fontSize: 16 }}>{retiranteAut.nombre} {retiranteAut.apellido}</div>
                      <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>DNI {dniMask(retiranteAut.dni)} · {retiranteAut.relacion.replace('_', ' ')}</div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <div style={{ textAlign: 'center', padding: 16 }}>
              <QRView value={solicitud.qrToken} size={220} />
              <div className="t-sm t-muted" style={{ marginTop: 10 }}>Mostralo en portería</div>
            </div>
          </>
        )}

        <Card>
          <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 10 }}>LÍNEA DE TIEMPO</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {transiciones.map(t => {
              const m = ESTADO_META[t.estadoHasta]
              return (
                <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 50, background: m.color, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="t-sm" style={{ fontWeight: 500 }}>{m.label}</div>
                    <div className="t-xs t-muted"><Clock size={10} style={{ verticalAlign: -1 }} /> {fmtHora(t.at)} · {t.actorRol}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </Screen>
      <div className="pk-sticky-action safe-bottom">
        <Button variant="secondary" leftIcon={<Share2 size={18} />} onClick={() => setShareSheet(true)}>Compartir link</Button>
        {puedeCancelarPadre(solicitud.estado) ? (
          <Button variant="destructive" leftIcon={<XCircle size={18} />} onClick={() => setConfirmCancel(true)}>Cancelar</Button>
        ) : solicitud.estado === 'listo' ? (
          <Button variant="ghost" disabled>No se puede cancelar</Button>
        ) : null}
      </div>

      <BottomSheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title="¿Cancelar solicitud?">
        <p className="t-body">Se notificará al colegio y no vas a poder deshacer la acción.</p>
        <Button variant="destructive" fullWidth onClick={cancelar}>Sí, cancelar</Button>
        <Button variant="ghost" fullWidth onClick={() => setConfirmCancel(false)}>Volver</Button>
      </BottomSheet>

      <BottomSheet open={shareSheet} onClose={() => setShareSheet(false)} title="Compartir con quien retira">
        <p className="t-body">Mandale este link al autorizado. Al abrirlo verá el QR para mostrar en portería.</p>
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Phone size={18} /><div className="t-sm" style={{ wordBreak: 'break-all' }}>{link}</div></div></Card>
        <Button variant="primary" fullWidth onClick={copiarLink}>Copiar link</Button>
        <Button variant="secondary" fullWidth onClick={async () => {
          try {
            await (navigator as any).share?.({ title: 'Pickids — Retiro escolar', text: `Usá este QR para retirar a ${nombreHijos}`, url: link })
          } catch {}
          setShareSheet(false)
        }}>Compartir por WhatsApp / SMS</Button>
      </BottomSheet>
    </>
  )
}
