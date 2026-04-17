import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../store/session'
import './splash.css'

export function SplashShared() {
  const nav = useNavigate()
  const { usuarioId, rol, onboardingDone } = useSession()
  useEffect(() => {
    const t = setTimeout(() => {
      if (!usuarioId) nav('/onboarding', { replace: true })
      else if (!rol) nav('/elegir-rol', { replace: true })
      else if (rol === 'padre' && !onboardingDone) nav('/onboarding', { replace: true })
      else if (rol === 'padre') nav('/padres/inicio', { replace: true })
      else nav('/colegio/cola', { replace: true })
    }, 1400)
    return () => clearTimeout(t)
  }, [nav, usuarioId, rol, onboardingDone])
  return (
    <div className="pk-splash">
      <div className="pk-splash__logo">
        <img src={`${import.meta.env.BASE_URL}pickids-icon.svg`} alt="Pickids" width={120} height={120} />
      </div>
      <div className="pk-splash__tagline">Retirar nunca fue tan simple</div>
    </div>
  )
}
