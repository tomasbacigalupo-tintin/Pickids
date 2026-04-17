import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { useSession } from '../../store/session'
import './splash.css'

const slides = [
  { emoji: '🚙', title: 'Solicitá el retiro desde tu celular', sub: 'Elegí a tu hijo, quién lo retira, y listo.' },
  { emoji: '🏫', title: 'El colegio recibe y prepara a tu hijo', sub: 'Seguí cada paso con un estado claro.' },
  { emoji: '🚪', title: 'Retiralo sin filas, sin esperas', sub: 'Mostrá el QR en portería y ya está.' },
]

export function Onboarding() {
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const { usuarioId, markOnboarding } = useSession()

  const next = () => {
    if (i < slides.length - 1) setI(i + 1)
    else {
      markOnboarding()
      nav(usuarioId ? '/padres/inicio' : '/login', { replace: true })
    }
  }

  const s = slides[i]
  return (
    <div className="pk-onb">
      <div className="pk-onb__top">
        <span />
        <button className="pk-onb__skip" onClick={() => { markOnboarding(); nav(usuarioId ? '/padres/inicio' : '/login', { replace: true }) }}>Saltar</button>
      </div>
      <div className="pk-onb__hero">
        <div className="pk-onb__illu">{s.emoji}</div>
        <div>
          <h2 className="pk-onb__title">{s.title}</h2>
          <p className="pk-onb__subtitle" style={{ marginTop: 10 }}>{s.sub}</p>
        </div>
        <div className="pk-onb__dots">
          {slides.map((_, idx) => <span key={idx} className={`pk-onb__dot ${idx === i ? 'is-active' : ''}`} />)}
        </div>
      </div>
      <Button fullWidth variant="primary" onClick={next}>{i === slides.length - 1 ? 'Empezar' : 'Siguiente'}</Button>
    </div>
  )
}
