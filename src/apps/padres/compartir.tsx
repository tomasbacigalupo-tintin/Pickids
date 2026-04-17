import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, Card, Header, Screen } from '../../components/ui'
import { StateChip } from '../../components/StateBar'
import { QRView } from '../../components/QRView'
import { db } from '../../db/schema'
import { dniMask, fmtHora } from '../../shared/format'

// Vista pública accesible vía link compartido (/c/:token)
export function CompartirPublico() {
  const { token } = useParams<{ token: string }>()
  const solicitud = useLiveQuery(() => token ? db.solicitudes.where('qrToken').equals(token).first() : undefined, [token])
  const retiranteAut = useLiveQuery(() => solicitud?.retiranteAutorizadoId ? db.autorizados.get(solicitud.retiranteAutorizadoId) : undefined, [solicitud?.retiranteAutorizadoId])
  const retirantePadre = useLiveQuery(() => solicitud?.retiranteUsuarioId ? db.usuarios.get(solicitud.retiranteUsuarioId) : undefined, [solicitud?.retiranteUsuarioId])
  const hijos = useLiveQuery(() => solicitud ? db.alumnos.bulkGet(solicitud.alumnosIds) : [], [solicitud?.alumnosIds.join(',')]) ?? []

  if (!solicitud) {
    return (
      <>
        <Header title="Pickids" />
        <Screen>
          <Card>
            <div className="t-h3">Código no encontrado</div>
            <div className="t-sm t-muted">El link puede estar desactualizado. Pedile al padre uno nuevo.</div>
          </Card>
        </Screen>
      </>
    )
  }

  const nombre = hijos.filter(Boolean).map(h => h!.nombre).join(' y ')
  const r = retiranteAut ? {
    nombre: `${retiranteAut.nombre} ${retiranteAut.apellido}`,
    dni: retiranteAut.dni, relacion: retiranteAut.relacion,
  } : retirantePadre ? {
    nombre: `${retirantePadre.nombre} ${retirantePadre.apellido}`,
    dni: retirantePadre.dni ?? '',
    relacion: 'tutor',
  } : null

  return (
    <>
      <Header title="Código de retiro" />
      <Screen>
        <Card variant="highlight">
          <div className="t-xs" style={{ color: 'var(--p-action)', fontWeight: 700, letterSpacing: 0.6 }}>CÓDIGO COMPARTIDO</div>
          <div className="t-h2" style={{ fontSize: 18, marginTop: 4 }}>Retiro de {nombre}</div>
          <div style={{ marginTop: 6 }}><StateChip estado={solicitud.estado} /></div>
          <div className="t-sm t-muted" style={{ marginTop: 8 }}>Solicitado {fmtHora(solicitud.createdAt)}</div>
        </Card>

        <div style={{ textAlign: 'center', padding: 20 }}>
          <QRView value={solicitud.qrToken} size={240} />
          <div className="t-sm t-muted" style={{ marginTop: 12 }}>Mostrá este código en portería junto con tu DNI físico.</div>
        </div>

        {r && (
          <Card>
            <div className="t-xs" style={{ color: 'var(--n-600)', letterSpacing: 0.6, marginBottom: 8 }}>RETIRA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar nombre={r.nombre.split(' ')[0]} apellido={r.nombre.split(' ').slice(1).join(' ')} size={52} />
              <div>
                <div className="t-h3" style={{ fontSize: 15 }}>{r.nombre}</div>
                <div className="t-sm t-muted" style={{ textTransform: 'capitalize' }}>DNI {dniMask(r.dni)} · {r.relacion.replace('_',' ')}</div>
              </div>
            </div>
          </Card>
        )}

        <Card variant="message">
          <div className="t-sm">En portería vas a tener que mostrar el DNI físico. La identidad se valida contra la foto registrada.</div>
        </Card>
      </Screen>
    </>
  )
}
