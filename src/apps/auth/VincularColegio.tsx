import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Header, Input, Screen, Card } from '../../components/ui'
import { Search, GraduationCap } from 'lucide-react'
import { useSession } from '../../store/session'

export function VincularColegio() {
  const nav = useNavigate()
  const [q, setQ] = useState('Colegio San Luis')
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const { usuarioId, login } = useSession()

  function confirmar() {
    if (code.trim().toUpperCase() !== 'PICKIDS-DEMO') {
      setErr('Código incorrecto. Probá con PICKIDS-DEMO.')
      return
    }
    if (usuarioId) login(usuarioId, 'padre')
    nav('/padres/inicio', { replace: true })
  }

  return (
    <>
      <Header title="Vincular colegio" back={() => nav(-1)} />
      <Screen>
        <Input label="Buscar colegio" value={q} onChange={setQ} leftIcon={<Search size={18} />} placeholder="Escribí el nombre..." />
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--p-primary-tint)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-primary)' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="t-h3">Colegio San Luis</div>
              <div className="t-sm t-muted">Córdoba · Jornada completa</div>
            </div>
          </div>
        </Card>
        <Input label="Código de familia" value={code} onChange={(v) => { setCode(v.toUpperCase()); setErr(null) }} placeholder="PICKIDS-DEMO" error={err ?? undefined} hint="Te lo dio el colegio por mail o en portería." />
        <Button variant="primary" fullWidth onClick={confirmar}>Vincular y continuar</Button>
      </Screen>
    </>
  )
}
