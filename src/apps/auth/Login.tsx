import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { db } from '../../db/schema'
import { useSession } from '../../store/session'
import type { Rol } from '../../shared/types'
import { Mail, Lock } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const login = useSession(s => s.login)

  async function doLogin(eMail?: string) {
    setErr(null); setLoading(true)
    const query = (eMail ?? email).trim().toLowerCase()
    const u = await db.usuarios.where('email').equalsIgnoreCase(query).first()
    setLoading(false)
    if (!u) { setErr('No encontramos ese email. Usá uno de los usuarios demo abajo.'); return }
    const firstRole: Rol = u.roles[0]
    login(u.id, u.roles.length > 1 ? firstRole : firstRole)
    // Redirección según rol
    if (u.roles.includes('padre')) nav('/padres/inicio', { replace: true })
    else nav('/colegio/cola', { replace: true })
  }

  return (
    <div className="pk-login">
      <div className="pk-login__logo">
        <img src={`${import.meta.env.BASE_URL}pickids-icon.svg`} alt="Pickids" width={64} height={64} />
      </div>
      <div>
        <div className="pk-login__title">Ingresá a Pickids</div>
        <div className="pk-login__subtitle">Retirar nunca fue tan simple</div>
      </div>

      <Input label="Email" value={email} onChange={setEmail} placeholder="martina@demo.com" type="email" leftIcon={<Mail size={18} />} inputMode="email" />
      <Input label="Contraseña" value={pass} onChange={setPass} placeholder="Cualquier texto en demo" type="password" leftIcon={<Lock size={18} />} error={err ?? undefined} />

      <Button variant="primary" fullWidth loading={loading} onClick={() => doLogin()}>Ingresar</Button>

      <div className="pk-login__separator">o probá con</div>

      <div style={{ display: 'grid', gap: 8 }}>
        <Button variant="secondary" fullWidth size="md" onClick={() => { setEmail('martina@demo.com'); doLogin('martina@demo.com') }}>Padre: Martina López</Button>
        <Button variant="secondary" fullWidth size="md" onClick={() => { setEmail('diego@demo.com'); doLogin('diego@demo.com') }}>Padre: Diego Pérez (cotutor)</Button>
        <Button variant="secondary" fullWidth size="md" onClick={() => { setEmail('porteria@sanluis.demo'); doLogin('porteria@sanluis.demo') }}>Colegio: Portería</Button>
        <Button variant="secondary" fullWidth size="md" onClick={() => { setEmail('coord@sanluis.demo'); doLogin('coord@sanluis.demo') }}>Colegio: Coordinación</Button>
        <Button variant="secondary" fullWidth size="md" onClick={() => { setEmail('admin@sanluis.demo'); doLogin('admin@sanluis.demo') }}>Colegio: Administración</Button>
      </div>

      <div className="pk-login__demo">
        <strong>Demo:</strong> la contraseña puede ser cualquier cosa. Código de familia: <code>PICKIDS-DEMO</code>.
      </div>
    </div>
  )
}
