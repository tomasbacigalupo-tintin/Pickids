// =============================================================
// Estados, colores, transiciones permitidas y reglas de negocio
// (Sección 4 + 5 del documento)
// =============================================================

import type { EstadoRetiro } from './types'

export const ESTADOS_ORDEN: EstadoRetiro[] = [
  'solicitado',
  'en_validacion',
  'autorizado',
  'en_preparacion',
  'listo',
  'entregado',
]

export const ESTADOS_FINALES: EstadoRetiro[] = [
  'entregado',
  'rechazado',
  'cancelado',
  'expirado',
]

export const ESTADO_META: Record<EstadoRetiro, {
  label: string
  short: string
  color: string
  bg: string
  description: string
}> = {
  solicitado:      { label: 'Solicitado',          short: 'Sol',   color: '#EAB308', bg: 'rgba(234,179,8,0.14)',  description: 'Esperando autorización del colegio' },
  en_validacion:   { label: 'En validación',       short: 'Val',   color: '#EAB308', bg: 'rgba(234,179,8,0.14)',  description: 'El colegio está revisando tu solicitud' },
  autorizado:      { label: 'Autorizado',          short: 'Aut',   color: '#2563EB', bg: 'rgba(37,99,235,0.12)',  description: 'Tu solicitud fue autorizada' },
  en_preparacion:  { label: 'En preparación',      short: 'Prep',  color: '#2563EB', bg: 'rgba(37,99,235,0.12)',  description: 'Están buscando a tu hijo' },
  listo:           { label: 'Listo para entregar', short: 'Listo', color: '#22C55E', bg: 'rgba(34,197,94,0.14)',  description: 'Tu hijo está en portería' },
  entregado:       { label: 'Entregado',           short: 'Entr',  color: '#16A34A', bg: 'rgba(22,163,74,0.14)',  description: 'Retiro completado' },
  rechazado:       { label: 'Rechazado',           short: 'Rech',  color: '#DC2626', bg: 'rgba(220,38,38,0.10)',  description: 'Solicitud rechazada' },
  cancelado:       { label: 'Cancelado',           short: 'Canc',  color: '#64748B', bg: 'rgba(100,116,139,0.14)', description: 'Solicitud cancelada' },
  expirado:        { label: 'Expirado',            short: 'Exp',   color: '#64748B', bg: 'rgba(100,116,139,0.14)', description: 'La solicitud expiró' },
}

// Transiciones permitidas — fiel a sección 4 del doc
const TRANSICIONES: Record<EstadoRetiro, EstadoRetiro[]> = {
  solicitado:     ['en_validacion', 'cancelado', 'rechazado', 'expirado'],
  en_validacion:  ['autorizado', 'rechazado', 'cancelado', 'expirado'],
  autorizado:     ['en_preparacion', 'cancelado', 'rechazado', 'expirado'],
  en_preparacion: ['listo', 'cancelado', 'rechazado', 'expirado'],
  listo:          ['entregado', 'rechazado', 'expirado'],   // NO cancelable
  entregado:      [],
  rechazado:      [],
  cancelado:      [],
  expirado:       [],
}

export function puedeTransitar(desde: EstadoRetiro, hasta: EstadoRetiro): boolean {
  return TRANSICIONES[desde].includes(hasta)
}

export function puedeCancelarPadre(actual: EstadoRetiro): boolean {
  // Cancelación permitida hasta "en preparación" inclusive (doc 5.3)
  return ['solicitado', 'en_validacion', 'autorizado', 'en_preparacion'].includes(actual)
}

export function esEstadoFinal(e: EstadoRetiro): boolean {
  return ESTADOS_FINALES.includes(e)
}

export function idxEnBarra(e: EstadoRetiro): number {
  const idx = ESTADOS_ORDEN.indexOf(e)
  return idx < 0 ? -1 : idx
}

// Demo clock: en producción expiración = 45 min desde "listo".
// Aceleramos a 90 segundos para demo.
export const DEMO_EXPIRACION_MS = 90_000
export const DEMO_RECORDATORIO_MS = 60_000
