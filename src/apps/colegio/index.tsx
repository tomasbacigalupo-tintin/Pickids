import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Users, List, BarChart3, Settings } from 'lucide-react'
import { TabBar } from '../../components/ui'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'

import { ColaActiva } from './ColaActiva'
import { DetalleSolicitud } from './DetalleSolicitud'
import { EscanearQR } from './EscanearQR'
import { Alumnos, FichaAlumno } from './Alumnos'
import { Reportes } from './Reportes'
import { Ajustes, Horarios, UsuariosColegio, PublicarMensaje } from './Ajustes'

export function ColegioApp() {
  const nav = useNavigate()
  const loc = useLocation()
  const { usuarioId, rol } = useSession()
  const usuario = useLiveQuery(() => usuarioId ? db.usuarios.get(usuarioId) : undefined, [usuarioId])
  const colegioId = usuario?.colegioId
  const cuentaDia = useLiveQuery(async () => {
    if (!colegioId) return 0
    const start = new Date(); start.setHours(0,0,0,0)
    return (await db.solicitudes.where('colegioId').equals(colegioId).toArray()).filter(s => s.createdAt >= start.getTime()).length
  }, [colegioId]) ?? 0

  const pathname = loc.pathname
  const isFlow = pathname.includes('/solicitud/') || pathname.includes('/escanear') || pathname.includes('/alumnos/') || pathname.includes('/ajustes/')

  let activeTab = 'cola'
  if (pathname.startsWith('/colegio/alumnos')) activeTab = 'alumnos'
  else if (pathname.startsWith('/colegio/reportes')) activeTab = 'reportes'
  else if (pathname.startsWith('/colegio/ajustes')) activeTab = 'ajustes'

  const puedeReportes = rol === 'coordinacion' || rol === 'administracion'

  return (
    <>
      <Routes>
        <Route index element={<Navigate to="cola" replace />} />
        <Route path="cola" element={<ColaActiva totalDia={cuentaDia} />} />
        <Route path="solicitud/:id" element={<DetalleSolicitud />} />
        <Route path="escanear" element={<EscanearQR />} />
        <Route path="alumnos" element={<Alumnos />} />
        <Route path="alumnos/:id" element={<FichaAlumno />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="ajustes/horarios" element={<Horarios />} />
        <Route path="ajustes/usuarios" element={<UsuariosColegio />} />
        <Route path="ajustes/mensaje" element={<PublicarMensaje />} />
        <Route path="*" element={<Navigate to="cola" replace />} />
      </Routes>

      {!isFlow && (
        <TabBar
          active={activeTab}
          onChange={(id) => {
            if (id === 'cola') nav('/colegio/cola')
            if (id === 'alumnos') nav('/colegio/alumnos')
            if (id === 'reportes') nav('/colegio/reportes')
            if (id === 'ajustes') nav('/colegio/ajustes')
          }}
          items={[
            { id: 'cola', label: 'Cola', icon: <List size={22} /> },
            { id: 'alumnos', label: 'Alumnos', icon: <Users size={22} /> },
            ...(puedeReportes ? [{ id: 'reportes', label: 'Reportes', icon: <BarChart3 size={22} /> }] : []),
            { id: 'ajustes', label: 'Ajustes', icon: <Settings size={22} /> },
          ]}
        />
      )}
    </>
  )
}
