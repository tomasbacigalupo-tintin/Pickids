import { useNavigate } from 'react-router-dom'
import { QRScanner } from '../../components/QRScanner'
import { db } from '../../db/schema'
import { useToast } from '../../store/toast'

export function EscanearQR() {
  const nav = useNavigate()
  const pushToast = useToast(s => s.push)

  async function onDetect(value: string) {
    // El valor puede ser el token directo o la URL completa
    let token = value
    try {
      const u = new URL(value)
      const parts = u.pathname.split('/')
      const idx = parts.findIndex(p => p === 'c')
      if (idx >= 0 && parts[idx + 1]) token = parts[idx + 1]
    } catch { /* no es URL, usamos como token */ }

    const s = await db.solicitudes.where('qrToken').equals(token).first()
    if (!s) {
      pushToast({ title: 'QR inválido', body: 'No encontramos la solicitud.', variant: 'error' })
      return
    }
    nav(`/colegio/solicitud/${s.id}`, { replace: true })
  }

  return <QRScanner onDetect={onDetect} onClose={() => nav(-1)} />
}
