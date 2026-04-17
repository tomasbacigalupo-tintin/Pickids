import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../store/session'
import { PadresApp } from '../apps/padres'
import { ColegioApp } from '../apps/colegio'
import { CompartirPublico } from '../apps/padres/compartir'
import { ToastHost } from '../components/ui'
import { subscribe } from '../db/sync'
import { useToast } from '../store/toast'
import { startExpirationClock } from '../db/repos'
import { LoginGate } from '../apps/auth/LoginGate'
import { SplashShared } from '../apps/auth/SplashShared'
import { Onboarding } from '../apps/auth/Onboarding'

export function AppRoot() {
  const { usuarioId, rol, onboardingDone } = useSession()
  const pushToast = useToast(s => s.push)
  const nav = useNavigate()

  useEffect(() => {
    const unsub = subscribe(ev => {
      if (ev.type === 'notificacion_nueva') {
        const sess = JSON.parse(localStorage.getItem('pickids-session') || '{}')
        const yo = sess?.usuarioId
        const apunta = ev.destinatarioId === yo || (ev.destinatarioId.startsWith('*colegio:') && sess?.rol && sess.rol !== 'padre')
        if (apunta) {
          pushToast({
            title: ev.titulo,
            body: ev.cuerpo,
            variant: ev.prioridad === 'critica' ? 'warning' : 'info',
          })
        }
      }
      if (ev.type === 'data_reset') {
        nav('/')
        setTimeout(() => window.location.reload(), 100)
      }
    })
    startExpirationClock()
    return unsub
  }, [pushToast, nav])

  return (
    <div className="app-stage">
      <ToastHost />
      <Routes>
        <Route path="/c/:token" element={<CompartirPublico />} />
        <Route path="/splash" element={<SplashShared />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/*"
          element={
            !usuarioId
              ? <LoginGate />
              : !rol
                ? <Navigate to="/elegir-rol" replace />
                : rol === 'padre'
                  ? (onboardingDone ? <PadresApp /> : <Navigate to="/onboarding" replace />)
                  : <ColegioApp />
          }
        />
      </Routes>
    </div>
  )
}
