import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Header, Screen, Stepper } from '../../components/ui'
import { Camera, Check, Shield } from 'lucide-react'

export function Verificacion() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const nav = useNavigate()

  function advance() {
    if (step < 2) setStep(step + 1)
    else { setDone(true); setTimeout(() => nav('/vincular', { replace: true }), 1400) }
  }

  return (
    <>
      <Header title="Verificación" back={() => nav(-1)} />
      <Screen>
        <Stepper current={step} total={3} />
        {done ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--p-ready-tint)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-ready)' }}>
              <Check size={44} />
            </div>
            <h2 className="t-h2" style={{ marginTop: 18 }}>Identidad enviada</h2>
            <p className="t-body t-muted" style={{ marginTop: 6 }}>El colegio revisará tus datos.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 className="t-h2"><Shield size={22} color="var(--p-primary)" /> Verificá tu identidad para proteger a tu hijo</h2>
              <p className="t-body t-muted">Paso {step + 1} de 3: {['Selfie', 'DNI frente', 'DNI dorso'][step]}</p>
            </div>
            <div style={{
              height: 280, borderRadius: 16, background: 'linear-gradient(135deg,#E2E8F0,#F8FAFC)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--n-600)',
            }}>
              <Camera size={44} />
              <span className="t-sm">Tocá para capturar</span>
            </div>
            <Button variant="primary" fullWidth onClick={advance}>{step < 2 ? 'Siguiente' : 'Enviar verificación'}</Button>
          </>
        )}
      </Screen>
    </>
  )
}
