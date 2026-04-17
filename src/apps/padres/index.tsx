import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, UserPlus, UserCircle } from 'lucide-react'
import { TabBar } from '../../components/ui'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'

import { Inicio } from './Inicio'
import { SolicitarRetiro } from './SolicitarRetiro'
import { SeguimientoEnVivo } from './SeguimientoEnVivo'
import { HijosLista, DetalleHijo } from './Hijos'
import { AutorizadosLista, AgregarAutorizado, DetalleAutorizado } from './Autorizados'
import { Perfil, ConfigNotif, Ayuda } from './Perfil'
import { CentroNotificaciones } from './CentroNotificaciones'

export function PadresApp() {
  const nav = useNavigate()
  const location = useLocation()
  const usuarioId = useSession(s => s.usuarioId)
  const unread = useLiveQuery(
    async () => usuarioId ? db.notificaciones.where('destinatarioId').equals(usuarioId).and(n => !n.leida).count() : 0,
    [usuarioId]
  ) ?? 0

  const pathname = location.pathname
  const isFlow = pathname.includes('/solicitar') || pathname.includes('/seguimiento') || pathname.includes('/autorizados/nuevo') || pathname.includes('/autorizados/') || pathname.includes('/detalle') || pathname.includes('/notificaciones') || pathname.includes('/hijos/') || pathname.includes('/perfil/')

  let activeTab = 'inicio'
  if (pathname.startsWith('/padres/hijos')) activeTab = 'hijos'
  else if (pathname.startsWith('/padres/autorizados')) activeTab = 'autorizados'
  else if (pathname.startsWith('/padres/perfil')) activeTab = 'perfil'

  return (
    <>
      <Routes>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="inicio" element={<Inicio />} />
        <Route path="solicitar/*" element={<SolicitarRetiro />} />
        <Route path="seguimiento/:id" element={<SeguimientoEnVivo />} />
        <Route path="hijos" element={<HijosLista />} />
        <Route path="hijos/:id" element={<DetalleHijo />} />
        <Route path="autorizados" element={<AutorizadosLista />} />
        <Route path="autorizados/nuevo" element={<AgregarAutorizado />} />
        <Route path="autorizados/:id" element={<DetalleAutorizado />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="perfil/notificaciones" element={<ConfigNotif />} />
        <Route path="perfil/ayuda" element={<Ayuda />} />
        <Route path="notificaciones" element={<CentroNotificaciones />} />
        <Route path="*" element={<Navigate to="inicio" replace />} />
      </Routes>

      {!isFlow && (
        <TabBar
          active={activeTab}
          onChange={(id) => {
            if (id === 'inicio') nav('/padres/inicio')
            if (id === 'hijos') nav('/padres/hijos')
            if (id === 'autorizados') nav('/padres/autorizados')
            if (id === 'perfil') nav('/padres/perfil')
          }}
          items={[
            { id: 'inicio', label: 'Inicio', icon: <Home size={22} />, badge: unread },
            { id: 'hijos', label: 'Hijos', icon: <Users size={22} /> },
            { id: 'autorizados', label: 'Autorizados', icon: <UserPlus size={22} /> },
            { id: 'perfil', label: 'Perfil', icon: <UserCircle size={22} /> },
          ]}
        />
      )}
    </>
  )
}
