// Ruta raíz si no hay sesión. Presenta Splash → Onboarding → Login
// y a su vez resuelve rutas /login, /elegir-rol, /verificacion, /vincular
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './Login'
import { SplashShared } from './SplashShared'
import { Onboarding } from './Onboarding'
import { Verificacion } from './Verificacion'
import { VincularColegio } from './VincularColegio'
import { SelectorRol } from './SelectorRol'

export function LoginGate() {
  return (
    <Routes>
      <Route index element={<SplashShared />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="login" element={<Login />} />
      <Route path="verificacion" element={<Verificacion />} />
      <Route path="vincular" element={<VincularColegio />} />
      <Route path="elegir-rol" element={<SelectorRol />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
