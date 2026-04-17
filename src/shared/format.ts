// Helpers comunes
export function fmtHora(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function fmtFecha(ts: number): string {
  const d = new Date(ts)
  const hoy = new Date()
  const ayer = new Date(Date.now() - 86400000)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy ' + fmtHora(ts)
  if (d.toDateString() === ayer.toDateString()) return 'Ayer ' + fmtHora(ts)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + fmtHora(ts)
}

export function fmtFechaCorta(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function saludo(nombre: string): string {
  const h = new Date().getHours()
  const pre = h < 12 ? 'Buen día' : h < 20 ? 'Hola' : 'Buenas noches'
  return `${pre}, ${nombre}`
}

export function initials(nombre: string, apellido?: string): string {
  const a = (nombre || '').trim()[0] ?? '?'
  const b = (apellido || '').trim()[0] ?? ''
  return (a + b).toUpperCase()
}

export function avatarColor(seed: string): string {
  const colors = ['#0B3D91', '#F59E0B', '#2563EB', '#16A34A', '#DC2626', '#7C3AED', '#0891B2', '#C026D3']
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return colors[h % colors.length]
}

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function dniMask(dni: string): string {
  if (!dni) return ''
  const clean = dni.replace(/\D/g, '')
  if (clean.length <= 2) return clean
  if (clean.length <= 5) return `${clean.slice(0, -3)}.${clean.slice(-3)}`
  return `${clean.slice(0, -6)}.${clean.slice(-6, -3)}.${clean.slice(-3)}`
}

export function isHorarioPermitido(horaStr: string, aperturaStr: string, cierreStr: string): boolean {
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const h = toMin(horaStr)
  return h >= toMin(aperturaStr) && h <= toMin(cierreStr)
}

export function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
