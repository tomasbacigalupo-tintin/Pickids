import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button, Card, Header, Screen, Segmented } from '../../components/ui'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'
import { Download } from 'lucide-react'
import { useToast } from '../../store/toast'

export function Reportes() {
  const usuarioId = useSession(s => s.usuarioId)!
  const usuario = useLiveQuery(() => db.usuarios.get(usuarioId), [usuarioId])
  const [rango, setRango] = useState<'hoy' | 'semana' | 'mes'>('hoy')
  const pushToast = useToast(s => s.push)
  const solicitudes = useLiveQuery(async () => {
    if (!usuario?.colegioId) return []
    return await db.solicitudes.where('colegioId').equals(usuario.colegioId).toArray()
  }, [usuario?.colegioId]) ?? []

  const stats = useMemo(() => {
    const now = Date.now()
    const limite = rango === 'hoy' ? new Date().setHours(0,0,0,0) : rango === 'semana' ? now - 7*86400000 : now - 30*86400000
    const en = solicitudes.filter(s => s.createdAt >= limite)
    const entregadas = en.filter(s => s.estado === 'entregado')
    const rechazos = en.filter(s => s.estado === 'rechazado').length
    const conAutorizado = en.filter(s => s.retiranteTipo === 'autorizado').length
    const promedio = entregadas.length
      ? Math.round(entregadas.reduce((acc, s) => acc + ((s.hitosPorEstado.entregado ?? s.updatedAt) - s.createdAt), 0) / entregadas.length / 1000 / 60)
      : 0
    return { total: en.length, entregadas: entregadas.length, rechazos, promedio, conAutorizadoPct: en.length ? Math.round((conAutorizado / en.length) * 100) : 0 }
  }, [solicitudes, rango])

  function exportarCSV() {
    const filas = [['ID', 'Alumnos', 'Estado', 'Motivo', 'Solicitado', 'Actualizado']]
    for (const s of solicitudes) {
      filas.push([
        s.id,
        s.alumnosIds.join('|'),
        s.estado,
        s.motivo,
        new Date(s.createdAt).toISOString(),
        new Date(s.updatedAt).toISOString(),
      ])
    }
    const csv = filas.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `pickids-retiros-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    pushToast({ title: 'CSV descargado', variant: 'success' })
  }

  return (
    <>
      <Header title="Reportes" />
      <Screen withTabBar>
        <Segmented value={rango} onChange={setRango} items={[
          { id: 'hoy', label: 'Hoy' },
          { id: 'semana', label: '7 días' },
          { id: 'mes', label: '30 días' },
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <KPI value={String(stats.total)} label="Retiros solicitados" color="var(--p-primary)" />
          <KPI value={String(stats.entregadas)} label="Entregados" color="var(--p-success)" />
          <KPI value={`${stats.promedio} min`} label="Prom. solicitud → entrega" color="var(--p-inprogress)" />
          <KPI value={`${stats.conAutorizadoPct}%`} label="Con autorizado" color="var(--p-action)" />
          <KPI value={String(stats.rechazos)} label="Rechazos" color="var(--p-error)" />
        </div>
        <Button variant="secondary" fullWidth leftIcon={<Download size={18} />} onClick={exportarCSV}>Exportar CSV completo</Button>
      </Screen>
    </>
  )
}

function KPI({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Card>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div className="t-sm t-muted" style={{ marginTop: 6 }}>{label}</div>
    </Card>
  )
}
